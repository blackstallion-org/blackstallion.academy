"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useCallback } from "react";
import { CrestMark } from "@/components/brand/CrestMark";

/* ================= Stallion Data Model ================= */
interface StallionData {
  id: string;
  name: string;
  shortName: string;
  number: string;
  nextId: string;
  nextName: string;
  nextNumber: string;
  video: string;
  portalVideo: string;
  facts: [string, string][];
}

const STALLIONS: StallionData[] = [
  {
    id: "chetak",
    name: "Chetak IX",
    shortName: "CHETAK",
    number: "[01]",
    nextId: "veer",
    nextName: "Veer",
    nextNumber: "[02]",
    video: "https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/3c83091e-4046-4fd6-adbb-2edb728be79a.mp4",
    portalVideo: "https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/fc3ded42-e845-41f3-a830-5cab512d79cd.mp4",
    facts: [
      ["Breed:", "Purebred Marwari (Equus caballus)"],
      ["Height:", "15.2 hands (157 cm)"],
      ["Coat:", "Dark bay, white blaze · Bhanwar"],
      ["Microchip:", "ISO 11784 · 356 098 112 004 912"],
      ["Discipline:", "The Calm Sovereign · Breath calibration"]
    ]
  },
  {
    id: "veer",
    name: "Veer",
    shortName: "VEER",
    number: "[02]",
    nextId: "zilzal",
    nextName: "Zilzal",
    nextNumber: "[03]",
    video: "https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/fc3ded42-e845-41f3-a830-5cab512d79cd.mp4",
    portalVideo: "https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/b30f64d9-1637-477a-83df-d0fc6461a422.mp4",
    facts: [
      ["Breed:", "Kathiawari cavalry line"],
      ["Height:", "15.0 hands (152 cm)"],
      ["Coat:", "Chestnut gold · Surang"],
      ["Microchip:", "ISO 11784 · 356 098 112 004 988"],
      ["Discipline:", "High-Velocity Lancer · Lance precision"]
    ]
  },
  {
    id: "zilzal",
    name: "Zilzal",
    shortName: "ZILZAL",
    number: "[03]",
    nextId: "tofan",
    nextName: "Tofan",
    nextNumber: "[04]",
    video: "https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/b30f64d9-1637-477a-83df-d0fc6461a422.mp4",
    portalVideo: "https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/5fc5651c-3b5d-4171-b507-87f7e635d1b4.mp4",
    facts: [
      ["Breed:", "Purebred Marwari (Indigenous)"],
      ["Height:", "15.3 hands (160 cm)"],
      ["Coat:", "Jet black · Kala studbook"],
      ["Microchip:", "ISO 11784 · 356 098 112 005 011"],
      ["Discipline:", "The Stoic Leader · Vaulting & formation"]
    ]
  },
  {
    id: "tofan",
    name: "Tofan",
    shortName: "TOFAN",
    number: "[04]",
    nextId: "chetak",
    nextName: "Chetak IX",
    nextNumber: "[01]",
    video: "https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/5fc5651c-3b5d-4171-b507-87f7e635d1b4.mp4",
    portalVideo: "https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/3c83091e-4046-4fd6-adbb-2edb728be79a.mp4",
    facts: [
      ["Breed:", "Purebred Marwari"],
      ["Height:", "15.1 hands (155 cm)"],
      ["Coat:", "Dappled grey · Shwet"],
      ["Microchip:", "ISO 11784 · 356 098 112 004 991"],
      ["Discipline:", "The Sensitive One · High acoustic response"]
    ]
  }
];

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function animateValue(setter: (v: number) => void, duration: number): Promise<void> {
  return new Promise((resolve) => {
    const start = performance.now();
    function step(now: number) {
      const t = Math.min(1, (now - start) / duration);
      setter(easeInOutCubic(t));
      if (t < 1) requestAnimationFrame(step);
      else resolve();
    }
    requestAnimationFrame(step);
  });
}

function roundedRectPoints(w: number, h: number, r: number) {
  r = Math.min(r, w / 2, h / 2);
  const corners = [
    [w / 2 - r, -h / 2 + r, -Math.PI / 2, 0],
    [w / 2 - r, h / 2 - r, 0, Math.PI / 2],
    [-w / 2 + r, h / 2 - r, Math.PI / 2, Math.PI],
    [-w / 2 + r, -h / 2 + r, Math.PI, Math.PI * 1.5]
  ];
  const pts: [number, number][] = [];
  corners.forEach((c) => {
    for (let i = 0; i <= 10; i++) {
      const a = c[2] + (c[3] - c[2]) * (i / 10);
      pts.push([c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r]);
    }
  });
  return pts;
}

export function StallionPortalHero() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const containerRef = useRef<HTMLElement>(null);
  const portalCanvasRef = useRef<HTMLCanvasElement>(null);
  const sceneCanvasRef = useRef<HTMLCanvasElement>(null);
  const portalBtnRef = useRef<HTMLButtonElement>(null);
  const portalVideoRef = useRef<HTMLVideoElement>(null);
  const transitionVideoRef = useRef<HTMLVideoElement>(null);
  const bgVideosRef = useRef<(HTMLVideoElement | null)[]>([]);
  const cursorRef = useRef<HTMLDivElement>(null);
  const cursorOrbitRef = useRef<HTMLSpanElement>(null);

  const animRef = useRef({
    expansion: 0,
    maskScale: 1,
    canvasOpacity: 1,
    transitionActive: false,
    rotX: 0,
    rotY: 0,
    targetX: 0,
    targetY: 0,
    pointerX: 0,
    pointerY: 0,
    orbitX: 0,
    orbitY: 0,
    frozenScene: false,
    busy: false
  });

  const cur = STALLIONS[currentIdx];

  const travelTo = useCallback((targetIndex: number) => {
    const a = animRef.current;
    if (a.busy || targetIndex === currentIdx) return;
    a.busy = true;
    a.targetX = 0;
    a.targetY = 0;

    const tVid = transitionVideoRef.current;
    if (!tVid) {
      a.busy = false;
      return;
    }

    setIsLoading(true);
    tVid.src = STALLIONS[currentIdx].portalVideo;
    tVid.load();

    const onMediaReady = () => {
      setIsLoading(false);
      setIsTransitioning(true);
      tVid.currentTime = 0;
      tVid.playbackRate = 1.3;
      a.canvasOpacity = 1;
      a.transitionActive = true;
      tVid.play().catch(() => {});

      animateValue((v) => {
        a.expansion = v;
      }, 1100)
        .then(() => {
          return new Promise<void>((resolve) => {
            const onEnd = () => {
              tVid.removeEventListener("ended", onEnd);
              resolve();
            };
            if (tVid.ended) resolve();
            else tVid.addEventListener("ended", onEnd);
            setTimeout(resolve, 3000); // safety fallback
          });
        })
        .then(() => {
          // Freeze scene onto scene canvas
          const sCanvas = sceneCanvasRef.current;
          if (sCanvas && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const d = Math.min(window.devicePixelRatio || 1, 2);
            sCanvas.width = Math.round(rect.width * d);
            sCanvas.height = Math.round(rect.height * d);
            const sctx = sCanvas.getContext("2d");
            if (sctx) {
              sctx.setTransform(d, 0, 0, d, 0, 0);
              const scale = Math.max(rect.width / (tVid.videoWidth || rect.width), rect.height / (tVid.videoHeight || rect.height));
              const w = (tVid.videoWidth || rect.width) * scale;
              const h = (tVid.videoHeight || rect.height) * scale;
              sctx.drawImage(tVid, (rect.width - w) / 2, (rect.height - h) / 2, w, h);
              a.frozenScene = true;
            }
          }

          setCurrentIdx(targetIndex);
          a.transitionActive = false;
          a.expansion = 0;
          a.maskScale = 0;
          setIsTransitioning(false);

          return animateValue((v) => {
            a.maskScale = v;
          }, 850);
        })
        .then(() => {
          a.frozenScene = false;
          a.busy = false;
        })
        .catch(() => {
          a.transitionActive = false;
          a.expansion = 0;
          a.maskScale = 1;
          setIsTransitioning(false);
          setIsLoading(false);
          a.busy = false;
        });
    };

    if (tVid.readyState >= 3) {
      onMediaReady();
    } else {
      tVid.addEventListener("canplaythrough", onMediaReady, { once: true });
      setTimeout(onMediaReady, 1200); // timeout fallback
    }
  }, [currentIdx]);

  useEffect(() => {
    // Play the active background video
    bgVideosRef.current.forEach((vid, i) => {
      if (!vid) return;
      if (i === currentIdx) {
        vid.play().catch(() => {});
      } else {
        vid.pause();
      }
    });

    if (portalVideoRef.current) {
      portalVideoRef.current.src = cur.portalVideo;
      portalVideoRef.current.play().catch(() => {});
    }
  }, [currentIdx, cur]);

  useEffect(() => {
    const container = containerRef.current;
    const pCanvas = portalCanvasRef.current;
    const sCanvas = sceneCanvasRef.current;
    const pBtn = portalBtnRef.current;
    if (!container || !pCanvas || !sCanvas || !pBtn) return;

    const pctx = pCanvas.getContext("2d");
    if (!pctx) return;

    let animId: number;
    let lastTime = performance.now();

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const d = Math.min(window.devicePixelRatio || 1, 2);
      pCanvas.width = Math.round(rect.width * d);
      pCanvas.height = Math.round(rect.height * d);
      pCanvas.style.width = `${rect.width}px`;
      pCanvas.style.height = `${rect.height}px`;
      pctx.setTransform(d, 0, 0, d, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);

    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const a = animRef.current;
      a.pointerX = e.clientX - rect.left;
      a.pointerY = e.clientY - rect.top;
      if (!a.busy) {
        a.targetY = ((e.clientX - rect.left) / rect.width - 0.5) * 37.4;
        a.targetX = ((e.clientY - rect.top) / rect.height - 0.5) * -33;
      }
    };

    const onPointerLeave = () => {
      animRef.current.targetX = 0;
      animRef.current.targetY = 0;
    };

    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerleave", onPointerLeave);

    const drawCover = (ctx: CanvasRenderingContext2D, media: HTMLVideoElement | null, cw: number, ch: number) => {
      if (!media) return;
      const mw = media.videoWidth || 1920;
      const mh = media.videoHeight || 1080;
      const scale = Math.max(cw / mw, ch / mh);
      const w = mw * scale;
      const h = mh * scale;
      ctx.drawImage(media, (cw - w) / 2, (ch - h) / 2, w, h);
    };

    const renderLoop = (now: number) => {
      const dt = Math.min(now - lastTime, 40);
      lastTime = now;
      const a = animRef.current;
      const rect = container.getBoundingClientRect();
      const cw = rect.width;
      const ch = rect.height;

      // Eased tilt
      a.rotX += (a.targetX - a.rotX) * Math.min(1, dt * 0.009);
      a.rotY += (a.targetY - a.rotY) * Math.min(1, dt * 0.009);

      pctx.clearRect(0, 0, cw, ch);

      if (a.frozenScene && sCanvas) {
        pctx.drawImage(sCanvas, 0, 0, cw, ch);
      }

      const pRect = pBtn.getBoundingClientRect();
      const e = a.expansion;
      const pCx = pRect.left - rect.left + pRect.width / 2;
      const pCy = pRect.top - rect.top + pRect.height / 2;
      const cx = pCx + (cw / 2 - pCx) * e;
      const cy = pCy + (ch / 2 - pCy) * e;
      const baseW = pRect.width + (cw - pRect.width) * e;
      const baseH = pRect.height + (ch - pRect.height) * e;
      const scale = e ? 1 : a.maskScale;
      const w = baseW * scale;
      const h = baseH * scale;
      const r = 90 * (1 - e) * scale;
      const rx = a.rotX * (1 - e);
      const ry = a.rotY * (1 - e);

      if (w > 1 && h > 1) {
        const pts = roundedRectPoints(w, h, r);
        const ax = (rx * Math.PI) / 180;
        const ay = (ry * Math.PI) / 180;
        const cosX = Math.cos(ax);
        const sinX = Math.sin(ax);
        const cosY = Math.cos(ay);
        const sinY = Math.sin(ay);

        pctx.save();
        pctx.globalAlpha = a.canvasOpacity;
        pctx.beginPath();
        for (let i = 0; i < pts.length; i++) {
          const px = pts[i][0];
          const py = pts[i][1];
          const xx = px * cosY;
          const yy = py * cosX;
          const z = px * sinY - py * sinX;
          const proj = 850 / (850 + z);
          const sx = cx + xx * proj;
          const sy = cy + yy * proj;
          if (i === 0) pctx.moveTo(sx, sy);
          else pctx.lineTo(sx, sy);
        }
        pctx.closePath();
        pctx.clip();
        pctx.fillStyle = "#171513";
        pctx.fillRect(0, 0, cw, ch);

        const currentVideo = a.transitionActive ? transitionVideoRef.current : portalVideoRef.current;
        drawCover(pctx, currentVideo, cw, ch);

        // Subtle bottom vignette inside portal
        const grad = pctx.createLinearGradient(0, ch * 0.52, 0, ch);
        grad.addColorStop(0, "rgba(0,0,0,0)");
        grad.addColorStop(1, "rgba(23,21,19,0.75)");
        pctx.fillStyle = grad;
        pctx.fillRect(0, ch * 0.52, cw, ch * 0.48);

        pctx.restore();
      }

      // Cursor interpolation
      a.orbitX += (a.pointerX - a.orbitX) * 0.2;
      a.orbitY += (a.pointerY - a.orbitY) * 0.2;

      if (cursorRef.current && cursorOrbitRef.current) {
        cursorRef.current.style.transform = `translate3d(${a.pointerX}px,${a.pointerY}px,0)`;
        cursorOrbitRef.current.style.transform = `translate3d(${a.orbitX - a.pointerX}px,${a.orbitY - a.pointerY}px,0) translate(-50%,-50%) scale(${isHovered ? 1.25 : 1})`;
      }

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerleave", onPointerLeave);
    };
  }, [isHovered]);

  const handlePortalClick = () => {
    const nextIdx = (currentIdx + 1) % STALLIONS.length;
    travelTo(nextIdx);
  };

  return (
    <section
      ref={containerRef}
      aria-label="BSAH Sovereign Studbook Portal"
      className="stallion-portal-experience relative w-full h-[100svh] min-h-[640px] overflow-hidden bg-[#0F0E0D] text-white isolate select-none"
    >
      {/* Background stallion videos */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {STALLIONS.map((s, idx) => (
          <video
            key={s.id}
            ref={(el) => {
              bgVideosRef.current[idx] = el;
            }}
            src={s.video}
            muted
            loop
            playsInline
            preload="auto"
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
              idx === currentIdx ? "opacity-45" : "opacity-0"
            }`}
          />
        ))}
      </div>

      {/* Atmospheric shading & vignette */}
      <div
        className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-black/60 via-transparent to-[#0F0E0D]/90"
        aria-hidden="true"
      />

      {/* Top Header Badge */}
      <header className="absolute left-[clamp(20px,2.5vw,40px)] right-[clamp(20px,2.5vw,40px)] top-[clamp(20px,3vh,36px)] z-10 flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-4">
          <CrestMark size="sm" className="h-10 w-10 text-gold" />
          <div className="flex flex-col">
            <span className="font-mono text-[0.68rem] tracking-[0.24em] uppercase text-gold font-bold">
              BSAH Studbook Portal
            </span>
            <span className="font-mono text-[0.62rem] tracking-[0.16em] uppercase text-sand/70">
              Reel 06 · Sovereign Fleet
            </span>
          </div>
        </div>

        <nav className="hidden sm:flex items-center gap-1 rounded-full border border-gold/30 bg-black/40 backdrop-blur-md px-4 py-1.5 font-mono text-[0.7rem] uppercase tracking-widest text-sand">
          <Link href="/fleet#registry" className="px-3 py-1 hover:text-gold transition-colors">
            Registry
          </Link>
          <span className="opacity-30">/</span>
          <Link href="/fleet#cctv" className="px-3 py-1 hover:text-gold transition-colors">
            CCTV Feeds
          </Link>
          <span className="opacity-30">/</span>
          <Link href="/fleet#pedigrees" className="px-3 py-1 hover:text-gold transition-colors">
            Pedigrees
          </Link>
        </nav>
      </header>

      {/* Left Stallion List */}
      <aside
        className="absolute left-[clamp(20px,2.5vw,40px)] top-1/2 -translate-y-1/2 z-10 hidden sm:flex flex-col gap-3 font-mono text-sm tracking-wider"
        aria-label="Stallion Roster"
      >
        {STALLIONS.map((s, idx) => (
          <button
            key={s.id}
            type="button"
            onClick={() => travelTo(idx)}
            className={`group flex items-center gap-3 text-left transition-all ${
              idx === currentIdx
                ? "text-gold font-bold text-base scale-105"
                : "text-sand/60 hover:text-sand"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full transition-transform ${
                idx === currentIdx ? "bg-gold scale-125" : "bg-sand/30 group-hover:bg-gold/60"
              }`}
            />
            <span>{s.number}</span>
            <span>{s.name}</span>
          </button>
        ))}
      </aside>

      {/* Center 3D Portal Canvas */}
      <canvas
        ref={portalCanvasRef}
        className="pointer-events-none absolute inset-0 z-[3] h-full w-full"
        aria-hidden="true"
      />
      <canvas ref={sceneCanvasRef} className="hidden" aria-hidden="true" />

      {/* Portal Trigger Button and Heading */}
      <section
        className={`portal-wrap absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[52%] z-[4] w-[min(320px,31vw)] transition-opacity duration-300 ${
          isTransitioning ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
        aria-label="Inspect next stallion"
      >
        <div className="flex items-center justify-between mb-3 font-mono text-[0.72rem] tracking-widest uppercase text-sand/80">
          <span className="text-gold">Next Stallion:</span>
          <span className="flex items-center gap-2">
            <span className="text-gold">{cur.nextNumber}</span>
            <strong className="text-white font-bold">{cur.nextName}</strong>
          </span>
        </div>

        <button
          ref={portalBtnRef}
          type="button"
          onClick={handlePortalClick}
          onPointerEnter={() => setIsHovered(true)}
          onPointerLeave={() => setIsHovered(false)}
          className="relative block w-full aspect-[320/350] rounded-[90px] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          aria-label={`Travel to ${cur.nextName}`}
        >
          {/* Hidden reference videos drawn by canvas */}
          <video
            ref={portalVideoRef}
            src={cur.portalVideo}
            muted
            loop
            playsInline
            preload="auto"
            className="invisible absolute w-1 h-1 pointer-events-none"
          />
          <video
            ref={transitionVideoRef}
            muted
            playsInline
            preload="auto"
            className="invisible absolute w-1 h-1 pointer-events-none"
          />
        </button>
      </section>

      {/* Bottom Content: Giant Stallion Name + Facts Table */}
      <section
        className={`absolute left-[clamp(24px,4vw,60px)] right-[clamp(24px,3vw,50px)] bottom-[clamp(24px,3vh,36px)] z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 transition-all duration-500 ${
          isTransitioning ? "opacity-0 translate-y-6" : "opacity-100 translate-y-0"
        }`}
        aria-live="polite"
      >
        <div>
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-gold font-bold">
            Stallion Dossier {cur.number}
          </span>
          <h1 className="font-display text-[clamp(72px,16vw,220px)] leading-[0.74] tracking-tight text-[#FAF7F0] m-0 -ml-2">
            {cur.shortName}
          </h1>
        </div>

        <dl className="w-full md:w-[min(460px,36vw)] m-0 font-sans text-xs sm:text-sm border-t border-gold/30">
          {cur.facts.map(([k, v], idx) => (
            <div
              key={idx}
              className="grid grid-cols-[110px_1fr] sm:grid-cols-[130px_1fr] gap-3 py-2 border-b border-gold/20"
            >
              <dt className="font-mono text-gold/90 font-medium">{k}</dt>
              <dd className="m-0 text-sand/90 font-serif leading-relaxed">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute left-1/2 bottom-8 -translate-x-1/2 z-20 font-mono text-[0.68rem] tracking-[0.2em] uppercase text-gold animate-pulse">
          Calibrating Sovereign Orbit…
        </div>
      )}

      {/* Interactive Custom Cursor */}
      <div
        ref={cursorRef}
        className="pointer-events-none fixed left-0 top-0 z-50 transition-opacity duration-200 hidden md:block"
        aria-hidden="true"
      >
        <span
          ref={cursorOrbitRef}
          className={`absolute left-0 top-0 h-9 w-9 rounded-full border border-gold/80 bg-gold/20 -translate-x-1/2 -translate-y-1/2 transition-transform duration-300 ${
            isHovered ? "scale-125 border-gold bg-gold/40" : ""
          }`}
        />
        <span className="absolute left-0 top-0 h-2 w-2 rounded-full bg-gold -translate-x-1/2 -translate-y-1/2" />
        <span
          className={`absolute left-0 top-6 -translate-x-1/2 font-mono text-[0.62rem] tracking-wider uppercase text-gold bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded transition-opacity ${
            isHovered ? "opacity-100" : "opacity-0"
          }`}
        >
          Travel
        </span>
      </div>
    </section>
  );
}
