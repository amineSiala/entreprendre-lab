import { describe, expect, it } from "vitest";
import { move, snapshot, submit } from "@/lib/engine";
import { openQuestion, reveal, sessionFixture, startedAt, studentA, studentB } from "./room-fixtures";

describe("projector leaderboard", () => {
  it("shows lobby nicknames only to the host before the presentation starts", () => {
    const session = sessionFixture();
    expect(snapshot(session, "presenter", "host").lobbyParticipants).toEqual(["Alice", "Bilal", "Camille"]);
    expect(snapshot(session, studentA, "student").lobbyParticipants).toBeUndefined();
    expect(snapshot(openQuestion("partners", session), "presenter", "host").lobbyParticipants).toBeUndefined();
    delete session.members[studentB];
    expect(snapshot(session, "presenter", "host").lobbyParticipants).toEqual(["Alice", "Camille"]);
    expect(JSON.stringify(snapshot(session, "presenter", "host").lobbyParticipants)).not.toContain(studentA);
  });
  it("adds a persisted arrow step after explanation, with back and jump support", () => {
    const explained = reveal(openQuestion("individual"));
    const podium = move(explained, explained.version, 1);
    expect(podium.index).toBe(explained.index);
    expect(podium.leaderboardVisible).toBe(true);
    expect(snapshot(podium, "presenter", "host").leaderboardVisible).toBe(true);
    expect(move(podium, podium.version, -1).leaderboardVisible).toBe(false);
    expect(move(podium, podium.version, 1)).toMatchObject({ index: explained.index + 1, leaderboardVisible: false });
    expect(move(podium, podium.version, 1, false, 0)).toMatchObject({ index: 0, leaderboardVisible: false });
    expect(() => move(podium, explained.version, 1)).toThrow();
  });

  it("uses revealed cumulative points, retains nonresponders and excludes identities from phones", () => {
    let session = submit(openQuestion("individual"), studentA, "individual", { choice: 1, reason: 2 }, startedAt);
    expect(snapshot(session, "presenter", "host").leaderboard).toBeUndefined();
    session = openQuestion("impact", reveal(session));
    session = submit(session, studentB, "impact", { choice: 3, reason: 0 }, startedAt + 10000);
    session = reveal(session);
    const board = snapshot(session, "presenter", "host").leaderboard!;
    expect(board.top.map(row => [row.nickname, row.points, row.previousPoints, row.rank])).toEqual([
      ["Alice", 1000, 1000, 1], ["Bilal", 750, 0, 2], ["Camille", 0, 0, 3],
    ]);
    expect(board.bottom).toEqual([]);
    expect(board.lastNames).toEqual(["Camille"]);
    const phone = snapshot(session, studentA, "student");
    expect(phone.leaderboard).toBeUndefined();
    expect(phone.leaderboardVisible).toBeUndefined();
    expect(JSON.stringify(phone)).not.toContain("Bilal");
  });

  it("shares tied ranks, selects six distinct players, and handles empty rooms and deletion", () => {
    const fixture = sessionFixture();
    for (let i = 0; i < 5; i++) fixture.members[`extra-${i}`] = { nickname: `Extra ${i}`, joinedAt: startedAt + i + 1 };
    const session = reveal(openQuestion("partners", fixture));
    let board = snapshot(session, "presenter", "host").leaderboard!;
    expect(board.top).toHaveLength(3);
    expect(board.bottom).toHaveLength(3);
    expect(new Set([...board.top, ...board.bottom].map(row => row.nickname)).size).toBe(6);
    expect([...board.top, ...board.bottom].every(row => row.rank === 1 && row.points === 0)).toBe(true);
    expect(board.lastCount).toBe(8);
    delete session.members[studentA];
    expect(JSON.stringify(snapshot(session, "presenter", "host").leaderboard)).not.toContain("Alice");
    session.members = {};
    board = snapshot(session, "presenter", "host").leaderboard!;
    expect(board).toMatchObject({ top: [], bottom: [], lastNames: [], lastCount: 0, total: 0 });
  });
});
