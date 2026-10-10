import { afterAll, beforeAll, expect, test, vi } from "vitest";
import { NetlifyDB } from "@netlify/database-dev";
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
