"use client";
import Link from "next/link";
import { X, ArrowUpRight } from "lucide-react";
import { useEffect, useRef } from "react";

export function Brand() {
  return <Link className="brand" href="/" aria-label="Entreprendre Lab, accueil"><span className="brand-mark"><i /><i /><i /><i /></span><span>entreprendre<span className="brand-dot">.</span><b>lab</b></span></Link>;
}
export function DemoBadge() { return <span className="demo-badge"><span /> RÉPÉTITION LOCALE</span>; }
export function Modal({ title, children, close }: { title: string; children: React.ReactNode; close: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { const el = dialog.current; el?.showModal(); return () => el?.close(); }, []);
  return <dialog ref={dialog} className="modal" aria-label={title} onCancel={e => { e.preventDefault(); close(); }} onClick={e => { if (e.target === e.currentTarget) close(); }}><div className="modal-head"><h2>{title}</h2><button className="icon-button" aria-label="Fermer" onClick={close}><X size={22} /></button></div>{children}</dialog>;
}
export function LocalNotice() { return <p className="local-notice">Les réponses sont conservées sur cet ordinateur. Pour jouer sur téléphone, utilisez le même Wi-Fi. <Link href="/privacy">En savoir plus <ArrowUpRight size={12} /></Link></p>; }
export async function api<T>(code: string, body?: object, query = ""): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch(`/api/rooms${code ? "/" + code : ""}${query}`, { method: body ? "POST" : "GET", headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined, cache: "no-store", signal: controller.signal });
    const data = await response.json();
    if (!response.ok) { const error = new Error(data.error || "Connexion interrompue.") as Error & { code?: string }; error.code = data.code; throw error; }
    return data;
  } catch (error) {
    if (controller.signal.aborted) throw new Error("Le serveur ne répond pas. Vérifiez la connexion puis réessayez.");
    throw error;
  } finally { clearTimeout(timer); }
}
