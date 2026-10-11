"use client";

import { QRCodeSVG } from "qrcode.react";
import { ArrowRight, Copy, Users } from "lucide-react";
import "./lobby.css";

export function Lobby({ code, url, names, count, copy, start, disabled }: {
  code: string; url: string; names: string[]; count: number;
  copy: () => void; start: () => void; disabled: boolean;
}) {
  return <div className="lobby-layout">
    <header className="lobby-heading"><div><p className="eyebrow">HUIT HISTOIRES. HUIT FAÇONS D’ENTREPRENDRE.</p><h1>La classe entre en jeu<span>.</span></h1></div><span className="lobby-badge">À VOUS DE JOUER ✳</span></header>
    <div className="lobby-body">
      <aside className="lobby-join"><span className="mini-label">01 · SCANNEZ ET REJOIGNEZ</span><div className="lobby-qr">{url && <QRCodeSVG value={url} size={240} marginSize={2} bgColor="#ffffff" fgColor="#192e42" level="M" title="Scanner pour rejoindre cette salle" />}</div><p>Scannez avec votre téléphone.<br />Choisissez un pseudo, c’est parti !</p><div className="lobby-code"><span>CODE DE LA SALLE</span><strong>{code}</strong></div><button className="text-button" onClick={copy}><Copy size={15} /> Copier le lien</button></aside>
      <section className="lobby-players" aria-label="Participants dans la salle"><div className="lobby-players-heading"><h2><Users size={25} /> Qui est dans la place ?</h2><span className="lobby-count" role="status" aria-live="polite">{count} arrivé{count !== 1 ? "s" : ""}</span></div>
        <div className="lobby-player-list">{names.length ? names.map((name, i) => <div className={`lobby-player lobby-color-${i % 4}`} key={`${i}-${name}`}><span className="lobby-avatar" aria-hidden="true">{["★", "◆", "✳", "●"][i % 4]}</span><strong>{name}</strong></div>) : <div className="lobby-empty"><span aria-hidden="true">✳</span><h3>On attend les premiers joueurs…</h3><p>Vos pseudos apparaîtront ici.<br />Le QR code vous ouvre la porte.</p></div>}</div>
        <div className="lobby-start"><div><strong>Tout le monde est là ?</strong><p>Découvrez le parcours avant la première histoire.</p></div><button className="button primary" onClick={start} disabled={disabled}>Commencer <ArrowRight size={20} /></button><span className="lobby-key">ou appuyez sur →</span></div>
      </section>
    </div>
  </div>;
}
