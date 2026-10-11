import { describe, expect, it } from "vitest";
import { beats } from "@/content/beats.fr";
import { move, snapshot, submit } from "@/lib/engine";
import { commandPitch, forgetPitch, ratePitch, upgradeSession } from "@/lib/pitch";
import type { PitchCommand, Session, TeamId } from "@/types/domain";
import { openQuestion, reveal, sessionFixture, studentA, studentB, studentC } from "./room-fixtures";
const actors = [studentA, studentB, studentC];
function setup(base = sessionFixture()) {
  const s = upgradeSession(base);
  s.index = beats.findIndex(b => b.kind === "pitch");
  return s;
}
function cmd(s: Session, c: PitchCommand) { return commandPitch(s, s.version, c); }
function confirmed(base = setup()) {
  let s = base;
  for (let i = 0; i < 3; i++) s = cmd(s, { command: "assign", participantId: s.members[actors[i]].publicId!, team: (i + 1) as TeamId });
  s = cmd(s, { command: "select", selection: "review" });
  return cmd(s, { command: "confirm", team: 1 });
}
function voteTeam(s: Session, team: TeamId, ratings: number[]) {
  s = cmd(s, { command: "start", team }); s = cmd(s, { command: "open", team });
  const others = actors.filter(a => s.pitch!.assignments[a] !== team);
  ratings.forEach((rating, i) => { s = ratePitch(s, others[i], team, rating, 1); });
  return cmd(s, { command: "close", team });
}
describe("pitch challenge", () => {
  it("upgrades old story rooms without resetting answers, IDs or finished positions", () => {
    const old = sessionFixture(); delete old.payloadRevision;
    old.index = 45; old.rounds.boss = { questionId: "boss", state: "revealed", openedAt: 0, responses: {} };
    const s = upgradeSession(old);
    expect(s.index).toBe(beats.length - 1); expect(s.rounds).toEqual(old.rounds);
    expect(Object.values(s.members).every(m => !!m.publicId)).toBe(true);
    expect(upgradeSession(s)).toBe(s);
    old.index = 12; expect(upgradeSession(old).index).toBe(12);
  });
  it("assigns duplicate nicknames independently, moves/removes players, and rejects incomplete teams", () => {
    let s = setup(); s.members[studentB].nickname = "Alice";
    const id = s.members[studentA].publicId!;
    s = cmd(s, { command: "assign", participantId: id, team: 1 });
    s = cmd(s, { command: "assign", participantId: id, team: 2 });
    expect(s.pitch!.assignments[studentA]).toBe(2); expect(s.pitch!.assignments[studentB]).toBeUndefined();
    s = cmd(s, { command: "assign", participantId: id, team: null });
    expect(s.pitch!.assignments).toEqual({});
    s = cmd(s, { command: "select", selection: "review" });
    expect(() => cmd(s, { command: "confirm", team: 1 })).toThrow();
    const complete = confirmed(s);
    expect(() => cmd(complete, { command: "assign", participantId: id, team: 2 })).toThrow("verrouillées");
  });
  it("blocks unintended navigation and out-of-order phases; transitions retry safely", () => {
    let s = confirmed();
    expect(() => move(s, s.version, 1)).toThrow();
    expect(() => move(s, s.version, -1, true, 0)).toThrow();
    expect(() => cmd(s, { command: "start", team: 2 })).toThrow();
    expect(() => cmd(s, { command: "open", team: 1 })).toThrow();
    expect(() => cmd(s, { command: "reveal", team: 3 })).toThrow();
    s = cmd(s, { command: "start", team: 1 });
    expect(commandPitch(s, s.version - 1, { command: "start", team: 1 })).toBe(s);
  });
  it("rejects own-team and invalid votes, replaces edits, rejects stale revisions and accepts exact retries", () => {
    let s = confirmed(); s = cmd(s, { command: "start", team: 1 }); s = cmd(s, { command: "open", team: 1 });
    expect(() => ratePitch(s, studentA, 1, 10, 1)).toThrow("propre équipe");
    for (const rating of [0, 11, 1.5, NaN]) expect(() => ratePitch(s, studentB, 1, rating, 1)).toThrow();
    s = ratePitch(s, studentB, 1, 4, 1); s = ratePitch(s, studentB, 1, 9, 2);
    expect(Object.keys(s.pitch!.votes[1]!)).toHaveLength(1);
    expect(() => ratePitch(s, studentB, 1, 4, 1)).toThrow(expect.objectContaining({ code: "STALE_VOTE" }));
    expect(ratePitch(s, studentB, 1, 9, 2)).toBe(s);
    s = cmd(s, { command: "close", team: 1 });
    expect(ratePitch(s, studentB, 1, 9, 2)).toBe(s);
    expect(() => ratePitch(s, studentB, 1, 10, 3)).toThrow(expect.objectContaining({ code: "PITCH_CLOSED" }));
    expect(s.pitch!.results[1]).toMatchObject({ count: 1, average: 9, bonus: 6300 });
  });
  it.each([[1, 700], [7, 4900], [10, 7000]])("awards rating %i as %i points only after collective reveal", (rating, points) => {
    let s = confirmed();
    for (const team of [1, 2, 3] as TeamId[]) s = voteTeam(s, team, [rating, rating]);
    const hidden = snapshot(s, studentA, "student");
    expect(hidden.xp).toBe(0); expect(hidden.pitch!.teams[0]).not.toHaveProperty("average");
    expect(hidden.pitch!.teams[0]).not.toHaveProperty("bonus");
    s = cmd(s, { command: "reveal", team: 3 });
    expect(snapshot(s, studentA, "student").xp).toBe(points);
    expect(snapshot(s, "presenter", "host").leaderboard!.top.every(r => r.points === points)).toBe(true);
    expect(snapshot(s, studentA, "student").pitch!.teams.map(t => t.rank)).toEqual([1, 1, 1]);
    expect(commandPitch(s, 0, { command: "reveal", team: 3 })).toBe(s);
    const board = move(s, s.version, 1); expect(board.leaderboardVisible).toBe(true);
    const synthesis = move(board, board.version, 1);
    expect(beats[synthesis.index].id).toBe("instadeep");
    expect(snapshot(synthesis, studentA, "student").xp).toBe(points);
    expect(beats[move(synthesis, synthesis.version, 1).index].kind).toBe("conclusion");
  });
  it("uses the unrounded average and handles no votes without inventing points", () => {
    let s = confirmed(); s = voteTeam(s, 1, [1, 10]); s = voteTeam(s, 2, []); s = voteTeam(s, 3, [7, 8]);
    s = cmd(s, { command: "reveal", team: 3 });
    expect(s.pitch!.results[1]).toMatchObject({ average: 5.5, bonus: 3850 });
    expect(s.pitch!.results[2]).toMatchObject({ count: 0, average: 0, bonus: 0 });
    expect(snapshot(s, studentA, "student").pitch!.teams.map(t => t.rank)).toEqual([2, 3, 1]);
    let fractional = confirmed(); fractional.members.audience = { publicId: "audience", nickname: "Public", joinedAt: 1 };
    fractional = cmd(fractional, { command: "start", team: 1 }); fractional = cmd(fractional, { command: "open", team: 1 });
    for (const actor of [studentB, studentC, "audience"]) fractional = ratePitch(fractional, actor, 1, actor === "audience" ? 2 : 1, 1);
    fractional = cmd(fractional, { command: "close", team: 1 });
    expect(fractional.pitch!.results[1]!.bonus).toBe(933);
  });
  it("lets late arrivals rate all teams without a bonus and exposes no private voter identities", () => {
    let s = confirmed(); s.members.late = { publicId: "public-late", nickname: "Public", joinedAt: 1 };
    s = cmd(s, { command: "start", team: 1 }); s = cmd(s, { command: "open", team: 1 }); s = ratePitch(s, "late", 1, 8, 1);
    const safe = snapshot(s, studentA, "student");
    expect(safe.pitch!.eligible).toBe(false); expect(safe.pitch).not.toHaveProperty("votes");
    expect(JSON.stringify(safe)).not.toContain(studentB);
    expect(snapshot(s, "late", "student").pitch).toMatchObject({ eligible: true, ownVote: { rating: 8, revision: 1 } });
    s = cmd(s, { command: "close", team: 1 }); s = voteTeam(s, 2, []); s = voteTeam(s, 3, []); s = cmd(s, { command: "reveal", team: 3 });
    expect(snapshot(s, "late", "student").xp).toBe(0);
  });
  it("deletes personal votes/membership while preserving closed anonymous results", () => {
    let s = confirmed(); s = voteTeam(s, 1, [7, 9]);
    delete s.members[studentB]; forgetPitch(s, studentB);
    expect(s.pitch!.votes[1]).not.toHaveProperty(studentB); expect(s.pitch!.assignments).not.toHaveProperty(studentB);
    expect(s.pitch!.results[1]).toMatchObject({ count: 2, average: 8, bonus: 5600 });
  });
  it("adds pitch points to quiz totals without changing recognized forms", () => {
    let base = openQuestion("individual"); base = submit(base, studentA, "individual", { choice: 1 }, base.rounds.individual.openedAt); base = reveal(base);
    let s = confirmed(setup(base)); for (const team of [1, 2, 3] as TeamId[]) s = voteTeam(s, team, [7]); s = cmd(s, { command: "reveal", team: 3 });
    expect(snapshot(s, studentA, "student")).toMatchObject({ xp: 5900, recognized: ["individual"] });
    expect(snapshot(s, "presenter", "host").leaderboard!.top[0]).toMatchObject({ nickname: "Alice", points: 5900, previousPoints: 1000 });
  });
  it("upgrades revision-2 conclusions and ongoing pitch rankings without losing scores or public IDs", () => {
    let s = confirmed();
    for (const team of [1, 2, 3] as TeamId[]) s = voteTeam(s, team, [7]);
    s = cmd(s, { command: "reveal", team: 3 });
    s = move(s, s.version, 1); s.payloadRevision = 2;
    const upgraded = upgradeSession(s);
    expect(upgraded).toMatchObject({ payloadRevision: 3, index: 45, leaderboardVisible: true, version: s.version });
    expect(upgraded.pitch).toEqual(s.pitch); expect(upgraded.members).toEqual(s.members); expect(upgraded.rounds).toEqual(s.rounds);
    expect(snapshot(upgraded, studentA, "student").xp).toBe(4900);
    const synthesis = move(upgraded, upgraded.version, 1);
    expect(beats[synthesis.index].id).toBe("instadeep");
    const finished = { ...s, index: 46, leaderboardVisible: false };
    expect(upgradeSession(finished)).toMatchObject({ payloadRevision: 3, index: 47, pitch: s.pitch });
    expect(upgradeSession(upgraded)).toBe(upgraded);
  });
});
