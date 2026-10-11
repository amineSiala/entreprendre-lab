"use client";
import { connectionHint } from "@/lib/environment";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, MoveUpRight, Sparkle, Play } from "lucide-react";
import { Brand, DemoBadge, Modal, api } from "@/components/common";
import { CampusArt } from "@/components/art";
import { chapters, curriculumStatus } from "@/content/curriculum.fr";

export function Home() {
  const router = useRouter();
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const [modal, setModal] = useState<"join" | "rules" | "program" | "presenter" | null>(null), [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  async function start() {
    setBusy(true); setError("");
    try { const result = await api<{ code: string }>("", { action: "create", mode: "phones", password }); router.push(`/host/session/${result.code}/stage`); }
    catch (e) { setError((e as Error).message); setBusy(false); }
  }
  return <main className="home-shell">
    <header className="site-header"><Brand /><nav aria-label="Navigation principale"><button onClick={() => setModal("program")}>Le programme</button><button onClick={() => setModal("rules")}>Comment on joue ? <MoveUpRight size={14} /></button></nav><DemoBadge /></header>
    <section className="home-hero">
      <div className="hero-copy"><p className="eyebrow"><span className="small-star">✳</span> L’ENTREPRENEURIAT SE JOUE AUSSI EN CLASSE</p><h1>Huit histoires.<br /><span className="blue-text"><span className="number-circle">8</span> façons</span><br />d’entreprendre<span className="coral-text">.</span></h1>
      <p className="hero-description">Des entreprises réelles. Des débuts inattendus.<br />Et vous, pour faire les bons choix.</p>

      <div className="hero-actions"><button className="button primary" onClick={() => setModal("join")}>Rejoindre<ArrowRight size={21} /></button></div>

      </div>
      <CampusArt />
    </section>
    <section className="home-bottom"><div className="learning-promise"><Sparkle size={28} /><div><strong>Comprendre, pas deviner.</strong><p>Des histoires vraies. Des quiz. Des déclics.</p></div></div><div className="home-stat"><strong>08</strong><span>formes à explorer</span></div><div className="home-stat"><strong>03</strong><span>manches de quiz</span></div></section>
    <footer className="home-footer"><button className="text-button" onClick={() => { setPassword(""); setError(""); setModal("presenter"); }}>Espace présentateur</button></footer>
    {modal === "presenter" && <Modal title="Espace présentateur" close={() => { setModal(null); setPassword(""); }}><p>Authentifiez-vous pour créer une salle.</p><form onSubmit={event => { event.preventDefault(); void start(); }}><label htmlFor="presenter-password">Mot de passe présentateur</label><input id="presenter-password" type="password" className="code-input" value={password} onChange={event => setPassword(event.target.value)} autoComplete="current-password" required maxLength={128} autoFocus /><button className="button primary" type="submit" disabled={busy || !password}><Play size={17} />{busy ? "Ouverture…" : "Créer la salle"}<ArrowRight size={18} /></button>{error && <p role="alert" className="error-message">{error}</p>}</form></Modal>}
    {modal === "join" && <Modal title="Entrez dans la partie." close={() => setModal(null)}><p>Le code à six caractères s’affiche sur le projecteur.</p><form onSubmit={e => { e.preventDefault(); router.push(`/join/${code.toUpperCase()}`); }}><label htmlFor="room-code">Code de la salle</label><input id="room-code" className="code-input" maxLength={6} minLength={6} required autoFocus value={code} onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z2-9]/g, ""))} placeholder="ABC234" autoComplete="off" /><button className="button primary" type="submit">Rejoindre <ArrowRight size={18} /></button></form></Modal>}
    {modal === "rules" && <Modal title="Le raisonnement marque des points." close={() => setModal(null)}><div className="rules-list"><p><b>01 · Observez.</b> Repérez les faits utiles dans chaque situation.</p><p><b>02 · Discutez.</b> Devinez les entreprises à voix haute, puis répondez aux quiz sur téléphone.</p><p><b>03 · Faites le point.</b> Découvrez l’explication et confrontez les idées.</p><p><b>04 · Retrouvez les huit.</b> Deux minutes sans indices. Validez pour fixer votre bonus de vitesse.</p></div><div className="note-box">20 secondes par quiz : touchez une réponse pour gagner de 500 à 1 000 points si elle est juste. Le rappel final dure 2 minutes et rapporte jusqu’à 8 000 points. Vos brouillons se sauvegardent ; Valider verrouille votre réponse. Sinon, le dernier brouillon compte à la fermeture. Les points dépendent de la vitesse et du nombre de formes correctes. La salle expire après 4 heures.</div><p className="muted">Sur téléphone : {connectionHint}</p></Modal>}
    {modal === "program" && <Modal title="Le parcours de la séance." close={() => setModal(null)}><p>{curriculumStatus}</p><ol className="program-list">{chapters.map((chapter, i) => <li key={chapter}><span>{String(i + 1).padStart(2, "0")}</span>{chapter}</li>)}</ol></Modal>}
  </main>;
}
