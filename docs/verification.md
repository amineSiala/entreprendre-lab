# Verification — team pitch challenge (11 October 2026)

- 74 unit/API/Postgres tests passed. Coverage includes team confirmation, duplicate names, private public IDs, own-team vote rejection, vote revision ordering, closure races, fractional averages, zero votes, idempotent reveal, cumulative points, deletion, additive upgrades and exact four-hour expiry.
- Lint, TypeScript and online production build passed.
- All nine Playwright scenarios passed in one uninterrupted run (4.4 minutes). The full 47-beat deck fits three projector sizes. The pitch rehearsal used four independent phones, including 320 px and a late audience member, and exercised reassignment, refresh, failed save/retry, rating edits, hidden results, all three pitches, 4,900/7,000/0 bonuses, rankings and the closing video.
- Screenshots inspected: artifacts/pitch-teams.png and artifacts/pitch-results.png; phone screenshots also saved. These browser simulations do not replace testing physical classroom devices.
- The NetlifyDB PGlite adapter shares one PostgreSQL session across sockets. Its test pool is limited to one connection to prevent interleaved BEGIN/COMMIT operations. These tests verify storage behavior; cross-worker production isolation relies on the actual Postgres FOR UPDATE lock.
- Published source 7f9d807 in Netlify deployment 6acbe632b353572cd55b783a, ready without errors. Live routes and team-control/rating bundles returned 200; missing presenter credentials 401; retired-room access 410; video range 206 and sound-enabled playback worked in Edge. Cleanup remains scheduled every five minutes. Authenticated room creation and the full hosted pitch round were not repeated; that rehearsal was local. See the latest handoff for details.

---

# Verification — revised company stories (11 October 2026)

This section supersedes the historical lesson and timing checks below.

- Lint, TypeScript and online production build passed.
- 60 unit/API/Postgres tests passed, including exact four-hour expiry, durable cleanup, legacy removal, concurrent retries, aliases and scoring at 0/60/120 seconds.
- Eight Playwright scenarios passed across a full run and one focused selector-fix rerun. They exercise all 46 beats, three projector sizes, 320/390/430 px phones, hidden reveals, draft recovery, explicit submission, the real 120-second timeout (4,000 points), rankings, 60 participants, expired polling and video controls.
- These are browser simulations, not physical phone/projector tests.
- Local server restored on port 3000; retired-room access returned 410 and triggered persistent cleanup.

Live deployment: 6acbcef28528b36021898905 (source 744e8cd), ready. Database migration applied; cleanup-rooms registered with schedule */5 * * * *. Public routes/assets returned 200, room expiry 410, missing presenter credentials 401, and video range 206. Edge played the hosted video with sound enabled and no media error. Hosted authenticated room creation and an unattended scheduled invocation were not observed; authentication/multiplayer and cleanup behavior were tested locally.

---

> Mise à jour du 10 octobre 2026 : la version en ligne est désormais publiée sur https://entreprendre-lab.netlify.app avec stockage Postgres. Voir le README pour les nouveaux tests et les modalités de publication. Les mentions de limitation au réseau local ci-dessous décrivent la validation initiale.

# Vérification — 9 octobre 2026

Environnement : Windows, Node.js 24.20.0, Next.js 16.4.0, Microsoft Edge piloté par Playwright. Serveur unique, données dans un fichier local. Aucun déploiement cloud.

## Résultats

| Commande / scénario | Résultat |
| --- | --- |
| `npm run lint` | Sans erreur ni avertissement ESLint |
| `npm run typecheck` | Sans erreur |
| `npm test` | 47 tests réussis : contenu, correction, clavier, API, confidentialité, concurrence, stockage |
| `npm run test:e2e` | Les quatre scénarios fonctionnels réussissent ; le cinquième scénario de charge a été exécuté séparément avec `--grep '60 simulated'` et réussit |
| `npm run build` | Compilation de production réussie |

## Ce qui a réellement été exercé

- Les 36 étapes avancées au clavier, avec vérification des débordements à 1920×1080, 1366×768 et 1024×768. Captures de six étapes représentatives à deux résolutions dans `artifacts/`.
- Trois contextes navigateur indépendants, aux largeurs 320, 390 et 430 pixels : inscription par pseudo, réponses différentes, justification obligatoire, correction et sauvegarde après actualisation.
- Le rappel intermédiaire, le carnet sans indices pendant un rappel, le rappel final des huit formes, le cas inédit et la consultation de la progression privée.
- La suppression effective de la participation d’un étudiant à sa salle.
- Le refus de commande de présentation envoyée par un étudiant ; l’absence de notes de présentateur et de correction dans les réponses API destinées à un étudiant avant révélation.
- Le deuxième onglet du présentateur en lecture seule, le mode statique hors ligne, la resynchronisation vers l’état serveur et la relecture sans nouveau score.
- L’activation par Espace d’un choix focalisé sans avancer involontairement la présentation.
- Identifiants de contrôleur générés avec `crypto.getRandomValues`, compatible avec un réseau local en HTTP.
- Après compilation, application démarrée avec `npm start` sur le port 3000. Une fenêtre présentateur et une fenêtre participant ont utilisé l’adresse Wi-Fi `http://192.168.100.174:3000` en HTTP non sécurisé : création, pilotage, inscription, réponse synchronisée et retour de la réponse après actualisation réussis, sans erreur JavaScript. Les deux fenêtres tournaient sur ce même ordinateur ; cela ne remplace pas l’essai de téléphones physiques.

## Simulation de charge locale

60 clients HTTP indépendants se sont inscrits en parallèle, puis ont envoyé une réponse et renvoyé exactement la même réponse. Résultat : **60 réponses stockées, 0 doublon**, réparties en quatre groupes de 15.

Sur cette exécution en développement, via l’adresse de boucle locale : inscriptions en environ 1,87 s au total, premier envoi des 60 réponses en environ 1,36 s au total. Ce sont des mesures ponctuelles, pas un engagement de performance. Les clients API n’exécutent ni rendu d’écran ni réseau Wi-Fi.

## À répéter avant le cours

Utiliser le véritable projecteur et deux téléphones physiques au minimum. Vérifier la lisibilité depuis le fond de la salle, le scan du QR, les règles du Wi-Fi et le pare-feu. Répéter le déroulé à voix haute pour ajuster l’objectif de 27 minutes : il n’est pas imposé par un minuteur.

Les comptes récupérables, Supabase, le déploiement Internet, le fonctionnement multi-processus et les règles de sécurité d’un service hébergé ne font pas partie de cette validation.

## Mise à jour du 10 octobre 2026 — parties chronométrées

55 tests unitaires/API/Postgres/authentification passent ; six scénarios Playwright vérifient le parcours, trois joueurs, 60 participants simulés, les reprises, le mot de passe et la clôture automatique. Lint et compilation de production passent.

Sur https://entreprendre-lab.netlify.app : création sans mot de passe ou avec un mot de passe incorrect refusée ; création autorisée avec le secret configuré. Sur un même défi, les réponses correctes rapide et plus lente ont obtenu 990 et 931 points ; la mauvaise réponse et l’absence de réponse ont obtenu 0. Après 15 secondes, résultats révélés, réponse tardive refusée, répétition d’un envoi sans points supplémentaires. Accueil et résultat inspectés sur un écran mobile de 390 px. Les participations de test ont été supprimées.

Le secret Netlify PRESENTER_PASSWORD_HASH est configuré explicitement dans le contexte production ; un secret ne peut pas être créé avec le contexte all incluant le développement. Le dépôt contient uniquement le nom de cette variable, jamais le mot de passe ni sa valeur.
