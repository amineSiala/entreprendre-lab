import "server-only";
import type { FormId } from "@/types/domain";
export const keys: Record<string, { choice?: number; reason?: number; explanation: string; takeaway: string }> = {
  opening: { choice: 0, explanation: "Entreprendre, c’est porter une initiative qui crée de la valeur. Cela peut se faire dans une entreprise existante : c’est l’intrapreneuriat.", takeaway: "Posséder une entreprise n’est pas indispensable." },
  launch: { choice: 1, reason: 2, explanation: "Yanis crée une entreprise distincte avec le soutien de son employeur : c’est l’essaimage. Créer une entreprise ne suffit pas à prouver cet accompagnement. Salma crée à partir de zéro.", takeaway: "Essaimage = nouvelle entreprise + appui d’une entreprise existante." },
  intra: { choice: 0, reason: 1, explanation: "D’abord, le projet reste dans l’entreprise : intrapreneuriat. Ensuite, Nora crée une société distincte avec son appui : essaimage. Le soutien de l’employeur n’efface pas cette distinction.", takeaway: "Le projet reste en interne, ou devient une entreprise distincte ?" },
  network: { choice: 2, reason: 1, explanation: "Le rachat d’une entreprise existante est une reprise. Le contrat de marque et de concept relève de la franchise. Ces deux formes se combinent.", takeaway: "Reprise = entreprise existante. Franchise = concept sous contrat." },
  mini: { explanation: "Création ex nihilo, essaimage, intrapreneuriat, reprise d’entreprise et franchise. Trois formes distinctes parmi ces cinq suffisent.", takeaway: "Se rappeler sans indice fait travailler la mémoire." },
  social: { choice: 3, reason: 0, explanation: "Le bénéfice peut financer l’accès à des repas abordables. La priorité donnée à la mission sociale, soutenue par un modèle viable, caractérise la démarche.", takeaway: "Une mission sociale a aussi besoin d’un modèle durable." },
  green: { choice: 1, reason: 2, explanation: "Réduire les déchets est l’objectif central : l’activité est verte. Une messagerie ordinaire ne prouve pas une innovation technologique centrale. Avec d’autres faits, un projet pourrait être vert ET techno.", takeaway: "Vert = finalité environnementale. Techno = innovation technologique centrale." },
  axes: { choice: 3, reason: 0, explanation: "L’objectif répond au pourquoi. Le lancement répond au comment. La forme juridique reste un choix distinct, selon le pays et le projet.", takeaway: "Les huit formes du cours ne sont pas huit formes juridiques." },
  jury: { explanation: "Les moyens disponibles favorisent un test en interne, mais sa validation reste nécessaire. Les autres options demandent d’autres ressources. Défendez votre choix avec une contrainte et une limite : aucun vote n’est noté.", takeaway: "Un bon choix répond à un contexte, pas à une étiquette." },
  boss: { explanation: "Création ex nihilo, essaimage, franchise, intrapreneuriat, reprise d’entreprise, entrepreneuriat social et solidaire, techno-entrepreneuriat et entrepreneuriat vert.", takeaway: "Retenir les noms est une étape. Savoir les appliquer en est une autre." },
  transfer: { choice: 0, reason: 1, explanation: "Société distincte avec l’appui de l’employeur : essaimage. Capteur inédit au cœur de l’activité : techno-entrepreneuriat. Réduction des pertes d’eau comme objectif central : entrepreneuriat vert.", takeaway: "Plusieurs indices peuvent justifier plusieurs formes pour un projet." },
};
export const aliases: Record<FormId, string[]> = {
  exnihilo: ["ex nihilo", "creation ex nihilo", "creation a partir de zero", "creation de zero"],
  essaimage: ["essaimage", "entrepreneuriat par essaimage", "entrepreneuriat essaimage"],
  franchise: ["franchise", "franchisee", "franchisage", "entrepreneuriat par franchise", "entrepreneur franchise"],
  intrapreneur: ["intrapreneur", "intrapreneure", "intrapreneuriat", "entrepreneur interne", "entrepreneuriat interne"],
  repreneur: ["repreneur", "repreneuse", "reprise", "reprise d entreprise", "reprise entreprise"],
  social: ["social", "social et solidaire", "entrepreneuriat social", "entrepreneuriat social et solidaire", "ess"],
  techno: ["techno", "techno entrepreneuriat", "technoentrepreneuriat", "entrepreneuriat technologique", "entrepreneur technologique"],
  vert: ["vert", "verte", "entrepreneuriat vert", "entrepreneur vert", "entrepreneuriat ecologique"],
};
