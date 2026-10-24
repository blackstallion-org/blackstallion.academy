"use client";

import { useState } from "react";
import { BlueprintPlan } from "@/components/sections/schools/BlueprintPlan";
import { tiers } from "@/lib/content/schools";

export function CampusPlan() {
  const [perspective, setPerspective] = useState(false);
  const [angle, setAngle] = useState(-15);
  return <div className="mt-6 max-w-4xl border border-line p-4">
    <div className="flex flex-wrap gap-3" role="group" aria-label="Campus drawing view"><button type="button" aria-pressed={!perspective} onClick={() => setPerspective(false)} className="label border border-brass px-4 py-3 text-gold">Plan view</button><button type="button" aria-pressed={perspective} onClick={() => setPerspective(true)} className="label border border-brass px-4 py-3 text-gold">Spatial view</button></div>
    <div className="overflow-hidden py-6" style={{ perspective: "1000px", touchAction: "pan-y" }}><div style={{ transform: perspective ? `rotateX(45deg) rotateZ(${angle}deg)` : undefined, transformStyle: "preserve-3d" }}><BlueprintPlan tier={tiers[1]} /></div></div>
    {perspective && <label className="block text-sm text-sand">Rotate concept plan<input type="range" min="-45" max="45" value={angle} onChange={(event) => setAngle(Number(event.target.value))} className="block min-h-11 w-full accent-[#c9a66b]" /></label>}
  </div>;
}
