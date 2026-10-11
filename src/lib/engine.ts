import "server-only";
import { beats } from "@/content/beats.fr";
import { questions } from "@/content/questions.fr";
import { keys } from "@/lib/answer-keys";
import { grade } from "@/lib/grading";
import { presenterNotes } from "@/lib/presenter-notes";
import type { Answer, FormId, RoomState, Round, Session } from "@/types/domain";
import { expiresAt } from "./room-policy";

export class RoomError extends Error {
  constructor(public status: number, message: string, public code = "ROOM_ERROR") { super(message); }
}
function closeRound(round: Round, now: number) {
  const q = questions[round.questionId];
  const at = Math.min(now, round.openedAt + q.seconds * 1000);
  if (q.kind === "recall") for (const response of Object.values(round.responses)) {
    if (response.finalized) continue;
    response.finalized = true;
    response.at = at;
    response.feedback = grade(round.questionId, response.answer, at - round.openedAt);
  }
  round.state = "revealed";
  round.closedAt = at;
}
export function expireRounds(session: Session, now = Date.now()): Session {
  const expired = Object.values(session.rounds).filter(round => round.state === "open" && now >= round.openedAt + questions[round.questionId].seconds * 1000);
  if (!expired.length) return session;
  const next = structuredClone(session);
  for (const round of expired) {
    closeRound(next.rounds[round.questionId], now);
    if (beats[next.index].questionId === round.questionId && beats[next.index].kind.endsWith("-open")) next.index++;
  }
  next.version++;
  return next;
}
export function move(session: Session, expectedVersion: number, direction: -1 | 1, force = false, target?: number, now = Date.now()) {
  if (session.version !== expectedVersion) throw new RoomError(409, "La présentation a changé. Synchronisation en cours.", "STALE");
  const current = beats[session.index];
  // Keep existing beat indices stable for persisted rooms and participant screens.
  if (target === undefined && session.leaderboardVisible && direction < 0)
    return { ...session, leaderboardVisible: false, version: session.version + 1 };
  if (target === undefined && direction > 0 && !session.leaderboardVisible && current.kind.endsWith("-results") && current.questionId && session.rounds[current.questionId]?.state === "revealed")
    return { ...session, leaderboardVisible: true, version: session.version + 1 };
  const active = Object.values(session.rounds).find(round => round.state === "open");
  if (target !== undefined && active) throw new RoomError(409, "Fermez la question avec la flèche droite avant de changer de chapitre.");
  const nextIndex = Math.max(0, Math.min(beats.length - 1, target ?? session.index + direction));
  if (nextIndex === session.index) return session;
  if (direction > 0 && current.questionId && current.kind.endsWith("-open")) {
    const round = session.rounds[current.questionId];
    if (round?.state === "open" && now - round.openedAt < 10_000 && !force)
      throw new RoomError(409, "Moins de 10 secondes. Appuyez encore sur → pour fermer, ou attendez.", "EARLY_CLOSE");
  }
  const result = structuredClone(session);
  result.leaderboardVisible = false;
  result.index = nextIndex;
  result.version++;
  const beat = beats[nextIndex];
  if (beat.questionId && direction > 0) {
    if (beat.kind.endsWith("-open") && !result.rounds[beat.questionId]) {
      result.rounds[beat.questionId] = { questionId: beat.questionId, state: "open", openedAt: now, responses: {} };
    } else if (beat.kind.endsWith("-results")) {
      const round = result.rounds[beat.questionId];
      if (round?.state === "open") closeRound(round, now);
    }
  }
  return result;
}
export function submit(session: Session, actor: string, questionId: string, answer: Answer, now = Date.now(), finalize = false) {
  const round = Object.hasOwn(session.rounds, questionId) ? session.rounds[questionId] : undefined;
  const q = Object.hasOwn(questions, questionId) ? questions[questionId] : undefined;
  if (!round || !q) throw new RoomError(404, "Question introuvable.");
  // Choices are final; recall autosaves remain editable until the deadline.
  const previous = round.responses[actor];
  if (previous) {
    const sameAnswer = previous.answer.choice === answer.choice && previous.answer.reason === answer.reason
      && JSON.stringify(previous.answer.recall) === JSON.stringify(answer.recall);
    if (sameAnswer && (q.kind !== "recall" || previous.finalized || !finalize)) return session;
    if (q.kind !== "recall" || previous.finalized || round.state !== "open") throw new RoomError(409, "Votre réponse est déjà enregistrée et ne peut plus être modifiée.", "ALREADY_ANSWERED");
  }
  if (round.state !== "open" || beats[session.index].questionId !== questionId || !beats[session.index].kind.endsWith("-open")) throw new RoomError(409, "Cette question est fermée.", "CLOSED");
  if (now >= round.openedAt + q.seconds * 1000) throw new RoomError(409, "Le temps de réponse est écoulé.", "CLOSED");
  if (q.kind === "recall") {
    if (!answer.recall || answer.recall.length > (q.recallCount ?? 8)) throw new RoomError(422, "Vérifiez les formes saisies.");
  } else {
    if (answer.choice === undefined || answer.choice < 0 || answer.choice >= q.options.length) throw new RoomError(422, "Choisissez une réponse.");
    if (q.reasons && (answer.reason === undefined || answer.reason < 0 || answer.reason >= q.reasons.length)) throw new RoomError(422, "Choisissez aussi une justification.");
  }
  const next = structuredClone(session);
  next.rounds[questionId].responses[actor] = { answer, at: now, finalized: q.kind !== "recall" || finalize, feedback: grade(questionId, answer, now - round.openedAt) };
  return next;
}
export function snapshot(session: Session, actor: string, role: "host" | "student", controller?: string): RoomState {
  const beat = beats[session.index], question = beat.questionId ? questions[beat.questionId] : undefined;
  const round = beat.questionId ? session.rounds[beat.questionId] : undefined;
  const state: RoomState = { expiresAt: expiresAt(session), id: session.id, code: session.code, mode: "phones", index: session.index, version: session.version, participants: Object.keys(session.members).length, role, ended: beat.kind === "conclusion" };
  if (role === "host") {
    if (beat.kind === "title") state.lobbyParticipants = Object.values(session.members).sort((a, b) => a.joinedAt - b.joinedAt).map(member => member.nickname);
    state.canControl = Boolean(session.controller && session.controller.id === controller && session.controller.until > Date.now());
    state.presenterNote = presenterNotes[beat.id];
    state.leaderboardVisible = !!session.leaderboardVisible;
    if (round?.state === "revealed") {
      const rows = Object.entries(session.members).map(([id, member]) => {
        let points = 0, previousPoints = 0;
        for (const r of Object.values(session.rounds)) {
          if (r.state !== "revealed") continue;
          const earned = r.responses[id]?.feedback.xp ?? 0;
          points += earned;
          if (r.questionId !== round.questionId) previousPoints += earned;
        }
        return { nickname: member.nickname, joinedAt: member.joinedAt, points, previousPoints };
      }).sort((a, b) => b.points - a.points || a.joinedAt - b.joinedAt || a.nickname.localeCompare(b.nickname, "fr"));
      const ranked = rows.map((row, index) => ({ nickname: row.nickname, points: row.points, previousPoints: row.previousPoints, rank: rows.findIndex(other => other.points === row.points) + 1, position: index }));
      const last = ranked.filter(row => row.points === ranked.at(-1)?.points);
      const publicRow = ({ nickname, points, previousPoints, rank }: typeof ranked[number]) => ({ nickname, points, previousPoints, rank });
      state.leaderboard = { top: ranked.slice(0, 3).map(publicRow), bottom: ranked.slice(Math.max(3, ranked.length - 3)).map(publicRow), lastNames: last.slice(0, 3).map(row => row.nickname), lastCount: last.length, total: ranked.length };
    }
  }
  if (round && question) {
    const responses = Object.values(round.responses);
    state.round = { questionId: round.questionId, state: round.state, openedAt: round.openedAt, count: responses.length };
    const own = round.responses[actor];
    if (own) state.round.submission = { answer: own.answer, at: own.at, finalized: own.finalized, ...(round.state === "revealed" ? { feedback: own.feedback } : {}) };
    if (round.state === "revealed") {
      const key = keys[round.questionId];
      Object.assign(state.round, { explanation: key.explanation, takeaway: key.takeaway, correctChoice: key.choice, correctReason: key.reason });
      // Class-level percentages are suppressed for fewer than three phone responses.
      if (responses.length >= 3) {
        state.round.counts = question.options.map((_, index) => responses.filter(r => r.answer.choice === index).length);
        if (question.kind === "recall") {
          state.round.allRecalled = responses.filter(r => r.feedback.recalled.length === question.recallCount).length;
          state.round.averageRecall = responses.length ? responses.reduce((n, r) => n + r.feedback.recalled.length, 0) / responses.length : 0;
          state.round.recalledCounts = Object.fromEntries(question.forms.map(id => [id, responses.filter(r => r.feedback.recalled.includes(id)).length]));
        }
      }
    }
  }
  if (role === "student") {
    const recognized = new Set<FormId>(), recalled = new Set<FormId>();
    state.xp = 0;
    for (const r of Object.values(session.rounds)) {
      if (r.state !== "revealed" || !r.responses[actor]) continue;
      const f = r.responses[actor].feedback;
      state.xp += f.xp;
      if (f.correct) questions[r.questionId].forms.forEach(id => recognized.add(id));
      f.recalled.forEach(id => recalled.add(id));
    }
    state.recognized = [...recognized]; state.recalled = [...recalled];
  }
  return state;
}
