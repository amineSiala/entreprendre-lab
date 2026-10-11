import type { FormId, Question } from "@/types/domain";
const choice = (id: string, title: string, options: string[], forms: FormId[], round: number): Question => ({ id, kind: "choice", tag: `QUIZ ${round} · À VOUS DE JOUER`, title, scenario: "Une bonne réponse. À vous de la retrouver !", prompt: "Touchez votre réponse.", options, seconds: 20, forms });
export const questions: Record<string, Question> = {
individual: choice("individual", "Lancer son activité de manière indépendante : quelle forme ?", ["En association", "Individuel", "Familial", "International"], ["individual"], 1),
partners: choice("partners", "Les associés partagent les responsabilités. Vrai ou faux ?", ["Vrai", "Faux"], ["partner"], 1),
innovation: choice("innovation", "Quelle forme l’histoire de Dyson illustre-t-elle ?", ["Social", "Familial", "Innovant", "International"], ["innovative"], 1),
impact: choice("impact", "Résoudre un problème de société : quelle forme ?", ["Forte croissance", "Individuel", "International", "Social"], ["social"], 2),
profit: choice("profit", "Les entrepreneurs sociaux ne gagnent jamais d’argent. Vrai ou faux ?", ["Vrai", "Faux"], ["social"], 2),
growth: choice("growth", "Quelle forme vise un développement rapide à grande échelle ?", ["Forte croissance", "Familial", "Intrapreneuriat", "En association"], ["highgrowth"], 2),
internal: choice("internal", "Innover au sein d’une entreprise existante : quelle forme ?", ["International", "Individuel", "Intrapreneuriat", "Familial"], ["intrapreneur"], 3),
generations: choice("generations", "Une entreprise familiale peut se transmettre entre générations. Vrai ou faux ?", ["Vrai", "Faux"], ["family"], 3),
borders: choice("borders", "Servir des marchés dans plusieurs pays : quelle forme ?", ["Social", "International", "Individuel", "Familial"], ["international"], 3),
boss: { id: "boss", kind: "recall", tag: "LE GRAND RAPPEL · JUSQU’À 8 000 POINTS", title: "Huit formes. Zéro indice.", scenario: "Retrouvez les huit formes étudiées. Vous avez 2 minutes : plus vite vous validez une réponse juste, plus elle rapporte.", prompt: "Écrivez une forme par case, puis validez.", options: [], seconds: 120, recallCount: 8, forms: ["individual", "partner", "innovative", "social", "highgrowth", "intrapreneur", "family", "international"] },
};
