"use client";
import { useEffect, useRef, useState } from "react";
import { api } from "./common";
import type { PitchCommand, RoomState, SafePitch, TeamId } from "@/types/domain";
import "./pitch.css";

export const pitchForms: Record<TeamId, string> = { 1: "Entrepreneuriat international", 2: "Entrepreneuriat innovant", 3: "Entrepreneuriat en partenariat" };
const prompt = "Proposez une idée d’entreprise. À quels clients s’adresse-t-elle ? Quelle valeur apporte-t-elle ? Expliquez pourquoi elle correspond à votre forme d’entrepreneuriat.";
function Results({ pitch }: { pitch: SafePitch }) {
  return <div className="pitch-teams pitch-results">{pitch.teams.map(t => <article key={t.id} className={`pitch-team team-${t.id}`}><p className="eyebrow">RANG {t.rank} · ÉQUIPE {t.id}</p><h2>{pitchForms[t.id]}</h2><strong className="pitch-average">{t.count ? `${t.average!.toFixed(1).replace(".", ",")}/10` : "Aucun vote"}</strong><p>{t.count} vote{t.count !== 1 ? "s" : ""}</p><strong>+{t.bonus!.toLocaleString("fr-FR")} points par membre</strong><p className="pitch-names">{t.names.map(n => n.nickname).join(" · ") || "Aucun membre restant"}</p></article>)}</div>;
}
export function PitchStage({ pitch, disabled, command }: { pitch: SafePitch; disabled: boolean; command: (operation: PitchCommand) => Promise<void> }) {
  const [editingTeam, setEditingTeam] = useState<TeamId>(1);
  const reviewing = pitch.selection === "review", active = pitch.activeTeam;
  const selected = reviewing ? editingTeam : pitch.selection as TeamId;
  const cmd = (operation: PitchCommand) => void command(operation);
  if (pitch.phase === "revealed") return <div className="pitch-layout"><header><p className="eyebrow">LE VERDICT DE LA CLASSE</p><h1>Trois idées. À vous d’entreprendre.</h1><p>Le bonus est ajouté aux points de chaque membre. → Afficher le classement individuel.</p></header><Results pitch={pitch} /></div>;
  return <div className="pitch-layout" data-pitch-controls><header><p className="eyebrow">LE DÉFI DES TROIS ÉQUIPES</p><h1>{pitch.phase === "setup" ? reviewing ? "Vérifiez vos équipes." : `Choisissez l’équipe ${selected}.` : pitch.phase === "closed" ? "Prêts pour le verdict ?" : `Équipe ${active} : défendez votre idée.`}</h1><p>{pitch.phase === "setup" ? "Touchez les noms pour répartir toute la classe. Une équipe par joueur, trois équipes non vides." : "Un pitch oral, puis une note de 1 à 10 par les autres joueurs. Les résultats restent secrets jusqu’à la fin."}</p></header>
    <div className="pitch-teams">{pitch.teams.map(t => <article className={`pitch-team team-${t.id} ${pitch.phase === "setup" && selected === t.id || pitch.phase !== "setup" && active === t.id ? "selected-team" : ""}`} key={t.id}>
      {pitch.phase === "setup" ? <button className="pitch-team-heading" disabled={disabled} aria-pressed={selected === t.id} onClick={() => { if (reviewing) setEditingTeam(t.id); else cmd({ command: "select", selection: t.id }); }}>Équipe {t.id}</button> : <p className="eyebrow">ÉQUIPE {t.id}</p>}
      <h2>{pitchForms[t.id]}</h2><div className="pitch-member-list">{t.names.map(n => <span key={n.id}>{n.nickname}</span>)}{!t.names.length && <span className="pitch-empty">Aucun joueur</span>}</div>
      {pitch.phase !== "setup" && <small>{t.count} vote{t.count !== 1 ? "s" : ""} enregistré{t.count !== 1 ? "s" : ""}</small>}
    </article>)}</div>
    {pitch.phase === "setup" ? <>
      <div className="pitch-roster" aria-label="Joueurs à répartir">{pitch.roster?.map(m => <button key={m.id} aria-label={`${m.nickname}, ${m.team ? `équipe ${m.team}` : "sans équipe"}`} aria-pressed={m.team === selected} disabled={disabled} className={m.team ? `assigned team-${m.team}` : ""} onClick={() => cmd({ command: "assign", participantId: m.id, team: m.team === selected ? null : selected })}><b>{m.nickname}</b><small>{m.team ? `Équipe ${m.team}` : "À répartir"}</small></button>)}</div>
      <p className="pitch-unassigned">{pitch.roster?.filter(m => !m.team).length ?? 0} joueur(s) à répartir · {reviewing ? `Modification de l’équipe ${selected}` : `Sélection de l’équipe ${selected}`}</p>
      <div className="pitch-actions">{!reviewing ? <button className="button primary" disabled={disabled} onClick={() => cmd({ command: "select", selection: selected === 3 ? "review" : (selected + 1) as TeamId })}>{selected === 3 ? "Vérifier les équipes" : `Choisir l’équipe ${selected + 1}`}</button> : <button className="button primary" disabled={disabled || !pitch.roster?.length || pitch.roster.some(m => !m.team) || pitch.teams.some(t => !t.names.length)} onClick={() => cmd({ command: "confirm", team: 1 })}>Confirmer les équipes</button>}</div>
    </> : <div className="pitch-prompt"><p>{prompt}</p><div className="pitch-actions">
      {pitch.phase === "ready" && <button className="button primary" disabled={disabled} onClick={() => cmd({ command: "start", team: 1 })}>Commencer le pitch de l’équipe 1</button>}
      {pitch.phase === "presenting" && <button className="button primary" disabled={disabled} onClick={() => cmd({ command: "open", team: active })}>Ouvrir le vote pour l’équipe {active}</button>}
      {pitch.phase === "voting" && <><strong role="status">Vote ouvert · {pitch.teams.find(t => t.id === active)!.count} réponse(s)</strong><button className="button primary" disabled={disabled} onClick={() => cmd({ command: "close", team: active })}>Fermer le vote</button></>}
      {pitch.phase === "between" && <><p>Vote fermé. Les résultats attendent la révélation collective.</p><button className="button primary" disabled={disabled} onClick={() => cmd({ command: "start", team: (active + 1) as TeamId })}>Commencer le pitch de l’équipe {active + 1}</button></>}
      {pitch.phase === "closed" && <button className="button primary" disabled={disabled} onClick={() => cmd({ command: "reveal", team: 3 })}>Révéler les résultats</button>}
    </div></div>}
  </div>;
}

export function PitchPhone({ code, pitch, accept }: { code: string; pitch: SafePitch; accept: (state: RoomState) => void }) {
  const [desired, setDesired] = useState<number | null>(null), [saving, setSaving] = useState(false), [error, setError] = useState("");
  const wanted = useRef<{ rating: number; revision: number } | null>(null), running = useRef(false), revision = useRef(0);
  const latest = useRef(pitch);
  useEffect(() => { latest.current = pitch; }, [pitch]);
  async function send() {
    if (running.current || !wanted.current || !latest.current.eligible) return;
    running.current = true; setSaving(true); setError("");
    try {
      while (wanted.current && latest.current.eligible) {
        const vote: { rating: number; revision: number } = wanted.current;
        const state = await api<RoomState>(code, { action: "rate-pitch", team: pitch.activeTeam, ...vote });
        accept(state);
        if (wanted.current === vote) wanted.current = null;
      }
    } catch (e) { setError((e as Error).message); }
    finally { running.current = false; setSaving(false); }
  }
  function choose(rating: number) {
    revision.current = Math.max(revision.current, pitch.ownVote?.revision ?? 0) + 1;
    wanted.current = { rating, revision: revision.current }; setDesired(rating); void send();
  }
  const selected = desired ?? pitch.ownVote?.rating;
  if (pitch.phase === "revealed") return <section className="student-card pitch-phone"><p className="eyebrow">LES RÉSULTATS DES PITCHS</p><h1>Le verdict est arrivé.</h1><p className="student-xp">+{(pitch.bonus ?? 0).toLocaleString("fr-FR")} points pour vous</p><Results pitch={pitch} /></section>;
  return <section className="student-card pitch-phone"><p className="eyebrow">{pitch.ownTeam ? `VOUS ÊTES DANS L’ÉQUIPE ${pitch.ownTeam}` : pitch.phase === "setup" ? "LES ÉQUIPES SE PRÉPARENT" : "VOUS ÊTES DANS LE PUBLIC"}</p><h1>{pitch.phase === "setup" ? "La classe forme ses équipes." : `Le pitch de l’équipe ${pitch.activeTeam}`}</h1>
    <h2>{pitchForms[pitch.activeTeam]}</h2><p>{pitch.ownTeam ? `Votre forme : ${pitchForms[pitch.ownTeam]}.` : "Suivez le grand écran."}</p><p>{prompt}</p>
    {pitch.eligible ? <><p>Notez le pitch de 1 à 10. Vous pouvez changer votre note jusqu’à la fermeture.</p><div className="pitch-ratings" aria-label="Note du pitch">{Array.from({ length: 10 }, (_, i) => i + 1).map(n => <button key={n} aria-label={`Note ${n} sur 10`} aria-pressed={selected === n} onClick={() => choose(n)}>{n}</button>)}</div><p role="status">{saving ? "Enregistrement…" : error ? "Votre dernière note n’a pas été confirmée." : selected ? `Note ${selected}/10 enregistrée.` : "Choisissez votre note."}</p>{error && <div role="alert"><p>{error}</p><button className="button secondary" onClick={() => void send()}>Réessayer la note</button></div>}</> : <p className="pitch-phone-status">{pitch.phase === "voting" && pitch.ownTeam === pitch.activeTeam ? "C’est votre équipe : vous ne pouvez pas la noter." : pitch.phase === "closed" || pitch.phase === "between" ? "Vote fermé. Les résultats restent secrets jusqu’à la fin des trois pitchs." : "Le présentateur ouvrira le vote après le pitch."}</p>}
    <div className="pitch-phone-team">{pitch.teams.map(t => <p key={t.id}><b>Équipe {t.id}</b> · {t.names.map(m => m.nickname).join(", ") || "En préparation"}</p>)}</div>
  </section>;
}
