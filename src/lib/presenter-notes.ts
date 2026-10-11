import "server-only";
import { beats } from "@/content/beats.fr";
import { characters } from "@/content/curriculum.fr";
import { keys } from "./answer-keys";
import { instadeep } from "@/content/instadeep.fr";
export const presenterNotes: Record<string, string> = Object.fromEntries(beats.map(beat => {
const person = characters.find(item => item.id === beat.character);
let note = "Invitez la classe à scanner le QR code. La salle dure quatre heures. Commencez quand tout le monde est prêt.";
if (person) note = beat.kind === "teaser" ? "Lisez la question et laissez la classe proposer des noms à voix haute. N’annoncez pas encore l’entreprise ni la forme." : beat.kind === "story" ? `${person.story} Laissez un dernier moment pour deviner avant la révélation.` : `${person.name} — ${person.company}. ${person.definition} Une même entreprise peut illustrer plusieurs formes : nous en soulignons une ici. Source : ${person.source}`;
if (beat.questionId) note = beat.kind.endsWith("-results") ? keys[beat.questionId].explanation : beat.questionId === "boss" ? "Deux minutes. Les brouillons se sauvegardent. Valider verrouille la réponse et fixe le bonus de vitesse ; sinon le dernier brouillon compte à la fermeture. Jusqu’à 8 000 points, au prorata des formes justes. Aucun indice pendant le rappel." : "Vingt secondes, un seul choix, sans justification obligatoire. La réponse est enregistrée au toucher. Après la correction, la flèche droite affiche le classement.";
if (beat.kind === "conclusion") note = "Huit formes, huit histoires : toutes commencent quand quelqu’un voit une opportunité et agit. Les formes peuvent se combiner. Lancez la vidéo avec son bouton Lecture, puis ouvrez la discussion.";
if (beat.kind === "pitch") note = "Sélectionnez les joueurs des équipes 1, 2 puis 3. Vérifiez et confirmez la répartition. Chaque équipe défend une idée : international, innovant, puis partenariat. Ouvrez et fermez chaque vote manuellement. Personne ne note sa propre équipe. Après les trois votes, révélez ensemble les moyennes et le bonus : moyenne / 10 × 7 000 points par membre. La flèche droite affiche ensuite le classement individuel.";
if (beat.kind === "synthesis") note = `${instadeep.story} Faites le lien avec les trois équipes : international pour les activités dans plusieurs pays, innovant pour les solutions d’IA, en partenariat pour les deux cofondateurs. Une coopération avec BioNTech n’est pas la raison de classer la création en partenariat : c’est la fondation à deux. ${instadeep.acquisition} ${instadeep.deal} Il s’agit du maximum annoncé, pas d’un montant entièrement payé en juillet. ${instadeep.takeaway} Aucun nouveau quiz ni bonus. Sources : ${instadeep.sources.map(s => s.url).join(" ; ")}`;
return [beat.id, note];
}));
