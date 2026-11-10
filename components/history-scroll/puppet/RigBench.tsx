"use client";

import { useState } from "react";
import { RIGS } from "@/lib/content/history/rigs";
import { Puppet } from "./Puppet";
import type { Figure, Limb, P } from "./types";
import "../history-scroll.css";

const PATH: Record<string, string> = { IN: "india", WO: "world", JH: "lakshmibai", AL: "alexander" };
const srcFor = (id: string) => `/images/history/${PATH[id.slice(0, 2)]}/${id.toLowerCase()}-s.webp`;

function Bones({ f }: { f: Figure }) {
  const line = (a: P, b: P, k: string) => <line key={k} x1={a[0] * 100} y1={a[1] * 100} x2={b[0] * 100} y2={b[1] * 100} />;
  const limb = (l: Limb | undefined, k: string) => (l ? [line(l.top, l.mid, `${k}a`), line(l.mid, l.end, `${k}b`)] : []);
  if (f.kind === "horse")
    return (
      <g>
        {line(f.tailRoot, f.withers, "b")}
        {line(f.withers, f.poll, "n")}
        {line(f.poll, f.muzzle, "h")}
        {line(f.tailRoot, f.tailTip, "t")}
        {(["FL", "FR", "HL", "HR"] as const).flatMap((k) => limb(f.legs[k], k))}
      </g>
    );
  return (
    <g>
      {line(f.hip, f.neck, "t")}
      {line(f.neck, f.head, "h")}
      {limb(f.armA, "aa")}
      {limb(f.armB, "ab")}
      {limb(f.legA, "la")}
      {limb(f.legB, "lb")}
    </g>
  );
}

export function RigBench({ only }: { only: string | null }) {
  const [show, setShow] = useState(true);
  const ids = Object.keys(RIGS).filter((id) => !only || only.split(",").includes(id));
  return (
    <main className="hs gutter pb-20 pt-28">
      <button type="button" className="hs-button mb-6" onClick={() => setShow(!show)} aria-pressed={show}>
        Bones
      </button>
      <div className="grid gap-6 md:grid-cols-2">
        {ids.map((id) => (
          <figure key={id} data-rig={id}>
            <div className="relative">
              <div className="hs-gait">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={srcFor(id)} alt="" className="block h-auto w-full" />
                <Puppet rig={RIGS[id]} />
              </div>
              {show && (
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full" style={{ stroke: "#e11", strokeWidth: 0.4, vectorEffect: "non-scaling-stroke" } as React.CSSProperties}>
                  {RIGS[id].figures.map((f, i) => (
                    <Bones key={i} f={f} />
                  ))}
                </svg>
              )}
            </div>
            <figcaption className="font-mono text-xs">{id}</figcaption>
          </figure>
        ))}
      </div>
    </main>
  );
}
