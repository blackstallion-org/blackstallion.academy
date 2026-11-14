"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Headline } from "@/components/film/Headline";
import { useReducedMotion } from "@/lib/motion/reduced";
import { cn } from "@/lib/utils";
import { ACTS, INTRO, LAYERS, SCENES, SOURCES, STATUS_LABEL, type Ambient, type Idle, type JourneyScene, type Motion } from "@/lib/content/marwari-journey";
import s from "./journey.module.css";

/**
 * Reel 01 · The Marwari: one continuous painted journey in four acts (lib/content/marwari-journey.ts).
 *
 * Each painting is three DOM layers (background, subject cut-out, thin foreground) in one shared 16:9 stage box, moved at
 * different rates by scroll. Every move is a scrubbed GSAP timeline, so scrolling back reverses it. On wide screens the
 * panorama and plate scenes hold the painting in a sticky stage while the reading panel stays still on the painting's quiet
 * side; detail and inset scenes sit in a two-column spread. On phones every scene is the painting followed by its text.
 * Two loops run on their own clock, not scroll, and only while their scene is on screen: idle life for one horse per painting
 * (head nod about the withers, breathing barrel, mane sheen; see Subject) and per-act atmosphere (see AmbientLayer).
 * Reading mode and reduced motion turn every move off and lay the whole story out in normal flow.
 * Motion is scoped to this component (one gsap.matchMedia, reverted on unmount); the site's root Lenis already drives
 * ScrollTrigger, so no second smooth-scroll instance is created.
 */
export function MarwariJourney() {
  const root = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [reading, setReading] = useState(false);
  const still = reduced || reading;
  const [act, setAct] = useState<string>("land");
  const [progress, setProgress] = useState(0);
  const [inStory, setInStory] = useState(false);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      // Wayfinding: which act is on screen, and how far through the story the reader is (kept in both modes).
      ScrollTrigger.create({
        trigger: el.querySelector("[data-mj-story]"),
        start: "top center",
        end: "bottom center",
        onUpdate: (self) => setProgress(Math.round(self.progress * 100)),
        onToggle: (self) => setInStory(self.isActive),
      });
      el.querySelectorAll<HTMLElement>("[data-mj-act]").forEach((a) => {
        ScrollTrigger.create({ trigger: a, start: "top 55%", end: "bottom 55%", onToggle: (t) => t.isActive && setAct(a.dataset.mjAct!) });
      });
    }, el);
    return () => ctx.revert();
  }, [reading]);

  useEffect(() => {
    const el = root.current;
    if (!el || still) return;
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia(el);
    mm.add({ desk: "(min-width: 1024px)", phone: "(max-width: 1023.98px)" }, (c) => {
      const desk = !!c.conditions?.desk;
      const k = desk ? 1 : 0.45;
      el.querySelectorAll<HTMLElement>("[data-mj-scene]").forEach((scene) => {
        const m = SCENES.find((x) => x.id === scene.dataset.mjScene)?.motion;
        if (!m) return;
        const sticky = desk && (scene.dataset.layout === "panorama" || scene.dataset.layout === "plate");
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: sticky ? scene : scene.querySelector("[data-mj-stage]") ?? scene,
            start: sticky ? "top top" : "top bottom",
            end: sticky ? "bottom bottom" : "bottom top",
            scrub: 0.7,
            invalidateOnRefresh: true,
          },
        });
        build(tl, scene, m, k);
      });
    });
    let raf = 0;
    const refresh = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => ScrollTrigger.refresh());
    };
    document.fonts?.ready.then(refresh);
    window.addEventListener("load", refresh);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("load", refresh);
      mm.revert();
    };
  }, [still]);

  // Switching modes changes the page height a lot; keep ScrollTrigger's measurements current.
  useEffect(() => {
    const raf = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(raf);
  }, [reading]);

  const actName = ACTS.find((a) => a.id === act)?.name ?? "";

  return (
    <div ref={root} className={s.journey} data-mode={still ? "static" : "story"} data-parallax-skip>
      {/* Opening: the title on paper, safely below the fixed nav; the first painting follows it. */}
      <header className={cn("gutter", s.intro)}>
        <p className="label text-brass">{INTRO.kicker}</p>
        <Headline as="h1" size="1" animate="mount" inscription={INTRO.inscription} voice={INTRO.voice} className="mt-5 max-w-[18ch]" />
        <p className="t-story mt-6 max-w-2xl text-lg text-sand">{INTRO.sub}</p>
        <p className="t-ui mt-3 max-w-2xl text-sm text-dust">{INTRO.note}</p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <a href="#act-land" className="label inline-flex min-h-11 items-center rounded-full bg-gold px-5 text-ivory hover:bg-bone focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold">
            Begin the journey
          </a>
          <ReadingToggle reading={reading} setReading={setReading} disabled={reduced} />
        </div>
      </header>

      {/* Wayfinding: act links and a progress line; a side rail on wide screens, a bar at the foot on phones. */}
      <nav aria-label="Acts of the Marwari story" className={cn(s.rail, inStory && s.railShown)}>
        <ol className={s.railList}>
          {ACTS.map((a) => (
            <li key={a.id}>
              <a href={`#act-${a.id}`} className={cn(s.railLink, act === a.id && s.railOn)} aria-current={act === a.id ? "true" : undefined}>
                <span className="font-mono">{a.numeral}</span>
                <span className={s.railName}>{a.name}</span>
              </a>
            </li>
          ))}
        </ol>
        <div className={s.railTrack} aria-hidden>
          <span className={s.railFill} style={{ transform: `scaleY(${progress / 100})` }} />
        </div>
      </nav>
      <div className={cn(s.phoneBar, inStory && s.railShown)} aria-hidden>
        <span className="label text-brass">{ACTS.find((a) => a.id === act)?.numeral} · {actName}</span>
        <span className={s.phoneTrack}><span className={s.phoneFill} style={{ transform: `scaleX(${progress / 100})` }} /></span>
      </div>

      <div data-mj-story>
        {ACTS.map((a) => (
          <div key={a.id} data-mj-act={a.id}>
            <section id={`act-${a.id}`} aria-labelledby={`act-${a.id}-h`} className={cn("gutter", s.actBand, a.id === "land" && s.actFirst)}>
              <p className="label text-brass">Act {a.numeral}</p>
              <h2 id={`act-${a.id}-h`} className="t-voice mt-2 text-display-3 text-bone">{a.name}</h2>
              <p className="t-story mt-3 max-w-xl text-sand">{a.line}</p>
            </section>
            {SCENES.filter((x) => x.act === a.id).map((scene) => (
              <SceneBlock key={scene.id} scene={scene} eager={scene.id === "00"} still={still} />
            ))}
          </div>
        ))}
      </div>

      <footer className={cn("gutter", s.close)}>
        <p className="label text-brass">The story continues</p>
        <p className="t-voice mt-3 max-w-2xl text-display-3 text-bone">The story stays with the horse.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/lore" className="label inline-flex min-h-11 items-center rounded-full border border-brass/60 px-5 text-bone hover:border-gold hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold">
            The lore of the bards →
          </Link>
          <Link href="/fleet#real-horses" className="label inline-flex min-h-11 items-center rounded-full border border-brass/60 px-5 text-bone hover:border-gold hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold">
            See real Marwari horses →
          </Link>
        </div>
        <p className="t-ui mt-10 max-w-3xl text-xs text-dust">{SOURCES}</p>
      </footer>
    </div>
  );
}

function ReadingToggle({ reading, setReading, disabled }: { reading: boolean; setReading: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => setReading(!reading)}
      aria-pressed={reading || disabled}
      disabled={disabled}
      className="label inline-flex min-h-11 items-center rounded-full border border-brass/60 px-5 text-bone hover:border-gold hover:text-gold disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
    >
      {disabled ? "Reading mode (motion is off)" : reading ? "Back to the moving story" : "Read the story"}
    </button>
  );
}

/** One scene: the three-layer painting and its reading panel. */
function SceneBlock({ scene, eager, still }: { scene: JourneyScene; eager?: boolean; still: boolean }) {
  const L = LAYERS[scene.id];
  // The three layers mount only once the scene is within about a screen of the viewport (the browser's own lazy-loading
  // distance is several screens on phones, where the scenes are stacked closely). The stage box keeps its size meanwhile.
  const ref = useRef<HTMLElement>(null);
  const [near, setNear] = useState(!!eager);
  useEffect(() => {
    if (near || !ref.current) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setNear(true); io.disconnect(); } }, { rootMargin: "120% 0px 120% 0px" });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [near]);
  // The idle and ambient loops run only while the scene is actually on screen (CSS reads data-live); off screen they pause.
  const [live, setLive] = useState(false);
  useEffect(() => {
    if (still || !ref.current) return;
    const io = new IntersectionObserver(([e]) => setLive(e.isIntersecting), { rootMargin: "0px" });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [still]);
  const hid = `scene-${scene.id}-h`;
  const origin = scene.motion.s?.origin ?? "50% 70%";
  const load = eager ? ({ loading: "eager", fetchPriority: "high" } as const) : ({ loading: "lazy" } as const);
  const moving = !still;
  return (
    <section
      ref={ref}
      id={`scene-${scene.id}`}
      data-mj-scene={scene.id}
      data-layout={scene.layout}
      data-side={scene.side}
      data-place={scene.place ?? "bottom"}
      data-live={moving && live ? "" : undefined}
      aria-labelledby={hid}
      className={s.scene}
      style={{ "--mj-phase": `${-(Number(scene.id) % 7) * 1.1}s` } as CSSProperties}
    >
      <div className={s.track}>
        <div className={s.sticky}>
          <div className={s.stage} data-mj-stage>
            <div className={s.stageInner} data-mj-inner>
              <div className={s.layer} data-mj-layer="b">
                {near && <Image src={L.b} alt="" fill sizes="100vw" className={s.img} {...load} />}
              </div>
              {near && moving && scene.ambient === "desert" && <div className={s.haze} aria-hidden />}
              <div className={s.layer} data-mj-layer="s" style={{ transformOrigin: origin }}>
                <div className={s.gait} data-mj-gait>
                  {near ? (
                    <Subject src={L.s} alt={scene.alt} load={load} idle={moving ? scene.idle : undefined} />
                  ) : (
                    <span className="sr-only" role="img" aria-label={scene.alt} />
                  )}
                </div>
              </div>
              {scene.motion.fx && <div className={cn(s.fx, s[`fx-${scene.motion.fx}`])} data-mj-fx aria-hidden />}
              <div className={s.layer} data-mj-layer="f">
                {near && <Image src={L.f} alt="" fill sizes="100vw" className={s.img} loading="lazy" />}
              </div>
              {near && moving && scene.ambient && <AmbientLayer kind={scene.ambient} />}
            </div>
          </div>
          <div className={s.read}>
            <div className={s.panel}>
              {scene.kicker && <p className="label text-brass">{scene.kicker}</p>}
              <h3 id={hid} className={cn("t-voice mt-2 text-bone", s.title)}>{scene.title}</h3>
              {scene.body.map((p) => (
                <p key={p.slice(0, 24)} className="t-story mt-3 text-sand">{p}</p>
              ))}
              {scene.pull && <p className="t-voice mt-4 text-2xl text-gold">{scene.pull}</p>}
              {scene.list && (
                <dl className={s.list}>
                  {scene.list.map((it) => (
                    <div key={it.name}>
                      <dt className="label text-bone">{it.name}</dt>
                      <dd className="t-ui text-sm text-sand">{it.text}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {scene.link && (
                <Link href={scene.link.href} className="label mt-5 inline-flex min-h-11 items-center gap-2 text-gold hover:text-bone focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold">
                  {scene.link.label} →
                </Link>
              )}
              <p className={s.status}>
                <span className={cn(s.dot, scene.status === "folklore" && s.dotFolk, (scene.status === "reconstruction" || scene.status === "interpretive") && s.dotRecon)} aria-hidden />
                <span>
                  {STATUS_LABEL[scene.status]}
                  {scene.caveat ? `. ${scene.caveat}` : "."}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

type Load = { loading: "eager"; fetchPriority: "high" } | { loading: "lazy" };

/**
 * The subject cut-out. With an idle rig it is drawn as up to four copies of the same image (one request, one decode):
 * the base with the head's core hidden; a feathered barrel copy that breathes (scale only grows, so it always covers the
 * base beneath it); a feathered head-and-neck copy that nods about the withers, whose solid core spans the base's hidden
 * core so the alpha never thins at the seam; and inside the head, a light silhouette seen through a narrow band that
 * sweeps across the mane. All moves are CSS transforms on composited layers; none of this exists in still mode.
 */
function Subject({ src, alt, load, idle }: { src: string; alt: string; load: Load; idle?: Idle }) {
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
        <div className={s.sheen}>
          <div className={s.sheenFill}>{copy(s.sheenImg)}</div>
        </div>
      </div>
    </div>
  );
}

/** Looping atmosphere over the painting (see Ambient in lib/content/marwari-journey.ts); purely decorative. */
function AmbientLayer({ kind }: { kind: Ambient }) {
  return (
    <div className={s.amb} data-kind={kind} aria-hidden>
      {kind === "desert" && (
        <>
          <span className={cn(s.motes, s.motesNear)} />
          <span className={cn(s.motes, s.motesFar)} />
        </>
      )}
      {kind === "battle" && (
        <span className={s.emberField}>
          <span className={s.glow} />
          <span className={cn(s.sparks, s.sparksNear)} />
          <span className={cn(s.sparks, s.sparksFar)} />
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
function build(tl: gsap.core.Timeline, scene: HTMLElement, m: Motion, k: number) {
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
