# Entreprendre.Lab — Full conversation handoff

## Current update — roadmap, Tunisian teaser and supplied media (11 October 2026)

This supersedes prior beat counts and media choices. The deck has 50 beats: QR lobby → roadmap → eight three-step stories and quizzes → recall → pitch activity/leaderboard → anonymous Tunisian teaser → InstaDeep reveal → closing video. The roadmap names only the learning activities, not companies/forms or the Tunisian surprise. The teaser retains the requested sentence and prominently shows approximately $680 million, explicitly the maximum announced in 2023 including conditional payments.

- InstaDeep reveal uses the supplied cofounder photo. Empowerment Plan replaces the generic sewing image with the supplied coat/workshop photo. Post-it/3M replaces Art Fry's portrait with the supplied company illustration and a neutral caption; the invention story still names Art Fry and Spencer Silver. Dyson uses the supplied vertical video, ~15 seconds, as the reveal's main media. Both videos use a shared local player with manual playback, sound, native controls, shortcut exclusion and pause on slide exit. None of these media renders on teasers or anonymous stories.
- Source originals stay in photo/ and video/. Optimized WebP copies and Dyson MP4 are under public/media/. Credits record organizer-supplied provenance and do not invent licenses or identify the 3M illustration as Art Fry.
- New rooms carry payloadRevision 4. Older revision-1/2/3 indices map by original beat IDs: the lobby stays at 0, previous stories/quizzes shift past the roadmap, old pitch remains on pitch, old InstaDeep synthesis maps to the reveal, and finished rooms stay on the closing video. Answers, public member IDs, team state, private votes, frozen results, scores and leaderboard visibility survive. Lesson version, four-hour expiry and scheduled cleanup are unchanged.
- Validation: 86 unit/API/database tests, lint, TypeScript and final production build pass. Ten browser scenarios passed across the main run and focused layout reruns (not one uninterrupted green run). A roadmap footer overflow at 1366×768 was fixed by correcting heading line-height/spacing. The final full-50-slide and dedicated roadmap checks pass at 1920×1080, 1366×768 and 1024×768, including hidden reveals, both local video players, native keyboard controls, pause on exit, refresh, real 120-second recall timeout, QR-to-roadmap start, four-phone pitch scoring and the 60-player lobby. Screenshots were visually inspected; physical classroom hardware remains untested. Published source commit 2c2837e; Netlify deployment 6acbfc9fb65498733533c94a reached ready without errors. Live stage bundles contain the roadmap, separate teaser/reveal, 680-million qualifier and new reveal media. All three WebP images and credits returned 200. Presenter creation without credentials returned 401; retired-room access returned 410. Both MP4s served byte ranges with 206; Edge played Dyson (15.145 seconds, 618×1099) and conclusion (13.8 seconds, 1920×1080) with muted=false and no media error. The existing cleanup function remains deployed, with no database migration required. Local development server on port 3000 is restored and returned 200. Authenticated classroom/room-upgrade rehearsals were local; no new hosted authenticated room was created.

## Current update — InstaDeep synthesis (11 October 2026)

The deck now has 48 beats. One French informational slide, `instadeep` / kind `synthesis`, follows the pitch leaderboard and precedes the closing video. It immediately names InstaDeep, explains its 2014 Tunis origin with Karim Beguir and Zohra Slim, two laptops and approximately $2,000, then links the three team forms: international, innovative and partner entrepreneurship. The BioNTech acquisition is dated July 2023; £562 million is explicitly the maximum announced in January, including conditional payments. Official source links appear on the slide and in docs/story-sources.md. Local SVG icons and text require no remote photograph.

- No extra question, timer or points. Presenter notes distinguish cofounding from the later BioNTech partnership/acquisition.
- New rooms use `payloadRevision: 3`. On access, revision-2 rooms at conclusion index 46 map to new conclusion 47; their pitch index 45 stays unchanged. Older pre-pitch rooms at conclusion 45 also map to 47. Member public IDs, rounds, teams, votes, frozen results, score totals and leaderboard display are preserved. Four-hour expiry and the lesson version remain unchanged.
- Validation: 75 unit/API/database tests, lint, TypeScript and online production build pass. Both relevant browser scenarios pass (1.4 minutes): the full 48-beat deck at three projector sizes, plus the independent-phone pitch rehearsal through InstaDeep and the video. Video controls, pause on exit, back navigation and refresh were checked. The InstaDeep screenshot at 1024×768 was visually inspected; there are no remote images. Physical classroom hardware is not tested. Published source commit 836c033; Netlify deployment 6acbef0dc15e4a1a92655542 reached ready without errors. Live stage bundles include the InstaDeep title, founders, three forms, qualified acquisition amount and official sources. Public routes/assets returned 200; missing presenter credentials 401; retired-room access 410. Video range requests returned 206 and Edge played the hosted video with muted=false and no media error. The existing cleanup function remains deployed; no new database migration is needed. Local port-3000 development server is restored and returned 200. Authenticated classroom and upgrade tests were local; no new hosted authenticated room was created for this release.

## Current update — three-team pitch challenge (11 October 2026)

This section supersedes the earlier 46-beat count and conclusion ordering. The deck has 47 beats: the pitch activity follows the final recall leaderboard and precedes the existing closing video.

- Select all current players into Team 1 (international), Team 2 (innovative), then Team 3 (partner entrepreneurship). Review and correct assignments before confirming three nonempty teams. Membership then locks. Late arrivals are audience only, can rate every team and receive no team bonus.
- Each pitch starts manually. The presenter opens and closes its 1–10 vote, without a timer. Players cannot rate their own team. Taps autosave and remain editable until closure; revision numbers reject stale replacements. Individual votes stay private. Failed saves remain retryable.
- After all three votes, collective reveal exposes averages/counts/ranks and awards `round(unroundedAverage / 10 * 7000)` points per member, exactly once. No votes yields zero. These points add to the quiz totals; → shows the updated individual leaderboard, then → opens the video.
- Existing story rooms receive additive `payloadRevision: 2` upgrades and public participant UUIDs. Old final index 45 maps to the new conclusion index 46; prior answers/progress survive. GET requests now lock and persist rooms too, including upgrades and automatic quiz closure. No database table or lesson-version change is needed. Four-hour expiry and cleanup remain in force.
- New room API: presenter `action: pitch` with controller/version and operations assign/select/confirm/start/open/close/reveal; student `action: rate-pitch` with team/rating/revision. Safe snapshots expose phase, team names, own vote and eligibility; aggregate averages and bonuses appear only after reveal. Identity hashes and peer votes never enter public pitch data.
- Forgetting participation removes personal membership and votes. Closed anonymous aggregate counts/sums remain frozen, so other players' bonuses do not change.
- Validation: 74 unit/API/Postgres tests, lint, TypeScript and online production build pass. All nine browser scenarios passed in one uninterrupted run, including all 47 beats, three projector sizes, four independent phones (320/390/430 px), vote failure/retry, refresh, privacy, late arrivals, bonuses, rankings, and the real 120-second recall timeout. NetlifyDB uses a single-session PGlite adapter, so its test pool is restricted to one connection; hosted multi-worker serialization still depends on the production FOR UPDATE row lock. Physical classroom hardware is not tested. Published source commit 7f9d807 to the existing repository; Netlify deployment 6acbe632b353572cd55b783a reached ready without errors. Public homepage, privacy, stage and join routes returned 200; live stage bundles include team confirmation, rate-pitch and collective reveal. Missing presenter credentials returned 401; retired-room access returned 410. Hosted video byte ranges returned 206 and Edge played it with muted=false and no media error. The existing cleanup-rooms function retains its five-minute schedule. Local port-3000 dev server is restored. The authenticated pitch/multiplayer rehearsal was local; hosted authenticated room creation and a full hosted pitch round were not repeated because the presenter password was not supplied.

## Current update — company stories, final submission and four-hour rooms (11 October 2026)

This section supersedes all historical curriculum, presenter-allocation, recall-timing, scoring and retention details below.

- The French lesson now has 46 beats: QR lobby; eight company stories, each with teaser → anonymous story → reveal; three breaks of three single-tap questions; final recall; closing video. No P1/P2/P3 assignments or total duration target. The user's shortened **Rejoindre** homepage button and removal of the QR hint are preserved.
- New forms: individual, partner, innovative, social, highgrowth, intrapreneur, family, international. Companies: eBay, Airbnb, Dyson, Empowerment Plan, Shopify, Post-it/3M, LEGO, AirAsia. Sources: `docs/story-sources.md`.
- Nine quizzes last 20 seconds and need no justification. Correct answers earn 500–1,000 speed-based points. Final recall lasts **120 seconds**; drafts autosave, but **Valider mes réponses** locks the current text and fixes the server acceptance time. Without explicit submission, the last saved draft is finalized at automatic or manual closure. Score: `round((8000 - 4000 * clamp(elapsed / 120, 0, 1)) * uniqueCorrectForms / 8)`. All eight correct at timeout earn 4,000. Feedback remains private until collective reveal.
- Room payloads carry `lessonVersion: stories-2026-v1`; rooms expire **four hours from creation**, never from last activity. Every storage access cleans retired records; a private Netlify scheduled function `cleanup-rooms` runs every five minutes. Cleanup commits independently before a failed room request. Legacy rooms are deleted rather than mapped into the new deck. Expired/missing valid codes return 410 `ROOM_EXPIRED`; clients stop polling and clear stored participant references. Physical deletion in hosted storage happens on the next successful sweep/access; local deletion happens on access. Host backups follow their own retention.
- New interfaces: snapshot `expiresAt`, recall response `finalized`, answer request optional `finalize`. Identical final retries are idempotent; changed drafts cannot overwrite finalized answers. Draft saves never set the final scoring time. Existing JSON payload storage is reused; an additive migration indexes `game_rooms.created_at`.
- Originals are in `photo/`, optimized copies in `public/media/`, with public credits at `/media/credits.html`. The user chose a licensed sewing illustration for Veronika Scott because no clearly reusable portrait was found; the caption explicitly says it is neither her nor her workshop. Seven other reveals have real portraits and company logos. The provided `video/videoplayback.mp4` is served as `/media/conclusion.mp4`; manual playback with sound, native keyboard controls, paused on slide exit.
- Tests: 60 unit/API/Postgres tests passed; lint, TypeScript and online production build passed. Eight browser scenarios passed across the full run and one focused selector-fix rerun (not a single uninterrupted green run). Coverage includes all 46 beats at 1920×1080, 1366×768 and 1024×768; 320/390/430 px phones; real 120-second timeout at 4,000 points; draft/submit retries and privacy; exact room TTL and durable cleanup; 60-player lobby; leaderboard; video playback and keyboard handling. Screenshots remain ignored under `artifacts/`.
- Browser tests now isolate `.next-e2e` and `.data-e2e` on port 3100. ESLint ignores the generated test build. The local port-3000 server has been restarted; a retired-room access returned 410 and persisted cleanup.
- Published source commit 744e8cd to the existing repository and Netlify site. Deployment 6acbcef28528b36021898905 reached ready without errors; migration 20261011000100_room_expiry_index applied successfully. Netlify searchSiteFunctions confirmed cleanup-rooms schedule */5 * * * *. Public homepage, privacy, credits and licensed photo returned 200; retired-room access returned 410 and triggered hosted cleanup; unauthenticated creation returned 401. Video range requests returned 206 and Edge played the 13.8-second live video with muted=false and no media error. Authenticated room creation/multiplayer were verified locally, not repeated on the hosted site because the presenter password was not supplied. Schedule registration is confirmed; an unattended scheduled invocation was not observed. Physical classroom hardware remains to be rehearsed.

Historical notes follow.

Updated **10 October 2026**, user timezone **Africa/Lagos**.

## Latest update — automatic answers and longer timers (10 October 2026)

This supersedes earlier references to 15-second deadlines and immutable recall submissions.

Published source commit `a425efc` to the existing Netlify site; deployment `6aca477ff7fe4f254df374a2` reached **ready** with no error and the Next.js runtime present. Public homepage, participant and join routes returned 200. Live bundles contain all nine 20-second choice/vote definitions, both 60-second recall definitions, automatic-save UI and updated timing copy; the old answer submit labels are absent. Presenter creation without credentials remains rejected (401). The authenticated multiplayer and real 60-second expiry rehearsals were local; no new hosted test room was created for this deployment.

- All choice questions and unscored votes now allow **20 seconds**; both recall exercises (`mini`, `boss`) allow **60 seconds**. Server cutoff, both countdowns and speed scoring use each question’s duration. Correct answers remain worth 500–1,000 points based on server acceptance time; the halfway time is now 10 seconds for choices and 30 seconds for typing.
- On phones, tapping a vote saves it immediately. For choice + reason, tapping the choice opens the reasons; tapping a reason saves the complete answer. Normal answer flows have no submit button. A failed choice save remains locked and offers an idempotent recovery retry.
- Recall fields save automatically after a short typing pause and on blur, and remain editable until closure. Saves are serialized, failed saves retry, and only successful server acknowledgements show “Sauvegardé automatiquement”. Refresh restores the saved fields. The latest saved text (even incomplete or cleared) is used at automatic or manual closure. Recall points use the last changed save’s server timestamp; identical retries do not change that timestamp. Changed answers after closure are rejected.
- The presenter-only lobby and leaderboard remain unchanged. Opening a typing question does not expose answer aliases or hints. Peer snapshots contain no personal recall text; scores and grading feedback remain hidden until reveal.
- Implementation: `src/components/answer-editor.tsx`, updated student flow, recall save rules and private submission timestamp in the engine, question durations and timing copy. Existing answer API and room payload storage support the change without a DB migration.
- Validation: lint, TypeScript, 61 unit/API/storage tests and production build passed. All nine current Playwright scenarios passed across the full run and focused reruns after adapting an alert locator and using answer-card taps in place of radio `.check()` assertions. Coverage includes direct vote/choice submission, reselecting the same choice after returning from reasons, three independent phones, autosave failure/retry and refresh/edit/erase recovery, a real 60-second recall expiry, late-edit rejection, the 20-second choice expiry, private results, 60 clients, lobby, leaderboard, keyboard and projector layouts. Ignored screenshot: `artifacts/typing-autosave-320.png`.

## Latest update — QR lobby and one-off classroom flow (10 October 2026)

Published source commit `6948bb2` to the existing Netlify site; deployment `6aca32bd728c68adf831024c` reached **ready** with no error and the Next.js runtime present. Public homepage, stage and privacy routes returned 200. Live checks confirmed removed landing copy, QR instructions, lobby assets and presenter-auth rejection without credentials (401). The authenticated 60-player lobby rehearsal was local; no new hosted multiplayer room was created for this deployment.

- Create a fresh room, project its first slide, let students scan the QR and choose nicknames, then click **Commencer** or press Right when the class is ready. The lobby never starts automatically or starts a question deadline while waiting.
- The first slide displays joined nicknames with animated colorful cards, a live participant count and a large QR code. The roster scrolls for larger classes and respects reduced-motion preferences. Nicknames are included only in host snapshots at the first slide; participant snapshots do not receive the roster. Leaving/deleting a membership removes its nickname.
- Removed the homepage's saved-room resume link and saving new host rooms to `elab_last_room`. The homepage no longer displays **27′ objectif de séance** or **Imaginé pour apprendre ensemble ↗**. Join copy emphasizes scanning the projected QR; entering a code remains a fallback.
- This is a one-off classroom experience, without a returning-host prompt. Room storage and refresh recovery still support the active presentation; no automatic deletion or retention change was requested.
- Implementation: `src/components/lobby.tsx`, `lobby.css`, host-only `lobbyParticipants` and updated homepage/privacy copy. Existing deck indices and scoring are preserved.
- Validation: lint, TypeScript, 58 unit/API/storage tests and production build passed. Two relevant Playwright scenarios passed: all 36 deck beats and the QR lobby with 60 participants. Checked 1920×1080, 1366×768 and 1024×768; roster arrival/removal, no automatic start, host-only roster, refresh recovery and explicit **Commencer** were verified. Ignored screenshots: `artifacts/lobby-1920.png`, `lobby-1366.png`, `lobby-1024.png`.

## Latest published update — projector leaderboard (10 October 2026)

This update supersedes references below to team play and the absence of rankings. Source commit `46fe768` was pushed to `amineSiala/entreprendre-lab` and published to the existing Netlify site. Deployment `6aca2c7644ae06420b06f6c1` reached **ready** with no error and the Next.js server runtime present. Live homepage, privacy and stage routes returned HTTP 200; the stage bundles contain the new leaderboard; team creation returns 422; phone creation without presenter credentials remains rejected with 401. A new authenticated multiplayer session was not rehearsed on production during deployment; the functional browser rehearsal below was local.

- Phone participation is now the only format. Team selection, collective answer controls and team creation through the API were removed. Legacy rooms expose phone behavior without rewriting their stored question indices; old collective answers do not become participant scores.
- After each question's result/explanation, press Right to show cumulative top 3 / bottom 3 and a French last-place roast. Right again continues; Left returns to the explanation. The leaderboard phase persists in the room, survives refresh and respects the controller lease. Phones remain on personal feedback and never receive leaderboard data.
- Scores include revealed rounds only, including zero-point nonresponders. Votes show unchanged totals. Equal scores share a rank, with stable join-time/name ordering for display slots. Tied last-place players receive a group joke; fewer than six participants are not duplicated across panels; an empty room shows an invitation to join.
- Animated podium entrances, score counters, confetti, staggered bottom rows and a roast card follow the existing bright theme. Reduced-motion preferences disable animation and display final scores immediately.
- Join and privacy copy disclose projected nicknames, scores and last-place teasing. Personal answers remain private.
- Implementation: `src/components/leaderboard.tsx`, `leaderboard.css`, host-only snapshot fields and persisted `leaderboardVisible` in the engine. Existing 36 beat indices stay stable, with up to 11 extra ranking steps.
- Validation: 57 unit/API/storage tests, lint, TypeScript and production build passed. All six current Playwright scenarios passed across the full run and focused rerun after restoring the closed-question replay label. Coverage includes three independent phones, 60 simulated API participants, controller/offline behavior, expiry, projector-only rankings, refresh/back navigation, reduced motion, ties and a scored last-place roast. Projector layouts checked at 1920×1080, 1366×768 and 1024×768. Screenshots: ignored `artifacts/leaderboard-projector.png` and `artifacts/leaderboard-scored-projector.png`. Hosted deployment and public checks are recorded above.


This file describes the delivered project and the user's latest decisions. It replaces the old greenfield specification. Start from the existing implementation. The original six-form taxonomy, Supabase plan, local-only hosting status, participation-only scoring, and advisory timers are obsolete. Previous specifications remain available in Git history.

## 1. Current state

| Item | Current value |
| --- | --- |
| Workspace | `C:\Users\amine\Desktop\projet entrepreunoriat\AMINE` |
| Product | French interactive entrepreneurship presentation and classroom game |
| Live website | https://entreprendre-lab.netlify.app |
| GitHub repository | https://github.com/amineSiala/entreprendre-lab |
| Repository visibility | **Public**, anonymous access verified |
| Correct GitHub owner | **amineSiala**, without a hyphen |
| Git branch | `main` |
| Local origin | `https://amineSiala@github.com/amineSiala/entreprendre-lab.git` |
| Netlify project | `entreprendre-lab` |
| Netlify site ID | `9bb3c368-776d-4c3b-b339-398ee001a512` |
| Netlify team | `aminsiala01` |
| Netlify team ID | `69cbd0c30f4bdf23baacfc27` |
| Hosted persistence | Netlify Database / Postgres |
| Publication method | Committed source exported and uploaded through the official Netlify MCP server |
| Automatic GitHub deployments | **Not configured**; a push does not publish the site |
| Latest verified production deploy | `6aca477ff7fe4f254df374a2` |
| Latest application-change commit | `a425efc` — automatic saving and 20/60-second timers |
| Git HEAD before this handoff refresh | `0b690bf` — public repository documentation |
| Current request | Write this full handoff so a new conversation can continue without earlier chat history |

The public repository and live homepage were checked again during this update: both returned HTTP 200. Commits after the latest application deployment changed documentation, GitHub ownership, and visibility; they did not change live application code.

## 2. Latest user decisions

- Keep a **bright, distinctive, playful visual theme**, avoiding generic AI-looking dashboards and dark neon styling.
- Include an animated presentation and Kahoot-style challenges. Questions must require understanding of a situation and its justification, rather than copying a visible label.
- Support both projected **team play** and **individual phone play**.
- Friends must be able to join on a different Wi-Fi or mobile data. This works through the public Netlify URL.
- Use the professor's **eight official forms** below. Do not restore the six-profile taxonomy.
- The homepage's main action is **Rejoindre une salle**. Creation is a small **Espace présentateur** link at the bottom.
- Creation requires the user's private presenter password, checked on the server, including direct API requests.
- Every question lasts **15 seconds**, including votes and both recall challenges.
- Faster correct answers earn more points, with a maximum of **1,000 points per question**. Incorrect or late answers earn 0.
- The current repository must remain **public**, owned by **amineSiala**. The user lost access to the original account **Amine-SIALA**. Never use that old account for future pushes.
- Product language is French. The presentation remains keyboard-first, for three presenters (`P1`, `P2`, `P3`), with a teaching target of about 27 minutes. That target is not a forced session duration.
- Audience is a university class, initially planned for roughly 20–60 participants without a hard-coded class-size limit. Preserve the original goal that at least 80% of projected presentation operation is possible with Left/Right arrows alone.
- Preserve reduced-motion support, visible keyboard focus, labeled controls, large projector text, and usable phone layouts down to 320 px. The current visual language uses a cream background, dark ink text, cobalt/coral/yellow/mint accents, and illustrated character/sticker artwork.

The presenter password was supplied privately in the earlier conversation. Its plaintext and hash value must **not** appear in this public handoff, source files, examples, commits, or command output. Existing configuration is described below. If a future browser-login task needs the actual password and it is unavailable in context, ask the user privately; do not reset it just to run a test.

## 3. Official teaching content

Title: **« Un problème. Huit façons d’entreprendre. »**

Narrative: a campus needs affordable meals. Eight fictional characters illustrate different ways of building an entrepreneurial project. Forms can overlap and are not legal structures.

| ID | Official form | Simple definition | Professor's example | Character |
| --- | --- | --- | --- | --- |
| `exnihilo` | Création ex nihilo | Créer une entreprise à partir de zéro. | Un étudiant ouvre sa propre cafétéria. | Lina |
| `essaimage` | Entrepreneuriat par essaimage | Créer une entreprise avec le soutien d'une entreprise existante. | Un salarié lance son projet avec l'aide de son employeur. | Nour |
| `franchise` | Entrepreneuriat par franchise | Exploiter un concept et une marque existants sous contrat. | Ouvrir un restaurant franchisé. | Omar |
| `intrapreneur` | Intrapreneuriat | Développer un projet entrepreneurial au sein d'une entreprise. | Un employé crée un nouveau service pour son entreprise. | Sami |
| `repreneur` | Reprise d’entreprise | Acheter ou reprendre une entreprise déjà existante. | Reprendre un café familial. | Inès |
| `social` | Entrepreneuriat social et solidaire | Entreprendre principalement pour résoudre un problème social. | Proposer des repas abordables aux étudiants en difficulté. | Yasmine |
| `techno` | Techno-entrepreneuriat | Créer une activité fondée sur une innovation technologique. | Développer une start-up utilisant l'IA. | Adam |
| `vert` | Entrepreneuriat vert | Entreprendre avec un objectif environnemental central. | Créer une entreprise de recyclage ou de réduction des déchets. | Jade |

The deck has **12 chapters, 36 beats, and 11 questions**:

| Question ID | Type | Purpose |
| --- | --- | --- |
| `opening` | Vote, unscored | Entreprendre without owning an enterprise |
| `launch` | Choice + reason | Ex nihilo versus employer-supported essaimage |
| `intra` | Choice + reason | Internal project becoming a separate supported business |
| `network` | Choice + reason | Reprise and franchise can coexist |
| `mini` | Recall | Three studied forms, without hints |
| `social` | Choice + reason | Revenue and profit can support a social mission |
| `green` | Choice + reason | Environmental purpose differs from technological innovation |
| `axes` | Choice + reason | Purpose, launch method, and legal form are different choices |
| `jury` | Vote, unscored | Defend a practical compromise |
| `boss` | Recall | All eight forms without hints |
| `transfer` | Choice + reason | Apply essaimage, techno and vert to a new case |

Public prompts are in `src/content/questions.fr.ts`. Answer keys, accepted recall aliases, explanations, and presenter notes remain server-only. Do not ship those modules to the browser or reveal keys before closure.

## 4. Delivered user flows

### Presenter

1. Open the homepage and click **Espace présentateur** at the bottom.
2. Enter the private password, select **Sur téléphone** or **En équipes**, and click **Créer la salle**. Phone mode is the default.
3. The creator's browser receives an identity cookie and owns the room. Password knowledge alone does not recover a room created in another browser.
4. The stage route is `/host/session/[id]/stage`; despite its parameter name, `[id]` is the six-character room code.
5. Share the QR/join link for phone play. Online QR links use the website's actual origin, not the local LAN address.
6. Use arrows to advance. A question starts its 15-second server deadline; results appear automatically when polling processes expiry.
7. Resume the last room in the same browser with its cookies. Notes can be opened but are visible on the projected screen while the modal is open.

For remote friends who also need slides and commentary, share the presenter screen in an existing call. Built-in video/audio calling is not implemented.

### Participant

1. Use **Rejoindre une salle**, enter the code, or open `/join/[code]`.
2. Enter a nickname (2–24 characters); no personal account is required.
3. Wait for a question, choose an answer and justification where required, and validate within the shared 15 seconds. Both steps share one timer.
4. The app acknowledges an answer only after persistence succeeds. One accepted response per participant per question is immutable.
5. After reveal, see personal points and feedback. `/me` shows cumulative points and forms recognized/recalled.
6. The progress page hides form lists during an active recall question to prevent hints.
7. From `/me`, delete membership and all personal answers in that room.

### Team mode

The host enters one projected collective answer. Separate physical teams do not receive individual scores. Phone participation is refused for team-mode rooms. There is no public leaderboard or podium.

## 5. Scoring, deadlines and controls

The internal points field is still called `xp`. It now means game points, not the old participation formula.

For a correct choice **and** justification accepted before expiry:

```text
elapsedMs = server acceptance time - round.openedAt
speedPoints = round(1000 × (1 - 0.5 × max(0, elapsedMs) / 15000))
```

- Immediately: 1,000; halfway at 7.5 seconds: 750; just before expiry: approximately 500.
- Incorrect choice or reason: 0. At or after 15,000 ms, a new answer is rejected and contributes 0.
- Client-supplied times/scores are not trusted. Timing ends when the complete answer is accepted on the server.
- Votes `opening` and `jury`: **0 points**.
- Recall: `round(speedPoints × min(1, unique correct forms / required recall count))`, maximum 1,000. Normalization accepts accents/case, curated aliases, and limited typos; duplicates do not earn points.
- The 1,000 limit is **per question**; cumulative points can exceed it. Only revealed rounds contribute to visible totals.
- Old saved feedback is not retroactively regraded. Create a new room for a session entirely using the current scoring rules.

Deadline handling:

- `expireRounds()` reveals expired rounds, sets `closedAt` to their deadline, advances the current open beat to its results beat, and increments session version.
- Expiry is processed on API access, not by an independent background job. GET derives expired state without persisting it; a successful POST persists it. Host polling normally does so promptly.
- Host polls every **2 seconds**; student polls every **1.5 seconds**. Results may render shortly after expiry, but the server cutoff remains exactly 15 seconds.
- Countdown displays use the client clock and server opening timestamp. No clock-offset calibration is implemented; server acceptance remains authoritative.
- Requests have a 12-second client timeout. Offline slide previews do not save answers or fabricate results.

Keyboard behavior:

| Key | Action |
| --- | --- |
| `→`, Space, PageDown | Next beat; focused native controls retain normal Space behavior |
| `←`, PageUp | Previous beat |
| `F` | Fullscreen |
| `P` | Pause/resume general presentation clock, **not** the question deadline |
| `R` | Reconnect/resynchronize |
| `?` | Help |
| Escape | Close modal/cancel confirmation |
| Home / End | Confirm chapter jump |

Manual closure during the first 10 seconds requires a second `→`; Escape cancels. After 10 seconds, the presenter may close early without that confirmation. Chapter jumps are refused while any round is open. Going backwards never reopens a revealed round or awards extra points.

## 6. Stack and code map

**Next.js 16.4**, React 19.3, TypeScript, Tailwind CSS 4.1.18, lucide-react, qrcode.react, Zod, Vitest, Playwright, and `@netlify/database`. Fonts: locally packaged Bricolage Grotesque and DM Sans. Artwork is React/SVG/CSS; core rendering has no external generated-image dependency.

Local verification used Windows/PowerShell and Node 24.20.0. Netlify uses Node 22. Use npm and committed `package-lock.json`.

**Read `AGENTS.md` before code changes.** It requires reading relevant installed Next.js documentation in `node_modules/next/dist/docs/` before writing Next.js code. This version may differ from older APIs/conventions.

| File or directory | Responsibility |
| --- | --- |
| `src/content/curriculum.fr.ts` | Characters, official labels, cues, chapters |
| `src/content/beats.fr.ts` | Ordered 36-beat deck |
| `src/content/questions.fr.ts` | Public prompts, types, all 15-second durations |
| `src/lib/answer-keys.ts` | Server-only correct answers and recall aliases |
| `src/lib/grading.ts` | Recall normalization and speed scoring |
| `src/lib/engine.ts` | Pure navigation, expiry, submissions, privacy-filtered snapshots |
| `src/lib/presenter-auth.ts` | Server-only password digest verification |
| `src/lib/presenter-notes.ts` | Server-only current-beat notes |
| `src/lib/store.ts` | Local file and transactional Postgres adapters |
| `src/lib/environment.ts` | Build-time online/local flags and display copy |
| `src/lib/keyboard.ts`, `browser-id.ts` | Keyboard behavior and controller UUIDs |
| `src/types/domain.ts` | `Session`, `Round`, `RoomState`, `Feedback`, etc. |
| `src/app/api/rooms/[[...path]]/route.ts` | Room actions, validation, cookies, authorization |
| `src/components/home.tsx` | Joining UI and private presenter modal |
| `src/components/stage.tsx` | Projected stage, QR, polling, controls and results |
| `src/components/student.tsx` | Join, participant, recall, feedback and progress |
| `src/components/art.tsx` | Campus and character illustrations |
| `src/components/common.tsx` | Brand, badges, modals, notices, API helper |
| `src/app/globals.css`, `src/components/student.css` | Bright responsive theme and motion |
| `netlify.toml` | Build flags and explicit Next.js runtime plugin |
| `netlify/database/migrations/20261010000100_game_rooms.sql` | Hosted schema |
| `tests/` | Six Vitest files; 55 tests at last functional validation |
| `playwright/classroom.spec.ts` | Six browser scenarios |
| `docs/presenter-cheatsheet.md` | Presenter workflow and shortcuts |
| `docs/verification.md` | Historical and latest validation evidence |
| `docs/implementation-status.md`, `README.md` | Supporting development/status notes |

Some supporting docs retain historical sections. This handoff and current source supersede old references to six forms, Supabase, unfinished cloud hosting, 10/20 participation points, and nonbinding timers.

Implemented routes: `/`, `/host` (also Home), `/host/session/[id]/stage`, `/join/[code]`, `/s/[code]`, `/me`, `/privacy`, `/api/rooms`, and `/api/rooms/CODE`. No OAuth callbacks, permanent-account pages, or separate host-settings dashboard exist.

## 7. Backend, identity and privacy

### API and identity

`POST /api/rooms` creates with `{ action: "create", mode, password }`. `GET /api/rooms/CODE` returns an authorized snapshot. POST to the room accepts `join`, `sync`, `release`, `move`, `answer`, and `forget`. Read the Zod schema for exact fields.

- POST requires a same-origin Origin header. Direct HTTP tests must supply the actual site origin.
- Six-character random room codes exclude `I`, `O`, `0`, and `1`.
- Cookie `elab_identity`: random 32-byte identity, HTTP-only, SameSite=Lax, 30-day max age, Secure over HTTPS. The server stores only its SHA-256 fingerprint.
- Cookie ownership/membership controls room access. Nickname or room code alone does not grant host privileges.
- Host tab uses an 8-second renewable controller lease; another host tab is read-only until release/expiry.
- Optimistic session versions reject competing stale navigation with `STALE`.
- An identical answer retry returns the saved result even after closure. Changed second answers get `ALREADY_ANSWERED`.
- Host snapshots contain only current-beat notes. Participant snapshots do not include notes or hidden correction before reveal.
- Phone aggregate distributions are suppressed for fewer than three answers. Personal answers and member identities are not broadcast.
- Creation is limited to 15 rooms per host identity per 10 minutes, with an in-process limiter and a durable hosted check. Incorrect password attempts do not have a dedicated durable limiter.

### Storage

Hosted table `game_rooms`: `code` primary key, `host_hash`, JSONB `payload`, `created_at`, `updated_at`. Payload holds the whole session. A mutation runs `BEGIN`, loads only that room with `SELECT ... FOR UPDATE`, saves, and `COMMIT`; errors roll back. Creation uses an advisory lock per host for its durable limit. A cached pool is reused, and `closeStore()` is used by tests.

Local rehearsal stores `.data/rehearsal.json` (or `DEMO_DATA_DIR`) with serialized writes and temporary-file replacement. It supports one persistent Node process only.

Postgres is selected when `NETLIFY` is set, `ROOM_STORAGE=postgres`, or `NEXT_PUBLIC_SESSION_MODE=online`. Hosted mode fails when DB configuration/storage fails; it must never silently save to an ephemeral local file.

No automatic room purge exists. `/me` deletion removes the caller's membership and answers in the selected room. Cookie expiry and ending a presentation do not delete records. There is no permanent account linking, cross-device recovery, recoverable presenter account, or ownership transfer. Keep privacy copy honest.

## 8. Configuration and secrets

| Variable | Purpose and current handling |
| --- | --- |
| `PRESENTER_PASSWORD_HASH` | Private password's 64-character hex SHA-256 digest; configured in ignored `.env.local` and Netlify **production-context secret** |
| `NEXT_PUBLIC_SESSION_MODE` | `online` enables website copy and origin-based QR links; set by `netlify.toml` |
| `ROOM_STORAGE` | `postgres` selects hosted storage; set in build config; online flag/Netlify runtime also enforce Postgres |
| `NETLIFY_DB_URL` | Server-only DB connection secret supplied by Netlify Database; never client-prefixed |
| `NEXT_PUBLIC_APP_URL` | Optional LAN join URL in local mode; current local value uses `http://192.168.100.174:3000`, which can change |
| `DEMO_DATA_DIR` | Optional local data directory, default `.data/` |
| `PLAYWRIGHT_PORT` | Test server port, default 3100; 3000 was used to reuse an existing dev server |
| `PRESENTER_TEST_PASSWORD` | Test-only password override; runner defaults to `test-presenter-password` and supplies its digest to a server it starts |

Missing/malformed presenter configuration returns **503**. Missing/wrong credentials against configured auth return **401**. Verification uses `timingSafeEqual`; the submitted password is not saved in rooms or returned to clients.

Resolved Netlify issue: a secret cannot be set in an `all` context including development. The MCP updater misleadingly reported success on that failed request. The working setup used the documented CLI with **production** explicitly:

```text
node .tools/node_modules/netlify-cli/bin/run.js env:set PRESENTER_PASSWORD_HASH <private-digest> --secret --context production --force --site 9bb3c368-776d-4c3b-b339-398ee001a512
```

Changing a hosted variable requires redeployment. Never expose the private digest in output or a committed script. Build variables in `netlify.toml` are not a general runtime-secret mechanism. Preview deployments would need a separately configured presenter-secret context; only production is configured and verified here.

The public repository excludes `.env*` except `.env.example`, `.data/`, `.tools/`, `.netlify/`, `.deploy/`, `node_modules/`, `.next/`, screenshots, test outputs, and deploy ZIPs. Ignored helper output/logs can contain credentials or rehearsal data. Do not bulk-print or upload them.

## 9. GitHub ownership and history

The original repo was created under **Amine-SIALA**. The user lost access. Git Credential Manager authenticated **amineSiala**, a different account, and the whole local history was pushed to a new repository there. It was then made public and verified without authentication.

Local credential preference is now `amineSiala`; the origin includes its username to disambiguate saved accounts. Local commit-author settings use the user's current identity. Do not unnecessarily change global credentials or rewrite old commit authors.

If authentication expires:

```powershell
git credential-manager github login --username amineSiala --browser
```

Verify the authenticated API login before remote mutations. Never print a credential returned by Git Credential Manager. Ignored helper `.tools/migrate-github.mjs` checks the correct owner. **`.tools/github.mjs` is obsolete and expects the old account; do not reuse it.**

A verified ignored history backup exists at `.tools/entreprendre-lab-backup.bundle`. It predates owner/visibility documentation changes and is not automatically updated. Normal history is also on GitHub.

Milestones:

| Commit | Change |
| --- | --- |
| `45ab983` | Bright eight-form presentation and local classroom games |
| `d15d363` | Postgres storage and remote participation |
| `b1a475e` | Explicit Next.js runtime for MCP source deployment |
| `5378be9` | Presenter authentication and 15-second speed scoring |
| `0cfe40e` | Live scoring/authentication verification |
| `525362f` | Correct GitHub owner documented |
| `0b690bf` | Public repository documentation |

## 10. Local development and tests

```powershell
npm ci
npm run dev
```

Existing `.env.local` already configures local authentication and the LAN URL. On a fresh clone, create private config from `.env.example`. Local file mode needs no cloud DB. Scripts listen on `0.0.0.0`; local phones need the LAN address and network/firewall access. Internet friends use the public site.

Checks:

```powershell
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
```

Playwright uses installed Microsoft Edge on Windows; elsewhere install Chromium. Default test server is port 3100. It injects a test password digest into a server it starts. When reusing an existing server, set `PLAYWRIGHT_PORT` and `PRESENTER_TEST_PASSWORD` to match, without committing the real password. Another Next dev instance in this workspace can prevent a second from starting. Reuse it or deliberately stop the identified instance; do not kill unrelated Node processes.

A local build with `NEXT_PUBLIC_SESSION_MODE=online` also selects Postgres at runtime. Do not expect that build to use the JSON adapter without DB configuration.

Documentation-only work needs Markdown/diff validation, not an application test rerun. Functional work needs appropriate tests. Do not claim tests ran in a new conversation just because this file records earlier results.

## 11. Netlify MCP publication

Netlify is accessed through its **official local stdio MCP server**, not Sites/Higgsfield and not GitHub automatic deployment.

Ignored tooling under `.tools/node_modules/` includes `@netlify/mcp`, `@modelcontextprotocol/sdk`, and `netlify-cli`. `.tools/mcp.mjs` connects to `.tools/node_modules/@netlify/mcp/dist/netlify-mcp.js`.

```powershell
node .tools/mcp.mjs list
node .tools/mcp.mjs call
```

For `call`, put the JSON request in `.tools/mcp-call.json`. The response is saved in `.tools/mcp-result.json`. Normal responses are printed, so do not use it unredacted to list secret values. It accepts a UTF-8 BOM; `[IO.File]::WriteAllText` avoids problematic older PowerShell encoding defaults.

If Netlify auth expires:

```powershell
node .tools/node_modules/netlify-cli/bin/run.js login
```

Confirm tools/authentication before saying a connector is connected. These ignored helpers and dependencies will not exist in a fresh GitHub clone.

### Deploy the existing project

1. Inspect and verify the intended changes, commit, and push to **amineSiala/entreprendre-lab**.
2. Export committed tracked files only:

```powershell
git archive --format=zip --output=.tools/deploy-source.zip HEAD
Expand-Archive -LiteralPath .tools/deploy-source.zip -DestinationPath .deploy/source -Force
```

Ensure the export directory has no stale files from previous exports. Before any recursive cleanup, verify the absolute target is precisely the intended `.deploy/source` within this workspace.

3. Call `netlify-deploy-services-updater`:

```json
{
  "name": "netlify-deploy-services-updater",
  "arguments": {
    "selectSchema": {
      "operation": "deploy-site",
      "params": {
        "siteId": "9bb3c368-776d-4c3b-b339-398ee001a512",
        "deployDirectory": "C:\\Users\\amine\\Desktop\\projet entrepreunoriat\\AMINE\\.deploy\\source"
      }
    }
  }
}
```

4. Inspect the returned ID using `netlify-deploy-services-reader`, operation `get-deploy`, params `{ "deployId": "<returned-id>" }`. Wait for `ready`, inspect errors, then verify the public API and changed behavior. An accepted upload or successful build alone is insufficient.
5. Record the deploy and meaningful verification. Application changes require publication; documentation-only commits do not.

Resolved pitfalls:

- The MCP uploader does not honor the full `.gitignore`. Sending the live workspace can upload ignored nested dependencies, local data, and `.env.local`. Always send the clean Git export.
- `netlify.toml`: `npm run build`, publish `.next`, Node 22, online mode, and explicit `[[plugins]] package = "@netlify/plugin-nextjs"`.
- Keep that explicit runtime plugin. The first source upload built pages but omitted the server runtime; room API requests returned HTML. Explicit configuration fixed it. Verified adapter version was `@netlify/plugin-nextjs@5.16.2`, automatically installed by Netlify.
- `@netlify/database` plus migrations under `netlify/database/migrations/` provisions the DB and applies schema before production publication.
- Never edit an applied migration. Add a new migration; do not manually apply production schema, drop/reset data, or restore snapshots as ordinary troubleshooting.
- Existing linking state is in `.deploy/source/.netlify/state.json`. GitHub ownership changes do not require a new Netlify site or database migration.
- The existing Netlify team was Free and successfully provisioned this credit-based database. Do not enable paid upgrades without authorization.

Dashboard: https://app.netlify.com/projects/entreprendre-lab

Verified production deploy: https://app.netlify.com/sites/9bb3c368-776d-4c3b-b339-398ee001a512/deploys/6aca20f7abc97af8615167d6

## 12. Verification and known limits

Last functional validation: **10 October 2026**.

- Lint, TypeScript checks, and online production build passed.
- **55 Vitest tests** across six files passed: curriculum, grading, keyboard, engine, API, Postgres persistence/rollback/limits, authentication and deadlines.
- **Six Playwright scenarios** passed. Focused scenarios were rerun after fixing stale assertions; do not describe that as a single uninterrupted all-green run.
- Layout checked at 1920×1080, 1366×768 and 1024×768; participant flows at 320/390/430 px.
- Three independent browser contexts completed choices, reasons, recalls, refresh, private progress and deletion.
- Local simulation: 60 API clients joined, submitted and retried, producing exactly 60 saved answers with no duplicates. This is not a hosted 60-player capacity benchmark.
- Live HTTPS checks covered room creation, independent player cookies, concurrent answers, persistence, reveal, mobile rendering and deletion.
- Latest public check: missing/wrong presenter passwords rejected, correct configured password accepted. Faster/later correct answers scored **990/931**, wrong/no answer **0/0**. Results automatically revealed after 15 seconds, late submissions were rejected, and identical retries added no points.
- Ignored screenshots include `artifacts/online-join-home.png` and `artifacts/online-speed-score.png`. Earlier screenshots/traces/helpers are also local only.
- Test participants were removed. Empty test rooms may remain because there is no automatic purge.

Known limits and optional future work — **not current commitments**:

- No agent test on physical phones using 4G, full hosted classroom load test, or actual projector rehearsal. The user reported the live app worked.
- No permanent accounts, account linking/recovery, ownership transfer, public leaderboard or per-team individual scoring.
- No built-in screen sharing, audio/video calls, or automatic GitHub-to-Netlify deploy connection.
- No dedicated shared limiter for wrong presenter passwords.
- No automatic room retention/purge, curriculum version pinning, or regrading old sessions.
- Client clock differences can affect visual countdowns; server acceptance remains authoritative.
- An earlier production-only npm audit reported zero vulnerabilities, while full/development dependencies surfaced five high-severity advisories. Those were not remediated. Recheck when dependency work is requested; do not claim a fresh clean full audit.

## 13. Resume in a new conversation

1. Read this file and `AGENTS.md`; inspect `git status`, the latest commit, relevant source, and the user's new request.
2. Use **amineSiala** and the existing public repo. Preserve the working Netlify site and database.
3. Treat the eight forms, bright theme, presenter-only creation, speed scoring, and 15-second deadlines as accepted decisions unless the user changes them.
4. Use private local configuration without printing its values. Do not copy private helper output into a public document.
5. Implement and verify the new request. Publish when a live update is requested/authorized; a GitHub push alone does not update Netlify.
6. Update this file with new behavior, deployment/verification details and pending work as needed.

At the end of this handoff-writing task, no earlier requested application feature remains pending. Continue from the next user request instead of rebuilding the original specification.
