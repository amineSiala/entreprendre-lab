"use client";
import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Clock3, Users, Smartphone, MoveUpRight, Sparkle, Play, RotateCcw } from "lucide-react";
import { Brand, DemoBadge, Modal, api } from "@/components/common";
import { CampusArt } from "@/components/art";
import { chapters, curriculumStatus } from "@/content/curriculum.fr";
import type { PlayMode } from "@/types/domain";

function subscribeRoom(callback: () => void) { window.addEventListener("storage", callback); return () => window.removeEventListener("storage", callback); }
function lastRoom() { try { const value = localStorage.getItem("elab_last_room"); return value && /^[A-Z2-9]{6}$/.test(value) ? value : null; } catch { return null; } }

export function Home() {
  const router = useRouter();
  const previousRoom = useSyncExternalStore(subscribeRoom, lastRoom, () => null);
  const [mode, setMode] = useState<PlayMode>("teams");
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const [modal, setModal] = useState<"join" | "rules" | "program" | null>(null), [code, setCode] = useState("");
  async function start() {
    setBusy(true); setError("");
    try { const result = await api<{ code: string }>("", { action: "create", mode }); try { localStorage.setItem("elab_last_room", result.code); } catch { /* The room still works without local browser storage. */ } router.push(`/host/session/${result.code}/stage`); }
    catch (e) { setError((e as Error).message); setBusy(false); }
  }
  return <main className="home-shell">
    <header className="site-header"><Brand /><nav aria-label="Navigation principale"><button onClick={() => setModal("program")}>Le programme</button><button onClick={() => setModal("rules")}>Comment on joue ? <MoveUpRight size={14} /></button></nav><DemoBadge /></header>
    <section className="home-hero">
      <div className="hero-copy"><p className="eyebrow"><span className="small-star">✳</span> L’ENTREPRENEURIAT SE JOUE AUSSI EN CLASSE</p><h1>Un problème.<br /><span className="blue-text"><span className="number-circle">8</span> façons</span><br />d’entreprendre<span className="coral-text">.</span></h1>
      <p className="hero-description">Un campus à nourrir. Huit projets à découvrir.<br />Et vous, pour faire les bons choix.</p>
      <div className="mode-switch" aria-label="Format de la présentation"><button aria-pressed={mode === "teams"} className={mode === "teams" ? "active" : ""} onClick={() => setMode("teams")}><Users size={17} /> En équipes</button><button aria-pressed={mode === "phones"} className={mode === "phones" ? "active" : ""} onClick={() => setMode("phones")}><Smartphone size={17} /> Sur téléphone</button></div>
      <div className="hero-actions"><button className="button primary" onClick={start} disabled={busy}><Play size={17} fill="currentColor" /> {busy ? "Ouverture…" : "C’est parti !"}<ArrowRight size={21} /></button><button className="text-button" onClick={() => setModal("join")}>Rejoindre une salle <MoveUpRight size={17} /></button></div>
      <p className="mode-hint">{mode === "teams" ? "On discute, on choisit, on justifie. Un seul écran suffit." : "Un QR code, un pseudo et chacun joue sur son téléphone."}</p>
      {previousRoom && <button className="resume-link" onClick={() => router.push(`/host/session/${previousRoom}/stage`)}><RotateCcw size={12} /> Reprendre la salle {previousRoom}</button>}
      {error && <p role="alert" className="error-message">{error}</p>}</div>
      <CampusArt />
    </section>
    <section className="home-bottom"><div className="learning-promise"><Sparkle size={28} /><div><strong>Comprendre, pas deviner.</strong><p>Des cas concrets. Des choix à défendre. Des déclics.</p></div></div><div className="home-stat"><strong>08</strong><span>formes à explorer</span></div><div className="home-stat"><strong>03</strong><span>présentateurs</span></div><div className="home-stat"><strong><Clock3 size={22} /> 27′</strong><span>objectif de séance</span></div></section>
    <footer className="home-footer"><span>UN ATELIER, PAS UN MONOLOGUE.</span><span>Imaginé pour apprendre ensemble <span className="blue-text">↗</span></span></footer>
    {modal === "join" && <Modal title="Entrez dans la partie." close={() => setModal(null)}><p>Le code à six caractères s’affiche sur le projecteur.</p><form onSubmit={e => { e.preventDefault(); router.push(`/join/${code.toUpperCase()}`); }}><label htmlFor="room-code">Code de la salle</label><input id="room-code" className="code-input" maxLength={6} minLength={6} required autoFocus value={code} onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z2-9]/g, ""))} placeholder="ABC234" autoComplete="off" /><button className="button primary" type="submit">Rejoindre <ArrowRight size={18} /></button></form></Modal>}
    {modal === "rules" && <Modal title="Le raisonnement marque des points." close={() => setModal(null)}><div className="rules-list"><p><b>01 · Observez.</b> Repérez les faits utiles dans chaque situation.</p><p><b>02 · Discutez.</b> Choisissez une réponse, puis la raison qui la justifie.</p><p><b>03 · Faites le point.</b> Découvrez l’explication et confrontez les idées.</p><p><b>04 · Retrouvez les huit.</b> Un rappel sans indices, puis un nouveau cas.</p></div><div className="note-box">+10 points de participation, +20 pour une réponse et sa justification correctes. Aucun bonus de vitesse. Le rappel est mesuré séparément.</div><p className="muted">Sur téléphone : même Wi-Fi que le présentateur. En équipes : réponses orales ou sur papier, puis choix collectif à l’écran.</p></Modal>}
    {modal === "program" && <Modal title="Le parcours de la séance." close={() => setModal(null)}><p>{curriculumStatus}</p><ol className="program-list">{chapters.map((chapter, i) => <li key={chapter}><span>{String(i + 1).padStart(2, "0")}</span>{chapter}</li>)}</ol></Modal>}
  </main>;
}
