"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";
import { characters } from "@/content/curriculum.fr";
import type { Beat } from "@/types/domain";
import "./story.css";

export function StoryBeat({ beat }: { beat: Beat }) {
  const person = characters.find(item => item.id === beat.character)!;
  const number = characters.indexOf(person) + 1;
  if (beat.kind !== "reveal") return <div className={`story-mystery tone-${person.color}`}>
    <p className="eyebrow">HISTOIRE {String(number).padStart(2, "0")} / 08 · {beat.kind === "teaser" ? "À VOUS DE DEVINER" : "LES INDICES"}</p>
    <div className="mystery-mark" aria-hidden="true">{beat.kind === "teaser" ? "?" : "↗"}</div>
    {beat.kind === "teaser" ? <h1>{person.teaser}</h1> : <><h1>Tout commence comme ça.</h1><p className="story-body">{person.story}</p></>}
    <p className="story-prompt">{beat.kind === "teaser" ? "Une entreprise vous vient à l’esprit ?" : "Dernières propositions avant la révélation…"}</p>
    <div className="story-dots" aria-label={beat.kind === "teaser" ? "Étape 1 sur 3" : "Étape 2 sur 3"}><i className="active" /><i className={beat.kind === "story" ? "active" : ""} /><i /></div>
  </div>;
  return <div className="story-reveal">
    <figure className={`entrepreneur-photo tone-${person.color}`}><Image src={`/media/${person.photo}.webp`} alt={person.id === "social" ? "Illustration : travail de couture, sans lien avec Empowerment Plan" : person.id === "partner" ? "Brian Chesky, cofondateur d’Airbnb" : person.id === "intrapreneur" ? "Art Fry, co-inventeur des Post-it" : person.id === "family" ? "Godtfred Kirk Christiansen" : person.name} fill sizes="45vw" priority /><figcaption>{person.fact}{person.id === "social" && <small style={{display:"block",fontSize:13,marginTop:8}}>Illustration de couture · ni Veronika Scott ni son atelier</small>}</figcaption></figure>
    <div className="reveal-copy"><p className="eyebrow">HISTOIRE {String(number).padStart(2, "0")} · LA RÉVÉLATION</p>{person.id !== "social" && <Image className="company-logo" src={`/media/logo-${person.id}.webp`} alt={person.company} width={200} height={65} />}<h1>{person.company}<span className="coral-text">.</span></h1><p className="entrepreneur-name">{person.name}</p><div className={`form-definition tone-${person.color}`}><h2>{person.label}</h2><p>{person.definition}</p></div><p className="reveal-nuance">Un exemple, une forme mise en lumière. Dans la réalité, les formes peuvent se combiner.</p><a className="media-credit" href="/media/credits.html" target="_blank" rel="noreferrer">Sources et crédits photographiques ↗</a></div>
  </div>;
}
export function ClosingBeat() {
  const video = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState("");
  useEffect(() => { const element = video.current; return () => { element?.pause(); }; }, []);
  return <div className="closing-video-layout"><div><p className="eyebrow">ET MAINTENANT ?</p><h1>Tout commence<br /><span className="blue-text">par une occasion d’agir.</span></h1><p>Huit formes, huit histoires incroyables : toutes ont commencé quand quelqu’un a vu une opportunité et a décidé d’agir.</p><p className="closing-overlap">Les formes peuvent se combiner. À vous d’écrire la suite.</p></div><div data-video-controls><video ref={video} controls playsInline preload="metadata" aria-label="Vidéo de conclusion" onError={() => setError("La vidéo n’a pas pu être chargée. Utilisez le lien ci-dessous.")}><source src="/media/conclusion.mp4" type="video/mp4" />Votre navigateur ne peut pas lire cette vidéo.</video><button className="button primary" onClick={() => { void video.current?.play().catch(() => setError("Appuyez sur Lecture dans le lecteur vidéo.")); }}><Play size={19} /> Lire la vidéo</button>{error && <p role="alert">{error} <a href="/media/conclusion.mp4">Ouvrir la vidéo</a></p>}</div></div>;
}
