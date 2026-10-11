import { BrainCircuit, Globe2, Handshake } from "lucide-react";
import Image from "next/image";
import { instadeep } from "@/content/instadeep.fr";
import "./instadeep.css";

const icons = [Globe2, BrainCircuit, Handshake];
export function TunisianTeaserBeat() {
  return <div className="tunisian-teaser"><p className="eyebrow">UNE DERNIÈRE HISTOIRE À DEVINER</p><h1>{instadeep.takeaway}</h1><p className="tunisian-success">Une success story à environ <strong>680 millions de dollars</strong></p><p className="tunisian-qualifier">Maximum annoncé en 2023, paiements conditionnels compris.</p><p className="tunisian-guess">Quelle entreprise vous vient à l’esprit ?</p></div>;
}
export function InstaDeepBeat() {
  return <div className="instadeep-layout">
    <header><p className="eyebrow">NÉE EN TUNISIE · UNE HISTOIRE QUI RÉUNIT VOS TROIS ÉQUIPES</p><h1>{instadeep.title}</h1><p className="instadeep-story">{instadeep.story}</p></header>
    <div className="instadeep-intro"><figure className="instadeep-photo"><Image src="/media/instadeep-founders.webp" alt="Karim Beguir et Zohra Slim, cofondateurs d’InstaDeep" width={696} height={385} priority sizes="(max-width: 900px) 90vw, 40vw" /><figcaption>Karim Beguir et Zohra Slim · les cofondateurs</figcaption></figure>
    <div className="instadeep-forms">{instadeep.forms.map((form, index) => {
      const Icon = icons[index];
      return <article key={form.id} className={`instadeep-card instadeep-team-${index + 1}`}><div className="instadeep-card-top"><Icon size={30} aria-hidden="true" /><span>ÉQUIPE {index + 1}</span></div><h2>{form.label}</h2><p>{form.text}</p></article>;
    })}</div></div>
    <footer className="instadeep-sources" aria-label="Sources de la synthèse InstaDeep"><span>Sources :</span>{instadeep.sources.map(s => <a key={s.url} href={s.url} target="_blank" rel="noreferrer">{s.label} ↗</a>)}</footer>
  </div>;
}
