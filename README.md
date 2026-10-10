# Entreprendre.Lab

Présentation interactive en français : un campus à nourrir, huit formes d’entrepreneuriat et des défis qui demandent de justifier ses choix. Le parcours vise 27 minutes avec trois présentateurs. Deux formats sont proposés : discussion en équipes sur le projecteur, ou réponses individuelles sur téléphone.

La liste officielle fournie par l’enseignant est utilisée : création ex nihilo, essaimage, franchise, intrapreneuriat, reprise, entrepreneuriat social et solidaire, techno-entrepreneuriat et entrepreneuriat vert.

## Jouer à distance (Netlify)

Le dépôt privé est https://github.com/Amine-SIALA/entreprendre-lab. Le déploiement Netlify nécessite la connexion du propriétaire ; aucune URL publique n’est encore confirmée.

Une fois publié, ouvrir le site, choisir **Sur téléphone**, créer une salle et envoyer le lien de participation aux amis. Ils peuvent utiliser leurs données mobiles ou un autre Wi-Fi. Le présentateur avance les questions depuis son navigateur ; les participants répondent et justifient sur le leur. Pour commenter les diapositives ensemble à distance, partager l’écran dans votre appel habituel.

Le fichier `netlify.toml` active le mode en ligne. `@netlify/database` et les migrations de `netlify/database/migrations/` configurent Postgres. Chaque modification verrouille la ligne de la salle dans une transaction : les instances serveur partagent les réponses et le contrôle. La version hébergée ne bascule jamais vers un fichier local si la base est indisponible. Le mode en ligne génère les QR codes à partir de l’URL du site, indépendamment de l’adresse LAN utilisée en développement.

Netlify Database nécessite un compte compatible avec les crédits Netlify. Les accès à la base restent côté serveur. Ne pas committer les identifiants ni `.env.local`. Les salles locales ne sont pas transférées automatiquement au site.

## Démarrer localement

Prérequis : Node.js 20.9 ou plus récent et npm. Vérification effectuée avec Node.js 24.20.0.

```powershell
npm install
npm run dev
```

Ouvrir `http://localhost:3000`, choisir un format puis « C’est parti ! ». La création d’une salle associe le navigateur du présentateur à cette salle. Conserver ce navigateur et ses cookies pour la reprendre.

La configuration locale actuelle utilise l’adresse Wi-Fi `http://192.168.100.174:3000` pour les QR codes. La modifier dans `.env.local` si l’ordinateur change d’adresse. « Reprendre la salle » retrouve la dernière salle créée dans ce navigateur.

Pour utiliser la version compilée, arrêter le serveur de développement puis lancer :

```powershell
npm run build
npm start
```

Cela reste une installation locale. Aucun compte cloud ni identifiant Supabase n’est nécessaire.

## Jouer sur téléphone sur le réseau local

1. Connecter l’ordinateur et les téléphones au même Wi-Fi, ou au même point d’accès.
2. Trouver l’adresse IPv4 locale de l’ordinateur avec `ipconfig` — par exemple `192.168.1.20`.
3. Créer `.env.local` avec `NEXT_PUBLIC_APP_URL=http://192.168.1.20:3000`. Utiliser l’adresse réelle de l’ordinateur. Redémarrer le serveur ; refaire le build si vous utilisez `npm start`.
4. Ouvrir également cette adresse sur l’ordinateur, puis créer une salle « Sur téléphone ».
5. Scanner le QR code ou ouvrir l’adresse de participation affichée, puis choisir un pseudo.

Les scripts écoutent sur `0.0.0.0`. L’accès dépend du pare-feu Windows et de l’autorisation des communications entre appareils sur le Wi-Fi ; certains réseaux invités les bloquent. `localhost` désigne le téléphone lui-même et ne permet pas de rejoindre l’ordinateur. Un changement d’adresse IP demande de mettre à jour l’URL et de redémarrer.

## Présenter

Les flèches **→ / ←** font avancer ou reculer les 36 étapes. Une question comporte une ouverture puis une fermeture avec résultats et explication. Le décompte sert de repère ; le présentateur garde la main sur la fermeture. Fermer dans les dix premières secondes demande une seconde pression sur **→** ; **Échap** annule. **P** met en pause le chronomètre général, pas celui de la question. **R** retrouve l’état du serveur.

Le mode équipes enregistre un choix collectif, sa justification et un rappel collectif. Il ne mesure pas les résultats individuels de chaque équipe. Le mode téléphone enregistre une réponse par participant et par question. Les points récompensent la participation et le raisonnement, sans bonus de vitesse. Le rappel sans indices est présenté séparément.

Consulter [le guide des présentateurs](docs/presenter-cheatsheet.md) pour le déroulé et les raccourcis.

## Données et limites

En mode local, les salles, pseudos, réponses et états sont enregistrés dans `.data/rehearsal.json` sur l’ordinateur serveur. `DEMO_DATA_DIR` permet de choisir un autre dossier. La sauvegarde est un fichier JSON avec écritures sérialisées pour **un seul processus Node** : ne pas utiliser plusieurs instances ou un hébergement à système de fichiers éphémère.

Un cookie HTTP-only de 30 jours contient une identité aléatoire ; seule son empreinte est conservée dans les salles. Ce mécanisme reconnaît un navigateur sur une origine donnée. Ce n’est pas un compte et il ne permet pas de récupérer une identité après suppression du cookie ou changement d’appareil. Le lien vers un compte, la récupération et les comptes permanents ne sont pas implémentés.

Le participant peut demander la suppression de ses réponses et de sa participation à une salle depuis `/me`. Il n’y a pas de purge automatique des salles : pour effacer toute l’installation, arrêter le serveur puis supprimer son fichier `rehearsal.json`. Cela supprime toutes les salles de ce fichier. Voir aussi [la page de confidentialité](src/app/privacy/page.tsx).

Le serveur arbitre la navigation, les réponses et la correction ; les navigateurs interrogent régulièrement son état. Le contrôle est réservé à un onglet du présentateur à la fois. Le stockage partagé Netlify est implémenté ; sa validation sur le site public reste à effectuer après connexion. L’authentification récupérable n’est pas implémentée. En ligne, les données sont conservées dans Postgres sans purge automatique ; chaque participant peut effacer sa participation depuis son bilan. Voir [l’état d’implémentation](docs/implementation-status.md).

## Développement et vérification

```powershell
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
```

**Vérifié le 9 octobre 2026 :** lint et TypeScript sans erreurs ; 47 tests unitaires/API et 5 scénarios Playwright passent. Compilation de production réussie. Le parcours complet tient sur des écrans 1920×1080, 1366×768 et 1024×768. Trois sessions de navigateur indépendantes ont joué, actualisé leurs réponses, terminé le rappel des huit formes et consulté leur carnet.

Sous Windows, Playwright utilise Microsoft Edge installé. Sur les autres systèmes, installer Chromium avec `npx playwright install chromium`. Les captures sont dans `artifacts/`. Le [rapport de vérification](docs/verification.md) distingue les simulations locales des essais sur appareils physiques encore nécessaires.

Contenu : `src/content/`. Correction côté serveur : `src/lib/answer-keys.ts` et `src/lib/grading.ts`. État et sauvegarde : `src/lib/engine.ts` et `src/lib/store.ts`. [handoff.md](handoff.md) conserve la spécification et l’historique des exigences ; son encadré initial précise les demandes les plus récentes.
