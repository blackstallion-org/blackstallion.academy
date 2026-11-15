"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import gsap from "gsap";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { CrestMark } from "@/components/brand/CrestMark";
import { Wordmark } from "@/components/brand/Wordmark";
import { FilmNoise } from "@/components/motion/fx/FilmNoise";
import { AmbientLayer, Subject } from "@/components/sections/legend/journey/layers";
import journey from "@/components/sections/legend/journey/journey.module.css";
import { LAYERS, SCENES } from "@/lib/content/marwari-journey";
import { TRAILER_LENGTH, TRAILER_MUSIC, TRAILER_NOTE, TRAILER_OPEN, TRAILER_SHOTS, type LayerMove, type TrailerShot } from "@/lib/content/opening-trailer";
import { duckMusic, releaseMusic } from "@/lib/audio/mixer";
import { cn } from "@/lib/utils";
import styles from "./painted-trailer.module.css";

/** How long the visitor waits for the first painting before the page is shown instead (ms). */
const LOAD_LIMIT = 8000;
/** close to the house curve [0.16, 1, 0.3, 1] */
const CITADEL = "expo.out";

/**
 * The opening trailer (15 Nov 2026): about 25 s cut from the painted Marwari journey, laid over the home page on the first visit of
 * a session in place of the Marwar Journey video (which stays mid-page). Each shot is one painting as three layers (background,
 * subject, foreground) in an exact 16:9 box sized to cover the screen, so the idle rig and the parallax stay registered; one GSAP
 * timeline on the clock (not scroll) cuts between them under 2.39:1-style letterbox bars, film grain and two-voice title cards.
 * Muted until the visitor presses Sound; Skip, Escape or the end fades it over the page. If the first painting has not loaded in
 * 8 s the page is shown at once. Never shown under reduced motion, Data Saver or 2G (lib/opening/intro-boot.ts).
 */
export function PaintedTrailer({ onDone, onReveal }: { onDone: () => void; onReveal?: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const progress = useRef<HTMLSpanElement>(null);
  const audio = useRef<HTMLAudioElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const finished = useRef(false);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(true);
  const [reveal, setReveal] = useState(false);

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    tl.current?.pause();
    const a = audio.current;
    if (a && !a.paused) gsap.to(a, { volume: 0, duration: 1.6, onComplete: () => a.pause() });
    setReveal(true);
    onReveal?.();
    window.setTimeout(() => { releaseMusic("trailer"); onDone(); }, 1700);
  }, [onDone, onReveal]);

  // the first painting must be in memory before the clock starts; the rest stream in behind it
  useEffect(() => {
    let alive = true;
    const first = LAYERS[TRAILER_SHOTS[0].scene];
    const decode = (src: string) => { const img = new window.Image(); img.src = src; return img.decode().catch(() => undefined); };
    const giveUp = window.setTimeout(() => { if (alive && !finished.current) { finished.current = true; onDone(); } }, LOAD_LIMIT);
    Promise.all([first.b, first.s, first.f].map(decode)).then(() => { if (alive) { window.clearTimeout(giveUp); setReady(true); } });
    // warm the next painting too, so the first cut never waits
    const second = LAYERS[TRAILER_SHOTS[1].scene];
    [second.b, second.s, second.f].forEach(decode);
    return () => { alive = false; window.clearTimeout(giveUp); };
  }, [onDone]);

  // the cut: one timeline for the whole trailer
  useEffect(() => {
    const el = root.current;
    if (!ready || !el) return;
    const phone = window.matchMedia("(max-width: 767px)").matches;
    const k = phone ? 0.45 : 1;
    const ctx = gsap.context(() => {
      const t: gsap.core.Timeline = gsap.timeline({
        paused: true,
        onUpdate: () => { if (progress.current) progress.current.style.transform = `scaleX(${Math.min(1, t.time() / TRAILER_LENGTH)})`; },
      });
      const q = <T extends Element = HTMLElement>(sel: string) => el.querySelector<T>(sel);
      const bars = el.querySelectorAll("[data-bar]");
      const dip = q("[data-dip]");

      // cold open: black, the bars close, one quiet line
      t.fromTo(bars, { scaleY: 0 }, { scaleY: 1, duration: 1.1, ease: "power2.inOut" }, 0);
      t.fromTo("[data-open]", { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: CITADEL }, 0.15)
        .to("[data-open]", { autoAlpha: 0, duration: 0.35 }, TRAILER_OPEN.len - 0.4);

      TRAILER_SHOTS.forEach((shot, i) => {
        const shotEl = q(`[data-shot="${i}"]`);
        const inner = q(`[data-shot="${i}"] [data-inner]`);
        if (!shotEl || !inner) return;
        const next = TRAILER_SHOTS[i + 1];
        const end = next ? next.at + (next.cut === "dissolve" ? 0.6 : 0) : TRAILER_LENGTH + 2;
        const run = end - shot.at + 0.2;

        // arrival
        if (shot.cut === "dissolve") t.fromTo(shotEl, { autoAlpha: 0 }, { autoAlpha: 1, duration: 1, ease: "sine.inOut" }, shot.at - 0.45);
        else if (shot.cut === "whip") {
          t.set(shotEl, { autoAlpha: 1 }, shot.at)
            .fromTo(inner, { xPercent: 7 * k, filter: "blur(10px)" }, { xPercent: 0, filter: "blur(0px)", duration: 0.45, ease: "power3.out" }, shot.at);
        } else t.set(shotEl, { autoAlpha: 1 }, shot.at);
        if (shot.cut === "dip" && dip) t.to(dip, { autoAlpha: 1, duration: 0.4, ease: "sine.in" }, shot.at - 0.4).to(dip, { autoAlpha: 0, duration: 0.8, ease: "sine.out" }, shot.at);
        if (next) t.set(shotEl, { autoAlpha: 0 }, end);

        // the camera: each layer at its own depth
        const move = (sel: string, m?: LayerMove) => {
          const layer = q(`[data-shot="${i}"] [data-l="${sel}"]`);
          if (!layer || !m) return;
          t.fromTo(layer,
            { xPercent: (m.x?.[0] ?? 0) * k, yPercent: (m.y?.[0] ?? 0) * k, scale: m.scale?.[0] ?? 1 },
            { xPercent: (m.x?.[1] ?? 0) * k, yPercent: (m.y?.[1] ?? 0) * k, scale: m.scale?.[1] ?? 1, duration: run, ease: "sine.out" }, shot.at);
        };
        move("b", shot.b); move("s", shot.s); move("f", shot.f);
        const camera = q(`[data-shot="${i}"] [data-camera]`);
        if (camera && shot.push) {
          camera.style.transformOrigin = shot.push.origin;
          t.fromTo(camera, { scale: shot.push.scale[0] }, { scale: shot.push.scale[1], duration: run, ease: "sine.out" }, shot.at);
        }
        if (camera && shot.drain) t.fromTo(camera, { filter: "saturate(1) sepia(0) brightness(1)" }, { filter: "saturate(0.3) sepia(0.5) brightness(0.82)", duration: shot.len, ease: "sine.inOut" }, shot.at);
        if (camera && shot.shake) t.to(camera, { keyframes: { x: [0, -12 * k, 9 * k, -6 * k, 3 * k, 0], y: [0, 5 * k, -4 * k, 2 * k, -1, 0] }, duration: 0.55, ease: "none" }, shot.at + 0.1);

        // the card: two lines rise out of their masks, then leave before the cut
        const lines = el.querySelectorAll(`[data-card="${i}"] [data-line]`);
        const card = q(`[data-card="${i}"]`);
        if (!card) return;
        t.set(card, { autoAlpha: 1 }, shot.at)
          .fromTo(lines, { yPercent: 115 }, { yPercent: 0, duration: 1, ease: CITADEL, stagger: 0.14 }, shot.at + (shot.card.final ? 0.6 : 0.2));
        if (shot.card.final) t.fromTo("[data-endshade]", { autoAlpha: 0 }, { autoAlpha: 1, duration: 1, ease: "sine.inOut" }, shot.at + 0.2);
        if (shot.card.final) t.fromTo("[data-brand]", { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 1.1, ease: CITADEL }, shot.at + 1.6);
        else t.to(card, { autoAlpha: 0, filter: "blur(6px)", duration: 0.32, ease: "sine.in" }, end - 0.36);
      });

      // the end: the bars open on the last painting, then the page
      t.to(bars, { scaleY: 0, duration: 1.2, ease: "power2.inOut" }, TRAILER_LENGTH - 1.3);
      t.call(finish, [], TRAILER_LENGTH);
      tl.current = t;
      t.play(0);
    }, el);
    return () => { ctx.revert(); tl.current = null; };
  }, [ready, finish]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") finish(); };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [finish]);

  // the score follows the picture: whenever sound starts it jumps to the timeline's time
  const syncAudio = useCallback(() => {
    const a = audio.current, t = tl.current;
    if (!a || !t) return;
    a.currentTime = Math.min(t.time(), Math.max(0, (a.duration || TRAILER_LENGTH) - 0.05));
    a.play().catch(() => setMuted(true));
  }, []);

  // a hidden tab pauses the cut (and its sound) instead of running on unseen
  useEffect(() => {
    const vis = () => {
      if (document.hidden) { tl.current?.pause(); audio.current?.pause(); }
      else if (playing && !finished.current) { tl.current?.play(); if (!muted) syncAudio(); }
    };
    document.addEventListener("visibilitychange", vis);
    return () => document.removeEventListener("visibilitychange", vis);
  }, [playing, muted, syncAudio]);

  const togglePlay = () => {
    const t = tl.current;
    if (!t) return;
    if (t.paused()) { t.play(); setPlaying(true); if (!muted) syncAudio(); }
    else { t.pause(); audio.current?.pause(); setPlaying(false); }
  };
  const toggleSound = () => {
    const a = audio.current;
    if (!a) return;
    if (muted) { duckMusic("trailer", 0); a.volume = 1; setMuted(false); if (playing) syncAudio(); }
    else { a.pause(); releaseMusic("trailer"); setMuted(true); }
  };

  return (
    <div
      ref={root}
      className={cn(styles.root, "tone-photo")}
      data-reveal={reveal || undefined}
      data-intro-film
      role="region"
      aria-label="Opening trailer: the Marwari, in seven paintings"
      style={{ "--mj-play": playing && !reveal ? "running" : "paused" } as CSSProperties}
    >
      {TRAILER_SHOTS.map((shot, i) => <Shot key={shot.scene} shot={shot} index={i} />)}

      <div className={styles.vignette} aria-hidden />
      <FilmNoise className={styles.grain} opacity={0.07} blendMode="overlay" dust={0.25} scratches={0.12} flicker={0.18} />
      <div className={styles.endShade} data-endshade aria-hidden />
      <div className={styles.dip} data-dip aria-hidden />

      <p className={styles.open} data-open aria-hidden>{TRAILER_OPEN.line}</p>

      {TRAILER_SHOTS.map((shot, i) => (
        <div key={shot.scene} className={cn(styles.card, shot.card.final && styles.cardFinal)} data-card={i} aria-hidden>
          <span className={styles.mask}><span className={cn("t-inscribe", styles.inscription)} data-line>{shot.card.inscription}</span></span>
          <span className={styles.mask}>
            <span className={cn("t-voice", styles.voice)} data-line>
              {shot.card.blood ? (
                <>{shot.card.voice.slice(0, shot.card.voice.lastIndexOf(shot.card.blood))}<span className={styles.blood}>{shot.card.blood}</span></>
              ) : shot.card.voice}
            </span>
          </span>
          {shot.card.final && (
            <span className={styles.brand} data-brand>
              <CrestMark className="h-12 w-12 md:h-14 md:w-14" decorative />
              <Wordmark size="custom" className="text-[1rem] md:text-[1.2rem]" />
            </span>
          )}
        </div>
      ))}
      {/* the whole story for screen readers, once */}
      <p className="sr-only">{TRAILER_SHOTS.map((s) => `${s.card.inscription} ${s.card.voice}`).join(" ")}</p>

      <div className={cn(styles.bar, styles.barTop)} data-bar aria-hidden />
      <div className={cn(styles.bar, styles.barBottom)} data-bar aria-hidden />

      <div className={styles.controls}>
        <div className={styles.left}>
          <button type="button" className={styles.skip} onClick={finish}>Skip intro <span aria-hidden>→</span></button>
          <span className={styles.note}>{TRAILER_NOTE}</span>
        </div>
        <div className={styles.buttons}>
          {TRAILER_MUSIC && (
            <button type="button" className={styles.round} onClick={toggleSound} aria-pressed={!muted} aria-label="Trailer sound">
              {muted ? <VolumeX size={18} strokeWidth={1.4} aria-hidden /> : <Volume2 size={18} strokeWidth={1.4} aria-hidden />}
            </button>
          )}
          <button type="button" className={cn(styles.round, styles.play)} onClick={togglePlay} disabled={!ready} aria-label={playing ? "Pause the trailer" : "Play the trailer"}>
            {playing ? <Pause size={20} strokeWidth={1.4} aria-hidden /> : <Play size={20} strokeWidth={1.4} aria-hidden />}
          </button>
        </div>
      </div>
      <span className={styles.track} aria-hidden><span ref={progress} /></span>
      {TRAILER_MUSIC && <audio ref={audio} src={TRAILER_MUSIC.src} preload="auto" />}
    </div>
  );
}

/** One painting: an exact 16:9 box that covers the screen (anchored at the shot's focus), its three layers, rig and atmosphere. */
function Shot({ shot, index }: { shot: TrailerShot; index: number }) {
  const L = LAYERS[shot.scene];
  const scene = SCENES.find((s) => s.id === shot.scene);
  const first = index === 0;
  const load = first ? ({ loading: "eager", fetchPriority: "high", unoptimized: true } as const) : ({ loading: "eager", unoptimized: true } as const);
  return (
    <div
      className={styles.shot}
      data-shot={index}
      style={{ "--fx": shot.focus[0], "--fy": shot.focus[1], "--mj-phase": `${-index * 1.3}s` } as CSSProperties}
    >
      <div className={styles.frame} data-inner>
        <div className={styles.camera} data-camera>
          <div className={journey.layer} data-l="b"><Image src={L.b} alt="" fill sizes="100vw" className={journey.img} {...load} /></div>
          {shot.ambient === "desert" && <div className={journey.haze} aria-hidden />}
          <div className={journey.layer} data-l="s">
            <Subject src={L.s} alt="" load={load} idle={scene?.idle} sheen={false} />
          </div>
          <div className={journey.layer} data-l="f"><Image src={L.f} alt="" fill sizes="100vw" className={journey.img} {...load} /></div>
          {shot.ambient && <AmbientLayer kind={shot.ambient} />}
        </div>
      </div>
    </div>
  );
}
