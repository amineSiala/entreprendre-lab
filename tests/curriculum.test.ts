import { describe, expect, it } from "vitest";
import { beats } from "@/content/beats.fr";
import { characters, chapters } from "@/content/curriculum.fr";
import { questions } from "@/content/questions.fr";
import { aliases, keys } from "@/lib/answer-keys";
import { grade, normalize, recallForms } from "@/lib/grading";
import { presenterNotes } from "@/lib/presenter-notes";
import type { FormId } from "@/types/domain";

const officialForms: FormId[] = ["exnihilo", "essaimage", "franchise", "intrapreneur", "repreneur", "social", "techno", "vert"];
const officialLabels = ["Création ex nihilo", "Entrepreneuriat par essaimage", "Entrepreneuriat par franchise", "Intrapreneuriat", "Reprise d’entreprise", "Entrepreneuriat social et solidaire", "Techno-entrepreneuriat", "Entrepreneuriat vert"];

describe("professor's eight-form curriculum", () => {
  it("teaches and recalls exactly the supplied eight forms in a twelve-chapter presentation", () => {
    expect(characters.map(character => character.id)).toEqual(officialForms);
    expect(characters.map(character => character.label)).toEqual(officialLabels);
    expect(chapters).toHaveLength(12);
    expect([...new Set(beats.map(beat => beat.chapter))]).toEqual(Array.from({ length: 12 }, (_, index) => index + 1));
    expect(new Set(beats.filter(beat => beat.character).map(beat => beat.character))).toEqual(new Set(officialForms));
    expect(questions.boss.forms).toEqual(officialForms);
    expect(questions.boss.recallCount).toBe(8);
  });

  it("has a separate opening and results beat and a protected answer key for every question", () => {
    expect(new Set(Object.keys(keys))).toEqual(new Set(Object.keys(questions)));
    for (const question of Object.values(questions)) {
      const opening = beats.findIndex(beat => beat.questionId === question.id && beat.kind.endsWith("-open"));
      const result = beats.findIndex(beat => beat.questionId === question.id && beat.kind.endsWith("-results"));
      expect(opening).toBeGreaterThanOrEqual(0);
      expect(result).toBe(opening + 1);
      expect(question.forms.every(id => officialForms.includes(id))).toBe(true);
      for (const privateField of ["choice", "reason", "correctChoice", "correctReason", "explanation", "takeaway"]) expect(question).not.toHaveProperty(privateField);
      if (question.kind === "choice") {
        const key = keys[question.id];
        expect(question.reasons?.length).toBeGreaterThan(1);
        expect(question.options[key.choice!]).toBeTruthy();
        expect(question.reasons?.[key.reason!]).toBeTruthy();
      }
    }
  });

  it("keeps every presenter note in server content and out of the public beat catalog", () => {
    expect(Object.keys(presenterNotes)).toEqual(beats.map(beat => beat.id));
    for (const beat of beats) {
      expect(beat).not.toHaveProperty("notes");
      expect(presenterNotes[beat.id].length).toBeGreaterThan(0);
    }
    const publicContent = JSON.stringify(beats);
    for (const note of Object.values(presenterNotes)) expect(publicContent).not.toContain(note);
  });

  it("retains distinctions that demand understanding and can combine in the transfer challenge", () => {
    expect(questions.intra.forms).toEqual(["intrapreneur", "essaimage"]);
    expect(questions.network.forms).toEqual(["repreneur", "franchise"]);
    expect(questions.green.forms).toEqual(["techno", "vert"]);
    expect(questions.transfer.forms).toEqual(["essaimage", "techno", "vert"]);
    expect(questions.jury.kind).toBe("vote");
    expect(keys.jury.choice).toBeUndefined();
  });
});

describe("unaided recall grading", () => {
  it("recognizes all official names despite accents, punctuation, case, and whitespace", () => {
    expect(recallForms(officialLabels.map(label => `  ${label.toUpperCase()}  `), officialForms)).toEqual(officialForms);
    expect(normalize("  REPRISE D’ENTREPRISE  ")).toBe("reprise d entreprise");
    expect(recallForms(["création à partir de zéro", "ESS", "entrepreneuriat écologique"], officialForms)).toEqual(["exnihilo", "social", "vert"]);
  });

  it("allows one unambiguous insertion, deletion, or substitution in longer names", () => {
    expect(recallForms(["essaimge", "franchisze", "intrapreneuriatx", "reprise d entreprize"], officialForms)).toEqual(["essaimage", "franchise", "intrapreneur", "repreneur"]);
    expect(recallForms(["ver", "esss", "tech"], officialForms)).toEqual([]);
  });

  it("deduplicates synonyms and does not count ambiguous creator or generic innovation", () => {
    expect(recallForms(["ex nihilo", "création ex nihilo", "création de zéro"], officialForms)).toEqual(["exnihilo"]);
    expect(recallForms(["créateur", "création", "entrepreneur", "indépendant", "innovateur", "innovation", "lina", ""], officialForms)).toEqual([]);
  });

  it("only accepts forms included in the current recall exercise", () => {
    expect(recallForms(["social", "vert", "techno", "franchise"], questions.mini.forms)).toEqual(["franchise"]);
  });

  it("does not allow a normalized alias to identify more than one form", () => {
    const owners = new Map<string, FormId>();
    for (const form of officialForms) for (const alias of aliases[form]) {
      expect(normalize(alias)).toBe(alias);
      expect(owners.get(alias) ?? form).toBe(form);
      owners.set(alias, form);
    }
  });

  it("awards correct reasoning only when both answer and reason are correct", () => {
    const correct = grade("launch", { choice: 1, reason: 2 });
    expect(correct).toMatchObject({ correct: true, choiceCorrect: true, reasonCorrect: true, xp: 30, recalled: [] });
    expect(grade("launch", { choice: 1, reason: 0 })).toMatchObject({ correct: false, choiceCorrect: true, reasonCorrect: false, xp: 10 });
    expect(grade("launch", { choice: 0, reason: 2 })).toMatchObject({ correct: false, choiceCorrect: false, reasonCorrect: true, xp: 10 });
  });

  it("separates discussion participation and recall achievement from recognition correctness", () => {
    expect(grade("jury", { choice: 0 })).toMatchObject({ xp: 10, recalled: [] });
    expect(grade("jury", { choice: 0 }).correct).toBeUndefined();
    const result = grade("boss", { recall: officialLabels });
    expect(result).toMatchObject({ xp: 50, recalled: officialForms });
    expect(result.correct).toBeUndefined();
    expect(grade("boss", { recall: ["inconnu"] })).toMatchObject({ xp: 10, recalled: [] });
  });
});
