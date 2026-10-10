import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { RoomError } from "@/lib/engine";

export function requirePresenter(password?: string) {
  const configured = process.env.PRESENTER_PASSWORD_HASH;
  if (!configured || !/^[a-f0-9]{64}$/.test(configured)) throw new RoomError(503, "L’accès présentateur n’est pas encore configuré.");
  const supplied = createHash("sha256").update(password ?? "").digest();
  if (!password || !timingSafeEqual(supplied, Buffer.from(configured, "hex"))) throw new RoomError(401, "Mot de passe présentateur incorrect.", "AUTH_REQUIRED");
}
