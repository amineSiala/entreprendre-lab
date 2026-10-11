"use client";
import { connectionHint, storageHint } from "@/lib/environment";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Clock3, Eye, Flag, Lightbulb, LoaderCircle, LockKeyhole, Radio, RefreshCw, Smartphone, Sparkles, Trash2, Trophy, Users, WifiOff } from "lucide-react";
import { api, Brand, DemoBadge, LocalNotice, Modal } from "@/components/common";
import { AnswerEditor } from "@/components/answer-editor";
import { questions } from "@/content/questions.fr";
import type { FormId, Question, RoomState, SafeRound } from "@/types/domain";
import "./student.css";

const storageKey = "elab_student";
type Participation = { code: string; nickname: string; snapshot?: RoomState };
const formLabels: Record<FormId, string> = { individual: "Individuel", partner: "En association", innovative: "Innovant", social: "Social", highgrowth: "Forte croissance", intrapreneur: "Intrapreneuriat", family: "Familial", international: "International" };
function readStorage() { try { return localStorage.getItem(storageKey); } catch { return null; } }
function parseParticipation(value: string | null): Participation | null {
  try { const data = value ? JSON.parse(value) : null; return data && /^[A-Z2-9]{6}$/.test(data.code) && typeof data.nickname === "string" ? data : null; } catch { return null; }
}
function saveParticipation(value: Participation | null) {
  try {
    if (value) localStorage.setItem(storageKey, JSON.stringify(value)); else localStorage.removeItem(storageKey);
    window.dispatchEvent(new Event("elab-participation"));
  } catch { /* Participation still works when browser storage is unavailable. */ }
}
function subscribeStorage(callback: () => void) {
  window.addEventListener("storage", callback); window.addEventListener("elab-participation", callback);
  return () => { window.removeEventListener("storage", callback); window.removeEventListener("elab-participation", callback); };
}
function useParticipation() {
  const raw = useSyncExternalStore(subscribeStorage, readStorage, () => null);
  return useMemo(() => parseParticipation(raw), [raw]);
}
function errorMessage(error: unknown) { return error instanceof Error ? error.message : "La connexion a été interrompue. Réessayez."; }

function useRoom(code: string | undefined) {
  const [room, setRoom] = useState<RoomState | null>(null);
  const [error, setError] = useState("");
  const mounted = useRef(true), expiredRef = useRef(false);
  const [expired, setExpired] = useState(false);
  const fail = useCallback((error: unknown) => { if (!mounted.current) return; if ((error as { code?: string }).code === "ROOM_EXPIRED") { expiredRef.current = true; setExpired(true); saveParticipation(null); } setError(errorMessage(error)); }, []);
  const accept = useCallback((next: RoomState) => {
    if (!mounted.current || expiredRef.current) return;
    if (Date.now() >= next.expiresAt) { fail(Object.assign(new Error("Cette salle a expiré."), { code: "ROOM_EXPIRED" })); return; }
    setRoom(previous => {
      if (previous?.code === next.code && previous.version > next.version) return previous;
      // A poll initiated before an answer must never erase its acknowledgement.
      if (previous?.code === next.code && previous.version === next.version && previous.round?.questionId === next.round?.questionId && previous.round?.submission && next.round && (!next.round.submission || previous.round.submission.at > next.round.submission.at || (previous.round.submission.finalized && !next.round.submission.finalized))) {
        return { ...next, round: { ...next.round, submission: previous.round.submission } };
      }
      return next;
    });
    setError("");
    const saved = parseParticipation(readStorage());
    if (saved?.code === next.code && next.role === "student") saveParticipation({ ...saved, snapshot: next });
  }, [fail]);
  const refresh = useCallback(async () => {
    if (!code || expiredRef.current) return;
    try { accept(await api<RoomState>(code)); } catch (error) { fail(error); }
  }, [code, accept, fail]);
  useEffect(() => {
    mounted.current = true;
    let active = true, pending = false;
    const poll = async () => {
      if (expiredRef.current || !code || pending || document.visibilityState === "hidden") return;
      pending = true;
      try { const next = await api<RoomState>(code); if (active) accept(next); }
      catch (error) { if (active) fail(error); }
      finally { pending = false; }
    };
    void poll();
    const timer = setInterval(poll, 1500);
    document.addEventListener("visibilitychange", poll);
    window.addEventListener("online", poll);
    return () => { active = false; mounted.current = false; clearInterval(timer); document.removeEventListener("visibilitychange", poll); window.removeEventListener("online", poll); };
  }, [code, accept, fail]);
  useEffect(() => { if (!room || expired) return; const timer = setTimeout(() => fail(Object.assign(new Error("Cette salle a expiré."), { code: "ROOM_EXPIRED" })), Math.max(0, room.expiresAt - Date.now())); return () => clearTimeout(timer); }, [room, expired, fail]);
  return { room: room?.code === code ? room : null, error, expired, accept, refresh };
}

function StudentShell({ children, code, progress = true }: { children: React.ReactNode; code?: string; progress?: boolean }) {
  return <main className="student-shell">
    <header className="student-header"><Brand /><div className="student-header-links">{code && <span className="student-room-code">SALLE <b>{code}</b></span>}{progress && <Link href="/me" className="icon-button" aria-label="Ma progression"><Trophy size={20} /></Link>}</div></header>
    <div className="student-main">{children}</div>
    <footer className="student-footer"><DemoBadge /><LocalNotice /></footer>
  </main>;
}

export function StudentJoin({ code: rawCode }: { code: string }) {
  const code = rawCode.toUpperCase(), router = useRouter();
  const [nickname, setNickname] = useState(""), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const valid = /^[A-Z2-9]{6}$/.test(code);
  async function join(event: React.FormEvent) {
    event.preventDefault(); if (busy || !valid) return;
    setBusy(true); setError("");
    try {
      const room = await api<RoomState>(code, { action: "join", nickname: nickname.trim() });
      if (room.role === "host") { setError("Ce navigateur est celui du présentateur. Ouvrez ce lien sur un autre appareil ou dans une fenêtre privée pour participer."); setBusy(false); return; }
      saveParticipation({ code, nickname: nickname.trim(), snapshot: room });
      router.push(`/s/${code}`);
    } catch (error) { setError(errorMessage(error)); setBusy(false); }
  }
  return <StudentShell code={valid ? code : undefined} progress={false}>
    <section className="student-join-card">
      <div className="student-ticket-art" aria-hidden="true"><span className="student-art-star">✳</span><Smartphone size={66} strokeWidth={1.7} /><span className="student-art-dot">!</span></div>
      <p className="eyebrow">VOTRE PLACE DANS LA PARTIE</p><h1>La partie<br />vous attend<span>.</span></h1>
      <p className="student-intro">Touchez votre réponse : 20 secondes, jusqu’à 1 000 points par quiz. Le rappel final dure 2 minutes : validez pour gagner jusqu’à 8 000 points. La salle dure 4 heures.</p>
      {valid ? <form className="student-join-form" onSubmit={join}>
        <label htmlFor="student-nickname">Comment vous appelle-t-on ?</label>
        <input id="student-nickname" placeholder="Votre pseudo" minLength={2} maxLength={24} value={nickname} onChange={event => setNickname(event.target.value)} autoComplete="nickname" required disabled={busy} aria-describedby="nickname-hint" />
        <p id="nickname-hint" className="student-field-hint">Votre pseudo et vos points peuvent apparaître au classement sur le projecteur, avec une taquinerie pour la dernière place.</p>
        {error && <p role="alert" className="error-message">{error}</p>}
        <button className="button primary" disabled={busy || nickname.trim().length < 2} type="submit">{busy ? <LoaderCircle className="student-spin" size={19} /> : <ArrowRight size={19} />}{busy ? "On vous fait une place…" : "J’entre dans la partie"}</button>
      </form> : <div className="note-box"><p>Ce code ne correspond pas à une salle. Il doit contenir les six caractères affichés sur le projecteur.</p><Link className="button secondary" href="/">Saisir un autre code <ArrowRight size={17} /></Link></div>}
      <div className="student-join-note"><Users size={18} /><p>Le présentateur lance les défis. Gardez aussi un œil sur le grand écran.</p></div>
    </section>
  </StudentShell>;
}

function ConnectionNotice({ error, retry }: { error: string; retry: () => void }) {
  return <div className="student-connection" role="status"><WifiOff size={19} /><div><strong>Connexion à vérifier</strong><p>{error}</p></div><button className="icon-button" aria-label="Réessayer la connexion" onClick={retry}><RefreshCw size={19} /></button></div>;
}
function Waiting({ nickname }: { nickname?: string }) {
  return <section className="student-waiting student-card"><div className="student-waiting-art" aria-hidden="true"><Eye size={58} /><span>↗</span><i>✳</i></div><p className="eyebrow">VOUS ÊTES DANS LA PARTIE</p><h1>{nickname ? `${nickname}, à vous de jouer…` : "À vous de jouer…"}<br /><span>bientôt !</span></h1><p>Pour l’instant, huit histoires vous attendent. Suivez la présentation : le prochain défi apparaîtra ici.</p><div className="student-live"><span /> Synchronisé avec le présentateur</div><div className="student-waiting-tip"><Lightbulb size={20} /><p>Repérez les détails qui changent tout.<br />Vous devrez expliquer vos choix.</p></div></section>;
}
function Timer({ question, openedAt }: { question: Question; openedAt: number }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  const remaining = Math.min(question.seconds, Math.max(0, question.seconds - Math.floor((now - openedAt) / 1000)));
  return <div className="student-timer"><Clock3 size={15} /><span>{remaining > 0 ? `${remaining} s` : "Temps écoulé"}</span><span className="student-timer-hint">Clôture automatique.</span></div>;
}

function Submitted({ question, round }: { question: Question; round: SafeRound }) {
  const answer = round.submission!.answer;
  return <section className="student-card student-submitted" aria-live="polite"><div className="student-success-icon"><Check size={38} /></div><p className="eyebrow">RÉPONSE ENREGISTRÉE</p><h1>C’est dans<br /><span>la boîte !</span></h1><p>Votre réponse est bien arrivée. Le présentateur va ouvrir la discussion.</p><div className="student-saved-answer"><span>Votre {question.kind === "recall" ? "rappel" : "choix"}</span>{answer.recall ? <p>{answer.recall.filter(value => value.trim()).length} réponse(s) envoyée(s), sans indices.</p> : <><p>{answer.choice !== undefined && question.options[answer.choice]}</p>{answer.reason !== undefined && question.reasons && <small>{question.reasons[answer.reason]}</small>}</>}</div><div className="student-live"><span /> En attente de la révélation</div><p className="student-submit-note">Prenez le temps d’écouter les autres raisonnements.</p></section>;
}
function Revealed({ question, round }: { question: Question; round: SafeRound }) {
  const feedback = round.submission?.feedback;
  const recall = question.kind === "recall", vote = question.kind === "vote";
  return <section className="student-card student-feedback" aria-live="polite"><div className={`student-feedback-icon ${feedback?.correct ? "correct" : ""}`}>{recall ? <Flag size={35} /> : feedback?.correct ? <CheckCircle2 size={35} /> : <Lightbulb size={35} />}</div><p className="eyebrow">LE MOMENT DU DÉCLIC</p><h1>{!feedback ? "On fait le point." : recall ? `${feedback.recalled.length} sur ${question.recallCount} retrouvées.` : vote ? "Votre avis compte." : feedback.correct ? "Bien raisonné !" : "L’indice qui change tout."}</h1>
    {feedback && <span className="student-xp">{vote ? "Vote sans points" : `+${feedback.xp} points`}</span>}
    {!feedback && <p className="student-field-hint">Vous n’avez pas envoyé de réponse pour ce défi. Profitez de la correction.</p>}
    {feedback && !recall && !vote && <div className="student-answer-checks"><span><span aria-hidden="true">{feedback.choiceCorrect ? "✓" : "↗"}</span>{feedback.choiceCorrect ? "Choix correct" : "Choix à revoir"}</span>{question.reasons && <span><span aria-hidden="true">{feedback.reasonCorrect ? "✓" : "↗"}</span>{feedback.reasonCorrect ? "Justification correcte" : "Justification à revoir"}</span>}</div>}
    {round.correctChoice !== undefined && <div className="student-feedback-answer"><span>Le choix appuyé par les faits</span><p>{question.options[round.correctChoice]}</p>{round.correctReason !== undefined && question.reasons && <small>{question.reasons[round.correctReason]}</small>}</div>}
    <p className="student-explanation">{feedback?.explanation ?? round.explanation}</p><div className="student-takeaway"><Lightbulb size={22} /><div><strong>Le déclic à garder</strong><p>{feedback?.takeaway ?? round.takeaway}</p></div></div><div className="student-live"><span /> La suite arrive avec le présentateur</div>
  </section>;
}

export function StudentRoom({ code: rawCode }: { code: string }) {
  const code = rawCode.toUpperCase(), saved = useParticipation();
  const { room, error, expired, refresh, accept } = useRoom(code);
  const round = room?.round, question = round ? questions[round.questionId] : undefined;
  if (expired) return <ExpiredRoom />;
  return <StudentShell code={code}>
    {error && <ConnectionNotice error={error} retry={() => void refresh()} />}
    {!room ? error ? <section className="student-card student-empty"><Radio size={36} /><h1>Retrouvons votre salle.</h1><p>Vérifiez le code et votre connexion. {connectionHint}</p><Link href={`/join/${code}`} className="button primary">Rejoindre la salle <ArrowRight size={17} /></Link><Link href="/" className="student-back">Retour à l’accueil</Link></section> : <div className="student-loading" role="status"><LoaderCircle className="student-spin" size={28} /><p>Connexion à la partie…</p></div> : room.role === "host" ? <section className="student-card student-empty"><Users size={35} /><h1>Vous êtes le présentateur.</h1><p>Pour participer, ouvrez ce lien sur un autre appareil ou dans une fenêtre privée.</p><Link className="button primary" href={`/host/session/${code}/stage`}>Retour au projecteur <ArrowRight size={18} /></Link></section> : <>
      <div className="student-player-strip"><span><span className="student-avatar">{saved?.code === code ? saved.nickname.slice(0, 1).toUpperCase() : "✳"}</span><b className="student-player-name">{saved?.code === code ? saved.nickname : "Dans la partie"}</b></span><span><Sparkles size={15} />{room.xp ?? 0} points</span></div>
      {room.ended ? <section className="student-card student-waiting"><div className="student-success-icon"><Trophy size={38} /></div><p className="eyebrow">PARCOURS TERMINÉ</p><h1>Huit formes.<br /><span>À vous d’entreprendre.</span></h1><p>Retrouvez vos points et les formes reconnues ou rappelées dans votre carnet personnel.</p><Link href="/me" className="button primary">Voir mon carnet <ArrowRight size={17} /></Link></section> : !round || !question ? <Waiting nickname={saved?.code === code ? saved.nickname : undefined} /> : round.state === "revealed" ? <Revealed key={round.questionId} question={question} round={round} /> : round.submission && (question.kind !== "recall" || round.submission.finalized) ? <Submitted question={question} round={round} /> : <AnswerEditor key={round.questionId} question={question} round={round} code={code} accept={accept} timer={<Timer question={question} openedAt={round.openedAt} />} />}
    </>}
  </StudentShell>;
}

export function StudentProgress() {
  const saved = useParticipation();
  const { room, error, expired, refresh } = useRoom(saved?.code);
  const [confirmDelete, setConfirmDelete] = useState(false), [deleting, setDeleting] = useState(false), [deleteError, setDeleteError] = useState(""), [deleted, setDeleted] = useState(false);
  const current = room ?? saved?.snapshot;
  const recallOpen = current?.round?.state === "open" && questions[current.round.questionId]?.kind === "recall";
  async function forget() {
    if (!saved || deleting) return;
    setDeleting(true); setDeleteError("");
    try { await api<{ forgotten: boolean }>(saved.code, { action: "forget" }); saveParticipation(null); setDeleted(true); setConfirmDelete(false); }
    catch (error) { setDeleteError(errorMessage(error)); }
    finally { setDeleting(false); }
  }
  if (expired) return <ExpiredRoom />;
  return <StudentShell code={saved?.code} progress={false}>
    {!saved ? <section className="student-card student-empty"><Trophy size={42} /><p className="eyebrow">VOTRE CARNET DE PARCOURS</p><h1>{deleted ? "Vos réponses ont été effacées." : "Le premier déclic vous attend."}</h1><p>{deleted ? "Votre pseudo, vos réponses et votre progression dans cette salle ont été supprimés du serveur. La référence enregistrée dans ce navigateur a aussi été effacée." : "Rejoignez une partie avec le code affiché sur le projecteur. Vous retrouverez votre progression ici, dans ce navigateur."}</p><Link href="/" className="button primary">Retour à l’accueil <ArrowRight size={17} /></Link></section> : <>
      {error && <ConnectionNotice error={error} retry={() => void refresh()} />}
      <Link className="student-back" href={`/s/${saved.code}`}><ArrowLeft size={17} /> Retour à la partie</Link>
      <section className="student-progress-heading"><p className="eyebrow">MON CARNET · {saved.nickname}</p><h1>Chaque déclic<br /><span>fait son chemin.</span></h1><p>Des repères pour apprendre, avec un classement sur le projecteur.</p></section>
      {!room && !error ? <div className="student-loading" role="status"><LoaderCircle className="student-spin" size={24} /><p>Vérification de la séance en cours…</p></div> : recallOpen || (!room && Boolean(error)) ? <section className="student-card student-recall-lock"><LockKeyhole size={29} /><h2>{recallOpen ? "Un défi sans indices est en cours." : "La séance n’est pas synchronisée."}</h2><p>{recallOpen ? "Votre carnet attendra. Retournez à la partie pour retrouver les formes de mémoire." : "Reconnectez-vous pour afficher le carnet sans risquer de dévoiler des indices pendant un défi mémoire."}</p><Link className="button primary" href={`/s/${saved.code}`}>Retour au défi <ArrowRight size={17} /></Link></section> : <>
        <div className="student-progress-stats"><div><Sparkles size={20} /><strong>{current?.xp ?? 0}</strong><span>points de parcours</span></div><div><Eye size={20} /><strong>{current?.recognized?.length ?? 0}<small>/8</small></strong><span>formes reconnues</span></div><div><Flag size={20} /><strong>{current?.recalled?.length ?? 0}<small>/8</small></strong><span>formes rappelées</span></div></div>
        <p className="student-progress-explainer">« Reconnue » : identifiée dans un cas dans un quiz. « Rappelée » : retrouvée sans liste. Ce sont deux façons différentes de vérifier votre compréhension.</p>
        <section className="student-forms"><h2>Vos huit repères</h2><p>Ce carnet cumule les acquis des défis déjà révélés, pas seulement ceux du défi final.</p><div className="student-forms-list">{(Object.entries(formLabels) as [FormId, string][]).map(([id, label], index) => <article key={id}><span className="student-form-number">{String(index + 1).padStart(2, "0")}</span><div><h3>{label}</h3><div className="student-form-badges"><span className={current?.recognized?.includes(id) ? "earned" : ""}>{current?.recognized?.includes(id) ? <Check size={12} /> : <span aria-hidden="true">○</span>}Reconnue</span><span className={current?.recalled?.includes(id) ? "earned" : ""}>{current?.recalled?.includes(id) ? <Check size={12} /> : <span aria-hidden="true">○</span>}Rappelée</span></div></div></article>)}</div></section>
      </>}
      <section className="student-privacy-card"><LockKeyhole size={21} /><div><h2>Vos réponses restent personnelles.</h2><p>{storageHint} Ce navigateur conserve la référence de votre dernière salle.</p><p>Effacer retire votre pseudo, vos réponses et votre progression de la salle <b>{saved.code}</b>.</p><button className="student-delete" onClick={() => setConfirmDelete(true)}><Trash2 size={16} /> Effacer ma participation à cette salle</button><Link href="/privacy">Données et confidentialité <ArrowRight size={13} /></Link></div></section>
    </>}
    {confirmDelete && <Modal title="Effacer votre participation ?" close={() => { if (!deleting) setConfirmDelete(false); }}><p>Votre pseudo, vos réponses et votre progression dans la salle <b>{saved?.code}</b> seront supprimés. Cette action est définitive pour cette salle.</p>{deleteError && <p className="error-message" role="alert">{deleteError}</p>}<div className="student-modal-actions"><button className="button secondary" onClick={() => setConfirmDelete(false)} disabled={deleting}>Garder mon parcours</button><button className="button primary" onClick={() => void forget()} disabled={deleting}>{deleting ? <LoaderCircle className="student-spin" size={17} /> : <Trash2 size={17} />}{deleting ? "Suppression…" : "Oui, effacer"}</button></div></Modal>}
  </StudentShell>;
}

function ExpiredRoom() { return <StudentShell progress={false}><section className="student-card"><h1>Cette salle a expiré.</h1><p>Les salles durent quatre heures. Rejoignez une nouvelle salle pour continuer.</p><Link className="button primary" href="/">Retour à l’accueil</Link></section></StudentShell>; }
