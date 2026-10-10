> GitHub — compte actuel : **amineSiala**, dépôt public https://github.com/amineSiala/entreprendre-lab. Le projet local utilise ce compte pour ses prochains pushes. Le site Netlify reste https://entreprendre-lab.netlify.app.

> Dernière évolution — 10 octobre 2026 : accueil centré sur « Rejoindre une salle » ; création via « Espace présentateur » avec vérification serveur et secret Netlify. Tous les défis durent 15 secondes et se ferment automatiquement. Choix + justification corrects : 500–1 000 points selon la rapidité ; erreur/hors délai : 0 ; votes : 0 ; rappel : proportion de formes correctes × score de rapidité. Ces règles remplacent les anciens points de participation et chronos indicatifs ci-dessous. Le mot de passe n’est jamais enregistré dans ce dépôt.

# handoff.md — Entreprendre.Lab

> **Current requirements — updated 9 October 2026. Read before the historical specification below.**
>
> The user requests a **bright, distinctive visual theme**, avoiding a generic AI-generated look, and an animated presentation with playful, Kahoot-style challenges. Questions must require **understanding and reasoning**, rather than copying a visible label. Both **projected team play** and **individual phone play** are requested.
>
> The professor’s official list has now been supplied. It **replaces every six-profile/six-approach list, objective, character count and recall target below**. Teach and assess these **eight forms**:
>
> | N° | Forme d’entrepreneuriat | Définition simple | Exemple fourni |
> | --- | --- | --- | --- |
> | 1 | Création ex nihilo | Créer une entreprise à partir de zéro. | Un étudiant ouvre sa propre cafétéria. |
> | 2 | Entrepreneuriat par essaimage | Créer une entreprise avec le soutien d’une entreprise existante. | Un salarié lance son projet avec l’aide de son employeur. |
> | 3 | Entrepreneuriat par franchise | Exploiter un concept et une marque existants sous contrat. | Ouvrir un restaurant franchisé. |
> | 4 | Intrapreneuriat | Développer un projet entrepreneurial au sein d’une entreprise. | Un employé crée un nouveau service pour son entreprise. |
> | 5 | Reprise d’entreprise | Acheter ou reprendre une entreprise déjà existante. | Reprendre un café familial. |
> | 6 | Entrepreneuriat social et solidaire | Entreprendre principalement pour résoudre un problème social. | Créer une entreprise qui propose des repas abordables aux étudiants en difficulté. |
> | 7 | Techno-entrepreneuriat | Créer une activité fondée sur une innovation technologique. | Développer une start-up utilisant l’IA. |
> | 8 | Entrepreneuriat vert | Entreprendre avec un objectif environnemental central. | Créer une entreprise de recyclage ou de réduction des déchets. |
>
> Preserve the original keyboard-first, French-language, three-presenter teaching intent. Forms may overlap and are not legal structures. Final recall concerns **eight** forms, followed by application to a new case. The current title is **« Un problème. Huit façons d’entreprendre. »**
>
> **Implementation status is separate from requirements.** The current implementation uses a local Node server and JSON persistence for rehearsal and same-network phone participation. Supabase, permanent accounts, account linking, cloud hosting and cross-device recovery described below are **not connected or completed**. Consult `README.md` and `docs/implementation-status.md` for what is actually implemented and verified.
>
> **Historical specification follows.** Its original six-form content, provisional-list language and conflicting visual choices are superseded by this update. Remaining requirements describe the original target, not evidence of delivered functionality.

---

> **Project:** A live, interactive, French-language university presentation on **« Les formes d'entrepreneur »**.
>
> **Audience:** One classroom of university students; assume 20–60 simultaneous students initially, but do not hard-code a size limit.
>
> **Team:** Three student presenters, one projected laptop (authoritative controller), many students with mobile phones.
>
> **Duration:** 20–30 minutes, target **27 minutes of teaching** plus ~2 minutes for questions.
>
> **Top constraint:** On the projected computer, **at least 80% of presentation operation must be accomplished with the Left and Right arrow keys alone**, without using the mouse.
>
> **Primary outcome:** At the end, every student should be able to **recall the six taught entrepreneurial approaches unaided**, give a one-sentence explanation of each, and identify them in scenarios.
>
> **Status:** Greenfield product specification for an AI coding assistant (Codex in VS Code). Do not pretend this file describes existing code. If a repository already exists, inspect it first and adapt this plan while retaining the requirements.
>
> **Language:** Website, scripts, questions, buttons and feedback in **French**. Code, comments, migration names, tests and implementation documentation may be in English.

---

## 0. Instructions to Codex — read this first

You are the implementing engineer. Build a production-minded, demo-ready application rather than just a landing page. Work in small, testable vertical slices. **Do not fake persistence, real-time participation, security, or live class results**. If Supabase credentials are unavailable, support an explicitly labeled local **Demo Mode**, then document exactly what remains to connect to a live backend.

**Order of operations:**

1. Inspect the existing repository, if any; report the real state, package manager, and constraints. If empty, scaffold the agreed stack.
2. Implement the slide-deck data model and an attractive, usable, **keyboard-first projected stage** with demo content.
3. Implement quick student join, robust authentication, session membership and database-backed persistence.
4. Wire authoritative presenter controls to synchronized student question states.
5. Implement scoring, learning progress, final recall test, and private student dashboards.
6. Add tests, accessibility, security policies, deployment instructions and rehearsal tools.
7. Run lint, typecheck, tests and production build; fix failures; document results honestly.

**Keep these invariants:**

- The projected **stage** is the presenter interface and has a distraction-free layout. Do not force the presenter to switch to an admin dashboard during the talk.
- The projected stage always supports `ArrowRight` = **next beat** and `ArrowLeft` = **previous beat**. A *beat* may be a slide, a reveal, opening a poll, closing a poll, showing results, or revealing the explanation.
- Presenter navigation must be **authoritative on the server**, survive page refresh, and synchronize to connected students.
- A student gets an identity in seconds (nickname + anonymous auth), with **optional account upgrade** for cross-device recovery.
- Do not expose other students' personal answers, emails, session tokens, or full names on the projector.
- Never give the browser a Supabase secret/service-role key or hidden answer-key data.
- Student UI must work on ordinary mobile browsers; no app installation required.
- Build with one class session as the primary experience. Avoid premature multi-tenant complexity.
- Be honest about the taxonomy: our six memorable examples mix **profiles/orientations** and **ways of undertaking a venture**. They are not six exclusive legal structures.

**Definition of working MVP:** From a fresh browser, a presenter can create a room, display its QR code, have two students join on separate phones, advance through a real question using arrows, receive saved answers, reveal aggregate results, refresh all pages and retain progress, then run a closed-notes final recall challenge.

---

## 1. Product vision and pedagogy

### 1.1 Title and promise

**Entreprendre.Lab — « Un problème. Six entrepreneurs. »**

A fictional campus struggles to provide affordable, healthy meals. Six fictional candidates propose different ways of solving the same problem. The class becomes a jury and learns to distinguish their entrepreneurial approaches. Live quizzes are part of the narrative, not interruptions.

**Core message:** « Il n'existe pas une seule façon d'entreprendre. Le bon choix dépend des objectifs, des ressources et du contexte. »

### 1.2 What students must know at the end

Teach the following six **approaches / profiles** as pedagogical anchors:

| ID / slug | French label | Core memory cue | Campus character | Academic nuance |
|---|---|---|---|---|
| `independant` | Entrepreneur indépendant | **J'agis à mon compte** | **Lina**: makes and sells lunch boxes herself | Can also innovate, have a social mission, or own a franchise. Not automatically a specific legal status. |
| `innovateur` | Entrepreneur innovateur | **J'invente / j'améliore** | **Adam**: invents a demand-prediction/pre-ordering service | Innovation can happen inside or outside a firm; not necessarily a tech startup. |
| `social` | Entrepreneur social | **Je résous un problème social** | **Yasmine**: affordable meals for struggling students through a viable model | Social mission does not mean zero revenue or absence of profit. |
| `intrapreneur` | Intrapreneur | **J'entreprends dans une organisation** | **Sami**: launches a new student menu inside an existing catering company | Intrapreneur normally doesn't create/own a separate company for that initiative. |
| `repreneur` | Entrepreneur repreneur | **Je reprends une activité** | **Inès**: buys/takes over a café and changes its offer | A way of starting/entering business; not a psychological personality type. |
| `franchise` | Entrepreneur franchisé | **J'utilise un concept en réseau** | **Omar**: operates a restaurant under an established franchisor's brand | Franchisee remains an independent operator bound by a contract; franchising and takeover can sometimes overlap. |

The six are **not** mutually exclusive, and should not be introduced as a universal exhaustive academic classification. Explicitly explain the distinctions:

1. **Profil / orientation / motivation:** independence, innovation, social impact.
2. **Mode d'entreprendre:** creation, intrapreneurship, takeover, franchising.
3. **Forme juridique:** separate choice (e.g., individual business vs company form, depending on the country's law). Do not claim a named legal status without selecting/validating a jurisdiction.

Until the professor's official list is supplied, use this as a **proposed educational framework**, editable through a content configuration file.

### 1.3 Required learning loop

Each form should be encountered three or more times:

1. **Understand:** one memorable character + concrete solution + one benefit + one challenge.
2. **Recognize:** a short scenario with an answer choice and an immediate explanation.
3. **Retrieve:** an intermediate no-hints mini recall exercise and a final **closed-slide** recall challenge.

The project must assess memorization **separately** from participation. Do not claim every student mastered the material just because they joined or clicked an answer.

### 1.4 Three presenters

- **P1 — Le créateur:** welcome, initial vote, challenge framing, definition, Lina/Adam (approximately 9 minutes).
- **P2 — Le visionnaire:** Yasmine/Sami, motivations, scenario practice (approximately 8 minutes).
- **P3 — Le stratège:** Inès/Omar, comparison, taxonomy/legal distinction, final challenge (approximately 9 minutes).
- **All three:** deliver the one-minute closing together.

An unobtrusive presenter cue on the projected stage may show `P1`, `P2`, `P3` and current segment without giving away private script notes to the students. Presenter notes can be toggled and must be **hidden by default on the projected surface**.

---

## 2. User types and workflows

### 2.1 Presenter / host

1. Open `/host`, sign in using a permanent account, create or resume a session.
2. Go to `/host/session/[id]/stage`; select **Start / fullscreen** (one click acceptable at the beginning).
3. Project stage on classroom screen. Welcome slide shows **large QR code + short code + simple join URL**.
4. Students join while stage displays count; host advances mostly with arrows.
5. `ArrowRight` traverses the *beat sequence* (narrative, poll opened, poll locked/results, teaching reveal, etc.).
6. Stage shows enough live aggregate feedback to present without switching tabs.
7. Complete recall assessment, show aggregate stats, end on closing slide.
8. Room persists and can be resumed after a refresh or temporary outage.

Only one authorized **controller tab** may mutate stage state at a time. The projected host tab is the controller. A second presenter tab is read-only unless the host explicitly transfers control. MVP may omit the transfer UI; never allow uncontrolled simultaneous writers.

### 2.2 Student

1. Scan QR / open `/join/[code]`.
2. If no account session, create Supabase anonymous user; enter nickname (2–24 visible characters, trim, basic profanity filtering if possible, uniqueness not required).
3. Join this session; no email, password, or lengthy form required.
4. See a waiting screen when no question is active; don't mirror the entire slide deck unnecessarily.
5. As teacher advances, receive a prompt, select or type answer, submit once; see acknowledgment: **« Réponse enregistrée »** only after the server confirms persistence.
6. After question closes, see correctness/explanation (for graded questions), XP change, and class results as appropriate.
7. After session, access `/me` for history, mastered forms, missed items, examples, and quick review.
8. Optional **« Sauvegarder mon compte »**: securely link Google or verified email to the **existing anonymous identity**, preserving its user ID and data.

**Important recovery limitation:** Anonymous accounts persist on the server but cannot be recovered from a different device or cleared browser unless linked to a recoverable identity. Say this plainly. Never claim nickname alone is secure authentication.

### 2.3 Shared screen / public privacy

The projected view is a **presenter-controlled public stage**, not a private admin dashboard. Show participant **count** and **aggregate answer percentages**; suppress identifying information by default. Public leaderboard is optional and must use opt-in pseudonyms only; **not MVP**. Teachers should not have to read off students' real names.

---

## 3. Information architecture / routes

Proposed Next.js App Router structure (adapt if repository already has routing):

| Route | Who | Purpose |
|---|---|---|
| `/` | Public | Brand intro, two CTAs: Join a class / Host a class. |
| `/join/[code]` | Student | Low-friction join, nickname, consent notice; auto-resume existing auth. |
| `/s/[code]` | Student | Live participant view: waiting, current question, answer acknowledgment/results. |
| `/me` | Authenticated student | Personal history, progress and review, link permanent sign-in. |
| `/host` | Permanent presenter | Session creation and resume list. |
| `/host/session/[id]/stage` | Authorized presenter | **Primary keyboard-first projected screen.** |
| `/host/session/[id]/settings` | Authorized presenter | Out-of-band setup only: join code, content preview, reopen/close room, diagnostics. |
| `/auth/callback` | Auth | OAuth/email linking callback, safely return to previous account and path. |
| `/privacy` | Public | Student privacy explanation, storage, retention, deletion route/contact. |

**Room code:** human-readable, randomly generated uppercase alphanumeric (e.g. 6–8 characters without ambiguous `I/O/0/1`), unpredictable, enforced unique. Authorization must not rely on secrecy of room code.

### 3.1 UX design guidance

- Look like a modern startup demo, **not a generic education admin dashboard**.
- Palette: dark ink `#142833`, fresh mint `#BEE7D3`, warm ivory `#F6F5EF`, accent coral `#F0A486`; ensure WCAG AA text contrast.
- Typography: strong display headline, legible sans-serif body, restrained motion and consistent visual hierarchy.
- Projector stage designed first for **16:9 1920×1080**, responsive to 1366×768 and 4:3 projectors; no scroll for core slide content.
- Stage headline roughly 48–72 px on 1080p; support text usually 26–36 px and at most ~40–55 visible words per narrative beat. Avoid unreadably small poll labels.
- Large progress rail: `Slide 6 / 12` or `Beat 14 / 28`, speaker cue and live room count. Keep chrome near-invisible until needed.
- Student phone: narrow 320px support, one-thumb answers, 44px minimum touch targets, portrait-first, high contrast.
- Respect `prefers-reduced-motion`; keyboard focus rings; semantically labeled controls; accessible live result announcements.
- No stock image dependency required to render core flows: include a visually strong fallback using icons, simple character art, CSS shapes. License any external images properly; never hotlink random images without attribution/permission.

---

## 4. THE MOST IMPORTANT REQUIREMENT: projected arrow-key-first mode

### 4.1 Mental model

The app is a **beat deck**, not just a page deck. One visible slide may consist of several presentation **beats**. Right arrow = next beat. Left arrow = previous beat.

Examples:

- Beat A: display prompt, QR code, and joining counter.
- Beat B: open vote on student phones.
- Beat C: lock vote and show results on screen.
- Beat D: reveal the explanation/teaching point.

The deck must therefore work as a story even when the presenter never opens the mouse controls after launching fullscreen.

### 4.2 Required keyboard map

| Input | Action | Notes |
|---|---|---|
| `ArrowRight` | **Next beat** | Main action. Must cover slides, reveals, opening a quiz, freezing a quiz and showing its results. |
| `ArrowLeft` | **Previous beat** | Revisit prior explanatory screen; **never erase attempts, XP or submissions**. |
| `Space` or `PageDown` | Next beat | Optional alternative. Prevent page scrolling when stage controls have focus. |
| `PageUp` | Previous beat | Optional alternative. |
| `Home` | Jump to first beat | Confirm before disruptive jump when session is live. |
| `End` | Jump to last beat | Confirm before disruptive jump; never automatically mark lessons/questions completed. |
| `F` | Request browser fullscreen | Browsers require user gesture; show manual button if request fails. |
| `?` | Shortcut help overlay | Toggle; overlay must not permanently steal navigation focus. |
| `Esc` | Close transient overlay | Browser may also exit fullscreen; do not rely on preventing that. |
| `P` | Pause/resume presentation clock | Does not auto-close an active question. |
| `R` | Reconnect / refresh state | Re-fetch authoritative server state; do not blindly reload with destructive effects. |

**Don't** hijack arrow keys when:

- Focus is on `input`, `textarea`, `select`, a contenteditable element, or interactive modal.
- `Ctrl`, `Meta`, or `Alt` is held.
- The active key event is a repeat (`event.repeat`), unless a deliberate key-hold override is implemented.
- The user is navigating a confirmation dialog or accessibility controls.

Use `keydown` on the stage client, clean up listeners, avoid duplicate listeners from React Strict Mode, and call `preventDefault()` only for actual stage shortcuts.

### 4.3 Navigation state machine

Recommended beat types:

```ts
type BeatKind =
  | 'title'
  | 'story'
  | 'definition'
  | 'character'
  | 'compare'
  | 'reveal'
  | 'question-open'       // opens a new response window once
  | 'question-results'    // closes window if needed; shows aggregates
  | 'question-explain'    // reveals educational explanation
  | 'recall-open'         // no-hints free-text response
  | 'recall-results'
  | 'conclusion';

type PresentationBeat = {
  id: string;             // stable, versioned content ID
  slideId: string;        // maps to 1 of 12 large visual slides
  kind: BeatKind;
  title: string;
  speaker: 'P1' | 'P2' | 'P3' | 'ALL';
  durationHintSeconds?: number;
  questionId?: string;    // only on question/recall beats
  contentKey?: string;
};
```

Persist at least `sessions.current_beat_index`, `sessions.version`, and `sessions.status` in the database. **All authoritative updates go through a guarded server function** (RPC / server route) requiring current authorized presenter identity; use atomic version check or transaction to prevent double progression. Browser optimistic animation is fine but final rendered state must agree with server.

Transition effects are **idempotent**:

- Entering a `question-open` beat for the first time creates/opens a server-side question round.
- Entering `question-results` locks that round and computes/surfaces aggregates.
- Entering `question-explain` reveals the answer/explanation.
- `ArrowLeft` may revisit historical beats in **read-only replay mode**; never reopen a finished question or delete its answers.
- `ArrowRight` from a historical beat replays persisted results rather than creating duplicate rounds.
- All student submissions have server-side uniqueness by `(session_id, user_id, question_id)` or `(round_id, user_id)` to avoid duplicate scoring.
- If a presenter closes a question unusually early (e.g. less than 10 seconds after opening), show a clear **hold Right Arrow to force-close** action or concise confirmation with arrow-friendly semantics; otherwise the regular right arrow locks and progresses. The presenter should remain free to extend a round indefinitely.
- Don't automatically advance because of a timer. Timers can display elapsed or remaining time but the instructor controls pacing.
- Disable or clearly warn on disruptive Home/End jumps when a round is collecting responses.

### 4.4 Stage HUD (minimal)

During normal stage operation show only:

- Top-left: optional small Entreprendre.Lab wordmark and slide title.
- Top-right: discreet `P1/P2/P3` cue, `N participants`, `● Connecté` status.
- Bottom: thin progress rail, `◀ ▶` hint, maybe slide/beat counter.
- Center: narrative visual, character, or live question/results — never a CRUD panel.

Controls fade but appear when pointer moves, or when pressing `?`. Tiny out-of-band overlay menu can have **Full screen**, **Copy join link**, **Re-sync**, **Exit stage**, and **Emergency fallback**.

**Presenter convenience / safeguards:**

- After refresh, stage resumes from the exact saved beat and question state.
- Startup preflight: test network, room status, student join link, Supabase auth and realtime channel.
- Audience phone synchronization must not change stage focus or steal projector keyboard input.
- A visible disconnection indicator must be obvious but not block content.
- Stage navigation works on a standard laptop keyboard, a presenter clicker that emits Left/Right keys, and mouse controls for accessibility.
- Provide a progress timeline / jump-to slide **only in a side overlay** (one of the permissible ~20% non-arrow actions).

### 4.5 Concrete acceptance test for arrow-only use

Starting on the welcome slide, a host should be able to use only the **Right arrow** to:

1. Display the opening question.
2. Open its student response window.
3. Close it and reveal aggregate voting results.
4. Show the campus scenario.
5. Introduce Lina and Adam with their cues and comparisons.
6. Open and close knowledge checks.
7. Proceed through P2 and P3 sections without clicking on the screen.
8. Open the final free-response recall test, lock it, reveal the class's anonymized mastery summary, and reach the closing slide.

Then Left arrow should traverse prior beats without mutating submitted student work.

---

## 5. Teaching content and run of show

### 5.1 12 visible slides, approximately 27 minutes

| Slide | Title (in French) | Speaker | Time | Content / interactions |
|---|---|---|---:|---|
| 1 | « Et vous, seriez-vous entrepreneur ? » | P1 | 2m | Welcome QR, quick misconception vote: is founding your own company required? |
| 2 | « Mission : nourrir le campus » | P1 | 2m | Fictional student-meal challenge with three competing constraints. |
| 3 | « Entreprendre, c'est créer de la valeur » | P1 | 2m | Concise definition; three axes: profile, entry mode, legal form. |
| 4 | « Créer seul ou inventer ? » | P1 | 3m | Lina + Adam character cards, similarities/differences, 1 check. |
| 5 | « Entreprendre pour changer la société » | P2 | 3m | Yasmine, social mission and viability, 1 check. |
| 6 | « Innover sans créer une entreprise » | P2 | 3m | Sami intrapreneur, 1 check. |
| 7 | « Pourquoi et comment entreprendre ? » | P2 | 2m | Motives/approaches; mini retrieval without visible list. |
| 8 | « Et si l'activité existait déjà ? » | P3 | 2m | Inès repreneuse, 1 check. |
| 9 | « Entreprendre avec un réseau » | P3 | 2m | Omar franchisé, 1 check. |
| 10 | « Profil ≠ forme juridique » | P3 | 2m | Critical academic clarification, comparison dimensions. |
| 11 | « Le jury, c'est vous ! » | P3 | 3m | Audience case vote, free recall boss battle, results. |
| 12 | « Il n'existe pas une seule façon d'entreprendre » | ALL | 1m | Three-line conclusion, QR to `/me`, post-class challenge. |

This is **27 minutes** excluding ~2 minutes optional Q&A. Some time allocations may be adjusted after rehearsals, but keep the story and active learning.

### 5.2 Beat sequence seed (illustrative; implement as configurable data)

```text
00 intro-qr                  title               P1   QR + room code, live count
01 intro-vote-open           question-open       P1   initial misconception vote
02 intro-vote-results        question-results    P1   class results, no public names
03 intro-vote-explain        question-explain    P1   intrapreneurship preview
04 campus-problem            story               P1   campus problem
05 definition                definition          P1   entrepreneurship + 3 dimensions
06 character-lina            character           P1   indépendant
07 character-adam            character           P1   innovateur
08 compare-lina-adam         compare             P1   profile distinction
09 check-1-open              question-open       P1   identify innovation vs independence
10 check-1-results           question-results    P1   counts
11 check-1-explain           question-explain    P1   reasoning
12 character-yasmine         character           P2   social
13 check-2-open              question-open       P2   social example
14 check-2-results           question-results    P2   results + next beat explanation
15 character-sami            character           P2   intrapreneur
16 check-3-open              question-open       P2   intrapreneur scenario
17 check-3-results           question-results    P2   class breakdown
18 p2-motives                compare             P2   why/how; distinguish axes
19 mini-recall-open          recall-open         P2   name 3 forms without prompts
20 mini-recall-results       recall-results      P2   aggregate only
21 character-ines            character           P3   repreneur
22 character-omar            character           P3   franchisé
23 check-4-open              question-open       P3   repreneur vs franchise
24 check-4-results           question-results    P3   show reasoning
25 legal-not-the-same        definition          P3   profile ≠ status juridique
26 jury-vote-open            question-open       P3   which campus idea would you back?
27 jury-vote-results         question-results    P3   distribution; no single universal winner
28 boss-recall-open          recall-open         P3   name ALL SIX, no prompts
29 boss-recall-results       recall-results      P3   summary, mastery per form, explanations
30 conclusion                conclusion          ALL  take-home summary + save account QR
```

Codex can refine to ~30 beats as long as there is **one monotonically indexed shared authoritative beat pointer** and the arrow-only flow stays coherent. Important: on the final recall input, students must **not see a list of the six labels** in their phone UI while answering.

### 5.3 Characters (fictional, with memorable phrases)

- **Lina, indépendante:** « Je prépare et vends moi-même des lunch boxes. » *Force:* autonomie. *Contrainte:* temps/capacité.
- **Adam, innovateur:** « Je développe une solution pour anticiper les commandes et éviter le gaspillage. » *Force:* différenciation. *Contrainte:* développement/adoption.
- **Yasmine, sociale:** « Mon activité facilite l'accès des étudiants en difficulté à des repas abordables. » *Force:* impact social. *Contrainte:* équilibre financier.
- **Sami, intrapreneur:** « Je propose un nouveau service dans l'entreprise qui m'emploie. » *Force:* ressources internes. *Contrainte:* validation hiérarchique.
- **Inès, repreneuse:** « Je reprends un café existant pour l'adapter aux étudiants. » *Force:* base établie. *Contrainte:* coût/acquis.
- **Omar, franchisé:** « J'exploite un restaurant sous une marque et un modèle déjà établis. » *Force:* savoir-faire et réseau. *Contrainte:* contrat/redevances.

### 5.4 Speaker prompts (short, visible in notes, not on projector)

P1 opening:

> « Bonjour ! Aujourd'hui, vous n'allez pas seulement écouter une présentation. Vous allez devenir le jury d'un concours entrepreneurial. Notre campus a un problème : comment offrir des repas sains, abordables et pratiques ? Six personnes proposent six manières d'entreprendre. À la fin, sans regarder les slides, vous devrez les reconnaître toutes. »

P1→P2:

> « Nous avons vu qu'on peut travailler à son compte ou innover. Mais entreprendre ne sert pas uniquement à gagner de l'argent. »

P2→P3:

> « Nous avons découvert qu'on peut entreprendre pour un impact social, ou même à l'intérieur d'une entreprise. Et si la meilleure voie consistait à ne pas partir de zéro ? »

P3 final handoff:

> « Vous connaissez maintenant six façons d'entreprendre. Place au dernier défi : pourriez-vous les citer sans aucune aide ? »

All presenters' conclusion:

> « On peut créer, innover, avoir un impact social, entreprendre dans une organisation, reprendre une activité, ou rejoindre un réseau. Ces voies peuvent se combiner. Le plus important, c'est de choisir une démarche adaptée à son projet. »


---

## 6. Technical architecture: actual implementation, not mockups

### 6.1 Recommended stack

- **Next.js App Router + TypeScript**, using the currently compatible stable versions supported by the project tooling. Prefer server components for public pages and small client components where keyboard handling / live interaction is necessary.
- **Tailwind CSS** and accessible, reusable UI components; a lightweight icon set is fine. Avoid a giant animation/UI dependency just for slide transitions.
- **Supabase Auth** (anonymous student auth, later identity linking; permanent presenter login).
- **Supabase Postgres** (canonical session state, submissions, question rounds, progress, accounts).
- **Supabase Realtime** (private per-session Broadcast updates; for a small prototype Postgres Changes may be used only with correct RLS). Always refetch canonical state after a reconnect.
- **Supabase SSR / recommended server auth client setup** for Next.js; use secure cookie/session management and disable cached cross-user responses.
- **Vercel** or similar HTTPS hosting, with Supabase hosted project. Production hosting domain and Supabase auth redirect URLs must agree.
- **Vitest + React Testing Library** for logic/component unit tests; **Playwright** for browser E2E including keyboard-only navigation and two-user interactions. A local test database or disposable Supabase project should be used for DB integration/security tests.

**Crucial Next.js + anonymous-auth caution:** authenticated/student pages must be dynamically rendered, not statically cached with another student's details. Validate sessions on the server, and explicitly use non-cacheable responses for private state.

Use version-compatible official docs for setup rather than blindly copying snippets from older tutorials. Add working links in `README.md`.

### 6.2 System topology

```text
                                  One project / one classroom

      HOST LAPTOP (projected)                          STUDENTS (phones)
  /host/session/{id}/stage                            /join/{code}, /s/{code}
  ArrowRight / ArrowLeft                               Answer / wait / results
               |                                                  |
               | HTTPS commands                                   | HTTPS submits
               +-------------------+------------------------------+
                                   |
                          NEXT.JS SERVER ROUTES
                       auth + validation + rate limits
                                   |
                              SUPABASE DB
             sessions | rounds | answers | progress | members
                                   |
                     PRIVATE REALTIME / BROADCAST
                 state-changed notifications, safe data only
                         /                      \
                       host                  students

                       STUDENT ACCOUNT: /me
                 progress + review + identity linking
```

### 6.3 Repository layout (suggested)

```text
src/
  app/
    page.tsx
    join/[code]/page.tsx
    s/[code]/page.tsx
    me/page.tsx
    host/page.tsx
    host/session/[id]/stage/page.tsx
    host/session/[id]/settings/page.tsx
    auth/callback/route.ts
    privacy/page.tsx
    api/
      sessions/route.ts
      sessions/[id]/state/route.ts
      sessions/[id]/advance/route.ts
      sessions/[id]/join/route.ts
      rounds/[id]/submit/route.ts
      rounds/[id]/results/route.ts
      me/progress/route.ts
  components/
    stage/StageShell.tsx
    stage/BeatRenderer.tsx
    stage/StageKeyboardController.tsx
    stage/StageStatusHUD.tsx
    stage/QuestionResults.tsx
    student/JoinForm.tsx
    student/QuestionCard.tsx
    student/WaitingRoom.tsx
    student/AccountUpgrade.tsx
    student/ProgressDashboard.tsx
  content/
    curriculum.fr.ts
    beats.fr.ts
    questions.fr.ts
  lib/
    deck/transition.ts
    deck/content.ts
    grading/normalize.ts
    grading/score.ts
    auth/role-checks.ts
    supabase/client.ts
    supabase/server.ts
    validations/schemas.ts
  types/
    domain.ts
supabase/
  migrations/         # CHECK IN all tables, indexes, functions and RLS
  seed.sql             # Sample room/content only in non-production contexts
  tests/               # RLS, state-machine, concurrency tests
playwright/
  stage-navigation.spec.ts
  multi-user-live.spec.ts
  refresh-recovery.spec.ts
.env.example
README.md
handoff.md
```

The frontend's **presentation content can be configured in TypeScript** for this single lesson. Student answer keys must live on the protected server/DB side and must not be included in bundles served to students. Avoid accidentally importing server-only content from client components.

---

## 7. Data model and security boundaries

### 7.1 Database tables (minimum)

| Table | Required fields / guarantees | Read / write rules |
|---|---|---|
| `profiles` | `id uuid PK = auth.users.id`, `display_name`, `created_at`, `updated_at` | Each user reads/edits **their own** profile. No public email. |
| `presenter_permissions` | `user_id`, `session_id`, `role` | Restricted to permanent hosts; only authorized presenters may advance. |
| `sessions` | `id uuid`, `join_code unique`, `title`, `host_id`, `status`, `current_beat_index`, `version`, `deck_version`, `started_at`, `ended_at`, timestamps | Students only see limited safe public room fields. Write state via authorized atomic server command. |
| `memberships` | `session_id`, `user_id`, `nickname`, `joined_at`, `last_seen_at`, `is_active`; unique `(session_id,user_id)` | Self row and sanitized host aggregates; no student list leak to everyone. |
| `questions` | `id`, `kind`, `prompt`, `public_options`, `form_slug?`, `learning_objective`, `revision` | Expose only safe prompt/options. No answer keys here if readable by students. |
| `private_answer_keys` | `question_id`, correct answer(s), accepted aliases, scoring rule, explanation visibility rule | **Private schema or server-only protected table**. Not accessible to students. |
| `rounds` | `id`, `session_id`, `question_id`, `beat_open_index`, `state (open/closed/revealed)`, opened/closed timestamps, unique `(session_id,beat_open_index)` | Students see active public round state only; only server/host changes state. |
| `submissions` | `id`, `round_id`, `session_id`, `user_id`, `payload`, `submitted_at`, `awarded_xp`, `is_correct?`; unique `(round_id,user_id)` | Own submissions; only sanitized aggregates are shared. No edits after closing. |
| `student_mastery` | `session_id`, `user_id`, `form_slug`, `recognition_count`, `recall_count`, `last_attempt`, `mastery_level` | Own row only, updated by trusted grader. |
| `xp_events` | `id`, `session_id`, `user_id`, `round_id`, `kind`, `amount`, `created_at`, unique event key | Immutable to students; prevents duplicate point awards. |
| `stage_events` | `id`, `session_id`, `from_beat`, `to_beat`, `actor_id`, `version`, `created_at` | Presenter audit log, write server-only. |

Use UUID foreign keys, database indexes on `rounds(session_id,state)`, `memberships(session_id)`, `submissions(round_id)`, and `student_mastery(user_id,session_id)`; cascade/delete carefully and consistently. Create SQL migrations in source control rather than expecting manual Supabase dashboard clicks for schema.

### 7.2 Session and round state machine

```text
SESSION: draft -> lobby -> live -> ended
                                  |
                                  +-- personal review remains available

ROUND: not_created -> open -> closed -> revealed
                        |          |          |
                        +----------+----------+-- no reverse mutation
```

- `sessions.current_beat_index` is the **visual location**, while each round's state tracks its irreversible real-world lifecycle. Going backwards changes visual location, not the round lifecycle.
- `advanceStage(sessionId, expectedVersion, direction)` must run atomically: verify presenter role, lock session row, validate version, clamp beat range, apply first-entry round side effects, increment version, commit, notify clients.
- When revisiting historical beats, render them in **replay mode**, never silently reopen a round or permit a second submission.
- A late joiner should immediately receive the **current** round state and, if open, be allowed to answer; if closed, show relevant waiting/results UI instead.
- Two rapid ArrowRight presses should not skip a slide due to event repeat or concurrency races. Serialize navigation requests from the stage client and implement expected-version checking server-side.
- Refresh/reconnect: GET the authoritative state. Broadcast is just a notification; **do not infer truth from missing/out-of-order websocket events**.

### 7.3 API contracts (illustrative; adjust naming consistently)

```ts
// POST /api/sessions/[id]/advance (presenter only)
type AdvanceRequest = { expectedVersion: number; direction: -1 | 1 };
type AdvanceResponse = {
  sessionId: string;
  currentBeatIndex: number;
  version: number;
  activeRound?: { id: string; state: 'open' | 'closed' | 'revealed' };
};
// 401 unauthenticated, 403 unauthorized, 409 stale version, 422 invalid transition.

// POST /api/sessions/[id]/join (authenticated student, including anonymous)
type JoinRequest = { nickname: string };
type JoinResponse = { sessionId: string; membershipId: string; currentBeatIndex: number };

// POST /api/rounds/[id]/submit (member only)
type SubmitRequest = { answer: unknown; clientRequestId: string };
type SubmitResponse = { stored: true; submittedAt: string; awardedXp?: number };
// Duplicate replay of same client request -> same result; other attempts -> conflict.

// GET /api/sessions/[id]/state: authorized, role-shaped safe state
// GET /api/rounds/[id]/results: after reveal, sanitized aggregates, no personal records
// GET /api/me/progress: current user's own immutable learning record
```

Use **Zod** or equivalent runtime validation for every request body and params. Check the current authenticated user **on every server request**; don't trust a role, session, nickname, or room identifier passed by the browser. Sign-in does not make someone a host.

### 7.4 Row Level Security and secrets

- Enable RLS on **every user-data table**; no catch-all `USING (true)` policy on submissions, membership or profiles.
- Supabase anonymous **signed-in users use the `authenticated` DB role**, not the public anon role. Use `auth.uid()` for ownership; distinguish recoverable host users from anonymous users when enforcing host permissions (official docs: `auth.jwt()->>'is_anonymous'`).
- Limit session content via membership / host authorization, and validate that a target question actually belongs to the current session's active round.
- Do **not** expose Supabase service-role/secret keys in `NEXT_PUBLIC_*`, client bundles, logs or error payloads. Sensitive operations should be handled in server code with carefully scoped privileges or audited SECURITY DEFINER functions.
- If using `SECURITY DEFINER`, lock down `search_path`, permissions/grants and input validation; do not leave broad execution rights. Test cross-user access directly.
- For Realtime, use **private session channels** with authorization. Broadcast only minimal changed IDs/version/status and sanitised aggregates, no answers or email.
- Rate limit join, submit and session-creation endpoints (reasonable classroom bursts allowed). Prefer platform-supported or shared durable limits rather than in-memory per-process counters in serverless production.
- Provide a server-side allowlist/check for presenters; **a student cannot promote themselves to a host** by changing local state or calling an endpoint.
- Protect against script injection in nicknames, XSS in free text, and accidental SQL injection. Render student content as plain escaped text, never arbitrary HTML.
- Track minimal data: nickname, user ID, educational answers. Public screens show aggregates and opt-in pseudonyms only. Don't collect birth dates, phone numbers, or student numbers.

### 7.5 Data retention and deletion

For MVP, document a configurable retention period (e.g. 90 days for classroom event logs), avoid collecting unnecessary personal data, and provide a clear account/data deletion path or request method. The student's progress should not be silently deleted while their account is active; distinguish *session event log retention* from *student progress retention*. Hosts can archive a session after teaching. Document the actual policy in `/privacy`; do not promise indefinite storage without implementing it.

---

## 8. Join flow, realtime behavior and account recovery

### 8.1 In-class join under 15 seconds as a target, not an untested promise

1. Welcome beat shows huge QR, short URL, human-readable join code, and live connected count.
2. On student phone: enter nickname; calling Supabase `signInAnonymously()` makes a real authenticated user if there is no existing session.
3. Join the room through the trusted server endpoint. Persist membership immediately and show **« Vous êtes prêt ! »**.
4. If already signed in, reuse the identity, preserving progression across visits in that browser.
5. When the round opens, phone changes from waiting screen to question; at submit, show loading until DB write confirmed.
6. When finished, show **« Sauvegarder mon compte »** with Google or verified-email upgrade.

An anonymous student cannot recover the same identity on another phone or after clearing auth state until a recoverable identity is linked. Don't present nickname or room code as a password.

**Linking, not replacing:** upgrade the **current anonymous user** via Supabase's supported identity-linking mechanism (`linkIdentity` for OAuth with manual linking enabled, or supported verified-email update flow). Ensure callback preserves the original user ID and therefore joins/answers/mastery. Handle provider conflict explicitly instead of silently creating a new user and losing saved progress.

### 8.2 Live synchronization

- Channels by room, e.g. private `room:{session-id}:live`.
- The DB is source of truth; Broadcast contains `{ sessionId, version, eventType }`, then clients refetch safe state as needed.
- On subscribe or reconnect, always fetch current room state. On visibility change (phone locked/unlocked), refetch.
- Use Supabase Presence only for an approximate online count. Persist memberships separately. Distinguish **participants who joined** from **currently connected** people.
- Fallback: if WebSocket unavailable, poll safe state at a moderate interval (say 3–5 seconds) while visible. Back off when hidden. Do not request students to refresh manually each question.
- Network interruption during answer submission: use idempotency key and clear pending/confirmed UI states. Never claim a response was stored if the server didn't confirm.
- Do not put unlimited or overly detailed per-answer events on the projected stage; fetch aggregated results when round closes.

---

## 9. Game mechanics designed for memory, not clicking

### 9.1 Question types

1. **Opening misconception vote** (ungraded): « Faut-il créer sa propre entreprise pour entreprendre ? » Results kick off the story; answer clarified by intrapreneurship.
2. **Recognition (MCQ)**: given a new situation, choose the most appropriate entrepreneurial approach; include a **why** explanation after reveal.
3. **Contrast**: « Qu'est-ce qui distingue la reprise de la franchise ? » A short comparison that recognizes possible overlap.
4. **Jury vote** (ungraded): choose a campus solution based on constraints; no universal winner.
5. **Boss Battle / final no-hints recall**: type all six labels from memory (six short fields or a tagged free-text field), then identify a novel example without labels shown.

### 9.2 Example seed questions (French)

| ID | Prompt | Correct / teaching point |
|---|---|---|
| `q_open` | « Faut-il obligatoirement créer sa propre entreprise pour entreprendre ? » | **Non**; intrapreneuriat can be entrepreneurial inside an existing firm. |
| `q_independent` | « Lina prépare et vend ses repas elle-même, à son compte. Quelle approche illustre-t-elle ? » | **Entrepreneur indépendant**. |
| `q_innovation` | « Adam crée un système original de précommande et d'anticipation des besoins. » | **Entrepreneur innovateur**. |
| `q_social` | « Yasmine donne la priorité à l'accès des étudiants défavorisés à un repas abordable avec un modèle viable. » | **Entrepreneur social**. |
| `q_intra` | « Sami développe un nouveau service dans la société où il travaille. » | **Intrapreneur**. |
| `q_takeover` | « Inès rachète un café pour le moderniser. » | **Entrepreneur repreneur**. |
| `q_franchise` | « Omar ouvre un établissement dans un réseau, sous une marque et un concept existants. » | **Entrepreneur franchisé**. |
| `q_contrast` | « Reprendre une activité et rejoindre une franchise, est-ce la même chose ? » | **Non**; different concepts that may overlap. |
| `q_end_recall` | « Sans regarder les slides, citez les SIX approches étudiées. » | All six, in any order; tolerate accents, minor typos and well-defined synonyms. |

Include extra **unseen transfer questions** not copied directly from character cards; otherwise a student could memorize fictional names without grasping the concepts. Vary answer ordering and avoid using the same pattern for the right option.

### 9.3 Scoring and mastery

Define two independent outcomes:

- **XP / engagement:** e.g. +10 for submitting an eligible practice answer, +20 bonus for a correct graded answer, once per round. Unnecessarily fast answers must not receive a bonus; don't reward random rapid tapping.
- **Mastery:** based on correctness across recognition and unaided recall; not merely XP. Suggested indicators per form: `not_seen` → `introduced` → `recognized` → `recalled`. Use the final no-hints test as a strong, but not sole, signal.

For open recall, normalize case, whitespace, hyphens and French diacritics. Accept explicit aliases (`social`, `entrepreneuriat social`, `intrapreneur`, `entrepreneur interne`, etc.) and only cautious small typo tolerance. **Never count an ambiguous word such as `créateur` as proof of a specific form.** Ensure the grading key is editable to match a professor-provided taxonomy. Record `recognized_forms` and `recalled_forms` for each student so review can target gaps.

**Visible outcome:** presenter can show anonymized class totals such as “26/31 answered; 18/31 recalled all six; hardest form: intrapreneur”. Students privately see which forms they missed and short explanations. Do not claim "100% mastered" unless results support it. If there are fewer than 3 respondents, consider suppressing exact distribution to prevent identifying individuals.

### 9.4 After-class reinforcement

`/me` should offer a 2-minute **Révision express** using two random scenarios and one no-hints recall attempt. Persist date, score and hardest topics. A scheduled reminder service is **not required** for MVP. Allow revisiting content without joining another live classroom.

---

## 10. Presentation beat rendering and keyboard implementation guide

### 10.1 Separate content from progression

All slides are authored declaratively in `content/beats.fr.ts`. A question beat references a `questionId`; it should not contain imperative logic like `openPoll()` in a React render function. On a beat transition, a server-side transaction applies the side effect **once**. The client simply renders the returned state.

Implementation advice:

```ts
// Conceptual only; use production code with proper typing and APIs.
function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(
    target.closest('input, textarea, select, [contenteditable="true"], [role="dialog"]')
  );
}

function onStageKeyDown(event: KeyboardEvent) {
  if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
  if (isTypingTarget(event.target)) return;

  if (event.key === 'ArrowRight') {
    event.preventDefault();
    requestSerializedMove(+1); // Server-authorized, expected-version guarded.
  } else if (event.key === 'ArrowLeft') {
    event.preventDefault();
    requestSerializedMove(-1);
  }
}
```

Avoid adding listeners every render. Disable repeated commands while a request is pending, but queue or acknowledge intent clearly if needed. A clicker that sends right/left must work identically. A one-click **Start presentation** may be used to enter fullscreen; browsers may deny programmatic fullscreen without user interaction.

### 10.2 Projector-specific usability tests

- On 1366×768 projector, all text is visible without scroll or clipping.
- Walk 30 beats forward using **Right Arrow only**, including opening and closing four questions and the final recall.
- Walk backward across a previously completed round, and forward again: student submissions and scores remain unchanged.
- Refresh stage mid-quiz; the correct beat and active round remain.
- Disconnect host for 10 seconds, reconnect, see authoritative state and resume without creating duplicate rounds.
- Press Right Arrow twice quickly; no double skip and no duplicate XP.
- Press arrows with an input focused on settings: caret moves normally, stage does not navigate.
- Clicker arrows work; `F` enters fullscreen with an explicit browser permission fallback.
- View projected presentation from the back of the room; content legible and QR code easy to scan.

### 10.3 Presenter failsafes

Add a discreet shortcut help panel (`?`) and an out-of-band settings overlay reachable by mouse. For a dead network, a clearly marked **Offline presentation fallback** should keep the static story/characters playable with arrows, but **never impersonate student votes or pretend offline responses were saved**. Print a brief one-page rehearsal cheat sheet in `docs/presenter-cheatsheet.md`.

---

## 11. UI acceptance criteria and accessibility

### 11.1 Stage

- [ ] Visual title, speaker role cue, room participation count, network indicator and compact beat progress.
- [ ] Most transitions and all critical class interactions are driven by arrow keys.
- [ ] Poll open and results are distinct beats; answer key not revealed early.
- [ ] QR is large and includes readable join URL/code beneath it.
- [ ] Motion is restrained; does not delay right-arrow transitions for more than a brief effect.
- [ ] No layout shift from live counters or results while speaking.
- [ ] Optional presenter notes **hidden** on projected view by default.
- [ ] No personal email/name or individual identifiable answer displayed on projector.

### 11.2 Student mobile

- [ ] Joining requires no password or email; user can keep browsing on their phone normally.
- [ ] Touch targets >= 44 CSS px, legible on 320px-wide screens.
- [ ] Respect browser back/foreground and resume ongoing round.
- [ ] Student sees unambiguous pending / saved / closed / results states.
- [ ] Screen reader labels, form errors and polite status announcements.
- [ ] Keyboard accessible also on desktop; high contrast and reduced-motion compliance.
- [ ] Persistent account option explained accurately and easily reachable from `/me`.

### 11.3 Presenter host setup

- [ ] Presenter login cannot be spoofed from a student account.
- [ ] Can create and resume a live room, share URL, see preflight status.
- [ ] Can switch to offline fallback without falsifying saved answers.
- [ ] Can finish/archive room and keep authorized progress review available.

---

## 12. Test strategy: prove it works with multiple real browsers

Implement meaningful automated tests, not shallow snapshots only.

**Unit tests**

- Beat index progression and clamping at first/last beat.
- Backward replay never alters irreversible round states.
- Each first-time `question-open` creates exactly one round.
- Accent/case normalization and synonym-aware final recall scoring.
- XP awarded once, repeated submissions never double-score.
- Role-shaped DTO serialization never exposes protected answer keys.

**Integration / database security tests**

- Student A cannot read Student B's profile, submission or mastery row.
- Student cannot call host advancement endpoint even with guessed session IDs.
- Student cannot fetch answer keys before reveal (including direct Supabase REST calls).
- Nonmember cannot subscribe to another room's private Realtime channel.
- Two competing advance requests with same version result in **one** accepted transition.
- Two concurrent answer requests from same user/round result in **one** submission.
- Existing anonymous user can link identity while preserving progress, or conflicts produce a safe explanation.

**E2E / rehearsal script (mandatory)**

1. Create host using a permanent sign-in and create room.
2. Open projector browser; start presentation.
3. Open phone A in an incognito profile; join as `LinaFan` anonymously.
4. Open phone B in a distinct profile; join as `CampusChef` anonymously.
5. On projector press only `→` until first vote opens; phones show current vote.
6. Submit different choices. Confirm both receive **saved** feedback.
7. Press `→` to results; projected counts total 2, each phone sees the correct explanation.
8. Press `←` then `→`; counts remain 2, no duplicate round or XP.
9. Reload all browsers; identities, room pointer and answers are retained.
10. Complete final free recall, check independent mastery results, link one student's permanent account.
11. Open `/me` for linked student from another signed-in device and confirm progress is visible.
12. Verify unauthorized users can't read individual responses or send stage actions.

**Pre-class load rehearsal:** Test at least 30–60 simulated users joining in a short window and completing the same poll; verify no dropped saves and acceptable perceived response time. Document hardware/network assumptions. Don't invent a performance guarantee.

---

## 13. Delivery plan for Codex (vertical slices)

### Milestone 1 — Standalone keyboard-first slide deck

- Scaffold Next.js and polished responsive visual system.
- Implement all 12 slides as ~30 beats with French content, fictional characters and a standalone **stage**.
- Implement `ArrowRight`/`ArrowLeft`, `F`, `?`, progress, presenter cues, fullscreen behavior.
- **Demo Mode:** scripted fake class data, clearly labeled `DÉMO`, no claims of live persistence.
- Smoke test whole deck and take screenshots at 1920×1080 and 1366×768.

**Exit:** a complete, visually engaging presentation works locally via arrow keys even with no backend.

### Milestone 2 — Real rooms, student join and saved answers

- Supabase schema migrations, auth configuration, access policies, server auth helpers.
- Permanent host auth + host permission setup.
- Anonymous student join, membership, QR code, student waiting state.
- Submission endpoint with uniqueness, persistence and safe confirmation.
- Implement essential host and student security tests.

**Exit:** two browsers join and submit to a real DB; refresh does not lose identity or responses.

### Milestone 3 — Authoritative live presentation

- Build atomic host beat progression and irreversible question-round state machine.
- Add authorized private Realtime updates and reconnect snapshots.
- Wire open/close/results, class participation counters, private per-student feedback.
- Test arrows with two simulated students and simultaneous commands.

**Exit:** right-arrow actions drive both projector and student phones; back-navigation is harmless.

### Milestone 4 — Memorization and account preservation

- XP, mastery, final six-form no-hints recall, progress dashboard, quick review.
- Link anonymous accounts to verified email or Google while preserving account ID.
- Privacy/retention statement and deletion mechanism.
- Add regression/security and complete rehearsal E2E tests.

**Exit:** student can return later and see saved results; host sees truthful anonymized class mastery.

### Milestone 5 — Deployment and dress rehearsal

- `.env.example`, README setup guide, Supabase dashboard settings, migrations and seed.
- Deploy over HTTPS; configure OAuth redirect/callback URLs correctly.
- Run format/lint/typecheck/tests/build and fix errors.
- Document unsupported features, risks, exact live-room setup steps and fallback procedure.
- On the actual classroom laptop, test arrow keys, clicker, fullscreen, QR scanning and Wi-Fi.

**Exit:** one host, at least two phones, complete live session, refresh/rejoin and final recall work on deployed site.

---

## 14. Environment, setup and definition of done

### 14.1 Example environment template (names may be adapted)

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Server only if genuinely needed. NEVER NEXT_PUBLIC_*. Never commit real keys.
SUPABASE_SERVICE_ROLE_KEY=

# Shared durable rate limiting, optional provider-specific settings:
RATE_LIMIT_REDIS_URL=
RATE_LIMIT_REDIS_TOKEN=
```

Avoid requiring Redis to run the local MVP. If no hosted rate limiting is available, implement a reasonable first-step safeguard and document its production limitations. Do not confuse Supabase's safe public/publishable key with its secret or service-role key.

### 14.2 `README.md` must include

1. Requirements (Node/npm, Supabase project, browser and device assumptions).
2. Install and local start instructions, copy `.env.example` to `.env.local`.
3. How to enable anonymous auth and permanent presenter auth, Google linking if configured.
4. How to apply migrations and safely seed content without touching production data.
5. How to provision initial presenter permission (**not by an unauthenticated signup toggle**).
6. How to create a live session, scan QR and rehearse on two mobile devices.
7. Fullscreen and keyboard controls with a printable cheat sheet.
8. How to run lint, typecheck, unit, integration and Playwright tests.
9. Deploy steps and auth redirect URLs.
10. Security, retention, account recovery and offline-mode limitations.

### 14.3 Final production demo acceptance checklist

- [ ] **Keyboard-first:** >80% of normal presenter interactions, including question opening/closing and showing results, use Left/Right only.
- [ ] **Actual live session:** projector drives multiple phones in real time.
- [ ] **Saved participation:** an answer remains stored after refresh or a temporary disconnect.
- [ ] **Actual accounts:** new students join in seconds; account linking preserves existing results.
- [ ] **Accurate learning:** six forms + nuances taught; final closed-notes recall works.
- [ ] **Security:** authorized presenter controls only; no answer-key/student data leaks; RLS tested.
- [ ] **Resilience:** duplicate arrow/submission handling; clear offline/online behavior.
- [ ] **Usability:** fully responsive student UI; projector text legible from the room.
- [ ] **Honest reporting:** demo fixtures never passed off as live results or production data.
- [ ] **Works after build:** lint, typecheck, test and build all pass; README is reproducible.

---

## 15. Copy/paste first prompt for Codex in VS Code

> Read the root `handoff.md` fully and treat it as the product requirements document. First inspect the current repository and identify what exists. Then implement **Milestone 1**: a polished, French-language, 12-slide / ~30-beat keyboard-first projected presentation for Entreprendre.Lab. Use Next.js App Router + TypeScript + Tailwind unless the existing repo already has a compatible stack. The stage must use `ArrowRight` to progress through every narrative reveal, question-open, question-results and explanation beat, `ArrowLeft` to go backward without destructive side effects, `F` for fullscreen, and `?` for controls. Include presenter labels P1/P2/P3 and the six correctly nuanced educational profiles. If no Supabase credentials exist, implement an explicitly marked demo mode and a backend interface that can be connected later—**do not falsely claim live persistence**. Write tests for beat transitions and arrow keyboard handling. Run checks and report files changed, commands run, what works, and what remains. When Milestone 1 passes, propose or proceed with Milestone 2 from this same file in small verified slices.

**Then follow-up prompt:**

> Continue the implementation according to `handoff.md`, beginning with the next incomplete milestone. Implement real Supabase authentication, schema migrations, RLS, server-authoritative presenter progression and saved student submissions. Keep the stage keyboard-first and ensure all data paths have tests. Do not call a feature "working" until it has been exercised in separate browser sessions and after refresh. Clearly state any required human configuration in Supabase/Vercel instead of inventing credentials.

---

## 16. Official technical references (verify current API versions when coding)

- Supabase anonymous sign-in / upgrade: https://supabase.com/docs/guides/auth/auth-anonymous
- Supabase private Realtime Broadcast: https://supabase.com/docs/guides/realtime/subscribing-to-database-changes
- Supabase Realtime concepts: https://supabase.com/docs/guides/realtime
- Next.js App Router route handlers: https://nextjs.org/docs/app/api-reference/file-conventions/route
- Supabase row-level security: https://supabase.com/docs/guides/database/postgres/row-level-security

**End of specification. The true priority order is:** classroom learning outcome → effortless arrow-driven stage → reliable student join + preserved data → security → aesthetic refinement. Do not sacrifice the first four for animation or surface polish.
