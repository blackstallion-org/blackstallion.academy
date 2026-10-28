"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type Ref } from "react";
import { Headline } from "@/components/film/Headline";
import { campusCopy, campusModuleById, campusTiers } from "@/lib/content/campus";
import type { TierId } from "@/lib/content/schools";
import { useCapabilities } from "@/lib/3d/use-capabilities";
import { useNearViewport, useOnScreen } from "@/lib/motion/use-near-viewport";
import { useReducedMotion } from "@/lib/motion/reduced";
import { cn } from "@/lib/utils";
import { CampusConfigurationSelector } from "./CampusConfigurationSelector";
import type { CameraView } from "./CampusCameraController";
import type { CampusSceneHandle, CampusSceneProps } from "./CampusScene";
import { FacilityInformationPanel } from "./FacilityInformationPanel";
import { SitePlan2D } from "./SitePlan2D";

// three.js, drei and the model load in a chunk of their own, fetched a screen ahead of the section.
const CampusScene = dynamic<CampusSceneProps & { ref?: Ref<CampusSceneHandle> }>(() => import("./CampusScene").then((m) => m.CampusScene), { ssr: false });

const STAGE_BACKDROP = "radial-gradient(120% 90% at 50% 36%, var(--color-ember), var(--color-umber) 70%, color-mix(in srgb, var(--color-umber) 80%, var(--color-brass)) 100%)";

const controlClass =
  "label grid min-h-11 min-w-11 cursor-pointer place-items-center px-3 text-bone transition-colors hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-gold aria-pressed:text-gold";

/**
 * The campus scale model: an isometric miniature of the hub, three approved tiers, a hotspot on every building, a
 * synchronised site plan and an information card. 3D is an enhancement: without WebGL the plan and the card are the page.
 */
export function CampusExperience() {
  const caps = useCapabilities();
  const reduced = useReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<CampusSceneHandle>(null);
  const near = useNearViewport(stageRef);
  const onScreen = useOnScreen(stageRef, "120px");
  const [tabVisible, setTabVisible] = useState(true);
  const [tierId, setTierId] = useState<TierId>("standard");
  const [requested, setRequested] = useState<TierId>("standard");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [view, setView] = useState<CameraView>("overview");
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const swapping = useRef(false);

  const tier = campusTiers[tierId];
  const selected = selectedId ? (campusModuleById(tier, selectedId) ?? null) : null;
  const live3d = caps?.webgl === true && !failed;
  const fallback = (caps !== null && !caps.webgl) || failed;

  useEffect(() => {
    const onVis = () => setTabVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const back = useCallback(() => {
    setSelectedId(null);
    sceneRef.current?.overview();
  }, []);

  const select = useCallback(
    (id: string) => {
      if (id === selectedId) return back();
      setSelectedId(id);
      sceneRef.current?.focus(id);
    },
    [selectedId, back],
  );

  const changeTier = useCallback(
    async (next: TierId) => {
      if (next === tierId && !swapping.current) return;
      setRequested(next);
      if (swapping.current || next === tierId) return;
      swapping.current = true;
      setHoveredId(null);
      try {
        // The take-down is a promise; a stalled one (a hidden tab, an interrupted flight) must never leave the tiers locked.
        if (sceneRef.current && ready) await Promise.race([sceneRef.current.playOut(campusTiers[next]), new Promise<void>((resolve) => window.setTimeout(resolve, 2500))]);
      } finally {
        setSelectedId(null);
        setView("overview");
        setTierId(next);
        swapping.current = false;
      }
    },
    [tierId, ready],
  );

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.altKey || e.ctrlKey || e.metaKey || !sceneRef.current) return;
    const h = sceneRef.current;
    if (e.key === "ArrowLeft") h.orbitBy(-0.35);
    else if (e.key === "ArrowRight") h.orbitBy(0.35);
    else if (e.key === "+" || e.key === "=") h.zoomBy(0.82);
    else if (e.key === "-" || e.key === "_") h.zoomBy(1.22);
    else if (e.key === "0") {
      setSelectedId(null);
      h.overview();
    } else if (e.key === "t" || e.key === "T") h.top();
    else if (e.key === "Escape" && selectedId) back();
    else return;
    e.preventDefault();
  };

  const goToPanel = () => panelRef.current?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });

  return (
    <section id="campus-model" aria-labelledby="campus-h" className="relative scroll-mt-24 py-[clamp(5rem,12vh,10rem)]">
      <div className="gutter">
        <Headline id="campus-h" inscription={campusCopy.inscription} voice={campusCopy.voice} />
        <p className="t-story mt-6 max-w-2xl text-sand">{campusCopy.lede}</p>
        <CampusConfigurationSelector className="mt-10" value={requested} onChange={(id) => void changeTier(id)} />
      </div>

      <div className="gutter mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)] lg:items-start">
        <div
          ref={stageRef}
          tabIndex={0}
          role="group"
          aria-label={`${tier.name} campus model. Drag to turn it; the buttons zoom and reset. Arrow keys turn, plus and minus zoom, zero resets.`}
          onKeyDown={onKeyDown}
          className="relative h-[48svh] min-h-[360px] overflow-hidden border border-line focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-gold lg:h-[min(76svh,740px)] lg:min-h-[560px]"
          style={{ background: STAGE_BACKDROP }}
        >
          {live3d && near && (
            <div className="absolute inset-0">
              <CampusScene
                ref={sceneRef}
                tier={tier}
                quality={caps!.quality}
                reduced={reduced}
                paused={!onScreen || !tabVisible}
                selectedId={selectedId}
                hoveredId={hoveredId}
                onHover={setHoveredId}
                onSelect={select}
                onView={setView}
                onReady={() => setReady(true)}
                onError={() => setFailed(true)}
              />
            </div>
          )}

          {!fallback && (
            <p aria-hidden={ready} className={cn("label pointer-events-none absolute inset-0 grid place-items-center text-brass transition-opacity duration-700", ready ? "opacity-0" : "opacity-100")}>
              Building the model
            </p>
          )}

          {fallback && (
            <div className="absolute inset-0 grid place-items-center p-4 sm:p-8">
              <div className="w-full max-w-3xl">
                <SitePlan2D tier={tier} selectedId={selectedId} hoveredId={hoveredId} onSelect={select} onHover={setHoveredId} labels />
                <p className="t-ui mt-3 text-center text-xs text-dust">The 3D model is not available on this device. The plan and the card beside it carry the same data.</p>
              </div>
            </div>
          )}

          {ready && !fallback && (
            <>
              {/* The floating plan. On a phone it moves below the card, where it is wide enough to tap. */}
              <div className="plate absolute left-3 top-3 z-20 hidden w-[clamp(190px,26%,260px)] p-2 lg:block">
                <SitePlan2D tier={tier} selectedId={selectedId} hoveredId={hoveredId} onSelect={select} onHover={setHoveredId} />
              </div>

              <div className="plate absolute bottom-3 right-3 z-20 flex items-stretch divide-x divide-[color:var(--color-line)]" role="toolbar" aria-label="Camera">
                <button type="button" className={controlClass} aria-pressed={view === "overview"} onClick={() => { setSelectedId(null); sceneRef.current?.overview(); }}>
                  Isometric
                </button>
                <button type="button" className={controlClass} aria-pressed={view === "top"} onClick={() => { setSelectedId(null); sceneRef.current?.top(); }}>
                  Plan
                </button>
                <button type="button" className={cn(controlClass, "hidden sm:grid")} aria-label="Turn left" onClick={() => sceneRef.current?.orbitBy(-0.45)}>
                  <span aria-hidden>‹</span>
                </button>
                <button type="button" className={cn(controlClass, "hidden sm:grid")} aria-label="Turn right" onClick={() => sceneRef.current?.orbitBy(0.45)}>
                  <span aria-hidden>›</span>
                </button>
                <button type="button" className={controlClass} aria-label="Zoom out" onClick={() => sceneRef.current?.zoomBy(1.22)}>
                  <span aria-hidden>−</span>
                </button>
                <button type="button" className={controlClass} aria-label="Zoom in" onClick={() => sceneRef.current?.zoomBy(0.82)}>
                  <span aria-hidden>+</span>
                </button>
              </div>

              {selected && (
                <button type="button" onClick={goToPanel} className="plate label absolute left-3 top-3 z-20 flex min-h-11 cursor-pointer items-center gap-2 px-3 text-bone lg:hidden">
                  <span className="truncate">{selected.name}</span>
                  <span aria-hidden className="text-gold">
                    Details ↓
                  </span>
                  <span className="sr-only">Show details</span>
                </button>
              )}
            </>
          )}
        </div>

        <div ref={panelRef} className="scroll-mt-24 space-y-6">
          <FacilityInformationPanel tier={tier} module={selected} onSelect={select} onBack={back} />
          {!fallback && (
            <div className="plate p-3 lg:hidden">
              <SitePlan2D tier={tier} selectedId={selectedId} hoveredId={hoveredId} onSelect={select} onHover={setHoveredId} labels />
            </div>
          )}
        </div>
      </div>

      <p className="gutter t-ui mt-8 max-w-3xl text-xs leading-relaxed text-dust">{campusCopy.footnote}</p>
    </section>
  );
}
