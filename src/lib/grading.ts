import "server-only";
import { aliases, keys } from "@/lib/answer-keys";
import { questions } from "@/content/questions.fr";
import type { Answer, Feedback, FormId } from "@/types/domain";

export function normalize(text: string) {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
}
function oneTypo(a: string, b: string) {
  if (Math.min(a.length, b.length) < 6 || Math.abs(a.length - b.length) > 1) return false;
  let i = 0, j = 0, differences = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue; }
    if (++differences > 1) return false;
    if (a.length >= b.length) i++;
    if (b.length >= a.length) j++;
  }
  return differences + (a.length - i) + (b.length - j) <= 1;
}
export function recallForms(values: string[], allowed: FormId[]) {
  const found = new Set<FormId>();
  for (const value of values) {
    const text = normalize(value);
    const exact = allowed.filter(id => aliases[id].includes(text));
    const candidates = exact.length ? exact : allowed.filter(id => aliases[id].some(alias => oneTypo(text, alias)));
    if (candidates.length === 1) found.add(candidates[0]);
  }
  return [...found];
}
export function grade(questionId: string, answer: Answer): Feedback {
  const q = questions[questionId], key = keys[questionId];
  if (q.kind === "recall") {
    const recalled = recallForms(answer.recall ?? [], q.forms);
    return { recalled, xp: 10 + recalled.length * 5, explanation: key.explanation, takeaway: key.takeaway };
  }
  if (q.kind === "vote") return { recalled: [], xp: 10, explanation: key.explanation, takeaway: key.takeaway, correctChoice: key.choice };
  const choiceCorrect = key.choice === answer.choice, reasonCorrect = key.reason === answer.reason;
  const correct = choiceCorrect && reasonCorrect;
  return { correct, choiceCorrect, reasonCorrect, recalled: [], xp: 10 + (correct ? 20 : 0), explanation: key.explanation, takeaway: key.takeaway, correctChoice: key.choice, correctReason: key.reason };
}
