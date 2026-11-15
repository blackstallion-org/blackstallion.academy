"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import type gsap from "gsap";
import { cn } from "@/lib/utils";
import type { Ambient, Idle, Motion } from "@/lib/content/marwari-journey";
import s from "./journey.module.css";

/**
 * The painted-journey building blocks shared by /legend (MarwariJourney) and the home page's opening trailer
 * (components/opening/PaintedTrailer): the idle-rigged subject cut-out, the looping atmosphere, and the motion-recipe timeline
 * builder. Loops run only where an ancestor sets --mj-play: running (see journey.module.css).
 */
export type Load = ({ loading: "eager"; fetchPriority?: "high" } | { loading: "lazy" }) & { unoptimized?: boolean };

/**
 * The subject cut-out. With an idle rig it is drawn as up to four copies of the same image (one request, one decode):
 * the base with the head's core hidden; a feathered barrel copy that breathes (scale only grows, so it always covers the
 * base beneath it); a feathered head-and-neck copy that nods about the withers, whose solid core spans the base's hidden
 * core so the alpha never thins at the seam; and inside the head, a light silhouette seen through a narrow band that
 * sweeps across the mane. All moves are CSS transforms on composited layers; none of this exists in still mode.
 */
export function Subject({ src, alt, load, idle, sheen = true }: { src: string; alt: string; load: Load; idle?: Idle; sheen?: boolean }) {
  if (!idle) return <Image src={src} alt={alt} fill sizes="100vw" className={s.img} {...load} />;
  const pc = (v: number) => `${v}%`;
  // The sheen band: a strip about the head's width that starts just left of the head and ends just right of it. Its child
  // is a stage-sized copy that counter-moves, so the light silhouette stays registered to the painting as the band passes.
  const [hx] = idle.head.at;
  const hr = idle.head.r[0];
  const bw = Math.min(14, Math.max(3, hr * 0.8));
  const bl = hx - hr * 1.2 - bw;
  const travel = hr * 2.4 + bw;
  const vars = {
    "--sl": pc(bl),
    "--sw": pc(bw),
    "--st": pc((travel / bw) * 100),
    "--fl": pc((-bl / bw) * 100),
    "--fw": pc((100 / bw) * 100),
    "--ft": pc(-travel),
    "--hx": pc(idle.head.at[0]),
    "--hy": pc(idle.head.at[1]),
    "--hrx": pc(idle.head.r[0]),
    "--hry": pc(idle.head.r[1]),
    "--px": pc(idle.pivot[0]),
    "--py": pc(idle.pivot[1]),
    "--deg": `${idle.deg ?? 1.5}deg`,
    ...(idle.barrel && {
      "--bx": pc(idle.barrel.at[0]),
      "--by": pc(idle.barrel.at[1]),
      "--brx": pc(idle.barrel.r[0]),
      "--bry": pc(idle.barrel.r[1]),
    }),
  } as CSSProperties;
  const copy = (cls?: string) => <Image src={src} alt="" fill sizes="100vw" className={cn(s.img, cls)} {...load} />;
  return (
    <div className={s.rig} style={vars}>
      <div className={s.rigBase}>
        <Image src={src} alt={alt} fill sizes="100vw" className={s.img} {...load} />
      </div>
      {idle.barrel && (
        <div className={s.rigBarrel} aria-hidden>
          {copy()}
        </div>
      )}
      <div className={s.rigHead} aria-hidden>
        {copy()}
        {sheen && (
          <div className={s.sheen}>
            <div className={s.sheenFill}>{copy(s.sheenImg)}</div>
          </div>
        )}
      </div>
    </div>
  );
}

/** Looping atmosphere over the painting (see Ambient in lib/content/marwari-journey.ts); purely decorative. */
export function AmbientLayer({ kind }: { kind: Ambient }) {
  return (
    <div className={s.amb} data-kind={kind} aria-hidden>
      {kind === "battle" && (
        <span className={s.emberField}>
          <span className={s.glow} />
        </span>
      )}
      {(kind === "desert" || kind === "battle") && (
        <span className={s.sandField}>
          <span className={s.veil} />
          <span className={s.ribbons} />
          <span className={cn(s.sand, s.sandFar)} />
          <span className={cn(s.sand, s.sandNear)} />
        </span>
      )}
      {kind === "palace" && (
        <span className={s.shaftField}>
          <span className={s.shaft} />
          <span className={s.shaft} />
          <span className={s.shaft} />
        </span>
      )}
    </div>
  );
}

/** Builds one scene's scrubbed timeline from its motion recipe (duration 1 = the whole scene). */
export function build(tl: gsap.core.Timeline, scene: HTMLElement, m: Motion, k: number) {
  const q = (sel: string) => scene.querySelector<HTMLElement>(sel);
  const B = q('[data-mj-layer="b"]');
  const S = q('[data-mj-layer="s"]');
  const F = q('[data-mj-layer="f"]');
  const G = q("[data-mj-gait]");
  const inner = q("[data-mj-inner]");
  const fx = q("[data-mj-fx]");
  const pair = (v: [number, number] | undefined) => (v ? [v[0] * k, v[1] * k] : undefined);

  if (B && m.b) {
    const x = pair(m.b.x), y = pair(m.b.y);
    tl.fromTo(B, { xPercent: x?.[0] ?? 0, yPercent: y?.[0] ?? 0, scale: m.b.scale?.[0] ?? 1 }, { xPercent: x?.[1] ?? 0, yPercent: y?.[1] ?? 0, scale: m.b.scale?.[1] ?? 1, duration: 1 }, 0);
  }
  if (S && m.s) {
    const x = pair(m.s.x), y = pair(m.s.y);
    tl.fromTo(S, { xPercent: x?.[0] ?? 0, yPercent: y?.[0] ?? 0, scale: m.s.scale?.[0] ?? 1 }, { xPercent: x?.[1] ?? 0, yPercent: y?.[1] ?? 0, scale: m.s.scale?.[1] ?? 1, duration: 1 }, 0);
    // A gait cadence: small, even lifts tied to scroll, never a free-running loop.
    if (G && m.s.cadence) {
      const { n, amp } = m.s.cadence;
      for (let j = 0; j < n; j++) {
        tl.to(G, { yPercent: -amp * k, duration: 0.5 / n, ease: "sine.out" }, j / n).to(G, { yPercent: 0, duration: 0.5 / n, ease: "sine.in" }, (j + 0.5) / n);
      }
    }
  }
  if (F && m.f) {
    const x = pair(m.f.x), y = pair(m.f.y);
    if (m.f.hold) {
      // The foreground sand passes, then rests for the second half of the scene.
      tl.fromTo(F, { xPercent: x?.[0] ?? 0 }, { xPercent: x?.[1] ?? 0, duration: 0.55, ease: "power2.out" }, 0);
    } else {
      tl.fromTo(F, { xPercent: x?.[0] ?? 0, yPercent: y?.[0] ?? 0 }, { xPercent: x?.[1] ?? 0, yPercent: y?.[1] ?? 0, duration: 1 }, 0);
    }
  }
  if (inner && m.push) {
    inner.style.transformOrigin = m.push.origin;
    tl.fromTo(inner, { scale: m.push.scale[0] }, { scale: 1 + (m.push.scale[1] - 1) * k, duration: 1 }, 0);
  }
  if (m.special === "breathe" && S) {
    tl.to(S, { scale: 1 + 0.012 * k, duration: 0.5, ease: "sine.inOut" }, 0).to(S, { scale: 1, duration: 0.5, ease: "sine.inOut" }, 0.5);
  }
  if (m.special === "leap" && S) {
    // One controlled leap off the wall toward the plain (the horse faces left), then release into the next scene.
    tl.fromTo(S, { xPercent: 0, yPercent: 0, rotate: 0 }, { xPercent: -10 * k, yPercent: -7 * k, rotate: -4, duration: 0.45, ease: "power1.out" }, 0.15)
      .to(S, { xPercent: -20 * k, yPercent: 5 * k, rotate: 5, duration: 0.4, ease: "power1.in" }, 0.6);
  }
  if (m.special === "fade-colour" && inner) {
    tl.fromTo(inner, { filter: "saturate(1) brightness(1)" }, { filter: "saturate(0.45) brightness(0.9)", duration: 1 }, 0);
  }
  if (m.special === "reveal" && S) {
    tl.fromTo(S, { clipPath: "inset(0% 100% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.5, ease: "power2.out" }, 0.05);
  }
  if (fx) {
    if (m.fx === "lantern") {
      for (let j = 0; j < 3; j++) tl.to(fx, { opacity: 0.85, duration: 0.15, ease: "sine.inOut" }, j / 3).to(fx, { opacity: 0.35, duration: 0.18, ease: "sine.inOut" }, j / 3 + 0.15);
    } else if (m.fx === "warm") {
      tl.fromTo(fx, { opacity: 0 }, { opacity: 1, duration: 1 }, 0);
      if (B) tl.fromTo(B, { filter: "brightness(0.82) saturate(0.85)" }, { filter: "brightness(1) saturate(1.05)", duration: 1 }, 0);
    } else {
      tl.fromTo(fx, { opacity: 0, xPercent: m.fx === "dust" ? -18 : 0, yPercent: m.fx === "embers" ? 6 : 0 }, { opacity: 1, xPercent: m.fx === "dust" ? 4 : m.fx === "ripple" ? -6 : 0, yPercent: m.fx === "embers" ? -14 : 0, duration: 0.55 }, 0)
        .to(fx, { opacity: 0, xPercent: m.fx === "dust" ? 22 : m.fx === "ripple" ? -12 : 0, yPercent: m.fx === "embers" ? -26 : 0, duration: 0.45 }, 0.55);
    }
  }
}
