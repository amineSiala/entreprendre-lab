import { describe, expect, it } from "vitest";
import { beats } from "@/content/beats.fr";
import { keys } from "@/lib/answer-keys";
import { expireRounds, move, RoomError, snapshot, submit } from "@/lib/engine";
import { presenterNotes } from "@/lib/presenter-notes";
import { openQuestion, reveal, sessionFixture, startedAt, studentA, studentB, studentC } from "./room-fixtures";

describe("authoritative presentation progression", () => {
  it("opens one round, guards unusually early closing, and permits explicit force closing", () => {
    const session = openQuestion("individual");
    expect(session.rounds.individual).toMatchObject({ state: "open", openedAt: startedAt, responses: {} });
    expect(() => move(session, session.version, 1, false, undefined, startedAt + 9_999)).toThrow(expect.objectContaining({ code: "EARLY_CLOSE", status: 409 }));
    expect(session.rounds.individual.state).toBe("open");
    const closed = move(session, session.version, 1, true, undefined, startedAt + 500);
    expect(closed.rounds.individual).toMatchObject({ state: "revealed", closedAt: startedAt + 500 });
    expect(closed.version).toBe(session.version + 1);
  });

  it("rejects answers at the deadline and reveals without a presenter command", () => {
    const session = openQuestion("individual");
    const last = submit(session, studentA, "individual", { choice: 1, reason: 2 }, startedAt + 19_999);
    expect(last.rounds.individual.responses[studentA].feedback.xp).toBe(500);
    expect(() => submit(session, studentA, "individual", { choice: 1, reason: 2 }, startedAt + 20_000)).toThrow(expect.objectContaining({ code: "CLOSED" }));
    expect(expireRounds(last, startedAt + 19_999)).toBe(last);
    const expired = expireRounds(last, startedAt + 20_000);
    expect(expired.rounds.individual.state).toBe("revealed");
    expect(beats[expired.index].id).toBe("individual-results");
    expect(expireRounds(expired, startedAt + 30_000)).toBe(expired);
    expect(submit(expired, studentA, "individual", { choice: 1, reason: 2 }, startedAt + 30_000)).toBe(expired);
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
    const opened = openQuestion("individual");
    expect(() => move(opened, opened.version, 1, true, beats.length - 1)).toThrow(RoomError);
    const previous = move(opened, opened.version, -1);
    expect(() => move(previous, previous.version, 1, true, 0)).toThrow(RoomError);
    expect(previous.rounds.individual.state).toBe("open");
  });

  it("replays revealed rounds without reopening them, losing submissions, or duplicating XP", () => {
    const answer = { choice: 1, reason: 2 };
    const closed = reveal(submit(openQuestion("individual"), studentA, "individual", answer));
    const before = snapshot(closed, studentA, "student");
    const backward = move(closed, closed.version, -1);
    expect(backward.rounds.individual.state).toBe("revealed");
    expect(() => submit(backward, studentB, "individual", answer)).toThrow(expect.objectContaining({ code: "CLOSED" }));
    const forward = move(backward, backward.version, 1);
    expect(forward.rounds).toEqual(closed.rounds);
    expect(snapshot(forward, studentA, "student").xp).toBe(before.xp);
    expect(snapshot(forward, studentA, "student").round?.count).toBe(1);
  });
});

describe("saved answers and private feedback", () => {
  it("only sends the current presenter note to the room owner, never to students", () => {
    const session = openQuestion("individual");
    const hostState = snapshot(session, "presenter", "host");
    const studentState = snapshot(session, studentA, "student");
    expect(hostState.presenterNote).toBe(presenterNotes["individual-open"]);
    expect(studentState).not.toHaveProperty("presenterNote");
    expect(JSON.stringify(studentState)).not.toContain(presenterNotes["individual-open"]);
    expect(JSON.stringify(hostState)).not.toContain(presenterNotes["individual-results"]);
    expect(hostState.ended).toBe(false);
    const conclusion = move(sessionFixture(), 0, 1, false, beats.length - 1);
    expect(snapshot(conclusion, studentA, "student").ended).toBe(true);
    expect(snapshot(move(conclusion, conclusion.version, -1), studentA, "student").ended).toBe(false);
  });

  it("makes an identical retry idempotent before and after closure", () => {
    const answer = { choice: 1, reason: 2 };
    const accepted = submit(openQuestion("individual"), studentA, "individual", answer, startedAt + 50);
    expect(submit(accepted, studentA, "individual", { reason: 2, choice: 1 }, startedAt + 80)).toBe(accepted);
    const closed = reveal(accepted);
    expect(submit(closed, studentA, "individual", answer)).toBe(closed);
    expect(closed.rounds.individual.responses[studentA].at).toBe(startedAt + 50);
    expect(snapshot(closed, studentA, "student").xp).toBe(999);
  });

  it("rejects attempts to overwrite a saved answer", () => {
    const accepted = submit(openQuestion("individual"), studentA, "individual", { choice: 1, reason: 2 });
    expect(() => submit(accepted, studentA, "individual", { choice: 0, reason: 2 })).toThrow(expect.objectContaining({ status: 409, code: "ALREADY_ANSWERED" }));
    expect(accepted.rounds.individual.responses[studentA].answer.choice).toBe(1);
  });

  it("accepts a single choice and empty recall drafts, rejects invalid choices and oversized recall", () => {
    const session = openQuestion("individual");
    expect(submit(session, studentA, "individual", { choice: 1 }).rounds.individual.responses[studentA].feedback.correct).toBe(true);
    expect(() => submit(session, studentA, "individual", { choice: 4 })).toThrow(expect.objectContaining({ status: 422 }));
    expect(submit(openQuestion("boss"), studentA, "boss", { recall: ["", " "] }).rounds.boss.responses[studentA].feedback.xp).toBe(0);
    expect(() => submit(openQuestion("boss"), studentA, "boss", { recall: Array(9).fill("social") })).toThrow(expect.objectContaining({ status: 422 }));
  });

  it("does not expose answer keys, feedback, distributions, or XP before reveal", () => {
    const session = submit(openQuestion("individual"), studentA, "individual", { choice: 1, reason: 2 });
    for (const [actor, role] of [[studentA, "student"], [studentB, "student"], ["presenter", "host"]] as const) {
      const state = snapshot(session, actor, role);
      const serialized = JSON.stringify(state);
      for (const key of ["correctChoice", "correctReason", "explanation", "takeaway", "feedback", "counts", "hostHash", "members", "responses"]) expect(serialized).not.toContain(`"${key}"`);
      expect(serialized).not.toContain(keys.individual.explanation);
      expect(state.xp ?? 0).toBe(0);
      expect(state.recognized ?? []).toEqual([]);
    }
    expect(snapshot(session, studentA, "student").round?.submission?.answer).toEqual({ choice: 1, reason: 2 });
    expect(snapshot(session, studentB, "student").round?.submission).toBeUndefined();
  });

  it("reveals each student's own feedback and suppresses class distributions below three responses", () => {
    let session = openQuestion("individual");
    session = submit(session, studentA, "individual", { choice: 1, reason: 2 });
    session = submit(session, studentB, "individual", { choice: 0, reason: 0 });
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
    let session = openQuestion("individual");
    session = submit(session, studentA, "individual", { choice: 1, reason: 2 });
    session = submit(session, studentB, "individual", { choice: 0, reason: 0 });
    session = submit(session, studentC, "individual", { choice: 1, reason: 0 });
    const publicState = snapshot(reveal(session), "presenter", "host");
    expect(publicState.round?.counts).toEqual([1, 2, 0, 0]);
    expect(publicState.round?.submission).toBeUndefined();
  });


  it("keeps participation XP, correct reasoning, and unaided recall separate", () => {
    let session = reveal(submit(openQuestion("individual"), studentA, "individual", { choice: 0 }));
    expect(snapshot(session, studentA, "student")).toMatchObject({ xp: 0, recognized: [], recalled: [] });
    session = reveal(submit(openQuestion("impact", session), studentA, "impact", { choice: 3, reason: 0 }));
    session = reveal(submit(openQuestion("boss", session), studentA, "boss", { recall: ["familial"] }));
    expect(snapshot(session, studentA, "student")).toMatchObject({ xp: 1958, recognized: ["social"], recalled: ["family"] });
  });

  it("protects a private recall result until reveal and suppresses small class recall totals", () => {
    const accepted = submit(openQuestion("boss"), studentA, "boss", { recall: ["familial", "international"] });
    expect(snapshot(accepted, studentA, "student").recalled).toEqual([]);
    const state = snapshot(reveal(accepted), studentA, "student");
    expect(state.recalled).toEqual(["family", "international"]);
    expect(state.round?.averageRecall).toBeUndefined();
    expect(state.round?.allRecalled).toBeUndefined();
    expect(state.round?.recalledCounts).toBeUndefined();
  });
});
