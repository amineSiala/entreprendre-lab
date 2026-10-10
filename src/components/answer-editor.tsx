"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, Check, LoaderCircle, LockKeyhole, RefreshCw } from "lucide-react";
import { api } from "@/components/common";
import type { Answer, Question, RoomState, SafeRound } from "@/types/domain";

type EditorProps = { question: Question; round: SafeRound; code: string; accept: (next: RoomState) => void; timer: ReactNode };
function useDeadline(question: Question, round: SafeRound) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 200); return () => clearInterval(timer); }, []);
  return now >= round.openedAt + question.seconds * 1000;
}
function Heading({ question, timer }: Pick<EditorProps, "question" | "timer">) {
  return <><div className="student-question-top"><p className="eyebrow">{question.tag}</p>{timer}</div><h1>{question.title}</h1><p className="student-scenario">{question.scenario}</p></>;
}
export function AnswerEditor(props: EditorProps) {
  return props.question.kind === "recall" ? <RecallEditor {...props} /> : <ChoiceEditor {...props} />;
}

function ChoiceEditor({ question, round, code, accept, timer }: EditorProps) {
  const [choice, setChoice] = useState<number>(), [reason, setReason] = useState<number>();
  const [step, setStep] = useState(1), [attempt, setAttempt] = useState<Answer | null>(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [closed, setClosed] = useState(false);
  const pending = useRef(false);
  const timedOut = useDeadline(question, round);
  const locked = busy || attempt !== null || timedOut || closed;
  async function save(answer: Answer) {
    if (pending.current || closed || (!attempt && timedOut)) return;
    pending.current = true; setAttempt(answer); setBusy(true); setError("");
    try { accept(await api<RoomState>(code, { action: "answer", questionId: question.id, answer })); }
    catch (failure) {
      setError((failure as Error).message);
      if ((failure as Error & { code?: string }).code === "CLOSED") setClosed(true);
    } finally { pending.current = false; setBusy(false); }
  }
  const showingReasons = step === 2 && !!question.reasons;
  function pick(index: number) {
    if (locked || pending.current) return;
    if (showingReasons) { setReason(index); void save({ choice, reason: index }); }
    else { setChoice(index); if (question.reasons) setStep(2); else void save({ choice: index }); }
  }
  return <section className="student-question"><Heading question={question} timer={timer} />
    {question.reasons && <div className="student-steps" aria-label={`Étape ${step} sur 2`}><span className={step === 1 ? "active" : "complete"}><b>{step === 2 ? <Check size={12} /> : "1"}</b>Je choisis</span><span /><span className={step === 2 ? "active" : ""}><b>2</b>Je justifie</span></div>}
    <fieldset className="student-options"><legend>{showingReasons ? "Quel raisonnement soutient votre choix ?" : question.prompt}</legend>{(showingReasons ? question.reasons! : question.options).map((option, index) => <label key={`${step}-${index}`} className={`student-option student-option-${index} ${(showingReasons ? reason : choice) === index ? "selected" : ""} ${locked ? "locked" : ""}`}><input type="radio" name={showingReasons ? "reason" : "choice"} value={index} checked={(showingReasons ? reason : choice) === index} onChange={() => pick(index)} onClick={() => { if ((showingReasons ? reason : choice) === index) pick(index); }} disabled={locked} /><span className="student-option-symbol" aria-hidden="true">{["▲", "◆", "●", "■"][index]}</span><span>{option}</span><span className="student-option-check" aria-hidden="true">{(showingReasons ? reason : choice) === index && <Check size={17} />}</span></label>)}</fieldset>
    {showingReasons && <div className="student-choice-summary"><span>Votre choix</span><p>{choice !== undefined && question.options[choice]}</p>{!locked && <button type="button" onClick={() => setStep(1)}><ArrowLeft size={15} /> Modifier mon choix</button>}</div>}
    {busy && <p className="student-submit-note" role="status"><LoaderCircle className="student-spin" size={16} /> Enregistrement…</p>}
    {error && <div className="student-answer-error" role="alert"><strong>{closed ? "Le défi est terminé." : "Enregistrement non confirmé."}</strong><p>{error}</p>{!closed && attempt && <button className="button primary" disabled={busy} onClick={() => void save(attempt)}><RefreshCw size={18} /> Vérifier et réessayer</button>}</div>}
    <p className="student-submit-note"><LockKeyhole size={12} />{question.reasons ? "Touchez un choix, puis une justification : c’est enregistré automatiquement." : "Touchez votre réponse : c’est enregistré automatiquement."}</p>
  </section>;
}

function RecallEditor({ question, round, code, accept, timer }: EditorProps) {
  const [values, setValues] = useState<string[]>(() => Array.from({ length: question.recallCount! }, (_, i) => round.submission?.answer.recall?.[i] ?? ""));
  const [saved, setSaved] = useState(() => JSON.stringify(values)), [saving, setSaving] = useState(false), [error, setError] = useState("");
  const latest = useRef(values), savedRef = useRef(saved), pending = useRef(false), active = useRef(true);
  const timedOut = useDeadline(question, round);
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
  const flush = useCallback(async () => {
    if (pending.current || Date.now() >= round.openedAt + question.seconds * 1000) return;
    pending.current = true; setSaving(true);
    try {
      while (active.current && Date.now() < round.openedAt + question.seconds * 1000) {
        const recall = [...latest.current], signature = JSON.stringify(recall);
        if (signature === savedRef.current) { setError(""); break; }
        const next = await api<RoomState>(code, { action: "answer", questionId: question.id, answer: { recall } });
        savedRef.current = signature;
        if (active.current) { setSaved(signature); setError(""); accept(next); }
      }
    } catch (failure) { if (active.current) setError((failure as Error).message); }
    finally { pending.current = false; if (active.current) setSaving(false); }
  }, [code, question.id, question.seconds, round.openedAt, accept]);
  useEffect(() => { const timer = setTimeout(() => void flush(), 300); return () => clearTimeout(timer); }, [values, flush]);
  useEffect(() => {
    if (!error || timedOut) return;
    const timer = setTimeout(() => void flush(), 1500);
    return () => clearTimeout(timer);
  }, [error, timedOut, saving, flush]);
  function change(index: number, value: string) {
    const next = latest.current.map((old, i) => i === index ? value : old);
    latest.current = next; setValues(next);
  }
  const unsaved = JSON.stringify(values) !== saved;
  return <section className="student-question"><Heading question={question} timer={timer} /><form onSubmit={event => event.preventDefault()}><h2>{question.prompt}</h2><p className="student-field-hint">Vos réponses se sauvegardent au fur et à mesure. Vous pouvez les modifier pendant 1 minute, même si la liste est incomplète.</p><div className="student-recall-fields">{values.map((value, index) => <label key={index}><span>{String(index + 1).padStart(2, "0")}</span><span className="sr-only">Forme {index + 1}</span><input aria-label={`Forme ${index + 1}`} value={value} maxLength={100} autoComplete="off" autoCorrect="off" spellCheck={false} placeholder={`Forme ${index + 1}`} disabled={timedOut} onChange={event => change(index, event.target.value)} onBlur={() => void flush()} /></label>)}</div>
    <p className="student-submit-note" role="status">{saving || unsaved ? <><LoaderCircle className="student-spin" size={15} />{timedOut ? "Temps écoulé. Seule la dernière sauvegarde compte." : "Sauvegarde en cours…"}</> : values.some(value => value.trim()) ? <><Check size={15} /> Sauvegardé automatiquement</> : "Écrivez les formes dont vous vous souvenez."}</p>
    {error && <div className="student-answer-error" role="alert"><strong>Sauvegarde non confirmée.</strong><p>{error}</p>{!timedOut && <button type="button" className="button secondary" disabled={saving} onClick={() => void flush()}><RefreshCw size={16} /> Réessayer la sauvegarde</button>}</div>}
    <p className="student-submit-note">À la fin du chrono, votre dernière sauvegarde est prise en compte automatiquement.</p></form></section>;
}
