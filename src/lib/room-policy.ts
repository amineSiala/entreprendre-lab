export const LESSON_VERSION = "stories-2026-v1";
export const ROOM_TTL_MS = 4 * 60 * 60 * 1000;
export const expiresAt = (room: { createdAt: number }) => room.createdAt + ROOM_TTL_MS;
export function isRetired(room: { createdAt: number; lessonVersion?: string }, now = Date.now()) {
  return room.lessonVersion !== LESSON_VERSION || now >= expiresAt(room);
}
