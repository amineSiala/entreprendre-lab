import { getDatabase } from "@netlify/database";
import { cleanupSql, cleanupParams } from "../../src/lib/room-cleanup";

let database: ReturnType<typeof getDatabase> | undefined;
export default async function cleanupRooms() {
  const db = database ??= getDatabase(process.env.NETLIFY_DB_URL ? { connectionString: process.env.NETLIFY_DB_URL } : undefined);
  const result = await db.pool.query(cleanupSql, cleanupParams());
  console.info("Expired and legacy rooms removed:", result.rowCount);
}
export const config = { schedule: "*/5 * * * *" };
