import type { FormId } from "@/types/domain";

const faces: Record<FormId, { skin: string; shirt: string; hair: string; style: number }> = {
  exnihilo: { skin: "#db936d", shirt: "#ed735e", hair: "#263241", style: 0 },
  essaimage: { skin: "#bd795c", shirt: "#4770df", hair: "#263241", style: 1 },
  franchise: { skin: "#c58562", shirt: "#ed9c45", hair: "#263241", style: 2 },
  intrapreneur: { skin: "#dfaa80", shirt: "#64a38a", hair: "#5b3b2c", style: 3 },
  repreneur: { skin: "#ba7254", shirt: "#df7562", hair: "#263241", style: 4 },
  social: { skin: "#e6b892", shirt: "#ac77a7", hair: "#334b5c", style: 5 },
  techno: { skin: "#e1b28f", shirt: "#4f6bdd", hair: "#734b31", style: 6 },
  vert: { skin: "#ab674d", shirt: "#57a385", hair: "#27363e", style: 7 },
};
export function Portrait({ id, className = "" }: { id: FormId; className?: string }) {
  const p = faces[id];
  const long = [0, 4, 5, 7].includes(p.style);
  return <svg viewBox="0 0 220 230" className={className} fill="none" aria-hidden="true">
    <path d="M32 230c1-52 32-83 78-83s78 31 79 83" fill={p.shirt} stroke="#203246" strokeWidth="3" />
    {long && <path d="M58 139V83c0-39 22-59 53-59s52 21 52 60v63c-32 18-73 16-105-8Z" fill={p.hair} stroke="#203246" strokeWidth="3" />}
    <path d="M93 132v26c9 12 24 13 34 0v-26" fill={p.skin} stroke="#203246" strokeWidth="3" />
    <path d="M71 79c-13-1-13 24 0 25M149 79c13-1 13 24 0 25" fill={p.skin} stroke="#203246" strokeWidth="3" />
    <path d="M71 64c0-24 76-27 78 3v34c-1 32-18 45-38 45s-39-15-40-45V64Z" fill={p.skin} stroke="#203246" strokeWidth="3" />
    {p.style === 5 ? <path d="M62 112c-11-74 18-87 48-87 35 0 53 27 50 76l-12-6c0-30-10-38-17-44-17 23-37 24-58 23l-1 38-10 0Z" fill={p.hair} stroke="#203246" strokeWidth="3" /> : p.style % 3 === 0 ? <path d="M69 84c-12-26-8-58 22-61 33-19 65 4 61 39-15 4-29-2-42-14-6 18-20 21-38 23l-3 13Z" fill={p.hair} stroke="#203246" strokeWidth="3" /> : <path d="M67 83c-10-40 10-63 45-58 36-8 52 22 39 57l-9-25c-18 8-41 7-56-3L73 85Z" fill={p.hair} stroke="#203246" strokeWidth="3" />}
    {p.style === 7 && <><circle cx="64" cy="38" r="22" fill={p.hair} stroke="#203246" strokeWidth="3" /><circle cx="151" cy="37" r="22" fill={p.hair} stroke="#203246" strokeWidth="3" /></>}
    <path d="M87 82h8m30 0h8" stroke="#203246" strokeWidth="3" strokeLinecap="round" />
    <ellipse cx="93" cy="94" rx="2.5" ry="3.5" fill="#203246" /><ellipse cx="128" cy="94" rx="2.5" ry="3.5" fill="#203246" />
    <path d="m111 94-3 14h6m-17 13c8 7 18 7 25-1" stroke="#203246" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    {[2, 6].includes(p.style) && <g stroke="#203246" strokeWidth="3"><rect x="79" y="85" width="26" height="21" rx="7" /><rect x="116" y="85" width="26" height="21" rx="7" /><path d="M105 92h11" /></g>}
    {p.style === 3 && <path d="m85 122 5 17c16 12 32 11 42-4l5-17c-16 9-36 12-52 4Z" fill={p.hair} />}
    {p.style === 0 ? <path d="M70 167v62h80v-62m-53 16h27v20H97z" stroke="#f9ecd4" strokeWidth="9" /> : <path d="m77 155 16 27 17-15 18 15 16-27M110 182v47" stroke="#203246" strokeWidth="2.5" />}
    <path d="M54 208v22m113-22v22" stroke="#203246" strokeWidth="3" />
  </svg>;
}
export function CampusArt({ compact = false }: { compact?: boolean }) {
  return <div className={`campus-art ${compact ? "compact" : ""}`} aria-hidden="true">
    <svg className="campus-scene" viewBox="0 0 600 500" fill="none">
      <path d="M130 113c73-58 174-67 246-28 97 52 124 181 86 259-33 69-166 86-263 54C91 363 46 207 130 113Z" fill="#dfe9fa" />
      <path d="m130 400 360 0M152 416h250" stroke="#25374b" strokeWidth="3" strokeLinecap="round" />
      <path d="M192 236h228v162H192z" fill="#fff9e9" stroke="#25374b" strokeWidth="3" />
      <path d="M211 181h190v60H211z" fill="#ffda5f" stroke="#25374b" strokeWidth="3" />
      <text x="306" y="219" textAnchor="middle" fontSize="23" fontWeight="800" fill="#25374b" fontFamily="DM Sans, sans-serif" letterSpacing="3">LE CAMPUS</text>
      <path d="m185 241 23-21h198l23 21v35H185v-35Z" fill="#ed7964" stroke="#25374b" strokeWidth="3" />
      <path d="M207 223v50m44-50v50m44-50v50m44-50v50m44-50v50" stroke="#fff9e9" strokeWidth="23" />
      <path d="M185 241h244M185 276h244" stroke="#25374b" strokeWidth="3" />
      <path d="M216 301h88v65h-88z" fill="#bfdbc7" stroke="#25374b" strokeWidth="3" />
      <path d="M326 296h69v102h-69z" fill="#6485de" stroke="#25374b" strokeWidth="3" />
      <path d="M335 306h51v46h-51z" fill="#dbe5ff" stroke="#25374b" strokeWidth="2" />
      <circle cx="383" cy="368" r="3" fill="#25374b" />
      <path d="M243 316v16m8-16v16m8-16v16m-16-8h16m-8 4v20m20-26c-6 9-4 16 2 16v11" stroke="#25374b" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M433 331c5-28 32-51 46-38 10 8-5 38-42 45m4 15c14-21 42-20 44-6 2 13-21 19-44 14" fill="#84b59c" stroke="#25374b" strokeWidth="3" />
      <path d="m439 336-4 47m-14-8h29l-6 23h-18l-5-23Z" fill="#ec9e71" stroke="#25374b" strokeWidth="3" />
      <path d="m176 108 6-18 7 18 19 4-17 9-1 19-11-14-19 5 10-16-9-16 15 9Z" fill="#ffcc45" stroke="#25374b" strokeWidth="2.5" />
      <path d="m468 173 8 8m-7 0 7-8M111 288l11 11m-11 0 11-11" stroke="#25374b" strokeWidth="3" strokeLinecap="round" />
      <path d="M327 118c12-14 23-12 28-2 6 16-15 22-15 30m0 12v2" stroke="#2d50d3" strokeWidth="6" strokeLinecap="round" />
      <path d="M234 155c-5-36 31-37 40-16" stroke="#25374b" strokeWidth="2.5" strokeDasharray="5 5" />
      <path d="m265 137 11 7 0-13" stroke="#25374b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
    <div className="art-person art-lina"><Portrait id="exnihilo" /><span>Lina <span>✦</span></span></div>
    <div className="art-person art-adam"><Portrait id="techno" /><span>Adam <span>↗</span></span></div>
    <div className="art-person art-jade"><Portrait id="vert" /><span>Jade <span>✳</span></span></div>
    <div className="jury-sticker">Le jury,<br /><strong>c’est vous !</strong><span>↗</span></div>
    <div className="art-caption">Même problème. Huit chemins possibles.</div>
  </div>;
}
