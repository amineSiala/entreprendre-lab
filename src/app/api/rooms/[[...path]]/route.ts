import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { beats } from "@/content/beats.fr";
import { createSession, getSession, identityHash, newIdentity, transaction } from "@/lib/store";
import { expireRounds, move, RoomError, snapshot, submit } from "@/lib/engine";
import { requirePresenter } from "@/lib/presenter-auth";
import { randomUUID } from "node:crypto";
import { commandPitch, forgetPitch, ratePitch } from "@/lib/pitch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const cookieName = "elab_identity";
const teamSchema = z.union([z.literal(1), z.literal(2), z.literal(3)]);
const pitchCommandSchema = z.discriminatedUnion("command", [
  z.object({ command: z.literal("assign"), participantId: z.string().uuid(), team: teamSchema.nullable() }),
  z.object({ command: z.literal("select"), selection: z.union([teamSchema, z.literal("review")]) }),
  ...(["confirm", "start", "open", "close", "reveal"] as const).map(command => z.object({ command: z.literal(command), team: teamSchema })),
]);
const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create"), mode: z.literal("phones").default("phones"), password: z.string().max(128).optional() }),
  z.object({ action: z.literal("join"), nickname: z.string().trim().min(2).max(24) }),
  z.object({ action: z.literal("sync"), controller: z.string().uuid() }),
  z.object({ action: z.literal("release"), controller: z.string().uuid() }),
  z.object({ action: z.literal("move"), controller: z.string().uuid(), version: z.number().int().nonnegative(), direction: z.union([z.literal(-1), z.literal(1)]), force: z.boolean().optional(), target: z.number().int().min(0).max(beats.length - 1).optional() }),
  z.object({ action: z.literal("answer"), finalize: z.boolean().optional(), controller: z.string().uuid().optional(), questionId: z.string().min(1).max(32), answer: z.object({ choice: z.number().int().min(0).max(3).optional(), reason: z.number().int().min(0).max(2).optional(), recall: z.array(z.string().max(100)).max(8).optional() }) }),
  z.object({ action: z.literal("forget") }),
  z.object({ action: z.literal("pitch"), controller: z.string().uuid(), version: z.number().int().nonnegative(), operation: pitchCommandSchema }),
  z.object({ action: z.literal("rate-pitch"), team: teamSchema, rating: z.number().int().min(1).max(10), revision: z.number().int().min(1).max(Number.MAX_SAFE_INTEGER) }),
]);
const rateStore = globalThis as typeof globalThis & { roomRate?: Map<string, { time: number; count: number }> };
function limit(key: string) {
  const rates = rateStore.roomRate ??= new Map();
  const now = Date.now();
  for (const [k, value] of rates) if (now - value.time > 600_000) rates.delete(k);
  const value = rates.get(key) ?? { time: now, count: 0 };
  if (++value.count > 15) throw new RoomError(429, "Trop de créations de salles. Réessayez dans dix minutes.");
  rates.set(key, value);
}
async function handle(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  try {
    const { path = [] } = await context.params;
    if (path.length > 1 || (path[0] && !/^[A-Z2-9]{6}$/.test(path[0]))) throw new RoomError(404, "Salle introuvable.");
    const existing = request.cookies.get(cookieName)?.value;
    const token = existing && /^[a-f0-9]{64}$/.test(existing) ? existing : newIdentity();
    const actor = identityHash(token);
    let body: z.infer<typeof schema> | undefined;
    if (request.method === "POST") {
      const origin = request.headers.get("origin");
      let originUrl: URL | undefined;
      try { if (origin) originUrl = new URL(origin); } catch { /* Invalid origins fail the same check as absent origins. */ }
      if (!originUrl || originUrl.host !== request.headers.get("host") || originUrl.protocol !== request.nextUrl.protocol) throw new RoomError(403, "Origine de la requête refusée.");
      const raw = await request.text();
      if (raw.length > 6000) throw new RoomError(413, "Réponse trop longue.");
      body = schema.parse(JSON.parse(raw));
      if (body.action === "create") requirePresenter(body.password);
    }
    const payload = await transaction(data => {
      if (body?.action === "create") {
        if (path.length) throw new RoomError(400, "Adresse de création invalide.");
        limit(actor);
        const session = createSession(data, actor, body.mode);
        return { code: session.code };
      }
      const room = expireRounds(getSession(data, path[0] ?? ""));
      const role = room.hostHash === actor ? "host" : "student";
      if (body?.action === "join") {
        room.members[actor] ??= { publicId: randomUUID(), nickname: body.nickname, joinedAt: Date.now() };
      } else if (role !== "host" && !room.members[actor]) throw new RoomError(403, "Rejoignez cette salle avant de continuer.");
      const controller = body && "controller" in body ? body.controller : request.nextUrl.searchParams.get("controller") ?? undefined;
      if (body?.action === "sync") {
        if (role !== "host") throw new RoomError(403, "Commande réservée au présentateur.");
        if (!room.controller || room.controller.until <= Date.now() || room.controller.id === controller) room.controller = { id: controller!, until: Date.now() + 8000 };
      }
      if (body?.action === "release") {
        if (role === "host" && room.controller?.id === controller) delete room.controller;
      }
      if (body?.action === "move" || body?.action === "pitch" || (body?.action === "answer" && role === "host")) {
        if (role !== "host") throw new RoomError(403, "Commande réservée au présentateur.");
        if (!room.controller || room.controller.id !== controller || room.controller.until <= Date.now()) throw new RoomError(409, "Un autre onglet pilote cette présentation. Attendez sa fermeture.", "CONTROLLER");
      }
      let updated = room;
      if (body?.action === "move") updated = move(room, body.version, body.direction, body.force, body.target);
      if (body?.action === "pitch") updated = commandPitch(room, body.version, body.operation);
      if (body?.action === "rate-pitch") {
        if (role === "host") throw new RoomError(403, "Le présentateur ne vote pas.");
        updated = ratePitch(room, actor, body.team, body.rating, body.revision);
      }
      if (body?.action === "answer") {
        if (role === "host") throw new RoomError(403, "Les réponses se font sur les téléphones.");
        updated = submit(room, actor, body.questionId, body.answer, Date.now(), body.finalize);
      }
      if (body?.action === "forget") {
        if (role === "host") throw new RoomError(400, "La suppression ici concerne uniquement les réponses personnelles des participants.");
        delete updated.members[actor];
        forgetPitch(updated, actor);
        for (const round of Object.values(updated.rounds)) delete round.responses[actor];
        data.sessions[room.code] = updated;
        return { forgotten: true };
      }
      data.sessions[room.code] = updated;
      return snapshot(updated, actor, role, controller);
    }, true, path[0]);
    const response = NextResponse.json(payload, { headers: { "Cache-Control": "no-store, private" } });
    if (existing !== token && body && ["create", "join"].includes(body.action)) response.cookies.set(cookieName, token, { httpOnly: true, sameSite: "lax", secure: request.nextUrl.protocol === "https:", path: "/", maxAge: 60 * 60 * 24 * 30 });
    return response;
  } catch (error) {
    if (error instanceof RoomError) return NextResponse.json({ error: error.message, code: error.code }, { status: error.status, headers: { "Cache-Control": "no-store" } });
    if (error instanceof z.ZodError || error instanceof SyntaxError) return NextResponse.json({ error: "Vérifiez les informations saisies." }, { status: 422 });
    console.error("Room storage failure", error instanceof Error ? error.name : "unknown");
    return NextResponse.json({ error: "Le serveur ne peut pas enregistrer les données. Réessayez." }, { status: 500 });
  }
}
export const GET = handle;
export const POST = handle;
