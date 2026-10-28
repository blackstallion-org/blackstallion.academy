"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import gsap from "gsap";
import { ScrambleText } from "@/components/motion/ScrambleText";
import { useReducedMotion } from "@/lib/motion/reduced";
import styles from "./ImageCubeGallery.module.css";

const photographs = [
  { title: "First contact", src: "/images/cinematic-images/pexels-v-marin-701396667-29487828.webp", alt: "A quiet encounter between a person and a horse", copy: "The story begins with a moment of attention." },
  { title: "The first bond", src: "/images/bond-field-horizontal.webp", alt: "Horse and rider together in the field", copy: "A shared space. A relationship taking shape." },
  { title: "The details", src: "/images/cinematic-images/pexels-cristian-rojas-8064265.webp", alt: "A close study of equestrian tack and a stirrup", copy: "Leather, iron, and the small details of a ride." },
  { title: "In balance", src: "/images/science-rider-posture.webp", alt: "A rider seated on a horse in profile", copy: "A quieter frame, with horse and rider in focus." },
  { title: "The Marwari", src: "/images/black-marwari-stallion.webp", alt: "A dark Marwari stallion", copy: "A distinctive silhouette. A presence of its own." },
  { title: "Up close", src: "/media/curr-groundcare.webp", alt: "A cadet picking a horse's hoof in a sunlit stable", copy: "The moments between the larger ones." },
];
const rotations = [{ x: 0, y: 0 }, { x: 0, y: -90 }, { x: 0, y: -180 }, { x: 0, y: -270 }, { x: -90, y: 0 }, { x: 90, y: 0 }];

/** An original six-face mosaic using ordinary CSS 3D transforms and GSAP. */
export function ImageCubeGallery() {
  const gridRef = useRef<HTMLDivElement>(null);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const touchX = useRef<number | null>(null);
  const [selected, setSelected] = useState(0);
  const [ready, setReady] = useState(false);
  // The 144 cube faces only receive their (multi-megabyte) photographs once the gallery approaches the viewport;
  // as CSS backgrounds in the server HTML they were all downloaded with the page, hidden grid or not.
  const [near, setNear] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid || reduced || !CSS.supports("transform-style", "preserve-3d")) return;
    let disposed = false;
    const sources: HTMLImageElement[] = [];
    let resize: ResizeObserver | undefined;
    const observer = new IntersectionObserver((entries) => {
      if (!entries[0]?.isIntersecting) return;
      observer.disconnect();
      setNear(true);
      resize = new ResizeObserver(() => {
        const columns = window.innerWidth < 700 ? 4 : 6;
        const depth = grid.clientWidth / columns / 2;
        grid.style.setProperty("--depth", `${depth}px`);
        gsap.set(grid.children, { z: -depth });
      });
      resize.observe(grid);
      void Promise.all(photographs.map((photo) => new Promise<void>((resolve, reject) => {
        const image = new window.Image();
        sources.push(image);
        image.onload = () => resolve();
        image.onerror = reject;
        image.src = photo.src;
      }))).then(() => { if (!disposed) setReady(true); }).catch(() => { /* Keep the ordinary photograph if any face cannot load. */ });
    }, { rootMargin: "500px" });
    observer.observe(grid);
    return () => {
      disposed = true;
      observer.disconnect();
      resize?.disconnect();
      sources.forEach((image) => { image.onload = null; image.onerror = null; });
      gsap.killTweensOf(grid.children);
    };
  }, [reduced]);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid || !ready || reduced) return;
    const rotation = rotations[selected];
    const tween = gsap.to(grid.children, {
      rotationX: `${rotation.x}_short`, rotationY: `${rotation.y}_short`,
      duration: 0.95, ease: "power3.inOut", stagger: { each: 0.018, from: "center", grid: "auto" }, overwrite: "auto",
    });
    return () => { tween.kill(); };
  }, [selected, ready, reduced]);

  const photo = photographs[selected];
  return <section id="living-archive" aria-labelledby="living-archive-title" className={styles.section} data-parallax-skip>
    <header className={styles.header}>
      <p className={styles.label}>BSAH / A photographic study</p>
      <h2 id="living-archive-title"><ScrambleText typeface="heritage" text="The living archive." /></h2>
      <p className={styles.intro}>Six perspectives. One world.<br />Choose a frame to turn the story.</p>
    </header>
    <div className={styles.stage} onPointerDown={(event) => { touchX.current = event.clientX; }}
      onPointerUp={(event) => {
        if (touchX.current !== null && Math.abs(event.clientX - touchX.current) > 50) setSelected((index) => (index + (event.clientX < touchX.current! ? 1 : 5)) % 6);
        touchX.current = null;
      }} onPointerCancel={() => { touchX.current = null; }}>
      <Image src={photo.src} alt={photo.alt} fill sizes="(min-width: 1100px) 1100px, 95vw" className={`${styles.still} ${ready && !reduced ? styles.hidden : ""}`} />
      <div ref={gridRef} aria-hidden="true" className={`${styles.grid} ${ready && !reduced ? styles.ready : ""}`}>
        {Array.from({ length: 24 }, (_, index) => <div key={index} className={styles.cube} style={{
          "--col": index % 6, "--row": Math.floor(index / 6), "--mobile-col": index % 4, "--mobile-row": Math.floor(index / 4),
        } as CSSProperties}>
          {photographs.map((image, face) => <span key={image.src} className={`${styles.face} ${styles[`face${face}`]}`}><span style={near ? { backgroundImage: `url("${image.src}")` } : undefined} /></span>)}
        </div>)}
      </div>
    </div>
    <div className={styles.caption} aria-live="polite" aria-atomic="true">
      <span className={styles.label}>0{selected + 1} / 06</span><p><strong>{photo.title}.</strong> {photo.copy}</p>
    </div>
    <div className={styles.navigation} role="group" aria-label="Choose an archive photograph" data-sound="horseCall">
      {photographs.map((item, index) => <button key={item.title} ref={(node) => { buttons.current[index] = node; }} type="button"
        aria-pressed={selected === index} onClick={() => setSelected(index)} onKeyDown={(event) => {
          if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
          event.preventDefault();
          const next = event.key === "Home" ? 0 : event.key === "End" ? 5 : (index + (event.key === "ArrowRight" ? 1 : 5)) % 6;
          setSelected(next); buttons.current[next]?.focus();
        }}><span>0{index + 1}</span>{item.title}</button>)}
    </div>
  </section>;
}
