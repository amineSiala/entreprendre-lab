import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import type { PlayMode, Session } from "@/types/domain";
import { RoomError } from "@/lib/engine";
import { getDatabase } from "@netlify/database";
import { isRetired, LESSON_VERSION } from "./room-policy";
import { cleanupSql, cleanupParams } from "./room-cleanup";
import { upgradeSession } from "./pitch";

// Local rehearsal uses a file; hosted rooms use Postgres row locks across workers.
type Database = { sessions: Record<string, Session> };
const globalStore = globalThis as typeof globalThis & { rehearsalQueue?: Promise<unknown> };
let postgres: ReturnType<typeof getDatabase> | undefined;
export async function closeStore() {
  await postgres?.pool.end();
  postgres = undefined;
}
export function identityHash(value: string) { return createHash("sha256").update(value).digest("hex"); }
export function newIdentity() { return randomBytes(32).toString("hex"); }
export async function transaction<T>(work: (data: Database) => T, write = true, code?: string): Promise<T> {
  if (process.env.NETLIFY || process.env.NEXT_PUBLIC_SESSION_MODE === "online" || process.env.ROOM_STORAGE === "postgres") return postgresTransaction(work, write, code);
  const directory = process.env.DEMO_DATA_DIR || path.join(process.cwd(), ".data");
  const file = path.join(directory, "rehearsal.json");
  const run = (globalStore.rehearsalQueue ?? Promise.resolve()).then(async () => {
    await fs.mkdir(directory, { recursive: true });
    let data: Database;
    try { data = JSON.parse(await fs.readFile(file, "utf8")); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; data = { sessions: {} }; }
    const persist = async () => {
      const temporary = file + ".tmp";
      const handle = await fs.open(temporary, "w", 0o600);
      try { await handle.writeFile(JSON.stringify(data), "utf8"); await handle.sync(); } finally { await handle.close(); }
      await fs.rename(temporary, file);
    };
    let removed = false;
    for (const [key, room] of Object.entries(data.sessions)) if (isRetired(room)) { delete data.sessions[key]; removed = true; }
    // Persist cleanup before callbacks, including callbacks that reject an expired room.
    if (removed) await persist();
    const result = work(data);
    if (write) await persist();
    return result;
  });
  globalStore.rehearsalQueue = run.catch(() => {});
  return run;
}
async function postgresTransaction<T>(work: (data: Database) => T, write: boolean, code?: string): Promise<T> {
  const db = postgres ??= getDatabase(process.env.NETLIFY_DB_URL ? { connectionString: process.env.NETLIFY_DB_URL } : undefined);
  const client = await db.pool.connect();
  try {
    // Autocommitted separately so a rejected request cannot roll deletion back.
    await client.query(cleanupSql, cleanupParams());
    await client.query("BEGIN");
    const data: Database = { sessions: {} };
    if (code) {
      const result = await client.query(`SELECT payload FROM game_rooms WHERE code = $1${write ? " FOR UPDATE" : ""}`, [code]);
      if (result.rows[0]) data.sessions[code] = result.rows[0].payload as Session;
    }
    const result = work(data);
    if (write) for (const room of Object.values(data.sessions)) {
      if (code) await client.query("UPDATE game_rooms SET payload = $2::jsonb, updated_at = NOW() WHERE code = $1", [room.code, JSON.stringify(room)]);
      else {
        // Serialize creation per host so limits hold across independent function workers.
        await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [room.hostHash]);
        const recent = await client.query("SELECT COUNT(*)::int AS count FROM game_rooms WHERE host_hash = $1 AND created_at > NOW() - INTERVAL '10 minutes'", [room.hostHash]);
        if (recent.rows[0].count >= 15) throw new RoomError(429, "Trop de créations de salles. Réessayez dans dix minutes.");
        await client.query("INSERT INTO game_rooms(code, host_hash, payload, created_at) VALUES ($1, $2, $3::jsonb, $4)", [room.code, room.hostHash, JSON.stringify(room), new Date(room.createdAt).toISOString()]);
      }
    }
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    if (!code && (error as { code?: string }).code === "23505") throw new RoomError(409, "Ce code vient d’être utilisé. Relancez la création de salle.");
    throw error;
  } finally { client.release(); }
}
export function createSession(data: Database, hostHash: string, mode: PlayMode) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code: string;
  do { code = Array.from(randomBytes(6), byte => alphabet[byte % alphabet.length]).join(""); } while (data.sessions[code]);
  const session: Session = { payloadRevision: 3, lessonVersion: LESSON_VERSION, id: randomUUID(), code, hostHash, mode, index: 0, version: 0, createdAt: Date.now(), members: {}, rounds: {} };
  data.sessions[code] = session;
  return session;
}
export function getSession(data: Database, code: string) {
  const session = data.sessions[code];
  if (!session || isRetired(session)) throw new RoomError(410, "Cette salle a expiré ou n’existe plus. Les salles durent quatre heures. Rejoignez une nouvelle salle.", "ROOM_EXPIRED");
  return data.sessions[code] = upgradeSession(session);
}
