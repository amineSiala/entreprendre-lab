import type { Beat } from "@/types/domain";
import { characters } from "./curriculum.fr";
const storyBeats = (start: number, end: number, chapter: number): Beat[] => characters.slice(start, end).flatMap((person, offset) => ([
{ id: `story-${start + offset + 1}-teaser`, chapter, kind: "teaser", title: `Histoire ${start + offset + 1} · À vous de deviner`, character: person.id },
{ id: `story-${start + offset + 1}-story`, chapter, kind: "story", title: `Histoire ${start + offset + 1} · Les indices`, character: person.id },
{ id: `story-${start + offset + 1}-reveal`, chapter, kind: "reveal", title: `Histoire ${start + offset + 1} · La révélation`, character: person.id },
]));
const quizBeats = (ids: string[], chapter: number): Beat[] => ids.flatMap(id => ([
{ id: `${id}-open`, chapter, kind: id === "boss" ? "recall-open" : "question-open", title: id === "boss" ? "Huit formes. Deux minutes." : "À vous de jouer", questionId: id },
{ id: `${id}-results`, chapter, kind: id === "boss" ? "recall-results" : "question-results", title: "Le déclic", questionId: id },
]));
export const beats: Beat[] = [
{ id: "welcome", chapter: 1, kind: "title", title: "Huit histoires. Huit façons d’entreprendre." },
{ id: "roadmap", chapter: 1, kind: "roadmap", title: "Notre parcours, ensemble." },
...storyBeats(0, 3, 2), ...quizBeats(["individual", "partners", "innovation"], 3),
...storyBeats(3, 5, 4), ...quizBeats(["impact", "profit", "growth"], 5),
...storyBeats(5, 8, 6), ...quizBeats(["internal", "generations", "borders"], 7),
...quizBeats(["boss"], 8),
{ id: "pitch", chapter: 9, kind: "pitch", title: "Trois équipes. Trois idées à défendre." },
{ id: "instadeep-teaser", chapter: 9, kind: "synthesis-teaser", title: "Une histoire née en Tunisie." },
{ id: "instadeep-reveal", chapter: 9, kind: "synthesis", title: "InstaDeep : une startup tunisienne, trois façons d’entreprendre" },
{ id: "conclusion", chapter: 9, kind: "conclusion", title: "Tout commence par une occasion d’agir." },
];
