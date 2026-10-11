"use client";
import { online, connectionHint } from "@/lib/environment";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { ArrowRight, ArrowUpRight, Check, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Copy, Flag, HelpCircle, Layers3, Maximize, MessageCircle, Pause, Play, RotateCcw, Smartphone, Sparkles, Trophy, Users, WifiOff, X, Zap } from "lucide-react";
import { api, Brand, DemoBadge, Modal } from "@/components/common";
import { Lobby } from "@/components/lobby";
import { LeaderboardBeat } from "@/components/leaderboard";
import { StoryBeat, ClosingBeat } from "@/components/story";
import { beats } from "@/content/beats.fr";
import { characters, chapters } from "@/content/curriculum.fr";
import { questions } from "@/content/questions.fr";
import { stageKey } from "@/lib/keyboard";
import { browserId } from "@/lib/browser-id";
import type { Question, RoomState, SafeRound } from "@/types/domain";

const shapes = ["▲", "◆", "●", "■"];
const colors = ["coral", "blue", "yellow", "mint"];
function formatTime(seconds: number) { return `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`; }

export function Stage({ code }: { code: string }) {
  const [controller] = useState(browserId);
  const [expired, setExpired] = useState(false);
  const expiredRef = useRef(false);
  const [state, setState] = useState<RoomState | null>(null);
  const [error, setError] = useState(""), [notice, setNotice] = useState("");
  const [connected, setConnected] = useState(true), [fallbackIndex, setFallbackIndex] = useState<number | null>(null);
  const fail = useCallback((e: unknown) => { const error = e as Error & { code?: string }; if (error.code === "ROOM_EXPIRED") { expiredRef.current = true; setExpired(true); } setConnected(false); setError(error.message); }, []);
  const [modal, setModal] = useState<"help" | "chapters" | "join" | "notes" | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<number | null>(null);
  const [busy, setBusy] = useState(false), [early, setEarly] = useState(false);
  const [clock, setClock] = useState(0), [paused, setPaused] = useState(false), [now, setNow] = useState(0);
  const [origin, setOrigin] = useState("");
  const pending = useRef(false), stateRef = useRef<RoomState | null>(null), moveAt = useRef(0), earlyRef = useRef(false);
  const currentIndex = fallbackIndex ?? state?.index ?? 0;
  const beat = beats[currentIndex];
  const ranking = fallbackIndex === null && !!state?.leaderboardVisible;
  const recallOpen = beat.kind === "recall-open";
  const question = beat.questionId ? questions[beat.questionId] : undefined;
  const round = fallbackIndex === null ? state?.round : undefined;
  const joinUrl = `${origin}/join/${code}`;

  const applyState = useCallback((value: RoomState) => {
    if (expiredRef.current) return;
    if (value.role !== "host") throw new Error("Cette page est réservée au présentateur qui a créé la salle.");
    if (!stateRef.current || value.version >= stateRef.current.version) { stateRef.current = value; setState(value); }
    setConnected(true); setError("");
  }, []);
  const sync = useCallback(async () => {
    if (expiredRef.current) return;
    try { const value = await api<RoomState>(code, { action: "sync", controller }); applyState(value); }
    catch (e) { fail(e); }
  }, [code, controller, applyState, fail]);
  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => { if (active) { const configured = process.env.NEXT_PUBLIC_APP_URL; setOrigin(!online && configured && !configured.includes("localhost") ? configured.replace(/\/$/, "") : window.location.origin); } });
    void Promise.resolve().then(sync);
    const timer = window.setInterval(() => { if (!pending.current) void sync(); }, 2000);
    function release() { if (expiredRef.current) return; navigator.sendBeacon(`/api/rooms/${code}`, new Blob([JSON.stringify({ action: "release", controller })], { type: "application/json" })); }
    window.addEventListener("pagehide", release);
    return () => { active = false; clearInterval(timer); window.removeEventListener("pagehide", release); };
  }, [code, controller, sync]);
  useEffect(() => {
    const timer = window.setInterval(() => { setNow(Date.now()); if (stateRef.current && Date.now() >= stateRef.current.expiresAt) { expiredRef.current = true; setExpired(true); } if (!paused) setClock(c => c + 1); }, 1000);
    return () => clearInterval(timer);
  }, [paused]);
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(""), 5000); return () => clearTimeout(timer); }, [notice]);

  const navigate = useCallback(async (direction: -1 | 1, target?: number) => {
    if (expiredRef.current) return;
    if (fallbackIndex !== null) { setFallbackIndex(i => Math.max(0, Math.min(beats.length - 1, target ?? (i ?? 0) + direction))); return; }
    const value = stateRef.current;
    if (!value || pending.current || !value.canControl || Date.now() - moveAt.current < 220) return;
    pending.current = true; moveAt.current = Date.now(); setBusy(true);
    try {
      const next = await api<RoomState>(code, { action: "move", controller, version: value.version, direction, force: earlyRef.current, ...(target !== undefined ? { target } : {}) });
      applyState(next); earlyRef.current = false; setEarly(false); setConfirmTarget(null);
    } catch (e) {
      const failure = e as Error & { code?: string };
      if (failure.code === "ROOM_EXPIRED") fail(failure);
      if (failure.code === "EARLY_CLOSE") { earlyRef.current = true; setEarly(true); }
      else { setNotice(failure.message); if (failure.code === "STALE") void sync(); }
    } finally { pending.current = false; setBusy(false); }
  }, [code, controller, fallbackIndex, applyState, sync, fail]);
  const fullscreen = useCallback(async () => {
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); }
    catch { setNotice("Le navigateur a refusé le plein écran. Utilisez son menu ou la touche F11."); }
  }, []);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") { setModal(null); setConfirmTarget(null); earlyRef.current = false; setEarly(false); return; }
      const target = event.target as HTMLElement | null;
      if (target?.closest("video, [data-video-controls]")) return;
      if (event.key === " " && target?.closest("button, a[href]")) return;
      const typing = !!target?.closest("input, textarea, select, [contenteditable]:not([contenteditable='false']), dialog, [role='dialog']");
      if (modal || confirmTarget !== null) return;
      const action = stageKey(event, typing);
      if (!action) return;
      event.preventDefault();
      if (action === "next") void navigate(1);
      if (action === "previous") { earlyRef.current = false; setEarly(false); void navigate(-1); }
      if (action === "f") void fullscreen();
      if (action === "?") setModal("help");
      if (action === "p") setPaused(p => !p);
      if (action === "r") { setFallbackIndex(null); void sync(); }
      if (action === "home") setConfirmTarget(0);
      if (action === "end") setConfirmTarget(beats.length - 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate, fullscreen, sync, modal, confirmTarget]);

  async function copyLink() { try { await navigator.clipboard.writeText(joinUrl); setNotice("Lien copié."); } catch { setNotice("Copiez le lien affiché sous le QR code."); } }

  if (expired) return <main className="loading-screen"><Brand /><h1>Cette salle a expiré.</h1><p>Une salle dure quatre heures. Créez une nouvelle salle pour continuer.</p><Link className="button primary" href="/">Retour à l’accueil</Link></main>;
  if (!state) return <main className="loading-screen"><Brand /><div className="loading-mark">✳</div><h1>{error ? "La salle n’est pas accessible." : "On prépare les histoires…"}</h1><p>{error || "Votre présentation arrive."}</p><div className="hero-actions"><button className="button primary" onClick={() => void sync()}>Réessayer <RotateCcw size={17} /></button><Link className="button secondary" href="/">Accueil</Link></div></main>;

  return <main className={`stage-shell ${beat.kind === "recall-open" ? "recall-stage" : ""}`}>
    <header className="stage-header"><Brand /><div className="stage-header-center"><span className="session-pill"><Smartphone size={15} />Salle {code}</span><DemoBadge /></div><div className="stage-status"><span className="participant-count"><Users size={16} />{state.participants} <span>participant{state.participants !== 1 ? "s" : ""}</span></span><span className={`connection-dot ${connected ? "" : "lost"}`} title={connected ? "Serveur connecté" : "Connexion interrompue"} aria-label={connected ? "Serveur connecté" : "Déconnecté"} /></div></header>
    {(!connected || fallbackIndex !== null || !state.canControl) && <div className="stage-alert" role="status">{fallbackIndex !== null ? <><WifiOff size={17} /> Diapositives hors ligne · votes et sauvegarde suspendus.<button onClick={() => { setFallbackIndex(null); void sync(); }}>Revenir au serveur</button></> : !connected ? <><WifiOff size={17} /> {error}<button onClick={() => setFallbackIndex(state.index)}>Continuer hors ligne</button></> : <>Un autre onglet pilote cette salle. Lecture seule jusqu’à sa fermeture (8 s maximum).</>}</div>}
    <section className={`stage-canvas canvas-${beat.kind}`} data-beat={ranking ? `${beat.questionId}-leaderboard` : beat.id} aria-label={`Chapitre ${beat.chapter} : ${beat.title}`}>
      <div className="beat-motion" key={ranking ? `${beat.id}-ranking` : beat.id}>
        {ranking ? <LeaderboardBeat board={state.leaderboard} questionId={beat.questionId!} /> : <>
        {beat.kind === "title" && <Lobby code={code} url={joinUrl} names={fallbackIndex === null ? state.lobbyParticipants ?? [] : []} count={state.participants} copy={copyLink} start={() => void navigate(1)} disabled={busy || !connected || !state.canControl || fallbackIndex !== null} />}
        {["teaser", "story", "reveal"].includes(beat.kind) && <StoryBeat beat={beat} />}
        {beat.kind === "conclusion" && <ClosingBeat />}
        {question && beat.kind === "question-open" && <QuestionBeat key={question.id} question={question} state={state} round={round} now={now} />}
        {question && beat.kind === "recall-open" && <RecallBeat key={question.id} question={question} state={state} round={round} now={now} />}
        {question && ["question-results", "question-explain", "recall-results"].includes(beat.kind) && (fallbackIndex !== null ? <div className="empty-results"><WifiOff size={46} /><h1>Les résultats sont sur le serveur.</h1><p>Reconnectez-vous pour les retrouver. Aucune réponse n’est enregistrée hors ligne.</p></div> : <ResultsBeat question={question} state={state} round={round} />)}
        </>}
      </div>
    </section>
    <footer className="stage-footer"><div className="stage-footer-left"><button className="icon-button" title="Les chapitres" aria-label="Les chapitres" onClick={() => setModal("chapters")} disabled={recallOpen}><Layers3 size={19} /></button><span className="chapter-number">{String(beat.chapter).padStart(2, "0")} <span>/ {chapters.length}</span></span><span className="chapter-name">{recallOpen ? "À vous de retrouver" : chapters[beat.chapter - 1]}</span></div><div className="chapter-progress" aria-label={`Chapitre ${beat.chapter} sur ${chapters.length}`}>{chapters.map((_, i) => <span key={i} className={i + 1 < beat.chapter ? "done" : i + 1 === beat.chapter ? "current" : ""} />)}</div><div className="stage-footer-right"><button className="clock-button" onClick={() => setPaused(p => !p)} title={paused ? "Reprendre le chrono" : "Mettre le chrono en pause"}>{paused ? <Play size={13} /> : <Pause size={13} />} {formatTime(clock)}</button><button className="icon-button quiet-control" aria-label="Aide et raccourcis" onClick={() => setModal("help")}><HelpCircle size={18} /></button><button className="icon-button quiet-control" aria-label="Plein écran" onClick={() => void fullscreen()}><Maximize size={18} /></button><div className="navigation-buttons"><button aria-label="Étape précédente" disabled={currentIndex === 0 || busy || (!state.canControl && fallbackIndex === null)} onClick={() => { earlyRef.current = false; setEarly(false); void navigate(-1); }}><ChevronLeft size={23} /></button><button aria-label="Étape suivante" disabled={currentIndex === beats.length - 1 || busy || (!state.canControl && fallbackIndex === null)} onClick={() => void navigate(1)}><ChevronRight size={23} /></button></div></div></footer>
    <div className="beat-counter">{currentIndex + 1} / {beats.length} étapes <span>·</span> ← → pour avancer</div>
    {early && <div className="toast early-toast" role="status"><Clock3 size={19} /><span>Moins de 10 secondes. <strong>Encore → pour fermer</strong>, ou laissez réfléchir.</span><button aria-label="Annuler la fermeture" onClick={() => { earlyRef.current = false; setEarly(false); }}><X size={17} /></button></div>}
    {notice && <div className="toast" role="status">{notice}</div>}
    {modal === "help" && <Modal title="La scène se pilote au clavier." close={() => setModal(null)}><div className="shortcut-grid"><kbd>← →</kbd><span>Étape précédente / suivante</span><kbd>Espace</kbd><span>Étape suivante</span><kbd>F</kbd><span>Plein écran</span><kbd>P</kbd><span>Pause / reprise du chronomètre</span><kbd>R</kbd><span>Retrouver l’état du serveur</span><kbd>?</kbd><span>Ouvrir cette aide</span><kbd>Échap</kbd><span>Fermer les fenêtres</span></div><p className="note-box">Les choix et votes se ferment après 20 secondes ; les rappels écrits après 2 minutes. P met uniquement le chronomètre général en pause. Les flèches ne modifient jamais une réponse déjà enregistrée.</p><div className="modal-actions"><button className="button secondary" disabled={recallOpen} onClick={() => setModal("notes")}>Notes du présentateur</button>{state.mode === "phones" && <button className="button secondary" onClick={() => setModal("join")}>Afficher le QR code</button>}<Link className="text-button" href="/">Retour à l’accueil <ArrowUpRight size={15} /></Link></div></Modal>}
    {modal === "chapters" && <Modal title="Le parcours de la séance." close={() => setModal(null)}><p>Changer de chapitre ne valide ni question ni apprentissage.</p><div className="chapter-menu">{chapters.map((title, i) => <button key={title} onClick={() => { setModal(null); setConfirmTarget(beats.findIndex(b => b.chapter === i + 1)); }}><span>{String(i + 1).padStart(2, "0")}</span>{title}<ArrowUpRight size={15} /></button>)}</div></Modal>}
    {modal === "notes" && <Modal title="Notes du présentateur" close={() => setModal(null)}><p className="note-box">Attention : ces notes sont visibles sur l’écran projeté tant que cette fenêtre reste ouverte.</p><p className="presenter-notes">{fallbackIndex === null ? state.presenterNote : "Les notes sont disponibles avec le serveur."}</p></Modal>}
    {modal === "join" && <Modal title="Rejoignez la partie." close={() => setModal(null)}><JoinPanel url={joinUrl} code={code} participants={state.participants} copy={copyLink} /><p className="muted">{connectionHint}</p></Modal>}
    {confirmTarget !== null && <Modal title="Changer d’étape ?" close={() => setConfirmTarget(null)}><p>Aller au chapitre {beats[confirmTarget].chapter} : {beats[confirmTarget].title} Les questions sautées ne seront pas jouées.</p><div className="modal-actions"><button className="button secondary" onClick={() => setConfirmTarget(null)}>Annuler</button><button className="button primary" onClick={() => { const target = confirmTarget; setConfirmTarget(null); void navigate(1, target); }}>Aller à cette étape <ArrowRight size={17} /></button></div></Modal>}
  </main>;
}

function JoinPanel({ url, code, participants, copy }: { url: string; code: string; participants: number; copy: () => void }) {
  return <div className="join-panel"><div className="join-qr">{url.startsWith("http") ? <QRCodeSVG value={url} size={148} marginSize={1} fgColor="#172d41" bgColor="#ffffff" /> : <Smartphone size={80} />}</div><div><span className="mini-label">SCANNEZ. REJOIGNEZ. JOUEZ.</span><strong className="join-code">{code}</strong><button className="copy-link" onClick={copy}><span>{url.replace(/^https?:\/\//, "")}</span><Copy size={14} /></button><span className="join-count"><span className="connection-dot" />{participants} dans la salle</span></div></div>;
}
function Timer({ question, round, now }: { question: Question; round?: SafeRound; now: number }) {
  const elapsed = round && now ? Math.max(0, Math.floor((now - round.openedAt) / 1000)) : 0;
  const remaining = Math.max(0, question.seconds - elapsed);
  return <div className={`question-timer ${remaining === 0 ? "overtime" : ""}`}><Clock3 size={19} /><strong>{formatTime(remaining)}</strong><span>{remaining === 0 ? "Temps écoulé" : "pour répondre"}</span></div>;
}
function QuestionBeat({ question, state, round, now }: { question: Question; state: RoomState; round?: SafeRound; now: number }) {
  return <div className="question-layout"><div className="question-topline"><p className="eyebrow"><Zap size={17} /> {question.tag}</p><Timer question={question} round={round} now={now} /></div><div className="question-heading"><h1>{question.title}</h1><span className="question-kind">{question.kind === "vote" ? "Vote · sans bonne note" : "Un seul choix"}</span></div><p className="question-scenario">{question.scenario}</p><div className="question-prompt"><strong>{question.prompt}</strong></div><div className="answer-grid">{question.options.map((option, i) => <div key={option} className={`answer-tile tone-${colors[i]}`}><span className="answer-shape">{shapes[i]}</span><span>{option}</span></div>)}</div><div className="question-bottom"><span className="discussion-tip"><MessageCircle size={17} />Touchez une réponse sur votre téléphone.</span>{round?.state === "revealed" && <span className="saved-pill">Relecture · question déjà fermée</span>}<span className="response-count"><Smartphone size={17} />{round?.count ?? 0} / {state.participants} réponses</span></div></div>;
}
function RecallBeat({ question, state, round, now }: { question: Question; state: RoomState; round?: SafeRound; now: number }) {
  return <div className="recall-layout"><div className="question-topline"><p className="eyebrow"><Trophy size={19} />{question.tag}</p><Timer question={question} round={round} now={now} /></div><div className="recall-content"><div className="recall-icon"><span>{question.recallCount}</span><Sparkles /></div><h1>{question.title}</h1><p>{question.scenario}</p><div className="recall-slots" aria-hidden="true">{Array.from({ length: question.recallCount! }, (_, i) => <span key={i}>{String(i + 1).padStart(2, "0")}<i /></span>)}</div><span className="recall-instruction">À vous de répondre sur votre téléphone.</span><span className="response-count">{round?.count ?? 0} / {state.participants} réponses</span></div></div>;
}
function ResultsBeat({ question, state, round }: { question: Question; state: RoomState; round?: SafeRound }) {
  const revealed = round?.state === "revealed";
  if (!revealed) return <div className="empty-results"><Flag size={46} /><h1>Cette manche n’a pas été jouée.</h1><p>Les étapes sautées ne créent ni réponses ni points.</p></div>;
  const feedback = round.submission?.feedback;
  const noVotes = round.count === 0;
  return <div className={`results-layout ${question.kind === "recall" ? "recall-results" : ""}`}><div className="question-topline"><p className="eyebrow"><Flag size={17} />{question.kind === "recall" ? "LE RAPPEL · SANS CONFONDRE AVEC LES POINTS" : "ON FAIT LE POINT"}</p><span className="closed-pill"><CheckCircle2 size={15} /> Réponses fermées</span></div><h1>{question.kind === "recall" ? "Ce qui reste en mémoire." : question.kind === "vote" ? "À vous de défendre votre choix." : "La réponse et son explication."}</h1><div className="results-body"><div className="results-chart">{question.kind === "recall" ? <><div className="recall-result-heading"><strong>{round.averageRecall !== undefined ? round.averageRecall.toFixed(1).replace(".", ",") : "—"}<small> / {question.recallCount}</small></strong><span>{"formes rappelées en moyenne"}</span></div><div className="recalled-chips">{characters.filter(c => question.forms.includes(c.id)).map(c => <span key={c.id} className={feedback?.recalled.includes(c.id) ? "found" : ""}>{feedback?.recalled.includes(c.id) && <Check size={14} />}{c.short}</span>)}</div>{state.mode === "phones" && round.allRecalled !== undefined && <p>{round.allRecalled} / {round.count} ont retrouvé les {question.recallCount} formes.</p>}</> : question.options.map((option, i) => <div className={`result-row ${round.correctChoice === i ? "correct" : ""}`} key={option}><span className={`result-symbol tone-${colors[i]}`}>{shapes[i]}</span><div className="result-label"><span>{option}</span>{round.counts && <div className="result-track"><i style={{ width: `${round.count ? (round.counts[i] / round.count) * 100 : 0}%` }} /></div>}</div><span className="result-percentage">{round.correctChoice === i ? <CheckCircle2 size={22} /> : null}{round.counts && state.mode === "phones" ? `${round.count ? Math.round(round.counts[i] / round.count * 100) : 0} %` : ""}</span></div>)}<p className="results-privacy">{noVotes ? "Aucune réponse enregistrée. Discussion et correction uniquement." : round.count < 3 ? `${round.count} réponse(s). Répartition masquée en dessous de 3 participants.` : `${round.count} / ${state.participants} réponses · résultats anonymes`}</p></div><aside className="explanation-card"><span className="mini-label"><Sparkles size={15} /> LE DÉCLIC</span><h2>{round.takeaway}</h2><p>{round.explanation}</p>{question.reasons && round.correctReason !== undefined && <div className="correct-reason"><Check size={16} /><span>{question.reasons[round.correctReason]}</span></div>}{feedback && <div className={`feedback-pill ${feedback.correct === false ? "retry" : ""}`}>{feedback.correct === true ? "Bonne réponse : bien joué !" : feedback.choiceCorrect && !feedback.reasonCorrect ? "Bon choix. La justification reste à retravailler." : feedback.correct === false ? "Un détour utile pour comprendre." : "Participation enregistrée."}<strong>+{feedback.xp} pts</strong></div>}</aside></div></div>;
}
