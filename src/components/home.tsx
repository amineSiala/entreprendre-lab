"use client";
import { connectionHint } from "@/lib/environment";
import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Clock3, MoveUpRight, Sparkle, Play, RotateCcw } from "lucide-react";
import { Brand, DemoBadge, Modal, api } from "@/components/common";
import { CampusArt } from "@/components/art";
import { chapters, curriculumStatus } from "@/content/curriculum.fr";

function subscribeRoom(callback: () => void) { window.addEventListener("storage", callback); return () => window.removeEventListener("storage", callback); }
function lastRoom() { try { const value = localStorage.getItem("elab_last_room"); return value && /^[A-Z2-9]{6}$/.test(value) ? value : null; } catch { return null; } }

export function Home() {
  const router = useRouter();
  const previousRoom = useSyncExternalStore(subscribeRoom, lastRoom, () => null);
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const [modal, setModal] = useState<"join" | "rules" | "program" | "presenter" | null>(null), [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  async function start() {
    setBusy(true); setError("");
    try { const result = await api<{ code: string }>("", { action: "create", mode: "phones", password }); try { localStorage.setItem("elab_last_room", result.code); } catch { /* The room still works without local browser storage. */ } router.push(`/host/session/${result.code}/stage`); }
    catch (e) { setError((e as Error).message); setBusy(false); }
  }
  return <main className="home-shell">
    <header className="site-header"><Brand /><nav aria-label="Navigation principale"><button onClick={() => setModal("program")}>Le programme</button><button onClick={() => setModal("rules")}>Comment on joue ? <MoveUpRight size={14} /></button></nav><DemoBadge /></header>
    <section className="home-hero">
      <div className="hero-copy"><p className="eyebrow"><span className="small-star">✳</span> L’ENTREPRENEURIAT SE JOUE AUSSI EN CLASSE</p><h1>Un problème.<br /><span className="blue-text"><span className="number-circle">8</span> façons</span><br />d’entreprendre<span className="coral-text">.</span></h1>
      <p className="hero-description">Un campus à nourrir. Huit projets à découvrir.<br />Et vous, pour faire les bons choix.</p>

      <div className="hero-actions"><button className="button primary" onClick={() => setModal("join")}>Rejoindre une salle <ArrowRight size={21} /></button></div>
      <p className="mode-hint">Un code, un pseudo et 15 secondes pour relever chaque défi.</p>
      {previousRoom && <button className="resume-link" onClick={() => router.push(`/host/session/${previousRoom}/stage`)}><RotateCcw size={12} /> Reprendre la salle {previousRoom}</button>}
      </div>
      <CampusArt />
    </section>
    <section className="home-bottom"><div className="learning-promise"><Sparkle size={28} /><div><strong>Comprendre, pas deviner.</strong><p>Des cas concrets. Des choix à défendre. Des déclics.</p></div></div><div className="home-stat"><strong>08</strong><span>formes à explorer</span></div><div className="home-stat"><strong>03</strong><span>présentateurs</span></div><div className="home-stat"><strong><Clock3 size={22} /> 27′</strong><span>objectif de séance</span></div></section>
    <footer className="home-footer"><button className="text-button" onClick={() => { setPassword(""); setError(""); setModal("presenter"); }}>Espace présentateur</button><span>Imaginé pour apprendre ensemble <span className="blue-text">↗</span></span></footer>
    {modal === "presenter" && <Modal title="Espace présentateur" close={() => { setModal(null); setPassword(""); }}><p>Authentifiez-vous pour créer une salle.</p><form onSubmit={event => { event.preventDefault(); void start(); }}><label htmlFor="presenter-password">Mot de passe présentateur</label><input id="presenter-password" type="password" className="code-input" value={password} onChange={event => setPassword(event.target.value)} autoComplete="current-password" required maxLength={128} autoFocus /><button className="button primary" type="submit" disabled={busy || !password}><Play size={17} />{busy ? "Ouverture…" : "Créer la salle"}<ArrowRight size={18} /></button>{error && <p role="alert" className="error-message">{error}</p>}</form></Modal>}
    {modal === "join" && <Modal title="Entrez dans la partie." close={() => setModal(null)}><p>Le code à six caractères s’affiche sur le projecteur.</p><form onSubmit={e => { e.preventDefault(); router.push(`/join/${code.toUpperCase()}`); }}><label htmlFor="room-code">Code de la salle</label><input id="room-code" className="code-input" maxLength={6} minLength={6} required autoFocus value={code} onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z2-9]/g, ""))} placeholder="ABC234" autoComplete="off" /><button className="button primary" type="submit">Rejoindre <ArrowRight size={18} /></button></form></Modal>}
    {modal === "rules" && <Modal title="Le raisonnement marque des points." close={() => setModal(null)}><div className="rules-list"><p><b>01 · Observez.</b> Repérez les faits utiles dans chaque situation.</p><p><b>02 · Discutez.</b> Choisissez une réponse, puis la raison qui la justifie.</p><p><b>03 · Faites le point.</b> Découvrez l’explication et confrontez les idées.</p><p><b>04 · Retrouvez les huit.</b> Un rappel sans indices, puis un nouveau cas.</p></div><div className="note-box">15 secondes par défi. Un choix et sa justification corrects rapportent de 500 à 1 000 points : plus vite vous validez, plus vous marquez. Une erreur ou un délai dépassé : 0. Les votes ne sont pas notés. Le rappel rapporte une part des points selon les formes retrouvées.</div><p className="muted">Sur téléphone : {connectionHint}</p></Modal>}
    {modal === "program" && <Modal title="Le parcours de la séance." close={() => setModal(null)}><p>{curriculumStatus}</p><ol className="program-list">{chapters.map((chapter, i) => <li key={chapter}><span>{String(i + 1).padStart(2, "0")}</span>{chapter}</li>)}</ol></Modal>}
  </main>;
}
