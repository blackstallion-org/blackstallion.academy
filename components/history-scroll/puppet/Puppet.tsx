"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/lib/motion/reduced";
import { energy, useReadingMode } from "../HistoryScrollRoot";
import { build, type Built } from "./build";
import { createMesh, disposeMesh, draw, getGL, MAX_BONES, worldMatrices } from "./gl";
import { pose } from "./motion";
import type { SceneRig } from "./types";

/** Extra room around the cutout (in image heights) so limbs and tails can swing past its edge. */
const PAD = 0.08;
const FRAME = 1000 / 30;

type Active = { tick: (t: number) => void };
const active = new Set<Active>();
let raf = 0;
let last = 0;
/** One clock for every puppet on the page. It runs a little faster while the visitor scrolls fast, then settles. */
let clock = 0;
function loop(now: number) {
  raf = active.size ? requestAnimationFrame(loop) : 0;
  if (now - last < FRAME - 2) return;
  const dt = last ? Math.min((now - last) / 1000, 0.1) : 0;
  last = now;
  clock += dt * (1 + Math.min(energy.v, 2) * 0.3);
  active.forEach((a) => a.tick(clock));
}
function start(a: Active) {
  active.add(a);
  if (!raf) {
    last = 0;
    raf = requestAnimationFrame(loop);
  }
}
function stop(a: Active) {
  active.delete(a);
}

/**
 * Brings one painted cutout to life: a rigged figure (`rig`) or a foreground that sways in the wind (`sway`).
 * It sits over the original image, which stays underneath as the fallback and is hidden only once a frame has drawn.
 */
export function Puppet({ rig, sway = 0 }: { rig?: SceneRig; sway?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();
  const { reading } = useReadingMode();

  useEffect(() => {
    const canvas = ref.current;
    const holder = canvas?.parentElement;
    const img = holder?.querySelector("img");
    if (!canvas || !holder || !img || reduced || reading || !getGL()) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let alive = true;
    let built: Built | null = null;
    let mesh: ReturnType<typeof createMesh> = null;
    const mats = new Float32Array(MAX_BONES * 9);
    let w = 0;
    let h = 0;
    let box: [number, number, number, number] = [0, 0, 1, 1];
    const prevPhase = new Map<number, number>();
    const art = holder.closest(".hs-art");

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = Math.max(1, Math.round(r.width * dpr));
      h = Math.max(1, Math.round(r.height * dpr));
      canvas.width = w;
      canvas.height = h;
    };

    const runner: Active = {
      tick: (t) => {
        if (!built || !mesh) return;
        const p = pose(built.bones, rig?.figures ?? [], t);
        const m = worldMatrices(built, p.locals, mats);
        draw(mesh, mats, ctx, w, h, { box, t, sway, waveAmp: 0.006 });
        if (!holder.dataset.puppet) holder.dataset.puppet = "live";
        // Hoof dust exactly where and when a hoof lands.
        if (art)
          for (const c of p.contacts) {
            const prev = prevPhase.get(c.bone) ?? c.phase;
            prevPhase.set(c.bone, c.phase);
            if (!(prev > 0.8 && c.phase < 0.2)) continue;
            const tip = built.bones[c.bone].tip;
            if (!tip) continue;
            const M = m[c.bone];
            const x = M[0] * tip[0] + M[2] * tip[1] + M[4];
            const y = M[1] * tip[0] + M[3] * tip[1] + M[5];
            const r = canvas.getBoundingClientRect();
            art.dispatchEvent(new CustomEvent("hs-hoof", { detail: { x: r.left + ((x - box[0]) / box[2]) * r.width, y: r.top + ((y - box[1]) / box[3]) * r.height } }));
          }
      },
    };

    const ready = async () => {
      try {
        await img.decode();
      } catch {
        /* already decoded or decoding failed; the image element still draws */
      }
      if (!alive || !img.naturalWidth) return;
      const aspect = img.naturalWidth / img.naturalHeight;
      built = build(rig ?? { figures: [] }, aspect);
      // A swaying foreground spans the full width: it gets no side padding, so it never widens the page.
      const px = rig ? PAD : 0;
      box = [-px, -PAD, aspect + px * 2, 1 + PAD * 2];
      Object.assign(canvas.style, {
        left: `${(-px / aspect) * 100}%`,
        width: `${(1 + (2 * px) / aspect) * 100}%`,
        top: `${-PAD * 100}%`,
        height: `${(1 + 2 * PAD) * 100}%`,
      });
      mesh = createMesh(built, img);
      resize();
    };
    if (img.complete) ready();
    else img.addEventListener("load", ready, { once: true });

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    let onScreen = false;
    const io = new IntersectionObserver(
      ([e]) => {
        onScreen = e.isIntersecting;
        if (onScreen && !document.hidden) start(runner);
        else stop(runner);
      },
      { rootMargin: "120px" },
    );
    io.observe(canvas);
    const onVis = () => (document.hidden || !onScreen ? stop(runner) : start(runner));
    document.addEventListener("visibilitychange", onVis);
    return () => {
      alive = false;
      stop(runner);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      img.removeEventListener("load", ready);
      delete holder.dataset.puppet;
      if (mesh) disposeMesh(mesh);
    };
  }, [rig, sway, reduced, reading]);

  if (reduced || reading) return null;
  return <canvas ref={ref} className="hs-puppet" aria-hidden />;
}
