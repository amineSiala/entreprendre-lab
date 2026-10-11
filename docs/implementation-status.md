> Dernière évolution — 10 octobre 2026 : accueil centré sur « Rejoindre une salle » ; création via « Espace présentateur » avec vérification serveur et secret Netlify. Tous les défis durent 15 secondes et se ferment automatiquement. Choix + justification corrects : 500–1 000 points selon la rapidité ; erreur/hors délai : 0 ; votes : 0 ; rappel : proportion de formes correctes × score de rapidité. Ces règles remplacent les anciens points de participation et chronos indicatifs ci-dessous. Le mot de passe n’est jamais enregistré dans ce dépôt.

> Mise à jour du 10 octobre 2026 : la version en ligne est désormais publiée sur https://entreprendre-lab.netlify.app avec stockage Postgres. Voir le README pour les nouveaux tests et les modalités de publication. Les mentions de limitation au réseau local ci-dessous décrivent la validation initiale.

# État d’implémentation

La référence pédagogique actuelle est la liste de huit formes fournie par l’utilisateur. Les six profils proposés dans l’ancien handoff sont remplacés. L’interface vise un atelier lumineux, avec cas à analyser, choix justifiés et rappel sans indices.

## Ce qui est implémenté dans le code

- Curriculum français de huit personnages et huit formes, 36 étapes en 12 chapitres pour trois présentateurs, défis de raisonnement, votes, rappel intermédiaire et rappel final.
- Deux modes de salle : choix collectif sur le projecteur et réponses individuelles sur téléphone.
- API Next.js locale : création, participation, synchronisation, navigation, réponses et effacement des réponses d’un participant.
- Identité anonyme par navigateur dans un cookie HTTP-only ; empreinte de cette identité dans le fichier des salles.
- État serveur versionné. Une action fondée sur une ancienne version est refusée plutôt que d’écraser l’état courant.
- Pilotage réservé au propriétaire de la salle avec un bail d’onglet de huit secondes ; renouvellement par le contrôleur actif.
- Une réponse par identité et question ; renvoyer une réponse déjà acceptée ne crée pas une deuxième réponse. Les nouvelles réponses à une question fermée sont refusées.
- Correction côté serveur. Les réponses correctes et le retour individuel ne sont fournis qu’après révélation. La réponse enregistrée par le participant lui-même peut lui être renvoyée avant révélation.
- Navigation arrière conservant les réponses, protection de fermeture précoce et blocage des sauts de chapitre pendant une question ouverte.
- Scène pilotable au clavier : flèches, Espace, Page précédente/suivante, plein écran, aide, pause du chronomètre général, resynchronisation et sauts début/fin avec confirmation. Les notes restent masquées par défaut ; leur ouverture est visible sur le projecteur.
- Parcours statique de secours en cas de déconnexion, sans collecte de votes ni sauvegarde de la navigation hors ligne. Le retour au serveur restaure sa position enregistrée.
- Sauvegarde JSON avec file d’attente dans un processus Node et remplacement du fichier après écriture. Redémarrer le même serveur avec le même dossier conserve les salles.
- Répartitions collectives masquées en dessous de trois réponses dans le mode téléphone ; aucun nom ni réponse individuelle d’un autre étudiant dans l’état projeté.

Ces chemins ont été exercés par les tests unitaires/API et les scénarios navigateur décrits dans [le rapport de vérification](verification.md).

## Protocole de synchronisation

L’API est `/api/rooms` pour créer une salle, puis `/api/rooms/[CODE]` pour ses opérations. Le serveur attribue le rôle à partir du cookie, pas d’un rôle déclaré par le client.

1. `create` choisit `teams` ou `phones` et retourne un code à six caractères.
2. `join` enregistre le pseudo du participant dans une salle téléphones.
3. Le présentateur utilise `sync` avec son identifiant d’onglet pour acquérir ou renouveler le contrôle. Les clients récupèrent régulièrement l’état ; il ne s’agit pas de WebSocket ou de Supabase Realtime.
4. `move` transmet la version observée et une direction, éventuellement une cible. Le serveur contrôle la version, le bail et les transitions.
5. `answer` transmet l’identifiant de question et le choix, la justification ou les champs de rappel. La correction et les points sont calculés côté serveur.
6. `forget` retire la participation et les réponses de l’identité actuelle pour cette salle.

Le serveur vérifie l’origine des écritures et valide les entrées. Ces protections locales ne constituent pas une validation de sécurité pour un service exposé sur Internet.

## Limites actuelles

| Sujet | État réel |
| --- | --- |
| Téléphones | Synchronisation sur le serveur local, sous réserve de connectivité entre appareils. Un essai sur deux téléphones physiques reste nécessaire avant le cours. |
| Sauvegarde | Un fichier local, un processus Node ; pas de base partagée, de sauvegarde distante ou de réplication. |
| Identité | Cookie anonyme de 30 jours, attaché au navigateur et à l’origine. Pas de compte permanent, de liaison de compte ni de récupération sur un autre appareil. |
| Conservation | Pas d’expiration automatique des salles. Suppression personnelle depuis `/me`, ou suppression du fichier serveur pour effacer toutes les salles. |
| Jeu en équipes | Un choix collectif enregistré ; pas de tableau de scores individuel par équipe. |
| Apprentissage | Reconnaissance et rappel séparés des points. Les huit formes peuvent se combiner ; elles ne sont pas huit statuts juridiques. |
| Rappel libre | Reconnaissance par variantes connues et tolérance limitée aux fautes, sans analyse sémantique générale. |
| Charge | 60 participants simulés via API sur cette machine : 60 inscriptions, 60 réponses et 60 renvois identiques sans doublon. Cela ne valide pas le Wi-Fi ni les appareils d’une vraie classe. |
| Hébergement | Pas de déploiement partagé ou cloud réalisé. |

## Milestones pour un service hébergé

1. Remplacer le fichier local par une base transactionnelle partagée, avec migrations, sauvegardes et politique de conservation.
2. Mettre en place l’authentification permanente des présentateurs, l’identité anonyme des étudiants et la liaison facultative à un compte récupérable.
3. Déplacer le bail de contrôleur, les versions et l’unicité des réponses dans des transactions et contraintes de base ; gérer les accès par salle et par utilisateur.
4. Adapter la synchronisation à plusieurs instances, ajouter les contrôles d’accès correspondants et tester perte de connexion, reprise et concurrence.
5. Configurer HTTPS, secrets côté serveur, limitation d’abus et journalisation sans réponses ni identifiants sensibles ; valider les règles d’accès et la rétention.
6. Tester la charge cible et répéter avec les appareils et le réseau réellement utilisés en classe.

Supabase est une possibilité prévue dans la spécification initiale, pas une dépendance connectée de cette version. Aucun identifiant cloud ne doit être inventé ou placé dans le code client.

## Vérification

Lint, TypeScript, 47 tests unitaires/API, 5 scénarios Playwright et compilation de production réussis. Navigation autoritaire, justification obligatoire, confidentialité avant révélation, rafraîchissement, onglet contrôleur unique, fermeture précoce, mode hors ligne, rappel des huit formes et suppression personnelle ont été vérifiés. Le rapport distingue les navigateurs et participants API simulés des téléphones physiques non testés.
# Current status — 11 October 2026

Company-story lesson implemented: 48 beats, eight forms, nine 20-second quizzes, a 120-second recall with up to 8,000 points, and three teams pitching international/innovative/partner entrepreneurship. An InstaDeep synthesis slide follows the pitch leaderboard and precedes the video. Editable ratings award up to 7,000 extra points per member after collective reveal. Existing story rooms receive additive revision-3 upgrades; conclusions stay on the video and pitch state survives. Four-hour expiry and five-minute cleanup remain in force.

Validation: 75 unit/API/database tests, lint, TypeScript and online production build pass. Both relevant browser scenarios pass, including the full 48-beat deck and pitch-to-InstaDeep-to-video transition. The previous release passed all nine browser scenarios. See handoff.md for publication status; historical sections are superseded where they conflict.
