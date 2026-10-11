import "server-only";
import { randomUUID } from "node:crypto";
import { beats } from "@/content/beats.fr";
import { RoomError } from "./engine";
import type { Pitch, PitchCommand, SafePitch, Session, TeamId } from "@/types/domain";

export const teamIds: TeamId[] = [1, 2, 3];
export function upgradeSession(room: Session): Session {
  if (room.payloadRevision === 3 && Object.values(room.members).every(m => m.publicId)) return room;
  const next = structuredClone(room);
  if (next.payloadRevision !== 3) {
    // Revision 1 ended at 45; revision 2 added pitch at 45 and ended at 46.
    // Keep finished rooms finished, and preserve ongoing pitch state at 45.
    const oldConclusion = next.payloadRevision === 2 ? 46 : 45;
    if (next.index >= oldConclusion) next.index = beats.length - 1;
    next.payloadRevision = 3;
  }
  for (const member of Object.values(next.members)) member.publicId ??= randomUUID();
  return next;
}
function initialPitch(): Pitch { return { phase: "setup", selection: 1, activeTeam: 1, assignments: {}, votes: {}, results: {} }; }
export function ensurePitch(session: Session): Session {
  if (session.pitch) return session;
  return { ...session, pitch: initialPitch() };
}
function requireSlide(session: Session) {
  if (beats[session.index]?.kind !== "pitch") throw new RoomError(409, "Revenez à la diapositive des pitchs.", "PITCH_CLOSED");
}
export function pitchBonus(session: Session, actor: string) {
  const p = session.pitch, team = p?.assignments[actor];
  return p?.phase === "revealed" && team ? p.results[team]?.bonus ?? 0 : 0;
}
export function commandPitch(session: Session, expectedVersion: number, command: PitchCommand): Session {
  requireSlide(session);
  const next = structuredClone(ensurePitch(session)), p = next.pitch!;
  // A retried phase transition is safe even if its response was lost.
  const already = command.command === "confirm" && p.phase === "ready"
    || command.command === "start" && p.phase === "presenting" && p.activeTeam === command.team
    || command.command === "open" && p.phase === "voting" && p.activeTeam === command.team
    || command.command === "close" && !!p.results[command.team]
    || command.command === "reveal" && p.phase === "revealed";
  if (already) return session;
  if (session.version !== expectedVersion) throw new RoomError(409, "La présentation a changé. Synchronisez puis réessayez.", "STALE");
  if (command.command === "assign" || command.command === "select" || command.command === "confirm") {
    if (p.phase !== "setup") throw new RoomError(409, "Les équipes sont verrouillées.");
    if (command.command === "assign") {
      const actor = Object.keys(next.members).find(id => next.members[id].publicId === command.participantId);
      if (!actor) throw new RoomError(404, "Ce participant n’est plus dans la salle.");
      if (command.team === null) delete p.assignments[actor]; else p.assignments[actor] = command.team;
    } else if (command.command === "select") p.selection = command.selection;
    else {
      if (p.selection !== "review" || Object.keys(next.members).some(id => !p.assignments[id]) || teamIds.some(t => !Object.values(p.assignments).includes(t)))
        throw new RoomError(422, "Répartissez tout le monde dans trois équipes non vides, puis vérifiez les équipes.");
      p.phase = "ready";
    }
  } else if (command.command === "start") {
    if (!(p.phase === "ready" && command.team === 1 || p.phase === "between" && command.team === p.activeTeam + 1)) throw new RoomError(409, "Respectez l’ordre des trois pitchs.");
    p.activeTeam = command.team; p.phase = "presenting";
  } else if (command.command === "open") {
    if (p.phase !== "presenting" || p.activeTeam !== command.team) throw new RoomError(409, "Commencez le pitch avant le vote.");
    p.phase = "voting"; p.votes[command.team] = {};
  } else if (command.command === "close") {
    if (p.phase !== "voting" || p.activeTeam !== command.team) throw new RoomError(409, "Ce vote n’est pas ouvert.");
    const votes = Object.values(p.votes[command.team] ?? {}), sum = votes.reduce((n, v) => n + v.rating, 0), average = votes.length ? sum / votes.length : 0;
    p.results[command.team] = { count: votes.length, sum, average, bonus: Math.round(average / 10 * 7000) };
    p.phase = command.team === 3 ? "closed" : "between";
  } else {
    if (p.phase !== "closed" || teamIds.some(t => !p.results[t])) throw new RoomError(409, "Terminez les trois votes avant la révélation.");
    p.phase = "revealed";
  }
  next.version++; return next;
}
export function ratePitch(session: Session, actor: string, team: TeamId, rating: number, revision: number): Session {
  requireSlide(session);
  if (!Number.isInteger(rating) || rating < 1 || rating > 10 || !Number.isSafeInteger(revision) || revision < 1) throw new RoomError(422, "Choisissez une note entière de 1 à 10.");
  const p = session.pitch, previous = p?.votes[team]?.[actor];
  if (previous?.revision === revision && previous.rating === rating) return session;
  if (!session.members[actor]) throw new RoomError(403, "Rejoignez la salle pour voter.");
  if (p?.assignments[actor] === team) throw new RoomError(403, "Vous ne pouvez pas noter votre propre équipe.");
  if (!p || p.phase !== "voting" || p.activeTeam !== team) throw new RoomError(409, "Ce vote est fermé.", "PITCH_CLOSED");
  if (previous && revision <= previous.revision) throw new RoomError(409, "Une note plus récente est déjà enregistrée.", "STALE_VOTE");
  const next = structuredClone(session); next.pitch!.votes[team]![actor] = { rating, revision }; return next;
}
export function forgetPitch(session: Session, actor: string) {
  if (!session.pitch) return;
  delete session.pitch.assignments[actor];
  for (const votes of Object.values(session.pitch.votes)) if (votes) delete votes[actor];
  session.version++;
}
export function safePitch(session: Session, actor: string, role: "host" | "student"): SafePitch {
  const p = session.pitch ?? initialPitch(), ownTeam = p.assignments[actor];
  const roster = Object.entries(session.members).sort((a, b) => a[1].joinedAt - b[1].joinedAt).map(([id, m]) => ({ id: m.publicId!, nickname: m.nickname, team: p.assignments[id] }));
  return { phase: p.phase, selection: p.selection, activeTeam: p.activeTeam, ownTeam,
    eligible: role === "student" && p.phase === "voting" && ownTeam !== p.activeTeam,
    ...(role === "host" && p.phase === "setup" ? { roster } : {}),
    ...(role === "student" && p.votes[p.activeTeam]?.[actor] ? { ownVote: p.votes[p.activeTeam]![actor] } : {}),
    ...(p.phase === "revealed" ? { bonus: pitchBonus(session, actor) } : {}),
    teams: teamIds.map(id => ({ id, names: roster.filter(m => m.team === id).map(({ id, nickname }) => ({ id, nickname })), count: p.results[id]?.count ?? Object.keys(p.votes[id] ?? {}).length,
      ...(p.phase === "revealed" ? { average: p.results[id]!.average, bonus: p.results[id]!.bonus, rank: 1 + teamIds.filter(t => p.results[t]!.average > p.results[id]!.average).length } : {}) })) };
}
