import { describe, expect, it } from "vitest";
import { beats } from "@/content/beats.fr";
import { keys } from "@/lib/answer-keys";
import { expireRounds, move, RoomError, snapshot, submit } from "@/lib/engine";
import { presenterNotes } from "@/lib/presenter-notes";
import { openQuestion, reveal, sessionFixture, startedAt, studentA, studentB, studentC } from "./room-fixtures";

describe("authoritative presentation progression", () => {
  it("opens one round, guards unusually early closing, and permits explicit force closing", () => {
    const session = openQuestion("launch");
    expect(session.rounds.launch).toMatchObject({ state: "open", openedAt: startedAt, responses: {} });
    expect(() => move(session, session.version, 1, false, undefined, startedAt + 9_999)).toThrow(expect.objectContaining({ code: "EARLY_CLOSE", status: 409 }));
    expect(session.rounds.launch.state).toBe("open");
    const closed = move(session, session.version, 1, true, undefined, startedAt + 500);
    expect(closed.rounds.launch).toMatchObject({ state: "revealed", closedAt: startedAt + 500 });
    expect(closed.version).toBe(session.version + 1);
  });

  it("rejects answers at the deadline and reveals without a presenter command", () => {
    const session = openQuestion("launch");
    const last = submit(session, studentA, "launch", { choice: 1, reason: 2 }, startedAt + 14_999);
    expect(last.rounds.launch.responses[studentA].feedback.xp).toBe(500);
    expect(() => submit(session, studentA, "launch", { choice: 1, reason: 2 }, startedAt + 15_000)).toThrow(expect.objectContaining({ code: "CLOSED" }));
    expect(expireRounds(last, startedAt + 14_999)).toBe(last);
    const expired = expireRounds(last, startedAt + 15_000);
    expect(expired.rounds.launch.state).toBe("revealed");
    expect(beats[expired.index].id).toBe("launch-results");
    expect(expireRounds(expired, startedAt + 30_000)).toBe(expired);
    expect(submit(expired, studentA, "launch", { choice: 1, reason: 2 }, startedAt + 30_000)).toBe(expired);
  });

  it("rejects stale navigation, including repeated commands at an old version", () => {
    const initial = sessionFixture();
    const moved = move(initial, 0, 1, false, undefined, startedAt);
    expect(() => move(moved, 0, 1, true)).toThrow(expect.objectContaining({ code: "STALE", status: 409 }));
    expect(moved.index).toBe(1);
    expect(initial.index).toBe(0);
  });

  it("keeps navigation bounded without incrementing an unchanged version", () => {
    const first = sessionFixture();
    expect(move(first, 0, -1)).toBe(first);
    const last = { ...first, index: beats.length - 1 };
    expect(move(last, 0, 1)).toBe(last);
  });

  it("rejects chapter jumps while any round collects answers", () => {
    const opened = openQuestion("launch");
    expect(() => move(opened, opened.version, 1, true, beats.length - 1)).toThrow(RoomError);
    const previous = move(opened, opened.version, -1);
    expect(() => move(previous, previous.version, 1, true, 0)).toThrow(RoomError);
    expect(previous.rounds.launch.state).toBe("open");
  });

  it("replays revealed rounds without reopening them, losing submissions, or duplicating XP", () => {
    const answer = { choice: 1, reason: 2 };
    const closed = reveal(submit(openQuestion("launch"), studentA, "launch", answer));
    const before = snapshot(closed, studentA, "student");
    const backward = move(closed, closed.version, -1);
    expect(backward.rounds.launch.state).toBe("revealed");
    expect(() => submit(backward, studentB, "launch", answer)).toThrow(expect.objectContaining({ code: "CLOSED" }));
    const forward = move(backward, backward.version, 1);
    expect(forward.rounds).toEqual(closed.rounds);
    expect(snapshot(forward, studentA, "student").xp).toBe(before.xp);
    expect(snapshot(forward, studentA, "student").round?.count).toBe(1);
  });
});

describe("saved answers and private feedback", () => {
  it("only sends the current presenter note to the room owner, never to students", () => {
    const session = openQuestion("launch");
    const hostState = snapshot(session, "presenter", "host");
    const studentState = snapshot(session, studentA, "student");
    expect(hostState.presenterNote).toBe(presenterNotes["launch-open"]);
    expect(studentState).not.toHaveProperty("presenterNote");
    expect(JSON.stringify(studentState)).not.toContain(presenterNotes["launch-open"]);
    expect(JSON.stringify(hostState)).not.toContain(presenterNotes["launch-results"]);
    expect(hostState.ended).toBe(false);
    const conclusion = move(sessionFixture(), 0, 1, false, beats.length - 1);
    expect(snapshot(conclusion, studentA, "student").ended).toBe(true);
    expect(snapshot(move(conclusion, conclusion.version, -1), studentA, "student").ended).toBe(false);
  });

  it("makes an identical retry idempotent before and after closure", () => {
    const answer = { choice: 1, reason: 2 };
    const accepted = submit(openQuestion("launch"), studentA, "launch", answer, startedAt + 50);
    expect(submit(accepted, studentA, "launch", { reason: 2, choice: 1 }, startedAt + 80)).toBe(accepted);
    const closed = reveal(accepted);
    expect(submit(closed, studentA, "launch", answer)).toBe(closed);
    expect(closed.rounds.launch.responses[studentA].at).toBe(startedAt + 50);
    expect(snapshot(closed, studentA, "student").xp).toBe(998);
  });

  it("rejects attempts to overwrite a saved answer", () => {
    const accepted = submit(openQuestion("launch"), studentA, "launch", { choice: 1, reason: 2 });
    expect(() => submit(accepted, studentA, "launch", { choice: 0, reason: 2 })).toThrow(expect.objectContaining({ status: 409, code: "ALREADY_ANSWERED" }));
    expect(accepted.rounds.launch.responses[studentA].answer.choice).toBe(1);
  });

  it("requires both an analysis and a justification, and rejects empty recall", () => {
    const session = openQuestion("launch");
    expect(() => submit(session, studentA, "launch", { choice: 1 })).toThrow(expect.objectContaining({ status: 422 }));
    expect(() => submit(session, studentA, "launch", { choice: 4, reason: 2 })).toThrow(expect.objectContaining({ status: 422 }));
    expect(() => submit(session, studentA, "launch", { choice: 1, reason: 3 })).toThrow(expect.objectContaining({ status: 422 }));
    expect(() => submit(openQuestion("boss"), studentA, "boss", { recall: ["", " "] })).toThrow(expect.objectContaining({ status: 422 }));
    expect(() => submit(openQuestion("mini"), studentA, "mini", { recall: ["reprise", "franchise", "essaimage", "ex nihilo"] })).toThrow(expect.objectContaining({ status: 422 }));
  });

  it("does not expose answer keys, feedback, distributions, or XP before reveal", () => {
    const session = submit(openQuestion("launch"), studentA, "launch", { choice: 1, reason: 2 });
    for (const [actor, role] of [[studentA, "student"], [studentB, "student"], ["presenter", "host"]] as const) {
      const state = snapshot(session, actor, role);
      const serialized = JSON.stringify(state);
      for (const key of ["correctChoice", "correctReason", "explanation", "takeaway", "feedback", "counts", "hostHash", "members", "responses"]) expect(serialized).not.toContain(`"${key}"`);
      expect(serialized).not.toContain(keys.launch.explanation);
      expect(state.xp ?? 0).toBe(0);
      expect(state.recognized ?? []).toEqual([]);
    }
    expect(snapshot(session, studentA, "student").round?.submission?.answer).toEqual({ choice: 1, reason: 2 });
    expect(snapshot(session, studentB, "student").round?.submission).toBeUndefined();
  });

  it("reveals each student's own feedback and suppresses class distributions below three responses", () => {
    let session = openQuestion("launch");
    session = submit(session, studentA, "launch", { choice: 1, reason: 2 });
    session = submit(session, studentB, "launch", { choice: 0, reason: 0 });
    const closed = reveal(session);
    const own = snapshot(closed, studentA, "student");
    expect(own.round?.submission?.feedback?.correct).toBe(true);
    expect(own.round?.counts).toBeUndefined();
    const peer = snapshot(closed, studentB, "student");
    expect(peer.round?.submission?.feedback?.correct).toBe(false);
    expect(peer.round?.submission?.answer).toEqual({ choice: 0, reason: 0 });
    expect(JSON.stringify(own)).not.toContain("Alice");
    expect(JSON.stringify(own)).not.toContain(studentB);
  });

  it("publishes aggregate counts once three students have answered", () => {
    let session = openQuestion("launch");
    session = submit(session, studentA, "launch", { choice: 1, reason: 2 });
    session = submit(session, studentB, "launch", { choice: 0, reason: 0 });
    session = submit(session, studentC, "launch", { choice: 1, reason: 0 });
    const publicState = snapshot(reveal(session), "presenter", "host");
    expect(publicState.round?.counts).toEqual([1, 2, 0, 0]);
    expect(publicState.round?.submission).toBeUndefined();
  });


  it("keeps participation XP, correct reasoning, and unaided recall separate", () => {
    let session = reveal(submit(openQuestion("launch"), studentA, "launch", { choice: 1, reason: 0 }));
    expect(snapshot(session, studentA, "student")).toMatchObject({ xp: 0, recognized: [], recalled: [] });
    session = reveal(submit(openQuestion("social", session), studentA, "social", { choice: 3, reason: 0 }));
    session = reveal(submit(openQuestion("boss", session), studentA, "boss", { recall: ["franchise"] }));
    expect(snapshot(session, studentA, "student")).toMatchObject({ xp: 1125, recognized: ["social"], recalled: ["franchise"] });
  });

  it("protects a private recall result until reveal and suppresses small class recall totals", () => {
    const accepted = submit(openQuestion("boss"), studentA, "boss", { recall: ["franchise", "reprise"] });
    expect(snapshot(accepted, studentA, "student").recalled).toEqual([]);
    const state = snapshot(reveal(accepted), studentA, "student");
    expect(state.recalled).toEqual(["franchise", "repreneur"]);
    expect(state.round?.averageRecall).toBeUndefined();
    expect(state.round?.allRecalled).toBeUndefined();
    expect(state.round?.recalledCounts).toBeUndefined();
  });
});
