/* Painted layers use plain <img>: CSS places them on the stage, the same way as the Marwari story. */
/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { useReducedMotion } from "@/lib/motion/reduced";
import { asset } from "@/lib/content/asset";
import { DriftCanvas } from "@/components/sections/marwari-story/DriftCanvas";
import { SCENES, SCENE_TOTAL, SKY, type LayerSpec, type StoryScene } from "./story-data";
import "./pratap.css";

const pad = (n: number) => String(n).padStart(2, "0");
const P = "/images/story/pratap/";

/**
 * The world that never changes. One blue sky sits behind everything; over it the clouds, two ridges, the ground and
 * a band of grass slide past as the visitor scrolls, each at its own speed (`k`: how many screen widths it travels
 * across the whole story). Every band is a row of tiles, every other one mirrored, so a band has no seams at any width.
 */
const BANDS = [
  { id: "clouds", src: `${P}band-clouds.webp`, k: 0.03, tiles: 10 },
  { id: "ridge-far", src: `${P}band-ridge-far.webp`, k: 0.05, tiles: 10 },
  { id: "ridge-near", src: `${P}band-ridge-near.webp`, k: 0.09, tiles: 12 },
  { id: "ground", src: `${P}band-ground.webp`, k: 0.16, tiles: 14 },
  { id: "fg", src: `${P}band-fg.webp`, k: 0.3, tiles: 32 },
] as const;

/** Placement reaches the layer as custom properties, so the phone layout is a CSS media query, not a second scene. */
function layerStyle(l: LayerSpec): CSSProperties {
  const s: Record<string, string> = {
    "--dx": l.d.x ?? "auto",
    "--dr": l.d.r ?? "auto",
    "--db": l.d.b,
    "--dw": l.d.w,
  };
  if (l.m) {
    s["--mx"] = l.m.x ?? "auto";
    s["--mr"] = l.m.r ?? "auto";
    s["--mb"] = l.m.b;
    s["--mw"] = l.m.w;
  }
  if (l.opacity !== undefined) s["--op"] = String(l.opacity);
  return s as CSSProperties;
}

const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const smooth = (v: number) => {
  const x = clamp(v);
  return x * x * (3 - 2 * x);
};

/**
 * One function computes every moving value of a frame from one number, `t`: the moment the camera is at (0 is the
 * first moment, 10 the last, 4.5 halfway between the fifth and the sixth). Nothing is stored between calls, so
 * scrolling backwards runs the same story in reverse.
 */
function render(frame: HTMLElement, t: number) {
  const W = frame.clientWidth;
  const H = frame.clientHeight;

  frame.querySelectorAll<HTMLElement>(".ps-band").forEach((el) => {
    el.style.transform = `translate3d(${(-t * W * Number(el.dataset.k)).toFixed(1)}px,0,0)`;
  });

  frame.querySelectorAll<HTMLElement>(".ps-layer").forEach((el) => {
    const u = t - Number(el.dataset.scene);
    const a = Math.abs(u);
    if (a >= 1) {
      el.style.visibility = "hidden";
      return;
    }
    const depth = Number(el.dataset.depth);
    const from = Number(el.dataset.from);
    const fromY = Number(el.dataset.fromy);
    const op = Number(el.dataset.op || 1);
    // A figure lingers around its own moment (the cubic term keeps it nearly still there) and then is carried off fast.
    const f = 0.15 * u + 0.85 * u * u * u;
    const reach = depth === 3 ? 0.95 : 0.6;
    const x = from === 0 ? -u * W * 0.05 : -from * f * W * reach;
    const y = fromY * (u < 0 ? 0.3 : -0.1) * H * u * u;
    el.style.visibility = "visible";
    el.style.opacity = String((op * (1 - smooth((a - 0.22) / 0.36))).toFixed(3));
    el.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
  });

  frame.querySelectorAll<HTMLElement>(".ps-tint").forEach((el) => {
    const a = Math.abs(t - Number(el.dataset.scene));
    el.style.opacity = String((1 - smooth((a - 0.25) / 0.55)).toFixed(3));
  });

  frame.querySelectorAll<HTMLElement>(".ps-page").forEach((el) => {
    const u = t - Number(el.dataset.scene);
    const a = Math.abs(u);
    el.style.opacity = String((1 - smooth((a - 0.26) / 0.2)).toFixed(3));
    el.style.transform = `translate3d(0,${(u * 28).toFixed(1)}px,0)`;
  });

  const rule = frame.querySelector<HTMLElement>(".ps-rule");
  if (rule) rule.style.transform = `scaleX(${(clamp(t / (SCENE_TOTAL - 1)) || 0).toFixed(4)})`;
  frame.dataset.active = String(Math.round(clamp(t, 0, SCENE_TOTAL - 1)));
}

/**
 * The Maharana Pratap and Chetak story. One painted world stays on screen while the visitor scrolls the page past it
 * (a sticky stage, not a pinned scroll: the page keeps scrolling normally and nothing traps it). The camera travels
 * through eleven moments; each moment's figures come in from their own edge over the same blue sky, stand for a
 * while, and leave the other way. Under reduced motion every moment is shown as its own still picture of the same world.
 */
export function PratapStory() {
  const trackRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const frames = Array.from(track.querySelectorAll<HTMLElement>(".ps-frame"));

    if (reduced) {
      const paint = () => frames.forEach((f, i) => render(f, i));
      paint();
      window.addEventListener("resize", paint);
      return () => window.removeEventListener("resize", paint);
    }

    const frame = frames[0];
    let target = 0;
    let cur = 0;
    let raf = 0;
    const read = () => {
      const r = track.getBoundingClientRect();
      const span = Math.max(1, track.offsetHeight - window.innerHeight);
      const p = clamp(-r.top / span);
      // A short hold at each end: the first and last moments are not skipped past.
      target = (SCENE_TOTAL - 1) * clamp((p - 0.03) / 0.94);
    };
    const tick = () => {
      cur += (target - cur) * 0.18;
      if (Math.abs(target - cur) < 0.0005) cur = target;
      render(frame, cur);
      raf = cur === target ? 0 : requestAnimationFrame(tick);
    };
    const kick = () => {
      read();
      if (!raf) raf = requestAnimationFrame(tick);
    };
    read();
    cur = target;
    render(frame, cur);
    window.addEventListener("scroll", kick, { passive: true });
    window.addEventListener("resize", kick);
    return () => {
      window.removeEventListener("scroll", kick);
      window.removeEventListener("resize", kick);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reduced]);

  return (
    <div ref={trackRef} className="ps-story" data-motion={reduced ? "reduced" : "full"}>
      <h1 className="sr-only">Maharana Pratap and Chetak: a scroll story</h1>
      {reduced ? (
        SCENES.map((scene, i) => (
          <section key={i} className="ps-still" aria-label={`${scene.label}: ${scene.title}`}>
            <Frame items={[{ scene, index: i }]} />
          </section>
        ))
      ) : (
        <div className="ps-track">
          <div className="ps-sticky">
            <div className="ps-drift-wrap" aria-hidden="true">
              <DriftCanvas />
            </div>
            <Frame items={SCENES.map((scene, index) => ({ scene, index }))} live />
          </div>
        </div>
      )}
    </div>
  );
}

type Item = { scene: StoryScene; index: number };

/** The stage: the constant sky and bands, then the figures of each moment, their colour wash, and their words. */
function Frame({ items, live }: { items: Item[]; live?: boolean }) {
  return (
    <div className="ps-frame" data-frame>
      <div className="ps-sky" style={{ backgroundImage: `url(${asset(SKY)})` }} aria-hidden="true" />
      <div className="ps-world">
        {BANDS.map((b) => (
          <div key={b.id} className={`ps-band ps-band--${b.id}`} data-k={b.k} aria-hidden="true">
            {Array.from({ length: b.tiles }, (_, n) => (
              <img key={n} className="ps-tile" src={asset(b.src)} alt="" decoding="async" loading="eager" style={n % 2 ? { transform: "scaleX(-1)" } : undefined} />
            ))}
          </div>
        ))}
        {items.map(({ scene, index }) =>
          scene.layers.map((l, j) => (
            <img
              key={`${index}-${j}`}
              className="ps-layer"
              data-plane={l.plane ?? (l.depth === 3 ? "hero" : "mid")}
              src={asset(l.src)}
              alt={l.alt}
              decoding="async"
              loading="eager"
              data-scene={index}
              data-depth={l.depth}
              data-from={l.from}
              data-fromy={l.fromY ?? 0}
              data-op={l.opacity ?? 1}
              style={layerStyle(l)}
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          )),
        )}
        {items.map(({ scene, index }) =>
          scene.tint ? <div key={index} className="ps-tint" data-scene={index} style={{ background: scene.tint }} aria-hidden="true" /> : null,
        )}
      </div>
      <div className="ps-panel" aria-hidden="true" />
      {items.map(({ scene, index }) => (
        <Page key={index} scene={scene} index={index} />
      ))}
      {live && (
        <div className="ps-rule-track" aria-hidden="true">
          <div className="ps-rule" />
        </div>
      )}
    </div>
  );
}

function Page({ scene, index }: { scene: StoryScene; index: number }) {
  return (
    <article className="ps-page" data-pos={scene.pos} data-scene={index}>
      <p className="ps-page__count">
        {pad(index + 1)} / {pad(SCENE_TOTAL)}
      </p>
      <h2 className="ps-label">{scene.label}</h2>
      <h3 className="ps-page__title">{scene.title}</h3>
      <p className="ps-page__body">{scene.body}</p>
      {scene.note && <p className="ps-page__note">{scene.note}</p>}
    </article>
  );
}
