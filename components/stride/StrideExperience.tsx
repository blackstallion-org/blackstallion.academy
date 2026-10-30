"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { useCapabilities } from "@/lib/3d/use-capabilities";
import { useReducedMotion } from "@/lib/motion/reduced";
import { StrideClock } from "@/lib/stride/clock";
import { useMediaQuery, useStrideRig } from "@/lib/stride/hooks";
import { StrideStore, type HotspotId } from "@/lib/stride/store";
import { cn } from "@/lib/utils";
import { LabPanel, ViewControls } from "./LabPanel";
import { StrideTimeline, StrideTransport } from "./StrideChart";
import { Chapter, Notes, Opening, StaticFootfalls } from "./StrideNarrative";
import { HotspotMarkers, StrideStage } from "./StrideStage";
import type { StageController } from "./stage-controller";
import type { StrideData } from "@/lib/stride/rig";
import { asset } from "@/lib/content/asset";

const POSTER = asset("/models/marwari-hero-poster.webp");
const REST_PHASE = 0.12; // the still pose under reduced motion: three hooves down, the rider upright

/**
 * /stride. One pinned stage (a single WebGL canvas) stays behind the whole page; the page scrolls over it and steers its camera,
 * from the opening through three beats to the laboratory. Under reduced motion nothing is pinned: the stage is an ordinary block
 * in the laboratory, still until you press play. Without WebGL the stage is the poster and the words and the footfall diagram stay.
 */
export function StrideExperience({ embedded = false }: { /** True inside another page: the opening then uses an h2. */ embedded?: boolean } = {}) {
  const reduced = useReducedMotion();
  const wide = useMediaQuery("(min-width: 1024px)");
  const roomy = useMediaQuery("(min-width: 1280px)");
  const caps = useCapabilities();
  const [clock] = useState(() => new StrideClock());
  const [store] = useState(() => new StrideStore());
  const markers = useMemo(() => new Map<HotspotId, HTMLElement>(), []);
  const [stageFailed, setStageFailed] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const openingRef = useRef<HTMLElement>(null);
  const chapterEls = useRef<(HTMLElement | null)[]>([]);
  const labRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const dockRef = useRef<HTMLDivElement>(null);
  const controller = useRef<StageController | null>(null);
  const toolsRef = useRef<HTMLDivElement>(null);

  const pinned = !reduced;
  const dockInStage = pinned && wide;
  const toolsOnStage = dockInStage && roomy; // a column of controls down the left edge of the stage, where the horse is not
  // the stage is a different element in the pinned and stacked layouts, so the observers are keyed on the layout
  const [nearStage, setNearStage] = useState(false);
  const [onScreen, setOnScreen] = useState(false);
  useEffect(() => {
    const el = stageRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const near = new IntersectionObserver(([e]) => e.isIntersecting && setNearStage(true), { rootMargin: "500px" });
    const live = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting), { rootMargin: "120px" });
    near.observe(el);
    live.observe(el);
    return () => {
      near.disconnect();
      live.disconnect();
    };
  }, [pinned]);
  const webgl = caps?.webgl;
  const { status, rig } = useStrideRig(webgl === true && (pinned || nearStage));
  const data: StrideData | null = rig?.data ?? null;
  const unavailable = webgl === false || status === "failed" || stageFailed;
  const live = status === "ready" && !!rig && !unavailable;
  useSyncExternalStore(store.subscribe, store.getVersion, store.getVersion);

  /* checks only: ?stridedebug exposes the clock, the store, the rig and the stage controller to the QA scripts */
  useEffect(() => {
    if (!live || !rig || !/[?&]stridedebug\b/.test(window.location.search)) return;
    Object.assign(window, { __stride: { clock, store, rig, get ctrl() { return controller.current; } } });
    return () => void Reflect.deleteProperty(window, "__stride");
  }, [live, rig, clock, store]);

  /* the clock starts at a still pose under reduced motion, and plays by itself otherwise once the animation is ready */
  useEffect(() => {
    if (!live) return;
    if (reduced) clock.set(REST_PHASE);
    else clock.play();
  }, [live, reduced, clock]);

  /* the page's position steers the camera; the panel and the dock tell it how much of the stage they cover */
  useEffect(() => {
    if (!pinned) {
      store.setStory(4, 0, 0);
      return;
    }
    const update = () => {
      const vh = window.innerHeight;
      const mid = vh * 0.5;
      const els = [openingRef.current, ...chapterEls.current.slice(0, 3)];
      const lab = labRef.current;
      if (els.some((e) => !e) || !lab) return;
      // anchors: the middle of the opening and of each beat, then the top of the laboratory
      const anchors = [...els.map((e) => e!.getBoundingClientRect()).map((r) => r.top + r.height / 2), lab.getBoundingClientRect().top];
      let story = 0;
      if (mid >= anchors[anchors.length - 1]) story = 4;
      else {
        for (let i = 0; i < anchors.length - 1; i++) {
          if (mid <= anchors[i + 1] && mid >= anchors[i]) {
            story = i + (mid - anchors[i]) / (anchors[i + 1] - anchors[i]);
            break;
          }
        }
        if (mid < anchors[0]) story = 0;
      }
      if (wide) {
        // one beat at a time: the text fades as its section leaves the middle of the screen
        for (const e of els) {
          const r = e!.getBoundingClientRect();
          const d = Math.abs(r.top + r.height / 2 - mid) / vh;
          const t = Math.min(1, Math.max(0, (d - 0.3) / 0.3));
          e!.style.opacity = String(1 - t * t * (3 - 2 * t));
        }
      } else {
        for (const e of els) e!.style.opacity = "";
      }
      const panelW = wide && panelRef.current ? panelRef.current.getBoundingClientRect().width : 0;
      const inset = wide ? panelW / window.innerWidth : 0;
      const dockEl = dockRef.current;
      const stageH = stageRef.current?.clientHeight || vh;
      const dock = dockInStage && dockEl ? dockEl.offsetHeight / stageH : 0;
      if (dockInStage && dockEl) {
        dockEl.style.width = `${window.innerWidth - panelW}px`;
        // the dock rises from the bottom edge as the camera settles into the laboratory
        const t = Math.min(1, Math.max(0, (story - 3.55) / 0.4));
        const a = t * t * (3 - 2 * t);
        dockEl.style.transform = reduced ? "" : `translateY(${((1 - a) * 100).toFixed(1)}%)`;
        dockEl.style.opacity = reduced ? String(a > 0.5 ? 1 : 0) : "1";
        dockEl.style.visibility = a < 0.01 ? "hidden" : "visible";
        dockEl.style.pointerEvents = a > 0.6 ? "auto" : "none";
        const tools = toolsRef.current;
        if (tools) {
          tools.style.opacity = String(a);
          tools.style.visibility = a < 0.01 ? "hidden" : "visible";
          tools.style.pointerEvents = a > 0.6 ? "auto" : "none";
        }
      }
      store.setStory(story, inset, dock);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    const ro = new ResizeObserver(update);
    if (panelRef.current) ro.observe(panelRef.current);
    if (dockRef.current) ro.observe(dockRef.current);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      ro.disconnect();
    };
  }, [pinned, wide, dockInStage, store, live, reduced]);

  const select = useCallback(
    (id: HotspotId | null) => {
      if (!id) {
        store.patch({ hotspot: null });
        return;
      }
      const view = store.view;
      const fix = (id === "rider-pelvis" && view === "horse") || (id !== "rider-pelvis" && view === "rider") ? { view: "combined" as const } : {};
      store.patch({ hotspot: id, manual: true, ...fix });
      // the explanation sits in the panel (or under the stage on a phone): bring it into view if it is not
      window.setTimeout(() => {
        const card = document.querySelector('[data-testid="hotspot-card"]');
        if (!card) return;
        const r = card.getBoundingClientRect();
        if (r.top < window.innerHeight * 0.1 || r.bottom > window.innerHeight * 0.96) card.scrollIntoView({ block: wide ? "center" : "center", behavior: reduced ? "auto" : "smooth" });
      }, 120);
    },
    [store, wide, reduced],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && store.hotspot) store.patch({ hotspot: null });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [store]);

  /* ---- pieces */
  const dock: ReactNode = (
    <div
      ref={dockRef}
      className={cn(
        dockInStage ? "absolute bottom-0 left-0 z-20 border-t border-line bg-night px-[max(16px,3vw)] pb-4 pt-4" : "gutter border-t border-line py-6",
      )}
      style={dockInStage ? { transform: "translateY(100%)", visibility: "hidden" } : undefined}
      data-testid="dock"
    >
      {data ? (
        <>
          <StrideTransport clock={clock} perStride={data.channels.vertical.perStride} />
          <StrideTimeline data={data} clock={clock} className="mt-4" />
        </>
      ) : (
        <div className="min-h-[9rem]">
          <p className="label text-brass">{unavailable ? "The 3D view is not available here" : "Loading the animation…"}</p>
          <StaticFootfalls className="mt-4 max-w-xl" />
        </div>
      )}
    </div>
  );

  const stage = (
    <div
      ref={stageRef}
      data-testid="stage"
      className={cn(
        "bg-night w-full overflow-hidden",
        // on a phone the stage is pinned above the scrolling text (which slides under it); on a wide screen the text scrolls over the stage
        pinned ? "sticky top-0 z-20 h-[48svh] border-b border-line lg:z-0 lg:h-svh lg:border-b-0" : "relative z-0 h-[62svh] min-h-[22rem] border-b border-line",
      )}
    >
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(70%_55%_at_50%_72%,var(--color-ember),transparent_72%)]" />
      {unavailable ? (
        <div className="absolute inset-0">
          <Image src={POSTER} alt="The academy's black Marwari stallion in a studio" fill sizes="100vw" className="object-contain object-center" priority={false} />
        </div>
      ) : (
        live &&
        rig && (
          <>
            <StrideStage
              rig={rig}
              clock={clock}
              store={store}
              reduced={reduced}
              wide={wide}
              quality={caps?.quality ?? "low"}
              active={onScreen}
              markers={markers}
              onFail={() => setStageFailed(true)}
              onController={(c) => void (controller.current = c)}
            />
            <HotspotMarkers markers={markers} selected={store.hotspot} onSelect={select} />
          </>
        )
      )}
      {!live && !unavailable && (
        <p className="label absolute bottom-6 left-1/2 -translate-x-1/2 text-dust" role="status">
          Preparing the horse…
        </p>
      )}
      {live && !dockInStage && <StagePlay clock={clock} />}
      {dockInStage && dock}
      {toolsOnStage && live && (
        <div ref={toolsRef} className="absolute left-[max(16px,2.5vw)] top-28 z-20" style={{ opacity: 0, visibility: "hidden" }}>
          <ViewControls store={store} vertical />
        </div>
      )}
    </div>
  );

  return (
    <>
      <div className="relative" data-stride-layout={pinned ? (wide ? "pinned-wide" : "pinned-narrow") : "stacked"}>
        {pinned && stage}
        <div className={cn("relative z-10", pinned && "lg:-mt-[100svh] lg:pointer-events-none")}>
          <Opening ref={openingRef} pinned={pinned} embedded={embedded} />
          {[0, 1, 2].map((i) => (
            <Chapter key={i} ref={(el) => void (chapterEls.current[i] = el)} index={i} pinned={pinned} />
          ))}
          <section ref={labRef} id="laboratory" aria-labelledby="lab-h" className={cn("relative", pinned && wide && "lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(27rem,36rem)]")}>
            {pinned && wide && <div aria-hidden />}
            <div className={cn("bg-night", pinned && wide ? "pointer-events-auto border-l border-line" : "")}>
              {!pinned && stage}
              {!dockInStage && dock}
              <div ref={panelRef} className="gutter py-14 lg:pt-28 lg:pb-24 lg:px-10">
                <LabPanel data={data} clock={clock} store={store} reduced={reduced} onSelect={select} toolsOnStage={toolsOnStage} />
              </div>
            </div>
          </section>
        </div>
      </div>
      <Notes />
    </>
  );
}

/** A play button in the corner of the stage, for the layouts where the dock is further down the page. */
function StagePlay({ clock }: { clock: StrideClock }) {
  useSyncExternalStore(clock.subscribeState, clock.getStateVersion, clock.getStateVersion);
  return (
    <button
      type="button"
      onClick={() => clock.toggle()}
      aria-pressed={clock.playing}
      aria-label={clock.playing ? "Pause" : "Play"}
      className="absolute bottom-4 right-4 z-10 flex h-11 w-11 items-center justify-center border border-line bg-night text-bone hover:border-gold hover:text-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
    >
      {clock.playing ? (
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
          <path d="M4 3h3v10H4zM9 3h3v10H9z" fill="currentColor" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
          <path d="M5 3v10l8-5-8-5Z" fill="currentColor" />
        </svg>
      )}
    </button>
  );
}
