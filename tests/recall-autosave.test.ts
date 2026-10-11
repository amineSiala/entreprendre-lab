import { describe, expect, it } from "vitest";
import { expireRounds, move, snapshot, submit } from "@/lib/engine";
import { grade } from "@/lib/grading";
import { openQuestion, startedAt, studentA, studentB } from "./room-fixtures";
const all=["individual","partner","innovative","social","high-growth","intrapreneur","family","international"];
describe("120-second final recall",()=>{
it("scores 8000/6000/4000 at start/midpoint/timeout with partial credit",()=>{
expect([0,60000,120000].map(t=>grade("boss",{recall:all},t).xp)).toEqual([8000,6000,4000]);
expect(grade("boss",{recall:all.slice(0,4)},60000).xp).toBe(3000);
expect(grade("boss",{recall:["social","social"]},0).xp).toBe(1000);
expect(grade("boss",{recall:[]},0).xp).toBe(0);
});
it("saves drafts privately, restores edits and grades unsubmitted drafts at the deadline",()=>{
let s=submit(openQuestion("boss"),studentA,"boss",{recall:["ind"]},startedAt+1000);
s=submit(s,studentA,"boss",{recall:all},startedAt+2000);
expect(snapshot(s,studentA,"student").round?.submission).toMatchObject({answer:{recall:all},finalized:false});
expect(snapshot(s,studentA,"student").round?.submission?.feedback).toBeUndefined();
expect(snapshot(s,studentB,"student").round?.submission).toBeUndefined();
expect(snapshot(s,studentA,"student").xp).toBe(0);
expect(expireRounds(s,startedAt+119999)).toBe(s);
const end=expireRounds(s,startedAt+130000);
expect(end.rounds.boss.responses[studentA]).toMatchObject({at:startedAt+120000,finalized:true,feedback:{xp:4000}});
expect(submit(end,studentA,"boss",{recall:all},startedAt+140000,true)).toBe(end);
});
it("explicit submission of an unchanged draft locks its new scoring time and retries idempotently",()=>{
let s=submit(openQuestion("boss"),studentA,"boss",{recall:all},startedAt+1000);
s=submit(s,studentA,"boss",{recall:all},startedAt+60000,true);
expect(s.rounds.boss.responses[studentA]).toMatchObject({at:startedAt+60000,finalized:true,feedback:{xp:6000}});
expect(submit(s,studentA,"boss",{recall:all},startedAt+70000,true)).toBe(s);
expect(()=>submit(s,studentA,"boss",{recall:["social"]},startedAt+70001)).toThrow();
const end=expireRounds(s,startedAt+120000);
expect(snapshot(end,studentA,"student").xp).toBe(6000);
});
it("uses closure time for drafts, preserves finalized scores, and supports erasing everything",()=>{
let s=submit(openQuestion("boss"),studentA,"boss",{recall:all},startedAt+1000,true);
s=submit(s,studentB,"boss",{recall:all},startedAt+1000);
const end=move(s,s.version,1,false,undefined,startedAt+60000);
expect(end.rounds.boss.responses[studentB].feedback.xp).toBe(6000);
expect(end.rounds.boss.responses[studentA].feedback.xp).toBe(7967);
s=submit(openQuestion("boss"),studentA,"boss",{recall:all},startedAt+1000);
s=submit(s,studentA,"boss",{recall:[""]},startedAt+2000);
expect(expireRounds(s,startedAt+120000).rounds.boss.responses[studentA].feedback.xp).toBe(0);
expect(()=>submit(s,studentB,"boss",{recall:all},startedAt+120000,true)).toThrow(expect.objectContaining({code:"CLOSED"}));
});
});
