"use client";
import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";
export function LocalVideo({ src, label, buttonLabel, className = "" }: { src: string; label: string; buttonLabel: string; className?: string }) {
  const video = useRef<HTMLVideoElement>(null), [error, setError] = useState("");
  useEffect(() => { const element = video.current; return () => element?.pause(); }, [src]);
  return <div data-video-controls className={className}><video ref={video} controls playsInline preload="metadata" aria-label={label} onError={() => setError("La vidéo n’a pas pu être chargée.")}><source src={src} type="video/mp4" />Votre navigateur ne peut pas lire cette vidéo.</video><button className="button primary" onClick={() => { void video.current?.play().catch(() => setError("Appuyez sur Lecture dans le lecteur vidéo.")); }}><Play size={19} />{buttonLabel}</button>{error && <p role="alert">{error} <a href={src}>Ouvrir la vidéo</a></p>}</div>;
}
