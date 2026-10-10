import type { Metadata } from "next";
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/dm-sans";
import "./globals.css";
export const metadata: Metadata = { title: "Entreprendre.Lab — À vous de jouer", description: "Un problème. Huit façons d’entreprendre. Une présentation interactive pour comprendre et jouer ensemble." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="fr"><body>{children}</body></html>; }
