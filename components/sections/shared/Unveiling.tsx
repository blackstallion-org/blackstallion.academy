"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { motion, useMotionValueEvent, useTransform, type MotionValue } from "motion/react";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { ErrorBoundary } from "@/components/3d/ErrorBoundary";
import type { RelightInput } from "@/components/3d/relight/RelightStage";
import { Headline } from "@/components/film/Headline";
import { Label } from "@/components/film/Marks";
import { PinnedScene } from "@/components/film/PinnedScene";
import { r } from "@/components/film/range";
import { useCapabilities } from "@/lib/3d/use-capabilities";
import { unveilingChrome as chrome, type UnveilingBeat, type UnveilingScene } from "@/lib/content/unveiling";
import { useNearViewport, useOnScreen } from "@/lib/motion/use-near-viewport";
import { cn } from "@/lib/utils";

// three/webgpu and the relighting shader load in their own client-only chunk (the same one /fleet and /anatomy use).
const RelightStage = dynamic(() => import("@/components/3d/relight/RelightStage"), { ssr: false });

const KEY_STEP = 0.14;
const noop = () => {};
const clamp01 =(v: number) => Math.max(0, Math.min(1, v));
const smooth = (t: number) => {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** A point on the lantern's own path (fractions of the picture), `t` from 0 to 1. */
function pathAt(path: UnveilingScene["path"], t: number): [number, number] {
  const n = path.length - 1;
  const f = clamp01(t) * n;
  const i = Math.min(n - 1, Math.floor(f));
  const k = f - i;
  return [lerp(path[i][0], path[i + 1][0], k), lerp(path[i][1], path[i + 1][1], k)];
}

/** How far the living horse has been revealed, as a radius in the units of the mask below (about 2.1 covers the whole picture). */
const reveal = (p: number) => smooth((p - 0.2) / 0.52) * 2.15;
const beatOf = (p: number) => (p < 0.235 ? 0 : p < 0.69 ? 1 : 2);

/**
 * The opening of a page in three beats that never share the screen: a white marble statue, then the lantern that turns it
 * into the living stallion, then the lit stallion while the page's own light and images follow below. It is a pinned scene
 * (scroll carries the lantern; a pointer, a finger or the arrow keys steer it) made of two relit pictures stacked: the living
 * one is masked by a circle that grows from the lantern. Both are the relighting shader of /fleet and /anatomy, so the stone
 * is raked by a gallery light and the coat by a stable lantern at the same place.
 * Where WebGL is missing the two stills stay and the same circle reveals one through the other; with reduced motion nothing
 * is pinned and the stone and the living horse are shown one after the other.
 */
export function Unveiling({ scene, className }: { scene: UnveilingScene; className?: string }) {
  return (
    <div data-parallax-skip className={cn("tone-dark relative bg-night", className)}>
      <PinnedScene
        id={scene.id}
        label={chrome.regionLabel}
        length={4.2}
        frameClassName="bg-night"
        reducedFallback={<Stacked scene={scene} />}
      >
        {(progress) => <Frame scene={scene} progress={progress} />}
      </PinnedScene>
    </div>
  );
}

/** The first line is on screen at rest and only leaves; the last arrives and stays; the one between does both. */
const COPY_OUTPUT = {
  first: { opacity: [1, 1, 1, 0], y: [0, 0, 0, -18] },
  middle: { opacity: [0, 1, 1, 0], y: [18, 0, 0, -18] },
  last: { opacity: [0, 1, 1, 1], y: [18, 0, 0, 0] },
} as const;

function BeatCopy({ beat, progress, active, stops, position }: { beat: UnveilingBeat; progress: MotionValue<number>; active: boolean; stops: [number, number, number, number]; position: keyof typeof COPY_OUTPUT }) {
  const opacity = useTransform(progress, r(...stops), [...COPY_OUTPUT[position].opacity]);
  const y = useTransform(progress, r(...stops), [...COPY_OUTPUT[position].y]);
  return (
    <motion.div style={{ opacity, y }} aria-hidden={!active} inert={!active} className="pointer-events-none">
      <Headline as="p" animate="none" size="2" inscription={beat.inscription} voice={beat.voice} />
      <p className="t-story mt-5 max-w-md text-lede text-sand">{beat.line}</p>
    </motion.div>
  );
}

function Frame({ scene, progress }: { scene: UnveilingScene; progress: MotionValue<number> }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const maskRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const near = useNearViewport(stageRef);
  const onScreen = useOnScreen(stageRef);
  const capabilities = useCapabilities();
  const input = useRef<RelightInput>({ key: null });
  const lantern = useRef({ x: scene.path[0][0], y: scene.path[0][1], steer: false });
  const [beat, setBeat] = useState(0);
  const [live, setLive] = useState({ stone: true, living: false });
  const [mountLiving, setMountLiving] = useState(false);
  const [failed, setFailed] = useState(false);

  const supported = capabilities !== null && capabilities.webgl && !failed;
  const quality = capabilities?.quality ?? "low";
  const onError = useCallback((error: Error) => {
    console.error(`[${scene.id}] relit stage unavailable:`, error.message);
    setFailed(true);
  }, [scene.id]);

  /** Everything that follows the scroll or the lantern is written straight to the DOM: no React render per frame. */
  const apply = useCallback(
    (p: number) => {
      const state = lantern.current;
      const [x, y] = state.steer ? [state.x, state.y] : pathAt(scene.path, smooth(p / 0.8));
      const mask = maskRef.current;
      if (mask) {
        mask.style.setProperty("--lx", `${(x * 100).toFixed(2)}%`);
        mask.style.setProperty("--ly", `${(y * 100).toFixed(2)}%`);
        mask.style.setProperty("--r", `${(reveal(p) * 55 - 16).toFixed(2)}%`);
      }
      const glow = glowRef.current;
      if (glow) {
        glow.style.setProperty("--lx", `${(x * 100).toFixed(2)}%`);
        glow.style.setProperty("--ly", `${(y * 100).toFixed(2)}%`);
        const base = smooth((p - 0.06) / 0.14) * (1 - smooth((p - 0.8) / 0.18));
        glow.style.opacity = String(Math.max(base, state.steer ? 0.55 : 0).toFixed(3));
      }
      input.current.key = { x: x * 2 - 1, y: -(y * 2 - 1) };
      const b = beatOf(p);
      setBeat((prev) => (prev === b ? prev : b));
      const next = { stone: p < 0.8, living: p > 0.1 };
      setLive((prev) => (prev.stone === next.stone && prev.living === next.living ? prev : next));
      if (p > 0.04) setMountLiving(true);
    },
    [scene.path],
  );
  useMotionValueEvent(progress, "change", apply);
  useEffect(() => {
    // A page opened part-way down (a reload, a back navigation) paints the right frame once mounted.
    const frame = requestAnimationFrame(() => apply(progress.get()));
    return () => cancelAnimationFrame(frame);
  }, [apply, progress]);

  const steerTo = (clientX: number, clientY: number) => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect || !rect.width || !rect.height) return;
    lantern.current = { x: clamp01((clientX - rect.left) / rect.width), y: clamp01((clientY - rect.top) / rect.height), steer: true };
    apply(progress.get());
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => steerTo(event.clientX, event.clientY);
  const releaseLantern = (event: PointerEvent<HTMLDivElement>) => {
    // a finger returns the lantern to the scroll; a mouse keeps it where it left it until it comes back
    if (event.pointerType === "touch" || event.type === "pointerleave") {
      lantern.current.steer = false;
      apply(progress.get());
    }
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const moves: Record<string, [number, number]> = { ArrowLeft: [-KEY_STEP, 0], ArrowRight: [KEY_STEP, 0], ArrowUp: [0, -KEY_STEP], ArrowDown: [0, KEY_STEP] };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    const [cx, cy] = lantern.current.steer ? [lantern.current.x, lantern.current.y] : pathAt(scene.path, smooth(progress.get() / 0.8));
    lantern.current = { x: clamp01(cx + move[0] / 2), y: clamp01(cy + move[1] / 2), steer: true };
    apply(progress.get());
  };

  return (
    <div className="relative mx-auto flex h-full max-w-[96rem] flex-col gap-5 gutter pb-6 pt-[clamp(5.5rem,10svh,7.5rem)] lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-center lg:gap-10 lg:pb-10">
      <div className="order-2 flex min-h-0 flex-col justify-center lg:order-1">
        <Label>{scene.label}</Label>
        <div className="mt-4 grid [&>*]:col-start-1 [&>*]:row-start-1">
          <BeatCopy beat={scene.stone} progress={progress} active={beat === 0} stops={[0, 0.1, 0.17, 0.22]} position="first" />
          <BeatCopy beat={scene.lantern} progress={progress} active={beat === 1} stops={[0.25, 0.31, 0.62, 0.68]} position="middle" />
          <BeatCopy beat={scene.light} progress={progress} active={beat === 2} stops={[0.7, 0.78, 0.9, 1]} position="last" />
        </div>
        <p className="label mt-6 text-brass" id={`${scene.id}-hint`}>
          <span className="[@media(hover:none)]:hidden">{chrome.hintPointer}</span>
          <span className="hidden [@media(hover:none)]:inline">{chrome.hintTouch}</span>
        </p>
        <p className="t-ui mt-2 hidden text-xs text-dust sm:block">{chrome.hintKeys} {chrome.note}</p>
        <p className="mt-5 flex items-center gap-3" aria-hidden="true">
          {chrome.beats.map((name, i) => (
            <span key={name} className={cn("flex items-center gap-2 font-mono text-[0.62rem] uppercase tracking-[0.18em] transition-colors duration-500", i === beat ? "text-gold" : "text-dust")}>
              <span className={cn("h-px transition-all duration-500", i === beat ? "w-8 bg-gold" : "w-4 bg-line")} />
              {String(i + 1).padStart(2, "0")} {name}
            </span>
          ))}
        </p>
      </div>

      <div className="order-1 flex min-h-0 flex-1 items-center justify-center lg:order-2 lg:flex-none">
        <div
          ref={stageRef}
          role="group"
          aria-label={chrome.stageLabel}
          aria-describedby={`${scene.id}-hint`}
          tabIndex={0}
          onKeyDown={onKeyDown}
          onPointerMove={onPointerMove}
          onPointerUp={releaseLantern}
          onPointerCancel={releaseLantern}
          onPointerLeave={releaseLantern}
          className="relative isolate aspect-[4/5] max-h-full w-auto touch-pan-y focus-visible:outline-offset-4 max-lg:h-full lg:h-[min(76svh,52rem)]"
        >
          {/* The picture melts into the page at its edges (two linear masks, intersected) instead of sitting on it as a card. */}
          <div className="absolute inset-0 overflow-hidden [-webkit-mask-composite:source-in] [-webkit-mask-image:linear-gradient(to_right,transparent,#000_9%,#000_91%,transparent),linear-gradient(to_bottom,transparent,#000_6%,#000_90%,transparent)] [mask-composite:intersect] [mask-image:linear-gradient(to_right,transparent,#000_9%,#000_91%,transparent),linear-gradient(to_bottom,transparent,#000_6%,#000_90%,transparent)]">
            {/* STONE: the statue as it was lit in the studio. It is always on screen; the shader only adds the lantern's light to it. */}
            <Image
              src={scene.statue.image}
              alt={scene.statue.alt}
              fill
              priority
              sizes="(min-width: 1024px) 40vw, 90vw"
              className="object-cover object-center"
            />
            {near && supported && capabilities ? (
              <div className="absolute inset-0 mix-blend-screen" aria-hidden>
                <ErrorBoundary fallback={null} onError={onError}>
                  <RelightStage image={scene.statue.image} depth={scene.statue.depth} input={input} quality={quality} reduced={false} visible={onScreen && live.stone} preset="marble" onReady={noop} onError={onError} />
                </ErrorBoundary>
              </div>
            ) : null}

            {/* LANTERN: the living stallion, masked by a circle that grows from the lantern as the page is scrolled. */}
            <div
              ref={maskRef}
              aria-hidden
              className="absolute inset-0 [mask-image:radial-gradient(circle_at_var(--lx,30%)_var(--ly,30%),#000_var(--r,-16%),transparent_calc(var(--r,-16%)+16%))] [mask-repeat:no-repeat] [mask-size:100%_100%] [-webkit-mask-image:radial-gradient(circle_at_var(--lx,30%)_var(--ly,30%),#000_var(--r,-16%),transparent_calc(var(--r,-16%)+16%))]"
            >
              <Image src={scene.living.image} alt="" fill sizes="(min-width: 1024px) 40vw, 90vw" className="object-cover object-center" />
              {near && supported && capabilities && mountLiving ? (
                <div className="absolute inset-0 mix-blend-screen">
                  <ErrorBoundary fallback={null} onError={onError}>
                    <RelightStage image={scene.living.image} depth={scene.living.depth} input={input} quality={quality} reduced={false} visible={onScreen && live.living} preset="lantern" onReady={noop} onError={onError} />
                  </ErrorBoundary>
                </div>
              ) : null}
            </div>

            {/* The lantern's own glow: it follows the same point as the light, and still shows where the shader cannot run. */}
            <div
              ref={glowRef}
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-0 mix-blend-screen [background:radial-gradient(circle_at_var(--lx,30%)_var(--ly,30%),rgba(255,196,128,0.3)_0%,rgba(255,170,90,0.1)_14%,transparent_32%)]"
            />
            <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-1/5 [background:linear-gradient(to_top,rgba(8,7,6,0.62),transparent)]" />
          </div>
          {beat === 0 && (
            <p aria-hidden className="label pointer-events-none absolute bottom-4 left-4 text-gold/90 motion-safe:animate-pulse">{chrome.scroll}</p>
          )}
        </div>
      </div>
    </div>
  );
}

/** Reduced motion: nothing is pinned or revealed by scrolling; the stone and the living horse follow one another. */
function Stacked({ scene }: { scene: UnveilingScene }) {
  const block = (still: UnveilingScene["statue"], beat: UnveilingBeat, flip: boolean, eager: boolean) => (
    <div className={cn("gutter grid gap-8 py-[clamp(3rem,8vh,6rem)] lg:grid-cols-2 lg:items-center lg:gap-16", flip && "lg:[&>*:first-child]:order-2")}>
      <div className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden bg-night">
        <Image src={still.image} alt={still.alt} fill priority={eager} sizes="(min-width: 1024px) 40vw, 90vw" className="object-cover object-center" />
      </div>
      <div>
        <Headline as="p" animate="none" size="2" inscription={beat.inscription} voice={beat.voice} />
        <p className="t-story mt-5 max-w-md text-lede text-sand">{beat.line}</p>
      </div>
    </div>
  );
  return (
    <div className="pt-[clamp(5.5rem,10svh,7.5rem)]">
      <div className="gutter"><Label>{scene.label}</Label></div>
      {block(scene.statue, scene.stone, false, true)}
      {block(scene.living, scene.lantern, true, false)}
      <div className="gutter pb-12"><p className="t-story max-w-xl text-lede text-sand">{scene.light.line}</p><p className="t-ui mt-3 text-xs text-dust">{chrome.note}</p></div>
    </div>
  );
}
