import { describe, expect, it } from "vitest";
import { expireRounds, snapshot, submit } from "@/lib/engine";
import { openQuestion, reveal, startedAt, studentA, studentB } from "./room-fixtures";

describe("editable recall autosaves", () => {
  it("keeps the latest saved text, restores it privately and counts it at closure", () => {
    let session = submit(openQuestion("mini"), studentA, "mini", { recall: ["ex", "", ""] }, startedAt + 2000);
    session = submit(session, studentA, "mini", { recall: ["ex nihilo", "essaimage", "franchise"] }, startedAt + 30000);
    const own = snapshot(session, studentA, "student");
    expect(own.round?.submission?.answer.recall).toEqual(["ex nihilo", "essaimage", "franchise"]);
    expect(own.round?.submission?.feedback).toBeUndefined();
    expect(own.xp).toBe(0);
    expect(snapshot(session, studentB, "student").round?.submission).toBeUndefined();
    expect(snapshot(session, "presenter", "host").round?.count).toBe(1);
    expect(expireRounds(session, startedAt + 59999).rounds.mini.state).toBe("open");
    const closed = expireRounds(session, startedAt + 60000);
    expect(snapshot(closed, studentA, "student").xp).toBe(750);
    expect(snapshot(closed, studentA, "student").round?.submission?.feedback?.recalled).toHaveLength(3);
    expect(() => submit(closed, studentA, "mini", { recall: ["vert"] }, startedAt + 60001)).toThrow();
    expect(submit(closed, studentA, "mini", { recall: ["ex nihilo", "essaimage", "franchise"] }, startedAt + 60001)).toBe(closed);
  });

  it("allows erasing a saved entry and freezes it on manual closure or at the deadline", () => {
    let session = submit(openQuestion("mini"), studentA, "mini", { recall: ["franchise"] }, startedAt);
    session = submit(session, studentA, "mini", { recall: [""] }, startedAt + 5000);
    expect(snapshot(reveal(session), studentA, "student").xp).toBe(0);
    expect(() => submit(session, studentA, "mini", { recall: ["franchise"] }, startedAt + 60000)).toThrow(expect.objectContaining({ code: "CLOSED" }));
    expect(() => submit(reveal(session), studentA, "mini", { recall: ["franchise"] })).toThrow();
  });
});
