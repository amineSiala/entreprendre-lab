import { BrainCircuit, Globe2, Handshake } from "lucide-react";
import { instadeep } from "@/content/instadeep.fr";
import "./instadeep.css";

const icons = [Globe2, BrainCircuit, Handshake];
export function InstaDeepBeat() {
  return <div className="instadeep-layout">
    <header><p className="eyebrow">NÉE EN TUNISIE · UNE HISTOIRE QUI RÉUNIT VOS TROIS ÉQUIPES</p><h1>{instadeep.title}</h1></header>
    <p className="instadeep-story">{instadeep.story}</p>
    <div className="instadeep-forms">{instadeep.forms.map((form, index) => {
      const Icon = icons[index];
      return <article key={form.id} className={`instadeep-card instadeep-team-${index + 1}`}><div className="instadeep-card-top"><Icon size={30} aria-hidden="true" /><span>ÉQUIPE {index + 1}</span></div><h2>{form.label}</h2><p>{form.text}</p></article>;
    })}</div>
    <aside className="instadeep-acquisition"><strong>{instadeep.acquisition}</strong><p>{instadeep.deal}</p></aside>
    <p className="instadeep-takeaway">{instadeep.takeaway}</p>
    <footer className="instadeep-sources" aria-label="Sources officielles InstaDeep"><span>Sources officielles :</span>{instadeep.sources.map(s => <a key={s.url} href={s.url} target="_blank" rel="noreferrer">{s.label} ↗</a>)}</footer>
  </div>;
}
