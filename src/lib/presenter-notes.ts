import "server-only";
import { beats } from "@/content/beats.fr";
import { characters } from "@/content/curriculum.fr";
import { keys } from "./answer-keys";
export const presenterNotes: Record<string, string> = Object.fromEntries(beats.map(beat => {
const person = characters.find(item => item.id === beat.character);
let note = "Invitez la classe à scanner le QR code. La salle dure quatre heures. Commencez quand tout le monde est prêt.";
if (person) note = beat.kind === "teaser" ? "Lisez la question et laissez la classe proposer des noms à voix haute. N’annoncez pas encore l’entreprise ni la forme." : beat.kind === "story" ? `${person.story} Laissez un dernier moment pour deviner avant la révélation.` : `${person.name} — ${person.company}. ${person.definition} Une même entreprise peut illustrer plusieurs formes : nous en soulignons une ici. Source : ${person.source}`;
if (beat.questionId) note = beat.kind.endsWith("-results") ? keys[beat.questionId].explanation : beat.questionId === "boss" ? "Deux minutes. Les brouillons se sauvegardent. Valider verrouille la réponse et fixe le bonus de vitesse ; sinon le dernier brouillon compte à la fermeture. Jusqu’à 8 000 points, au prorata des formes justes. Aucun indice pendant le rappel." : "Vingt secondes, un seul choix, sans justification obligatoire. La réponse est enregistrée au toucher. Après la correction, la flèche droite affiche le classement.";
if (beat.kind === "conclusion") note = "Huit formes, huit histoires : toutes commencent quand quelqu’un voit une opportunité et agit. Les formes peuvent se combiner. Lancez la vidéo avec son bouton Lecture, puis ouvrez la discussion.";
return [beat.id, note];
}));
