import "server-only";
import type { FormId } from "@/types/domain";
export const keys: Record<string, { choice?: number; reason?: number; explanation: string; takeaway: string }> = {
individual: { choice: 1, explanation: "L’entrepreneur individuel lance son projet de manière indépendante et en assume les décisions.", takeaway: "Autonomie et responsabilité vont ensemble." },
partners: { choice: 0, explanation: "Les associés réunissent leurs compétences et partagent les responsabilités, les décisions et les bénéfices éventuels.", takeaway: "Entreprendre ensemble, c’est aussi décider ensemble." },
innovation: { choice: 2, explanation: "Les prototypes de James Dyson illustrent l’expérimentation au service d’une nouvelle solution.", takeaway: "Innover, c’est résoudre un problème autrement." },
impact: { choice: 3, explanation: "La mission sociale est au cœur du projet d’Empowerment Plan : des manteaux, mais aussi des emplois.", takeaway: "L’impact social guide l’activité." },
profit: { choice: 1, explanation: "Une activité sociale peut générer des revenus. Un modèle durable permet de poursuivre sa mission.", takeaway: "Impact et revenus peuvent aller ensemble." },
growth: { choice: 0, explanation: "Shopify transforme un outil conçu pour une boutique en plateforme utilisable par de nombreux commerçants.", takeaway: "Un modèle conçu pour changer d’échelle." },
internal: { choice: 2, explanation: "Art Fry et Spencer Silver ont développé leur idée au sein de 3M, avec les ressources de cette entreprise.", takeaway: "Intrapreneuriat : entreprendre de l’intérieur." },
generations: { choice: 0, explanation: "La famille Kirk Kristiansen illustre la continuité d’une entreprise entre plusieurs générations.", takeaway: "Une histoire familiale peut devenir une histoire d’entreprise." },
borders: { choice: 1, explanation: "L’entrepreneuriat international consiste à servir des marchés au-delà des frontières du pays d’origine.", takeaway: "Le marché dépasse les frontières." },
boss: { explanation: "Individuel · En association · Innovant · Social · Forte croissance · Intrapreneuriat · Familial · International.", takeaway: "Huit formes pour comprendre les projets. Elles peuvent se combiner." },
};
export const aliases: Record<FormId, string[]> = {
individual: ["individuel", "individuelle", "individual", "entrepreneuriat individuel", "entrepreneur individuel", "individual entrepreneur", "individual entrepreneurship"],
partner: ["association", "en association", "associe", "associes", "partenaire", "partenariat", "partner", "partnership", "entrepreneuriat en association", "entrepreneur partenaire", "partner entrepreneur"],
innovative: ["innovant", "innovante", "innovateur", "innovation", "innovative", "entrepreneuriat innovant", "entrepreneur innovant", "innovative entrepreneur"],
social: ["social", "sociale", "entrepreneuriat social", "entrepreneur social", "social entrepreneur"],
highgrowth: ["forte croissance", "a forte croissance", "haute croissance", "high growth", "highgrowth", "entrepreneuriat a forte croissance", "high growth entrepreneur"],
intrapreneur: ["intrapreneur", "intrapreneure", "intrapreneuriat", "intrapreneurship", "entrepreneuriat interne", "entrepreneur interne"],
family: ["familial", "familiale", "family", "entrepreneuriat familial", "entrepreneur familial", "family entrepreneur"],
international: ["international", "internationale", "entrepreneuriat international", "entrepreneur international", "international entrepreneur"],
};
