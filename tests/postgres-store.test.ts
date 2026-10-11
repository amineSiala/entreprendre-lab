import { afterAll, beforeAll, expect, test, vi } from "vitest";
import { NetlifyDB } from "@netlify/database-dev";
import { getDatabase } from "@netlify/database";
import { cleanupSql, cleanupParams } from "@/lib/room-cleanup";
import { closeStore, createSession, getSession, transaction } from "@/lib/store";
import { commandPitch, ratePitch } from "@/lib/pitch";
import { beats } from "@/content/beats.fr";
import type { PitchCommand, Session } from "@/types/domain";

// NetlifyDB's PGlite adapter executes every socket on one PostgreSQL session.
// Use one pool connection so overlapping BEGIN/COMMIT statements cannot share
// that session. Hosted Postgres additionally uses the store's FOR UPDATE lock.
vi.mock("@netlify/database", async importOriginal => {
  const actual = await importOriginal<typeof import("@netlify/database")>();
  return { ...actual, getDatabase: (...args: Parameters<typeof actual.getDatabase>) => {
    const db = actual.getDatabase(...args); db.pool.options.max = 1; return db;
  } };
});

let database: NetlifyDB;
beforeAll(async () => {
  database = new NetlifyDB();
  const connectionString = await database.start();
  await database.applyMigrations("./netlify/database/migrations");
  vi.stubEnv("ROOM_STORAGE", "postgres");
  vi.stubEnv("NETLIFY_DB_URL", connectionString);
}, 60_000);
afterAll(async () => { await closeStore(); vi.unstubAllEnvs(); await database?.stop(); });

test("persists isolated rooms and rolls back a failed mutation", async () => {
  const first = await transaction(data => createSession(data, "host-a", "phones"));
  const second = await transaction(data => createSession(data, "host-b", "phones"));
  await transaction(data => { getSession(data, first.code).members.alice = { nickname: "Alice", joinedAt: Date.now() }; }, true, first.code);
  await expect(transaction(data => { getSession(data, first.code).members.bob = { nickname: "Bob", joinedAt: Date.now() }; throw new Error("abort"); }, true, first.code)).rejects.toThrow("abort");
  const room = await transaction(data => getSession(data, first.code), false, first.code);
  expect(Object.keys(room.members)).toEqual(["alice"]);
  const other = await transaction(data => getSession(data, second.code), false, second.code);
  expect(other.members).toEqual({});
});

test("enforces a durable per-host creation limit", async () => {
  for (let i = 0; i < 15; i++) await transaction(data => createSession(data, "limited-host", "phones"));
  await expect(transaction(data => createSession(data, "limited-host", "phones"))).rejects.toMatchObject({ status: 429 });
});

test("Postgres storage serializes pitch edits, closure and repeated reveals without duplicate awards", async () => {
  const room = await transaction(data => createSession(data, "pitch-host", "phones"));
  await transaction(data => {
    const s = getSession(data, room.code); s.index = beats.findIndex(b => b.kind === "pitch");
    for (let i = 1; i <= 3; i++) s.members[`player${i}`] = { publicId: `public${i}`, nickname: `Player ${i}`, joinedAt: Date.now() };
  }, true, room.code);
  const update = (work: (s: Session) => Session) => transaction(data => data.sessions[room.code] = work(getSession(data, room.code)), true, room.code);
  const command = (operation: PitchCommand) => update(s => commandPitch(s, s.version, operation));
  for (const team of [1, 2, 3] as const) await command({ command: "assign", participantId: `public${team}`, team });
  await command({ command: "select", selection: "review" }); await command({ command: "confirm", team: 1 });
  for (const team of [1, 2, 3] as const) {
    await command({ command: "start", team }); await command({ command: "open", team });
    const voter = team === 1 ? "player2" : "player1";
    await Promise.allSettled([2, 1].map(revision => update(s => ratePitch(s, voter, team, revision === 2 ? 7 : 1, revision))));
    const latest = await transaction(data => getSession(data, room.code), false, room.code);
    expect(latest.pitch!.votes[team]![voter]).toEqual({ rating: 7, revision: 2 });
    const races = await Promise.allSettled([command({ command: "close", team }), update(s => ratePitch(s, voter, team, 8, 3))]);
    expect(races[0].status).toBe("fulfilled");
    const closed = await transaction(data => getSession(data, room.code), false, room.code);
    const frozen = closed.pitch!.results[team]!;
    expect(frozen.count).toBe(1); expect([4900, 5600]).toContain(frozen.bonus);
    await expect(update(s => ratePitch(s, voter, team, 10, 4))).rejects.toMatchObject({ code: "PITCH_CLOSED" });
  }
  const reveals = await Promise.all([command({ command: "reveal", team: 3 }), command({ command: "reveal", team: 3 })]);
  expect(reveals[0].version).toBe(reveals[1].version);
  expect(reveals[0].pitch!.results).toEqual(reveals[1].pitch!.results);
});

test("scheduled cleanup removes expired and legacy data without visitors and cannot resurrect a deleted room", async () => {
  const db = getDatabase({ connectionString: process.env.NETLIFY_DB_URL! });
  try {
    const expired = await transaction(data => createSession(data, "expired-host", "phones"));
    const legacy = await transaction(data => createSession(data, "legacy-host", "phones"));
    const live = await transaction(data => createSession(data, "live-host", "phones"));
    await db.pool.query("UPDATE game_rooms SET created_at = NOW() - INTERVAL '4 hours' WHERE code = $1", [expired.code]);
    await db.pool.query("UPDATE game_rooms SET payload = payload - 'lessonVersion' WHERE code = $1", [legacy.code]);
    await db.pool.query(cleanupSql, cleanupParams());
    const codes = (await db.pool.query("SELECT code FROM game_rooms WHERE code = ANY($1)", [[expired.code, legacy.code, live.code]])).rows.map((row: { code: string }) => row.code);
    expect(codes).toEqual([live.code]);
    await expect(transaction(data => getSession(data, expired.code), true, expired.code)).rejects.toMatchObject({ code: "ROOM_EXPIRED" });
    expect((await db.pool.query("SELECT code FROM game_rooms WHERE code = $1", [expired.code])).rows).toEqual([]);
    await db.pool.query("UPDATE game_rooms SET created_at = NOW() - INTERVAL '4 hours' WHERE code = $1", [live.code]);
    await expect(transaction(data => getSession(data, live.code), false, live.code)).rejects.toMatchObject({ code: "ROOM_EXPIRED" });
    expect((await db.pool.query("SELECT code FROM game_rooms WHERE code = $1", [live.code])).rows).toEqual([]);
  } finally { await db.pool.end(); }
});
