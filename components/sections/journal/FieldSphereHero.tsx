"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CrestMark } from "@/components/brand/CrestMark";

/* ================= Field Shots Data ================= */
interface Shot {
  id: string;
  title: string;
  place: string;
  note: string;
  tall?: boolean;
}

const CDN = "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/";
const FILM_URL = CDN + "hf_20260922_195107_ed3f055a-3a13-4a71-b743-e10310454246.mp4";

const SHOTS: Shot[] = [
  {
    id: "hf_20260922_194349_26ffdbfd-ac5e-49e9-a07d-c06d3f7cb4cb",
    title: "Before the Dust Settled",
    place: "South Africa · Limpopo Province",
    note: "Field photography is rarely about pressing the shutter. Most of the work happens earlier — waiting, staying still, and accepting that nature decides if the frame exists. This encounter lasted less than a minute."
  },
  {
    id: "hf_20260922_194350_5546ea3d-6336-42c7-a59f-06165c5802be",
    title: "The Long Walk Home",
    place: "Kenya · Maasai Mara",
    note: "A matriarch leading her herd across open grass at the end of the day. I stayed low and let them close the distance on their own terms."
  },
  {
    id: "hf_20260922_194349_b4533691-cb49-41d4-b56c-51f0fdcbe250",
    title: "Something Understood",
    place: "Botswana · Okavango Delta",
    note: "He held the look for about four seconds. Long enough to be certain neither of us intended to move first."
  },
  {
    id: "hf_20260922_194349_e588abd3-1bfa-4918-894f-05632cc51ccc",
    title: "Nine Hours of Nothing",
    place: "Finland · Lapland",
    note: "A full day in a hide for a single turn of the head. That ratio is normal and I have stopped resenting it."
  },
  {
    id: "hf_20260922_194350_28d92c80-de66-41cb-911e-b3b44aebe1f5",
    title: "Borrowed Trust",
    place: "Scotland · Cairngorms",
    note: "She had learned the shape of a person and decided it was uninteresting. That indifference is the rarest thing in this work."
  },
  {
    id: "hf_20260922_194349_04e89718-4214-4aff-bac5-490462bbfe2f",
    title: "Small Weather",
    place: "Costa Rica · Osa Peninsula",
    note: "Rain had just stopped. Everything on that branch was the size of a thumbnail and lit like a stage."
  },
  {
    id: "hf_20260922_194417_2c031e22-2fad-4c81-a544-83cd6bba1c33",
    title: "Against the Weather",
    place: "Alaska · Chilkat Valley",
    note: "Shot at a thousandth of a second into a rising storm. The light lasted eleven minutes."
  },
  {
    id: "hf_20260922_194349_a39c3226-7848-4b15-b840-98ad8aec467b",
    title: "The Pale Edge",
    place: "India · Bandhavgarh",
    note: "Almost entirely hidden. I only found the frame because the foliage stopped moving in the wrong place."
  },
  {
    id: "hf_20260922_194417_555e4d90-f35f-4a1a-8c75-def1e8b71988",
    title: "Perfect Arithmetic",
    place: "Indonesia · Raja Ampat",
    note: "Coiled with a precision that looks designed. Nothing about it is — it is just the cheapest way to hold heat."
  },
  {
    id: "hf_20260922_194417_e525a243-03c8-454b-83b4-60f541baf70a",
    title: "Shallow Water",
    place: "French Polynesia · Fakarava",
    note: "Three metres down on a single breath. It passed close enough that I stopped composing and simply held the camera still."
  },
  {
    id: "hf_20260922_194349_ec830e6f-b8e6-4569-8540-ee7f33902c53",
    title: "Two of Nine",
    place: "India · Ranthambore",
    note: "Siblings resting out the afternoon heat. The second one never opened its eyes."
  },
  {
    id: "hf_20260922_194417_35a9af5f-bd07-45a7-bb73-08b47d19d530",
    title: "Low Ground",
    place: "Nepal · Chitwan",
    note: "Flat on the ground at her eye level, which is the only honest angle for an animal that hunts from there."
  },
  {
    id: "hf_20260922_194416_30e307a9-1265-45c3-a1a0-5c6fa5bb9f8d",
    title: "Everything at Once",
    place: "Iceland · Southern Coast",
    note: "Free horses on a black beach at dusk. I panned and accepted whatever the frame gave back."
  },
  {
    id: "hf_20260922_194417_ff5cb9f8-8eed-4bfb-bb08-11256da92eae",
    title: "White on White",
    place: "Canada · Ellesmere Island",
    note: "Snow removes every reference for exposure. The only reliable meter left is the eyes."
  },
  {
    id: "hf_20260922_194418_1d9bff4a-4971-4944-9e49-d72e755ceeb0",
    title: "Census",
    place: "Namibia · Etosha",
    note: "Two of roughly sixteen thousand left. The number is the reason the frame exists."
  },
  {
    id: "hf_20260922_194349_75e53821-0807-4ebc-992d-34bae0ec2ce6",
    title: "The Whole Field",
    place: "France · Provence",
    note: "Four millimetres of animal. At this magnification a breath of wind is an earthquake."
  },
  {
    id: "hf_20260922_194417_5a227847-3796-4438-805d-7e66e9538205",
    title: "First Season",
    place: "Germany · Bavarian Forest",
    note: "Days old and already still enough to disappear. Stillness is the first thing anything here learns."
  },
  {
    id: "hf_20260922_194350_b49aa67e-0401-4029-af4f-f6ac3ee83398",
    title: "Listening Posture",
    place: "Tanzania · Serengeti",
    note: "Ears forward, weight on the back legs. She heard something I never did."
  },
  {
    id: "hf_20260922_194349_89b82779-3a46-4c55-b7c5-f4a0fd955874",
    title: "A Line of Red",
    place: "Spain · Fuente de Piedra",
    note: "Underexposed by two stops until only the shape survived."
  },
  {
    id: "hf_20260922_194416_47e18c62-253a-42e1-97a9-9e5f6a6b8d59",
    title: "Left Behind",
    place: "Studio · Reykjavík",
    note: "Found beneath a roost at first light. The only frame in this archive an animal agreed to in advance.",
    tall: true
  },
  {
    id: "hf_20260922_194417_a455843c-d8db-461c-8ef6-74a325d2472c",
    title: "The Other Side",
    place: "Uganda · Kibale Forest",
    note: "Taken by a colleague between two long waits. Proof, mostly, that someone is holding the camera."
  }
];

// Pre-compute Fibonacci sphere distribution unit vectors
const N = SHOTS.length;
const GA = Math.PI * (3 - Math.sqrt(5));
const UNIT_VECTORS: { x: number; y: number; z: number; lat: number; lon: number }[] = [];
for (let i = 0; i < N; i++) {
  const y = 1 - (i / (N - 1)) * 2;
  const rad = Math.sqrt(Math.max(0, 1 - y * y));
  const theta = i * GA;
  const x = Math.cos(theta) * rad;
  const z = Math.sin(theta) * rad;
  const lat = (Math.asin(y) * 180) / Math.PI;
  const lon = (Math.atan2(x, z) * 180) / Math.PI;
  UNIT_VECTORS.push({ x, y, z, lat, lon });
}

export function FieldSphereHero() {
  const [isRevealed, setIsRevealed] = useState(false);
  const [isGridView, setIsGridView] = useState(false);
  const [activeLightbox, setActiveLightbox] = useState<number | null>(null);
  const [showSplash, setShowSplash] = useState(true);
  const [showIntro, setShowIntro] = useState(true);
  const [splashProgress, setSplashProgress] = useState(0);

  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const gridFiguresRef = useRef<(HTMLElement | null)[]>([]);
  const plateRef = useRef<HTMLDivElement>(null);
  const filmVideoRef = useRef<HTMLVideoElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  // Animation state refs (mutable outside React re-renders)
  const animRef = useRef({
    spin: 0,
    tilt: -4,
    dragX: 0,
    dragY: 0,
    velX: 0,
    velY: 0,
    camZ: 0,
    R: 0,
    persp: 1150,
    cw: 160,
    dotX: 0,
    dotY: 0,
    dotTargetX: 0,
    dotTargetY: 0,
    dotVisible: false,
    focused: -1,
    dragging: false,
    pdown: null as { x: number; y: number; type: string; id: number } | null,
    pcapture: false,
    pcardIdx: null as number | null,
    pmove: null as { x: number; y: number } | null
  });

  const cardStatesRef = useRef<{ fade: number; dim: number }[]>(
    SHOTS.map(() => ({ fade: -1, dim: -1 }))
  );

  const computeLayout = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;

    const rect = root.getBoundingClientRect();
    const w = rect.width || window.innerWidth;
    const h = rect.height || window.innerHeight;

    let hr: number, wr: number, floor: number, scale: number;
    if (w <= 380) {
      hr = 0.38;
      wr = 0.48;
      floor = 108;
      scale = 0.44;
    } else if (w <= 640) {
      hr = 0.42;
      wr = 0.52;
      floor = 120;
      scale = 0.46;
    } else {
      hr = 0.46;
      wr = 0.58;
      floor = 155;
      scale = 0.47;
    }

    const R = Math.max(floor, Math.min(480, h * hr, w * wr));
    const cw = Math.round(Math.max(72, R * scale));

    let persp: number;
    if (w <= 380) persp = 620;
    else if (w <= 640) persp = 760;
    else if (w <= 900) persp = 920;
    else persp = 1150;

    animRef.current.R = R;
    animRef.current.persp = persp;
    animRef.current.cw = cw;

    root.style.setProperty("--fsh-persp", `${persp}px`);
    root.style.setProperty("--fsh-cw", `${cw}px`);
    root.style.setProperty("--fsh-hw", w <= 380 ? "min(88vw,320px)" : w <= 640 ? "min(84vw,360px)" : "min(56vw,640px)");

    // Position cards on 3D sphere
    for (let i = 0; i < N; i++) {
      const v = UNIT_VECTORS[i];
      const card = cardsRef.current[i];
      if (!card) continue;
      const tx = v.x * R;
      const ty = -v.y * R;
      const tz = v.z * R;
      card.style.transform = `translate3d(${tx}px,${ty}px,${tz}px) rotateY(${v.lon}deg) rotateX(${v.lat}deg)`;
    }
  }, []);

  const openLightbox = useCallback((idx: number, sourceRect: DOMRect) => {
    animRef.current.focused = idx;
    setActiveLightbox(idx);

    requestAnimationFrame(() => {
      const plate = plateRef.current;
      if (!plate) return;

      plate.style.transition = "none";
      plate.style.opacity = "0";

      const plateRect = plate.getBoundingClientRect();
      const dx = sourceRect.left + sourceRect.width / 2 - (plateRect.left + plateRect.width / 2);
      const dy = sourceRect.top + sourceRect.height / 2 - (plateRect.top + plateRect.height / 2);
      const scale = Math.max(0.04, sourceRect.width / plateRect.width);

      plate.style.transform = `translate(${dx}px,${dy}px) scale(${scale})`;
      void plate.offsetHeight; // force reflow

      plate.style.transition = "transform 0.62s cubic-bezier(0.22, 0.61, 0.36, 1), opacity 0.42s ease";
      plate.style.transform = "none";
      plate.style.opacity = "1";
    });
  }, []);

  const closeLightbox = useCallback(() => {
    const focused = animRef.current.focused;
    if (focused < 0) return;

    let sourceEl: HTMLElement | null = null;
    if (isGridView) {
      sourceEl = gridFiguresRef.current[focused];
    } else {
      sourceEl = cardsRef.current[focused];
    }

    const plate = plateRef.current;
    if (plate && sourceEl) {
      const sourceRect = sourceEl.getBoundingClientRect();
      const plateRect = plate.getBoundingClientRect();
      const dx = sourceRect.left + sourceRect.width / 2 - (plateRect.left + plateRect.width / 2);
      const dy = sourceRect.top + sourceRect.height / 2 - (plateRect.top + plateRect.height / 2);
      const scale = Math.max(0.04, sourceRect.width / plateRect.width);

      plate.style.transition = "transform 0.5s ease, opacity 0.38s ease";
      plate.style.transform = `translate(${dx}px,${dy}px) scale(${scale})`;
      plate.style.opacity = "0";

      setTimeout(() => {
        animRef.current.focused = -1;
        setActiveLightbox(null);
        if (plate) {
          plate.style.transition = "none";
          plate.style.transform = "";
          plate.style.opacity = "";
        }
      }, 520);
    } else {
      animRef.current.focused = -1;
      setActiveLightbox(null);
    }
  }, [isGridView]);

  const revealSphere = useCallback(() => {
    setShowIntro(false);
    setShowSplash(false);
    setIsRevealed(true);
    computeLayout();
    setTimeout(() => {
      computeLayout();
      cardsRef.current.forEach((c) => c?.classList.add("in"));
    }, 250);
  }, [computeLayout]);

  // Main render and physics loop
  useEffect(() => {
    let animId: number;

    const renderLoop = () => {
      const a = animRef.current;
      const isLit = a.focused >= 0;

      if (!a.dragging && !isLit) {
        a.dragX += a.velX;
        a.dragY += a.velY;
        a.velX *= 0.94;
        a.velY *= 0.94;
        if (Math.abs(a.velX) < 0.002) a.velX = 0;
        if (Math.abs(a.velY) < 0.002) a.velY = 0;

        const pitch = a.tilt + a.dragY;
        if (pitch > 32) a.dragY = 32 - a.tilt;
        if (pitch < -32) a.dragY = -32 - a.tilt;
      }

      // Depth scroll calculation
      const scrollY = window.scrollY;
      const maxScroll = window.innerHeight * 0.16;
      const p = Math.max(0, Math.min(1, scrollY / maxScroll));
      const camZTarget = p * Math.min(64, a.R * 0.12);
      a.camZ += (camZTarget - a.camZ) * 0.075;

      const sx = a.tilt + a.dragY;
      const sy = a.spin + a.dragX;

      if (worldRef.current) {
        worldRef.current.style.transform = `translateZ(${a.camZ}px) rotateY(${sy}deg) rotateX(${sx}deg)`;
      }

      if (headlineRef.current) {
        headlineRef.current.style.transform = `rotateX(${-sx}deg) rotateY(${-sy}deg) translateZ(${a.R * 0.62}px)`;
        const headOpacity = Math.max(0, 1 - p * 0.55);
        headlineRef.current.style.opacity = `${headOpacity}`;
      }

      // Card depth & dimming
      const sxR = (sx * Math.PI) / 180;
      const syR = (sy * Math.PI) / 180;
      const cosSx = Math.cos(sxR);
      const sinSx = Math.sin(sxR);
      const cosSy = Math.cos(syR);
      const sinSy = Math.sin(syR);
      const near = a.persp * 0.66;

      for (let i = 0; i < N; i++) {
        const v = UNIT_VECTORS[i];
        const card = cardsRef.current[i];
        if (!card) continue;

        const zf = v.z * cosSx * cosSy - v.y * sinSx * cosSy - v.x * sinSy;
        const base = 0.14 + 0.86 * Math.pow((zf + 1) / 2, 0.85);
        const shade = 1 - Math.min(1, p * 1.6);
        let dim = shade * (1 - base);

        let fade = 1;
        const zPos = zf * a.R + a.camZ;
        const absZ = Math.abs(zPos);
        if (zPos > near) {
          fade = Math.max(0, 1 - (absZ - near) / 190);
        }

        if (isLit) {
          dim = Math.min(1, dim + 0.78);
          if (i === a.focused) fade = 0;
        }

        const st = cardStatesRef.current[i];
        if (st.fade !== fade) {
          card.style.opacity = `${fade}`;
          st.fade = fade;
        }
        const dimR = Math.round(dim * 1000) / 1000;
        if (st.dim !== dimR) {
          card.style.setProperty("--d", `${dimR}`);
          st.dim = dimR;
        }
      }

      // Custom cursor lerp
      if (a.dotVisible && dotRef.current) {
        a.dotX += (a.dotTargetX - a.dotX) * 0.2;
        a.dotY += (a.dotTargetY - a.dotY) * 0.2;
        dotRef.current.style.transform = `translate3d(${a.dotX}px,${a.dotY}px,0)`;
      }

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Stage pointer drag handling
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const onPointerDown = (e: PointerEvent) => {
      const a = animRef.current;
      if (a.focused >= 0 || isGridView) return;

      const targetEl = e.target as HTMLElement | null;
      const cardEl = targetEl?.closest(".fsh-card") as HTMLElement | null;
      const cardIdx = cardEl?.dataset.idx ? parseInt(cardEl.dataset.idx, 10) : null;

      a.pdown = { x: e.clientX, y: e.clientY, type: e.pointerType, id: e.pointerId };
      a.pcardIdx = cardIdx;
      a.pcapture = false;
      a.pmove = { x: e.clientX, y: e.clientY };

      if (e.pointerType !== "touch") {
        try {
          stage.setPointerCapture(e.pointerId);
        } catch {}
        a.pcapture = true;
        a.dragging = true;
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      const a = animRef.current;
      if (!a.pdown || !a.pmove) return;

      const dx = e.clientX - a.pmove.x;
      const dy = e.clientY - a.pmove.y;

      if (e.pointerType === "touch" && !a.pcapture) {
        const totalDx = Math.abs(e.clientX - a.pdown.x);
        const totalDy = Math.abs(e.clientY - a.pdown.y);
        if (totalDx > 10 || totalDy > 10) {
          if (totalDy > totalDx * 1.15) {
            // Predominantly vertical drag: allow native scroll!
            a.pdown = null;
            return;
          } else {
            try {
              stage.setPointerCapture(e.pointerId);
            } catch {}
            a.pcapture = true;
            a.dragging = true;
          }
        }
      }

      if (a.pcapture) {
        a.dragX += dx * 0.13;
        a.dragY += dy * 0.13;
        a.velX = dx * 0.13;
        a.velY = dy * 0.13;
        a.pmove = { x: e.clientX, y: e.clientY };
      }
    };

    const endPointer = (e: PointerEvent) => {
      const a = animRef.current;
      if (!a.pdown) return;

      const totalDx = e.clientX - a.pdown.x;
      const totalDy = e.clientY - a.pdown.y;
      const dist = Math.sqrt(totalDx * totalDx + totalDy * totalDy);
      const slop = a.pdown.type === "touch" ? 14 : 7;

      if (dist < slop && a.pcardIdx !== null && cardsRef.current[a.pcardIdx]) {
        const rect = cardsRef.current[a.pcardIdx]!.getBoundingClientRect();
        openLightbox(a.pcardIdx, rect);
      }

      if (a.pcapture) {
        try {
          stage.releasePointerCapture(a.pdown.id);
        } catch {}
      }

      a.pdown = null;
      a.pcardIdx = null;
      a.pcapture = false;
      a.pmove = null;
      a.dragging = false;
    };

    stage.addEventListener("pointerdown", onPointerDown);
    stage.addEventListener("pointermove", onPointerMove);
    stage.addEventListener("pointerup", endPointer);
    stage.addEventListener("pointercancel", endPointer);

    return () => {
      stage.removeEventListener("pointerdown", onPointerDown);
      stage.removeEventListener("pointermove", onPointerMove);
      stage.removeEventListener("pointerup", endPointer);
      stage.removeEventListener("pointercancel", endPointer);
    };
  }, [openLightbox, isGridView]);

  // Custom cursor & resize listeners
  useEffect(() => {
    computeLayout();

    const onResize = () => computeLayout();
    window.addEventListener("resize", onResize);

    const onMouseMove = (e: MouseEvent) => {
      animRef.current.dotTargetX = e.clientX;
      animRef.current.dotTargetY = e.clientY;
      animRef.current.dotVisible = true;

      const target = e.target as HTMLElement | null;
      const isInteractive = target?.closest(".fsh-card, a, button, .fsh-grid figure");
      if (dotRef.current) {
        dotRef.current.classList.toggle("wide", Boolean(isInteractive));
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeLightbox();
        setIsGridView(false);
      }
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [computeLayout, closeLightbox]);

  // Intro video and splash progress orchestration
  useEffect(() => {
    let p = 0;
    const interval = setInterval(() => {
      p += 15;
      setSplashProgress(Math.min(100, p));
      if (p >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setShowSplash(false);
          const vid = filmVideoRef.current;
          if (vid) {
            vid.play().catch(() => revealSphere());
          } else {
            revealSphere();
          }
        }, 400);
      }
    }, 120);

    return () => clearInterval(interval);
  }, [revealSphere]);

  const activeShot = activeLightbox !== null ? SHOTS[activeLightbox] : null;

  return (
    <section
      ref={rootRef}
      aria-label="BSAH Field Archive · Visual Dispatches"
      className={`fsh-root ${isRevealed ? "revealed" : ""} ${isGridView ? "gridview" : ""} ${
        activeLightbox !== null ? "lit" : ""
      }`}
    >
      {/* 3D Perspective Stage */}
      <div ref={stageRef} className="fsh-stage" aria-hidden="true">
        <div ref={worldRef} className="fsh-world">
          <div className="fsh-orb">
            {SHOTS.map((s, i) => (
              <div
                key={s.id}
                ref={(el) => {
                  cardsRef.current[i] = el;
                }}
                data-idx={i}
                className={`fsh-card ${s.tall ? "tall" : ""}`}
              >
                <figure>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`${CDN}${s.id}_min.webp`} alt={s.title} loading="eager" />
                </figure>
              </div>
            ))}
          </div>

          <h1 ref={headlineRef} className="fsh-headline">
            <span className="inner">
              <span style={{ "--i": 0 } as React.CSSProperties}>I</span>{" "}
              <span style={{ "--i": 1 } as React.CSSProperties}>See</span>{" "}
              <span style={{ "--i": 2 } as React.CSSProperties}>Through</span>{" "}
              <span style={{ "--i": 3 } as React.CSSProperties}>the</span>{" "}
              <span style={{ "--i": 4 } as React.CSSProperties}>Wild</span>
            </span>
          </h1>
        </div>
      </div>

      {/* Atmospheric Vignette */}
      <div className="fsh-vig" aria-hidden="true" />

      {/* 2D Gallery Grid View Toggle */}
      <div className="fsh-grid" aria-label="Visual Dispatches Grid">
        <div className="rows">
          {SHOTS.map((s, i) => (
            <figure
              key={s.id}
              ref={(el) => {
                gridFiguresRef.current[i] = el;
              }}
              onClick={() => {
                const el = gridFiguresRef.current[i];
                if (el) openLightbox(i, el.getBoundingClientRect());
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`${CDN}${s.id}_min.webp`} alt={s.title} loading="lazy" />
              <figcaption>{s.title}</figcaption>
            </figure>
          ))}
        </div>
      </div>

      {/* Top Header Chrome */}
      <header className="fsh-chrome top-0 left-0 right-0 flex items-center justify-between px-[clamp(16px,2.8vw,36px)] pt-[clamp(16px,2.6vh,32px)] pointer-events-auto">
        <div className="flex items-center gap-3">
          <CrestMark size="sm" className="h-9 w-9 text-gold" />
          <div className="flex flex-col">
            <span className="font-mono text-[0.68rem] tracking-[0.2em] uppercase text-gold font-bold">
              BSAH Field Archive
            </span>
            <span className="font-mono text-[0.62rem] tracking-[0.14em] uppercase text-sand/70">
              Reel 14 · Visual Chronicle
            </span>
          </div>
        </div>

        <nav className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsGridView((prev) => !prev)}
            className="rounded-full border border-gold/40 bg-black/50 backdrop-blur-md px-3.5 py-1.5 font-mono text-[0.68rem] uppercase tracking-wider text-sand hover:text-gold transition-colors"
          >
            {isGridView ? "Sphere View" : "Grid View"}
          </button>
          <a
            href="#articles"
            className="rounded-full border border-gold/40 bg-black/50 backdrop-blur-md px-3.5 py-1.5 font-mono text-[0.68rem] uppercase tracking-wider text-sand hover:text-gold transition-colors hidden sm:inline-block"
          >
            Dispatches ↓
          </a>
        </nav>
      </header>

      {/* Bio Widget (Bottom Left) */}
      <div className="fsh-chrome fsh-hide-in-grid left-[clamp(16px,2.8vw,36px)] bottom-[clamp(16px,2.6vh,32px)] max-w-[min(320px,46vw)] hidden sm:block pointer-events-auto">
        <div className="flex items-center gap-3 mb-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${CDN}${SHOTS[20].id}_min.webp`}
            alt="Field Notes Curator"
            className="w-11 h-11 rounded object-cover border border-gold/30"
          />
          <div>
            <b className="font-display text-base font-normal text-white">The Field Archive</b>
            <p className="font-mono text-[0.6rem] text-gold uppercase tracking-widest m-0">21 Plates · 2026</p>
          </div>
        </div>
        <p className="font-sans text-[0.74rem] leading-relaxed text-sand/80 m-0">
          Field photography is less about capturing frames and more about learning when not to move. Every frame in this
          archive was captured in natural conditions without intervention.
        </p>
      </div>

      {/* Colophon (Bottom Right) */}
      <div className="fsh-chrome fsh-hide-in-grid right-[clamp(16px,2.8vw,36px)] bottom-[clamp(16px,2.6vh,32px)] font-mono text-[0.68rem] tracking-widest uppercase text-sand/60 hidden md:block">
        Field Notes 2026 · Reel 14
      </div>

      {/* Grid Mode Toggle Button */}
      <button
        type="button"
        onClick={() => setIsGridView((prev) => !prev)}
        className="fsh-gridbtn"
        aria-label="Toggle grid photography view"
      >
        <b />
        <b />
        <b />
        <b />
      </button>

      {/* Drag Cue */}
      <div className="fsh-cue" aria-hidden="true">
        <s />
        Drag to rotate sphere
      </div>

      {/* FLIP Lightbox Modal */}
      <div
        className={`fsh-lit ${activeLightbox !== null ? "is-active" : ""}`}
        aria-hidden={activeLightbox === null}
        role="dialog"
      >
        <div className="fsh-lit-scrim" onClick={closeLightbox} />
        {activeShot && (
          <div ref={plateRef} className="fsh-plate">
            <div className="fsh-shot">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`${CDN}${activeShot.id}_min.webp`} alt={activeShot.title} />
              <button type="button" onClick={closeLightbox} className="fsh-lit-close" aria-label="Close photo">
                Close [Esc]
              </button>
            </div>
            <div className="fsh-meta">
              <div>
                <h2>{activeShot.title}</h2>
                <div className="where">{activeShot.place}</div>
              </div>
              <p className="note">{activeShot.note}</p>
            </div>
          </div>
        )}
      </div>

      {/* Intro Film Sequence */}
      {showIntro && (
        <div className="fsh-intro">
          <video
            ref={filmVideoRef}
            src={FILM_URL}
            muted
            playsInline
            preload="auto"
            onEnded={revealSphere}
          />
          <div className="veil" />
          <button
            type="button"
            onClick={revealSphere}
            className="absolute right-6 bottom-6 z-10 rounded-full border border-gold/40 bg-black/60 px-4 py-2 font-mono text-[0.68rem] uppercase tracking-widest text-sand hover:text-gold hover:border-gold transition-colors"
          >
            Skip Film
          </button>
        </div>
      )}

      {/* Splash Loading Bar */}
      {showSplash && (
        <div className="fsh-splash">
          <div className="mark">
            The Chronicle · <em>Field Notes</em>
          </div>
          <div className="bar">
            <s style={{ transform: `scaleX(${splashProgress / 100})` }} />
          </div>
          <div className="font-mono text-[0.64rem] tracking-[0.24em] uppercase text-sand/60">
            Calibrating Field Constellation…
          </div>
        </div>
      )}

      {/* Interactive Dot Cursor */}
      <div ref={dotRef} className="fsh-dot hidden md:block" aria-hidden="true" />
    </section>
  );
}
