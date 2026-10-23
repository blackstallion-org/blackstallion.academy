"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrambleText } from "@/components/motion/ScrambleText";
import styles from "./HorseSequence.module.css";

const FRAME_COUNT = 32;
const frameUrl = (index: number) => `/images/horse-sequence/${String(index + 1).padStart(3, "0")}.webp`;

const chapters = [
  { number: "01 / 03", title: "Presence.", copy: "Before the ride, there is the horse. A moment to pause, observe, and meet." },
  { number: "02 / 03", title: "Connection.", copy: "The first exchange is quiet: a glance, a hand, a shared sense of space." },
  { number: "03 / 03", title: "Movement.", copy: "Then the story moves forward, one measured step at a time." },
];

/** A contained scroll chapter; it never changes the page's scroll position or global snap. */
export function HorseSequence() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    if (!section || !stageRef.current || !canvas) return;

    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    const context = canvas.getContext("2d", { alpha: true });
    const frames: (HTMLImageElement | undefined)[] = new Array(FRAME_COUNT);
    let lastDrawn = -1;
    let disposed = false;
    let started = false;

    const draw = (index: number) => {
      if (!context || disposed) return;
      const target = Math.max(0, Math.min(FRAME_COUNT - 1, index));
      if (target === lastDrawn) return;
      const image = frames[target] ?? frames.slice(0, target + 1).reverse().find(Boolean);
      if (!image?.complete || image.naturalWidth === 0) return;
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      lastDrawn = target;
      canvas.classList.add(styles.ready);
    };

    const loadFrames = () => {
      if (started) return;
      started = true;
      for (let index = 0; index < FRAME_COUNT; index += 1) {
        const image = new Image();
        image.decoding = "async";
        image.onload = () => {
          frames[index] = image;
          if (index === 0) draw(0);
        };
        image.src = frameUrl(index);
      }
    };

    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        loadFrames();
        observer.disconnect();
      }
    }, { rootMargin: "100% 0px" });
    observer.observe(section);

    media.add("(prefers-reduced-motion: no-preference)", () => {
      const panels = gsap.utils.toArray<HTMLElement>(section.querySelectorAll(`.${styles.panel}`));
      let frameRequest = 0;
      const ctx = gsap.context(() => {
        gsap.set(panels.slice(1), { autoAlpha: 0 });
        const timeline = gsap.timeline({
          paused: true,
          defaults: { ease: "none" },
        });
        timeline
          .to(panels[0], { autoAlpha: 0, y: -24, duration: 0.14 }, 0.24)
          .fromTo(panels[1], { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.16 }, 0.31)
          .to(panels[1], { autoAlpha: 0, y: -24, duration: 0.14 }, 0.56)
          .fromTo(panels[2], { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.16 }, 0.63);
        const sync = () => {
          frameRequest = 0;
          const rect = section.getBoundingClientRect();
          const distance = Math.max(1, rect.height - window.innerHeight);
          const progress = gsap.utils.clamp(0, 1, -rect.top / distance);
          timeline.progress(progress);
          draw(Math.round(progress * (FRAME_COUNT - 1)));
        };
        const requestSync = () => { if (!frameRequest) frameRequest = requestAnimationFrame(sync); };
        ScrollTrigger.create({ trigger: section, start: "top bottom", end: "bottom top", onUpdate: requestSync });
        window.addEventListener("scroll", requestSync, { passive: true });
        window.addEventListener("resize", requestSync);
        requestSync();
        return () => {
          window.removeEventListener("scroll", requestSync);
          window.removeEventListener("resize", requestSync);
          cancelAnimationFrame(frameRequest);
        };
      }, section);
      return () => ctx.revert();
    });

    return () => {
      disposed = true;
      observer.disconnect();
      media.revert();
      frames.forEach((image) => { if (image) image.onload = null; });
    };
  }, []);

  return (
    <>
    <section ref={sectionRef} className={styles.section} aria-labelledby="horse-sequence-title" data-parallax-skip>
      <div ref={stageRef} className={styles.stage}>
        <div className={styles.topline}>
          <span>BSAH / The Marwari</span>
          <span>Study in motion</span>
        </div>
        <div className={styles.visual}>
          {/* The still remains visible if frames fail or JavaScript is unavailable. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={frameUrl(0)} alt="Dark bay Marwari horse standing in profile" className={styles.fallback} loading="lazy" />
          <canvas ref={canvasRef} width={900} height={630} className={styles.canvas} aria-hidden="true" />
        </div>
        <div className={styles.copy}>
          <p className={styles.eyebrow}>The horse, in focus</p>
          <h2 id="horse-sequence-title" className={styles.srOnly}>The horse, in focus</h2>
          <div className={styles.panelStack}>
            {chapters.map((chapter) => (
              <div key={chapter.number} className={styles.panel}>
                <span className={styles.number}>{chapter.number}</span>
                <h3 className={styles.title}><ScrambleText typeface="condensed" text={chapter.title} /></h3>

              </div>
            ))}
          </div>
        </div>
        <div className={styles.bottomline}>
          <span>Black Stallion Academy of Horsemanship</span>
          <span>Scroll to explore ↓</span>
        </div>
      </div>
    </section>
    <div className="tone-light editorial-reel-notes gutter">
      {chapters.map((chapter) => <article key={chapter.number}><h3>{chapter.title}</h3><p>{chapter.copy}</p></article>)}
    </div>
    </>
  );
}
