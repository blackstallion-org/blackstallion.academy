"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/motion/reduced";

const pathways = [
  { name: "Cervical alignment", target: "Ears & attention", y: 85, text: "A balanced head and quiet gaze help the cadet give consistent cues. The horse’s ear position offers one observable signal of attention; instructors interpret it alongside the whole horse." },
  { name: "Core posture", target: "Withers & seat", y: 155, text: "A steady trunk and balanced seat help the rider follow the horse’s movement without gripping. Instructor feedback connects posture to a quieter, more consistent contact." },
  { name: "Lumbar balance", target: "Reins & contact", y: 225, text: "A supple lower back lets the rider move with the stride. Quiet hands maintain an even rein contact; these are riding cues, not claims of neurological treatment." },
];

export function SomaticMap() {
  const [active, setActive] = useState(1);
  const id = useId();
  const reduced = useReducedMotion();
  // The travelling pulse is an SVG (SMIL) animation, which runs on the main thread every frame; it now pauses while
  // the map is off screen and carries on from the same point when it returns.
  const svgRef = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) svg.unpauseAnimations();
      else svg.pauseAnimations();
    });
    observer.observe(svg);
    return () => observer.disconnect();
  }, []);
  return (
    <div className="mt-12 border border-line bg-night p-4 sm:p-8">
      <h3 className="t-voice text-2xl text-gold">One conversation. Two bodies.</h3>
      <p className="mt-2 max-w-xl text-sm text-sand">Select a connection to explore how balanced riding cues reach the horse.</p>
      <svg ref={svgRef} viewBox="0 0 600 290" className="mt-6 w-full" role="group" aria-label="Interactive rider and horse pathways">
        <title>{`Cadet to equine connection: ${pathways[active].name} to ${pathways[active].target}`}</title>
        <text x="45" y="30" fill="#c9a66b" fontSize="16">CADET SPINE</text>
        <text x="380" y="30" fill="#c9a66b" fontSize="16">MARWARI EQUINE</text>
        <path d="M125 60 C100 120 145 180 120 250 M455 60 C480 120 435 180 460 250" fill="none" stroke="#9c8058" strokeWidth="3" />
        {pathways.map((path, index) => <g key={path.name} opacity={active === index ? 1 : 0.35}>
          <path id={`${id}-${index}`} d={`M125 ${path.y} C240 ${path.y - 40} 350 ${path.y + 40} 455 ${path.y}`} fill="none" stroke="#c9a66b" strokeWidth={active === index ? 3 : 1} />
          {[125, 455].map((x) => <g key={x} role="button" tabIndex={0} aria-label={x === 125 ? path.name : path.target} aria-pressed={active === index} aria-controls={`${id}-detail`} onClick={() => setActive(index)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setActive(index); } }} className="cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"><circle cx={x} cy={path.y} r="32" fill="transparent" /><circle cx={x} cy={path.y} r={active === index ? 11 : 8} fill="#c9a66b" /></g>)}
          {active === index && !reduced && <circle r="5" fill="#faf7f0" className="somatic-pulse"><animateMotion dur="1.8s" repeatCount="indefinite" path={`M125 ${path.y} C240 ${path.y - 40} 350 ${path.y + 40} 455 ${path.y}`} /></circle>}
        </g>)}
      </svg>
      <div className="grid gap-2 sm:grid-cols-3" role="group" aria-label="Somatic pathways">
        {pathways.map((path, index) => <button key={path.name} type="button" aria-pressed={active === index} aria-controls={`${id}-detail`} onClick={() => setActive(index)} className={`min-h-16 border p-3 text-left ${active === index ? "border-gold text-gold" : "border-line text-sand"}`}><span className="block text-sm">{path.name}</span><span className="mt-1 block text-xs text-dust">→ {path.target}</span></button>)}
      </div>
      <p id={`${id}-detail`} aria-live="polite" className="mt-5 min-h-24 max-w-3xl text-sm leading-relaxed text-sand">{pathways[active].text}</p>
      <p className="mt-3 max-w-3xl text-xs leading-relaxed text-dust">Conceptual riding cues, not a clinical model. Physiological explanations and supplied research references require specialist review before use as health claims.</p>
    </div>
  );
}
