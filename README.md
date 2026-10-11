# Entreprendre.Lab

Présentation interactive en français : huit histoires vraies, huit formes d’entrepreneuriat, neuf questions, un grand rappel final et trois pitchs d’équipe notés par le public.

**Site : https://entreprendre-lab.netlify.app**
**Dépôt : https://github.com/amineSiala/entreprendre-lab**

## Le parcours

46 étapes : salle QR, huit histoires en trois temps (question mystère → histoire anonyme → révélation), trois pauses de trois questions, rappel final et vidéo de conclusion. Aucune répartition des intervenants ni durée totale imposée.

Formes : individuel, en association, innovant, social, forte croissance, intrapreneuriat, familial, international. Les formes peuvent se combiner. Les entreprises servent d’exemples pédagogiques ; ces catégories ne sont pas des statuts juridiques.

## Jouer

Ouvrir **Espace présentateur**, s’authentifier, créer une salle et projeter le QR code. Les participants choisissent un pseudo sur leur téléphone. Le présentateur clique **Commencer** quand la classe est prête. Wi-Fi ou données mobiles fonctionnent sur le site public.

Flèches gauche/droite pour naviguer. Chaque correction est suivie d’une étape de classement cumulatif sur le projecteur. Les notes sont visibles à la classe lorsqu’on ouvre leur fenêtre.

- Quiz : 20 secondes, un choix au toucher, sans justification obligatoire. Bonne réponse : 500–1 000 points selon la vitesse ; sinon zéro.
- Rappel final : 120 secondes, huit champs. Les brouillons se sauvegardent et restent modifiables. **Valider mes réponses** verrouille le texte et fixe l’heure de score. À défaut, le dernier brouillon sauvegardé compte à la fermeture.
- Score final : `round((8000 - 4000 × elapsedSeconds / 120) × correctForms / 8)`, avec un temps limité à 0–120 secondes et des formes distinctes. Les corrections restent cachées jusqu’à la révélation collective.
- La vidéo finale démarre manuellement, avec son et commandes natives.
- Après le classement final des pitchs, une diapositive InstaDeep montre comment une startup née à Tunis peut réunir les formes international, innovant et partenariat, puis → ouvre la vidéo. Le parcours compte 48 étapes.
- Avant la vidéo : répartir tous les joueurs en trois équipes, vérifier puis confirmer. Équipe 1 : international ; équipe 2 : innovant ; équipe 3 : partenariat. Les équipes sont ensuite verrouillées, sans minuteur de pitch ni de vote.
- Après chaque pitch, ouvrir puis fermer le vote de 1 à 10. Chacun note les autres équipes ; les arrivants tardifs restent dans le public. Les notes peuvent changer jusqu’à la fermeture. Révéler les résultats après les trois équipes : `round(moyenne / 10 × 7000)` points supplémentaires par membre, puis → affiche le classement individuel. Aucun vote : zéro bonus.

## Conservation

Les salles expirent exactement quatre heures après création ; l’activité ne prolonge pas ce délai. En ligne, nettoyage toutes les cinq minutes et à l’accès : les salles expirées ou de l’ancien cours sont supprimées. Localement, suppression au prochain accès au stockage. Un navigateur connecté efface sa référence de participation quand il constate l’expiration. Le cookie aléatoire reste valable 30 jours ; ce n’est pas un compte. La suppression individuelle reste disponible dans /me pendant la durée de la salle.

## Développement

Node.js 20.9+ et npm. Configurer le mot de passe privé par son empreinte SHA-256 dans `PRESENTER_PASSWORD_HASH` côté serveur, jamais dans le code public.

```powershell
npm ci
npm run dev
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
```

Les tests navigateur utilisent Edge sur Windows, un serveur sur le port 3100, un mot de passe de test et des dossiers isolés .next-e2e/.data-e2e. Les sorties et données de test sont ignorées par Git.

Le stockage local JSON convient à un seul processus. En ligne : Postgres Netlify, transactions et verrouillage par salle. La fonction planifiée cleanup-rooms supprime les données obsolètes toutes les cinq minutes. La création de salle reste protégée par le mot de passe présentateur.

## Médias et publication

Originaux : photo/ ; versions optimisées et vidéo : public/media/. Crédits publics : /media/credits.html. La photo de couture illustre le travail ; elle ne représente pas Veronika Scott ni son organisation. Vidéo fournie par l’organisateur.

Voir [les sources](docs/story-sources.md), [le guide](docs/presenter-cheatsheet.md) et [le handoff](handoff.md). Les anciens documents de pres/ sont des références historiques.

Publication : export propre du code committé vers le site Netlify existant, via le MCP officiel. Un push GitHub seul ne publie pas le site. Ne jamais exporter .env, .data ou .tools.
