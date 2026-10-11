import { afterAll, beforeAll, expect, test, vi } from "vitest";
import { NetlifyDB } from "@netlify/database-dev";
import { getDatabase } from "@netlify/database";
import { cleanupSql, cleanupParams } from "@/lib/room-cleanup";
import { closeStore, createSession, getSession, transaction } from "@/lib/store";

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
