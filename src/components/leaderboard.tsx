"use client";

import { useEffect, useState, type CSSProperties } from "react";
import type { Leaderboard, LeaderEntry } from "@/types/domain";
import "./leaderboard.css";

const jokes = [
  "Même le Wi-Fi a marqué plus de points. On tente une reconnexion ?",
  "Le business plan est solide : laisser tous les points à la concurrence.",
  "Ce n’est plus du suspense, c’est une stratégie de camouflage.",
  "Le score fait une sieste. Quelqu’un a un café ?",
  "La remontada charge… merci de ne pas éteindre le cerveau.",
  "Vous explorez un marché de niche : le bas du classement.",
];

function Score({ entry }: { entry: LeaderEntry }) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const value = Math.min(1, (now - start) / 1400);
      setProgress(1 - Math.pow(1 - value, 3));
      if (value < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);
  return <strong className="ranking-score" aria-label={`${entry.points} points`}>
    <span className="score-animated" aria-hidden="true">{Math.round(entry.previousPoints + (entry.points - entry.previousPoints) * progress).toLocaleString("fr-FR")}</span>
    <span className="score-static" aria-hidden="true">{entry.points.toLocaleString("fr-FR")}</span><small> pts</small>
  </strong>;
}

export function LeaderboardBeat({ board, questionId }: { board?: Leaderboard; questionId: string }) {
  if (!board?.total) return <div className="empty-results"><h1>Le podium vous attend.</h1><p>Aucun participant pour le moment. Rejoignez la salle pour entrer dans la partie !</p></div>;
  const tied = board.lastCount > 1;
  const allTied = board.lastCount === board.total;
  const joke = jokes[Array.from(questionId).reduce((sum, char) => sum + char.charCodeAt(0), 0) % jokes.length];
  const label = allTied ? "Tout le monde est ex æquo !" : tied ? `${board.lastCount} ex æquo en dernière place` : board.lastNames[0];
  return <div className="ranking-layout">
    <div className="ranking-confetti" aria-hidden="true">{Array.from({ length: 18 }, (_, i) => <i key={i} style={{ "--i": i } as CSSProperties} />)}</div>
    <header className="ranking-heading"><div><p className="eyebrow">LE CLASSEMENT · POINTS CUMULÉS</p><h1>Ça bouge sur le podium<span> !</span></h1></div><span className="ranking-total">{board.total} en piste</span></header>
    <div className="ranking-columns">
      <section className="ranking-top"><h2>★ Top 3</h2><div className="ranking-podium">{board.top.map((entry, i) => <article className={`podium-card podium-${i + 1}`} key={i} style={{ "--delay": `${(2 - i) * 160}ms` } as CSSProperties}>
        <span className="podium-medal" aria-label={`Rang ${entry.rank}`}>{entry.rank === 1 ? "♛" : `#${entry.rank}`}</span><h3>{entry.nickname}</h3><Score entry={entry} /><span className="ranking-gain">+{entry.points - entry.previousPoints} cette manche</span><div className="podium-base">#{entry.rank}</div>
      </article>)}</div></section>
      <section className="ranking-bottom"><h2>↗ Les 3 derniers</h2><p>La remontada commence ici.</p><div className="ranking-bottom-list">{board.bottom.map((entry, i) => <article className="ranking-row" key={i} style={{ "--delay": `${600 + i * 150}ms` } as CSSProperties}><span className="ranking-place">#{entry.rank}</span><h3>{entry.nickname}</h3><Score entry={entry} /></article>)}</div>{board.bottom.length < 3 && <p className="ranking-small-room">{board.total < 6 ? "Petite salle : chaque joueur apparaît une seule fois." : ""}</p>}</section>
    </div>
    <aside className="ranking-roast"><span className="roast-sticker" aria-hidden="true">🔥</span><div><p className="eyebrow">{allTied ? "DÉPART GROUPÉ" : "LA MINUTE ROAST"}</p><h2>{label}</h2><p>{allTied ? "Personne ne veut payer les points ? Belle solidarité, la classe !" : board.total === 1 ? "Seul en piste : première place garantie, pression maximale !" : joke}</p></div></aside>
    <p className="ranking-next">← {questionId === "pitch" ? "Revoir les résultats des pitchs" : "Revoir l’explication"} <span>→ Continuer la présentation</span></p>
  </div>;
}
