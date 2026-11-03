/* Painted layers use plain <img>: CSS places them on the stage, the same way as the Marwari story. */
/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { useLenis } from "lenis/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "@/lib/motion/reduced";
import { asset } from "@/lib/content/asset";
import { DriftCanvas } from "@/components/sections/marwari-story/DriftCanvas";
import { SCENES, SCENE_TOTAL, SKY, type LayerSpec, type StoryScene } from "./story-data";
import "./pratap.css";

gsap.registerPlugin(ScrollTrigger);

const pad = (n: number) => String(n).padStart(2, "0");

/** Placement reaches the layer as custom properties, so the phone layout is a CSS media query, not a second scene. */
function layerStyle(l: LayerSpec): CSSProperties {
  const s: Record<string, string> = {
    "--dx": l.d.x ?? "auto",
    "--dr": l.d.r ?? "auto",
    "--db": l.d.b,
    "--dw": l.d.w,
    "--z": String(l.depth),
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

/**
 * The Maharana Pratap and Chetak story: nine scenes on one painted indigo sky. The scenes share one pinned stage and one
 * scrubbed timeline (one unit per scene), so scrolling back runs the scenes in reverse. The page switches by setting an
 * attribute, so React does not re-render on scroll. Under reduced motion nothing is pinned or moved: each scene is a
 * still painting with its copy under it.
 */
export function PratapStory() {
  const rootRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const lenis = useLenis();

  // Lenis drives the native scroll; ScrollTrigger must hear every frame of it.
  useEffect(() => {
    if (!lenis || reduced) return;
    return lenis.on("scroll", ScrollTrigger.update);
  }, [lenis, reduced]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || reduced) return;
    const stage = root.querySelector<HTMLElement>(".ps-stage");
    if (!stage) return;
    const pages = Array.from(stage.querySelectorAll<HTMLElement>(".ps-page"));
    const rule = stage.querySelector<HTMLElement>(".ps-rule");

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ paused: true, defaults: { ease: "none" } });
      const last = SCENE_TOTAL - 1;

      SCENES.forEach((_scene: StoryScene, i) => {
        // Each moment is on screen from `inStart` to `end`. It is fully shown from `i` to `i + 0.6`. The next moment
        // starts coming in at `i + 0.75`, so the two overlap only briefly: the far layers linger while the near ones
        // travel in, and there is no long double exposure.
        const inStart = Math.max(0, i - 0.25);
        const fadeIn = i === 0 ? 0 : 0.25;
        const outStart = i + 0.6;
        const outEnd = i + 0.85;
        const end = i === last ? SCENE_TOTAL : outEnd;
        const span = end - inStart;

        // The scene's own background (the dusk sunset) fades in over the end of its scene and stays.
        const bg = stage.querySelector<HTMLElement>(`.ps-bg[data-scene-bg="${i}"]`);
        if (bg) tl.fromTo(bg, { opacity: 0 }, { opacity: 1, duration: 0.7 }, i + 0.3);

        // The moment's colour wash fades in and out with the moment.
        const tint = stage.querySelector<HTMLElement>(`.ps-tint[data-scene-tint="${i}"]`);
        if (tint) {
          tl.fromTo(tint, { opacity: i === 0 ? 1 : 0 }, { opacity: 1, duration: fadeIn }, inStart);
          if (i < last) tl.to(tint, { opacity: 0, duration: outEnd - outStart }, outStart);
        }

        const layers = Array.from(stage.querySelectorAll<HTMLElement>(`.ps-layer[data-scene="${i}"]`));
        layers.forEach((el) => {
          const depth = Number(el.dataset.depth);
          const from = Number(el.dataset.from);
          const op = Number(el.style.getPropertyValue("--op") || 1);
          // Near layers travel furthest, far layers least: the parallax depth.
          const reach = depth === 3 ? 26 : depth === 2 ? 14 : 6;
          // A layer that enters from a side crosses to the other side over the whole moment, so the scene keeps moving
          // while it is read. A layer that stays in place drifts gently across the middle.
          const x0 = from === 0 ? -reach * 0.4 : from * reach;
          const x1 = from === 0 ? reach * 0.4 : -from * reach * 0.8;
          tl.fromTo(el, { xPercent: x0 }, { xPercent: x1, duration: span }, inStart);
          tl.fromTo(el, { opacity: i === 0 ? op : 0 }, { opacity: op, duration: fadeIn }, inStart);
          if (i < last) tl.to(el, { opacity: 0, duration: outEnd - outStart }, outStart);
        });
      });

      // Pin the timeline to exactly one unit per moment, so progress * SCENE_TOTAL is the moment's time.
      tl.set({}, {}, SCENE_TOTAL);

      let current = 0;
      ScrollTrigger.create({
        trigger: root,
        start: "top top",
        end: () => `+=${window.innerHeight * SCENE_TOTAL}`,
        pin: stage,
        pinSpacing: true,
        scrub: 0.6,
        invalidateOnRefresh: true,
        animation: tl,
        onUpdate: (self) => {
          // The copy changes just before its painting is fully in, so the words arrive with the picture.
          const idx = Math.min(SCENE_TOTAL - 1, Math.max(0, Math.floor(self.progress * SCENE_TOTAL + 0.1)));
          if (idx !== current) {
            current = idx;
            pages.forEach((el, i) => el.setAttribute("data-active", i === idx ? "true" : "false"));
          }
          if (rule) rule.style.transform = `scaleX(${self.progress})`;
        },
      });
    }, root);

    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh);
    void document.fonts?.ready.then(refresh);

    return () => {
      window.removeEventListener("load", refresh);
      ctx.revert();
    };
  }, [reduced]);

  return (
    <div ref={rootRef} className="ps-story" data-motion={reduced ? "reduced" : "full"}>
      <h1 className="sr-only">Maharana Pratap and Chetak: a scroll story</h1>
      {reduced ? <Still /> : <Stage />}
    </div>
  );
}

function Layer({ l, scene }: { l: LayerSpec; scene: number | null }) {
  return (
    <img
      className="ps-layer"
      src={asset(l.src)}
      alt={l.alt}
      decoding="async"
      data-scene={scene ?? undefined}
      data-depth={l.depth}
      data-from={l.from}
      style={layerStyle(l)}
      onError={(e) => {
        e.currentTarget.style.display = "none";
      }}
    />
  );
}

function Page({ scene, index, active }: { scene: StoryScene; index: number; active: boolean }) {
  return (
    <article className="ps-page" data-pos={scene.pos} data-active={active ? "true" : "false"}>
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

function Stage() {
  return (
    <section className="ps-chapter" aria-label="The story of Maharana Pratap and Chetak">
      <div className="ps-stage">
        <img className="ps-sky" src={asset(SKY)} alt="" decoding="async" />
        {SCENES.map((scene, i) =>
          scene.bg ? (
            <img key={`bg-${i}`} className="ps-bg" data-scene-bg={i} src={asset(scene.bg)} alt="" decoding="async" />
          ) : null,
        )}
        {SCENES.map((scene, i) => scene.layers.map((l, j) => <Layer key={`${i}-${j}`} l={l} scene={i} />))}
        {SCENES.map((scene, i) =>
          scene.tint ? <div key={`tint-${i}`} className="ps-tint" data-scene-tint={i} style={{ background: scene.tint }} aria-hidden="true" /> : null,
        )}
        <div className="ps-drift-wrap">
          <DriftCanvas />
        </div>
        <div className="ps-frame" aria-hidden="true" />
        {SCENES.map((scene, i) => (
          <Page key={scene.label} scene={scene} index={i} active={i === 0} />
        ))}
        <div className="ps-rule-track" aria-hidden="true">
          <span className="ps-rule" />
        </div>
      </div>
    </section>
  );
}

function Still() {
  return (
    <div className="ps-still-list">
      {SCENES.map((scene, i) => (
        <section key={scene.label} className="ps-still" aria-label={scene.label}>
          <div className="ps-still__art">
            <img className="ps-sky" src={asset(SKY)} alt="" decoding="async" />
            {scene.bg && <img className="ps-bg" src={asset(scene.bg)} alt="" decoding="async" />}
            {scene.layers.map((l, j) => (
              <Layer key={j} l={l} scene={null} />
            ))}
            {scene.tint && <div className="ps-tint" style={{ background: scene.tint }} aria-hidden="true" />}
          </div>
          <Page scene={scene} index={i} active />
        </section>
      ))}
    </div>
  );
}
