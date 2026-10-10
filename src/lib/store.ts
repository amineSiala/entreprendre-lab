import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import type { PlayMode, Session } from "@/types/domain";
import { RoomError } from "@/lib/engine";

// Durable rehearsal adapter. One Node process; replace with DB transactions for cloud use.
type Database = { sessions: Record<string, Session> };
const globalStore = globalThis as typeof globalThis & { rehearsalQueue?: Promise<unknown> };
export function identityHash(value: string) { return createHash("sha256").update(value).digest("hex"); }
export function newIdentity() { return randomBytes(32).toString("hex"); }
export async function transaction<T>(work: (data: Database) => T, write = true): Promise<T> {
  const directory = process.env.DEMO_DATA_DIR || path.join(process.cwd(), ".data");
  const file = path.join(directory, "rehearsal.json");
  const run = (globalStore.rehearsalQueue ?? Promise.resolve()).then(async () => {
    await fs.mkdir(directory, { recursive: true });
    let data: Database;
    try { data = JSON.parse(await fs.readFile(file, "utf8")); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; data = { sessions: {} }; }
    const result = work(data);
    if (write) {
      const temporary = file + ".tmp";
      const handle = await fs.open(temporary, "w", 0o600);
      try { await handle.writeFile(JSON.stringify(data), "utf8"); await handle.sync(); } finally { await handle.close(); }
      await fs.rename(temporary, file);
    }
    return result;
  });
  globalStore.rehearsalQueue = run.catch(() => {});
  return run;
}
export function createSession(data: Database, hostHash: string, mode: PlayMode) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code: string;
  do { code = Array.from(randomBytes(6), byte => alphabet[byte % alphabet.length]).join(""); } while (data.sessions[code]);
  const session: Session = { id: randomUUID(), code, hostHash, mode, index: 0, version: 0, createdAt: Date.now(), members: {}, rounds: {} };
  data.sessions[code] = session;
  return session;
}
export function getSession(data: Database, code: string) {
  const session = data.sessions[code];
  if (!session) throw new RoomError(404, "Ce code ne correspond à aucune salle sur ce serveur.");
  return session;
}
