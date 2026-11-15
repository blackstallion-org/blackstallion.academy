"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Headline } from "@/components/film/Headline";
import { useReducedMotion } from "@/lib/motion/reduced";
import { cn } from "@/lib/utils";
import { ACTS, INTRO, LAYERS, SCENES, SOURCES, STATUS_LABEL, type JourneyScene } from "@/lib/content/marwari-journey";
import s from "./journey.module.css";
import { AmbientLayer, build, Subject } from "./layers";

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
/**
 * `afterPoster`: the page opens on a StoryPoster that already carries the h1, label and "Begin" link, so the opening here
 * keeps only the subtitle, the note and the reading toggle (one h1 per page), with id `journey-start` for "Begin".
 */
export function MarwariJourney({ afterPoster = false }: { afterPoster?: boolean } = {}) {
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
      <header id="journey-start" className={cn("gutter", s.intro, afterPoster && s.introAfterPoster)}>
        {!afterPoster && (
          <>
            <p className="label text-brass">{INTRO.kicker}</p>
            <Headline as="h1" size="1" animate="mount" inscription={INTRO.inscription} voice={INTRO.voice} className="mt-5 max-w-[18ch]" />
          </>
        )}
        <p className={cn("t-story max-w-2xl text-lg text-sand", !afterPoster && "mt-6")}>{INTRO.sub}</p>
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
      data-parchment={scene.parchment ? "" : undefined}
      data-live={moving && live ? "" : undefined}
      aria-labelledby={hid}
      className={s.scene}
      style={
        {
          "--mj-phase": `${-(Number(scene.id) % 7) * 1.1}s`,
          ...(scene.parchment && { "--pm-x": scene.parchment.x, "--pm-y": scene.parchment.y, "--pm-w": scene.parchment.w, "--pm-h": scene.parchment.h }),
        } as CSSProperties
      }
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
