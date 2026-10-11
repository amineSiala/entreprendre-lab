import { BrainCircuit, Flag, Lightbulb, Smartphone, Users } from "lucide-react";
import "./roadmap.css";
const steps = [
  { icon: Lightbulb, title: "Découvrir et deviner", text: "Huit histoires, des indices et vos propositions avant chaque révélation." },
  { icon: Smartphone, title: "Jouer pendant trois pauses quiz", text: "Votre téléphone vous permet de répondre et de suivre vos points." },
  { icon: BrainCircuit, title: "Retrouver les formes de mémoire", text: "Un défi pour rassembler ce que vous avez appris, sans liste d’indices." },
  { icon: Users, title: "Défendre une idée en équipe", text: "Imaginez une idée, présentez votre pitch et écoutez les autres équipes." },
  { icon: Flag, title: "Faire le lien et conclure", text: "Une dernière découverte pour relier les idées et ouvrir la discussion." },
];
export function RoadmapBeat() {
  return <div className="roadmap-layout"><header><p className="eyebrow">LE PARCOURS DE LA CLASSE</p><h1>Notre parcours, ensemble.</h1><p>Observez, proposez, jouez… puis passez de l’histoire à votre propre idée.</p></header><ol className="roadmap-steps">{steps.map((s, i) => <li key={s.title}><span className="roadmap-number">0{i + 1}</span><s.icon size={28} aria-hidden="true" /><div><h2>{s.title}</h2><p>{s.text}</p></div></li>)}</ol><p className="roadmap-footer">Gardez votre téléphone à portée de main et un œil sur le grand écran.</p></div>;
}
