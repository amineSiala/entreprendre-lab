import { beats } from "@/content/beats.fr";
import { move } from "@/lib/engine";
import type { PlayMode, Session } from "@/types/domain";

export const startedAt = 1_800_000_000_000;
export const studentA = "student-a";
export const studentB = "student-b";
export const studentC = "student-c";

export function sessionFixture(mode: PlayMode = "phones"): Session {
  return {
    id: "session-test", code: "ABC234", hostHash: "presenter", mode,
    index: 0, version: 0, createdAt: startedAt,
    members: {
      [studentA]: { nickname: "Alice", joinedAt: startedAt },
      [studentB]: { nickname: "Bilal", joinedAt: startedAt },
      [studentC]: { nickname: "Camille", joinedAt: startedAt },
    },
    rounds: {},
  };
}

export function openQuestion(questionId: string, session = sessionFixture()) {
  const index = beats.findIndex(beat => beat.questionId === questionId && beat.kind.endsWith("-open"));
  if (index < 0) throw new Error(`No opening beat for ${questionId}`);
  return move(session, session.version, 1, false, index, startedAt);
}

export function reveal(session: Session) {
  return move(session, session.version, 1, false, undefined, startedAt + 10_000);
}
