"use client";

import Link from "next/link";
import { useRef, useState } from "react";

export function TrojanBox() {
  const [angle, setAngle] = useState(-25);
  const drag = useRef<{ x: number; angle: number } | null>(null);
  return <section aria-labelledby="trojan-h" className="tone-dark gutter grid gap-10 bg-night py-20 lg:grid-cols-2 lg:items-center">
    <div><p className="label text-brass">An invitation to the institution</p><h2 id="trojan-h" className="t-voice mt-4 text-[clamp(2rem,5vw,4.5rem)] leading-tight text-bone">The Trojan Presentation Box</h2><p className="mt-5 max-w-lg text-sand">Matte black, copper edges, a leather sleeve and a brass seal. Explore the 350 ml presentation concept, designed to introduce a campus to the academy.</p><p className="mt-3 text-sm text-dust">Interactive design concept. Final dimensions, contents and product photography await approval.</p><Link href="/schools/access" className="label mt-8 inline-block border border-gold px-5 py-4 text-gold hover:bg-gold hover:text-night">Sovereign Access →</Link></div>
    <div className="min-w-0 border border-line bg-night p-5">
      <div className="trojan-stage" onPointerDown={(e) => { if (e.target instanceof HTMLButtonElement) return; drag.current = { x: e.clientX, angle }; }} onPointerMove={(e) => { if (drag.current) setAngle(drag.current.angle + (e.clientX - drag.current.x) * 0.7); }} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }} onPointerLeave={() => { drag.current = null; }}>
        <div className="trojan-box" style={{ transform: `rotateX(-15deg) rotateY(${angle}deg)` }} aria-hidden>
          <div className="trojan-face trojan-front"><span className="trojan-seal">BSAH</span><span className="mt-4 text-xs tracking-widest">SOVEREIGN INVITATION</span></div>
          <div className="trojan-face trojan-back"><span className="text-xs tracking-widest">DOMINUS SUI<br />DOMINUS EQUI</span></div>
          <div className="trojan-face trojan-left" /><div className="trojan-face trojan-right" /><div className="trojan-face trojan-top"><span className="text-xs">LEATHER SLEEVE</span></div><div className="trojan-face trojan-bottom" />
        </div>
      </div>
      <label className="block text-sm text-sand" htmlFor="trojan-angle">Rotate presentation box · swipe or use the slider</label><input id="trojan-angle" type="range" min="-180" max="180" step="1" value={((angle + 180) % 360 + 360) % 360 - 180} onChange={(e) => setAngle(Number(e.target.value))} className="mt-3 min-h-11 w-full accent-[#c9a66b]" />
      <details className="mt-3 text-sm text-sand"><summary className="cursor-pointer py-3 text-gold">Inside the presentation</summary><p className="leading-relaxed">Proposed custom foam cutouts protect the 350 ml gift, institutional passport and sealed invitation. Contents are a design specification pending approval.</p></details>
    </div>
  </section>;
}
