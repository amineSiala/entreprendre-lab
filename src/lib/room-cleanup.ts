import { LESSON_VERSION, ROOM_TTL_MS } from "./room-policy";
// Shared by the server store and the private scheduled function (no browser imports).
export const cleanupSql = "DELETE FROM game_rooms WHERE created_at <= $1 OR payload->>'lessonVersion' IS DISTINCT FROM $2";
export const cleanupParams = (now = Date.now()) => [new Date(now - ROOM_TTL_MS).toISOString(), LESSON_VERSION];
