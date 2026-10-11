import { online, connectionHint, storageHint } from "@/lib/environment";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Brand, DemoBadge } from "@/components/common";

export default function PrivacyPage() {
  return (
    <main className="document-page">
      <header className="site-header"><Brand /><DemoBadge /></header>
      <article>
        <p className="eyebrow">VOTRE PARTICIPATION, EN CLAIR</p>
        <h1>Vos réponses restent dans la salle.</h1>
        <p>{storageHint}</p>

        <section>
          <h2>Ce qui est enregistré</h2>
          <p>Le code de la salle, votre pseudo, vos réponses, leurs heures d’envoi, vos points et l’avancement de la présentation sont conservés. Choisissez un pseudo : votre nom complet et votre adresse e-mail ne sont pas nécessaires.</p>
          <p>Un cookie contient un identifiant aléatoire pour reconnaître votre navigateur pendant 30 jours. Le serveur conserve une empreinte de cet identifiant. Ce cookie n’est pas un compte : changer de navigateur ou le supprimer fait perdre l’accès à cette participation. La récupération et la liaison à un compte ne sont pas disponibles.</p>
        </section>

        <section>
          <h2>Ce que la classe voit</h2>
          <p>Avant le début de la présentation, les pseudos des participants apparaissent dans la salle d’attente sur le projecteur. Le présentateur attend que la classe ait rejoint, puis lance la partie. Le projecteur affiche ensuite des résultats collectifs après la fermeture de la question. Les répartitions sont masquées lorsqu’il y a moins de trois réponses. Votre réponse personnelle et votre bilan restent dans votre espace.</p>
          <p>Après chaque explication, le projecteur affiche les pseudos et points cumulés des trois premiers et des trois derniers, avec une taquinerie sur la performance à la dernière place. Ce classement n’est pas envoyé aux téléphones des participants.</p>
        </section>

        <section>
          <h2>Conservation et suppression</h2>
          <p>Une salle expire quatre heures après sa création, même si elle est encore active. L’accès s’arrête alors. En ligne, les données de la salle sont supprimées au prochain nettoyage réussi, programmé toutes les cinq minutes. En répétition locale, les salles expirées sont effacées au prochain accès au serveur. La référence locale de participation est effacée quand votre navigateur constate l’expiration. Les éventuelles sauvegardes de l’hébergeur suivent sa propre politique de conservation.</p>
          <p>Depuis <Link href="/me">votre bilan personnel</Link>, vous pouvez supprimer votre participation et vos réponses dans la salle concernée, avec le navigateur utilisé pour jouer. {online ? "L’administrateur du site et son hébergeur Netlify gèrent le stockage et peuvent accéder aux données. Contactez l’organisateur pour une demande de suppression supplémentaire." : "L’organisateur peut effacer toutes les salles en supprimant le fichier de données sur son ordinateur, serveur arrêté."}</p>
        </section>

        <section>
          <h2>Pour jouer ensemble</h2>
          <p>{connectionHint} Aucune installation d’application n’est nécessaire. Demandez à l’organisateur de la séance si vous avez besoin d’aide pour rejoindre la salle ou supprimer vos données.</p>
        </section>

        <Link className="button secondary" href="/"><ArrowLeft size={18} /> Retour à l’accueil</Link>
      </article>
    </main>
  );
}
