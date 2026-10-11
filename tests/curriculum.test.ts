import { describe, expect, it } from "vitest";
import { beats } from "@/content/beats.fr";
import { characters, chapters } from "@/content/curriculum.fr";
import { questions } from "@/content/questions.fr";
import { aliases, keys } from "@/lib/answer-keys";
import { grade, normalize, recallForms } from "@/lib/grading";
import { presenterNotes } from "@/lib/presenter-notes";
describe("company-story curriculum", () => {
it("contains eight three-step stories, nine quizzes, final recall and closing", () => {
expect(beats).toHaveLength(48); expect(chapters).toHaveLength(9);
expect(beats.slice(-3).map(b=>b.kind)).toEqual(["pitch","synthesis","conclusion"]);
expect(characters.map(c=>c.id)).toEqual(questions.boss.forms);
for(const person of characters) {
expect(beats.filter(b=>b.character===person.id).map(b=>b.kind)).toEqual(["teaser","story","reveal"]);
for(const beat of beats.filter(b=>b.character===person.id)) expect(beat.title).not.toContain(person.company);
expect(person.story).not.toContain(person.company);
}
expect(Object.values(questions).filter(q=>q.kind==="choice")).toHaveLength(9);
expect(questions.boss).toMatchObject({seconds:120,recallCount:8});
expect(beats.every(b=>!("speaker" in b))).toBe(true);
});
it("pairs each quiz with results and keeps keys/notes server-only", () => {
expect(Object.keys(presenterNotes)).toEqual(beats.map(b=>b.id));
expect(Object.keys(keys)).toEqual(Object.keys(questions));
for(const q of Object.values(questions)){
const i=beats.findIndex(b=>b.questionId===q.id&&b.kind.endsWith("-open"));
expect(beats[i+1].kind.endsWith("-results")).toBe(true);
expect(q.reasons).toBeUndefined();
for(const k of ["correctChoice","explanation","takeaway"]) expect(q).not.toHaveProperty(k);
if(q.kind==="choice") expect(q.options[keys[q.id].choice!]).toBeTruthy();
}
});
it("accepts French and English names, deduplicates, and rejects company names",()=>{
expect(recallForms(characters.map(c=>c.label.toUpperCase()),questions.boss.forms)).toEqual(questions.boss.forms);
expect(recallForms(["individual","partner","innovative","social","high-growth","intrapreneur","family","international"],questions.boss.forms)).toEqual(questions.boss.forms);
expect(recallForms(["individuel","individual","familial","family"],questions.boss.forms)).toEqual(["individual","family"]);
expect(recallForms(["intrapreneurx","internationl"],questions.boss.forms)).toEqual(["intrapreneur","international"]);
expect(recallForms(["eBay","LEGO","entrepreneur",""],questions.boss.forms)).toEqual([]);
const seen=new Set<string>(); for(const names of Object.values(aliases)) for(const name of names){expect(normalize(name)).toBe(name);expect(seen.has(name)).toBe(false);seen.add(name);}
});
it("scores single-tap questions without a reason",()=>{expect(grade("individual",{choice:1}).xp).toBe(1000);expect(grade("individual",{choice:0}).xp).toBe(0);});
});
