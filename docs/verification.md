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
