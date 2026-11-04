"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Label } from "@/components/film/Marks";
import { asset } from "@/lib/content/asset";
import { useNearViewport } from "@/lib/motion/use-near-viewport";

/**
 * The riding kit on /safety, one piece at a time: as the page scrolls, each piece joins the scene and the camera turns to it,
 * and its details sit beside the model. The pieces already shown stay in the scene, dimmed, while the current one is lit.
 */
const TACK_URL = asset("/models/tack-parts.glb");

export const KIT_PARTS = [
  { node: "helmet", name: "Riding helmet", note: "A certified helmet is fastened before every mount. It guards the head in the fall that nobody plans for." },
  { node: "bridle", name: "Bridle", note: "A snaffle bridle with a cavesson noseband. The bit rests at the corner of the mouth, so the lightest hand is enough to steer." },
  { node: "saddle", name: "Saddle", note: "The saddle sits on its stand. It seats the rider centred over the horse's back, and the girth keeps it from shifting." },
  { node: "stirrups", name: "Stirrup irons", note: "The irons carry the rider's feet, heels down and toes forward. A foot that slips out of the iron can be freed quickly." },
  { node: "whip", name: "Schooling whip", note: "A short whip is an aid, not a punishment: a light tap behind the leg asks the horse to move forward." },
  { node: "gloves", name: "Riding gloves", note: "Leather gloves give grip on the reins and keep the palm from rope burn during a long session." },
  { node: "boots", name: "Riding boots", note: "Tall leather boots with a defined heel protect the lower leg and stop the foot passing through the stirrup." },
] as const;

const KitStage = dynamic(() => import("./KitStage").then((m) => m.KitStage), { ssr: false });

export function SafetyKitScroll() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(0);
  const [active, setActive] = useState(0);
  const stageNear = useNearViewport(stageRef);

  useEffect(() => {
    const onScroll = () => {
      const el = sectionRef.current;
      if (!el) return;
      const span = el.offsetHeight - window.innerHeight;
      const p = span > 0 ? Math.min(1, Math.max(0, -el.getBoundingClientRect().top / span)) : 0;
      const i = Math.min(KIT_PARTS.length - 1, Math.floor(p * KIT_PARTS.length));
      activeRef.current = i;
      setActive(i);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const part = KIT_PARTS[active];

  return (
    <section
      ref={sectionRef}
      aria-labelledby="safety-kit-h"
      className="tone-dark relative bg-night"
      style={{ height: `${KIT_PARTS.length * 100}svh` }}
    >
      <h2 id="safety-kit-h" className="sr-only">
        The riding kit, piece by piece
      </h2>
      <div className="sticky top-0 flex h-[100svh] flex-col overflow-hidden lg:flex-row">
        <div ref={stageRef} className="relative h-[46svh] w-full shrink-0 lg:h-full lg:w-[60%]">
          {stageNear && (
            <Suspense fallback={null}>
              <KitStage activeRef={activeRef} />
            </Suspense>
          )}
        </div>
        <div className="gutter relative flex flex-1 flex-col justify-center gap-6 pb-10 pt-4 lg:pb-0 lg:pr-14">
          <Label>The kit · {String(active + 1).padStart(2, "0")} / {String(KIT_PARTS.length).padStart(2, "0")}</Label>
          <p className="t-inscribe text-display-2 text-bone" aria-live="polite">
            {part.name}
          </p>
          <p className="t-story max-w-[38ch] text-sand">{part.note}</p>
          <div className="flex gap-2" aria-hidden>
            {KIT_PARTS.map((p, k) => (
              <span
                key={p.node}
                className={`h-1.5 w-6 rounded-full transition-colors ${k <= active ? "bg-gold" : "bg-bone/20"}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
