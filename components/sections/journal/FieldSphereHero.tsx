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

const CDN = "https://d8j0ntlcm91z4.cloudfront.net/user_3KHOl32PLtCsaNMEkJTP0HHT06X/";
const FILM_URL = CDN + "hf_20261009_002919_571f23fa-14a9-4d0b-bbe3-19f4311054d8.mp4";

const SHOTS: Shot[] = [
  {
    id: "hf_20261009_133621_5a3cedb7-3682-4992-9f09-58666b26f286",
    title: "Why the Ears Curl",
    place: "Marwar · Rajasthan",
    note: "The signature lyre-shaped ears that curve inward until the tips touch. Rotating 180 degrees independently, desert riders read them as honest feedback long before a sound was heard."
  },
  {
    id: "hf_20261009_134207_2579fc71-30ad-44d5-9a75-48d29801a99c",
    title: "Omens of the Stable",
    place: "Jodhpur · Royal Courtyard",
    note: "A dappled grey Marwari stallion in silver cavalry bridle. The old bards read a horse's fortune in its hair whorls (devman), facial blaze, and white socks."
  },
  {
    id: "hf_20261009_134452_071b671c-3a71-467c-b01b-41fdd53c797c",
    title: "The Golden Revival",
    place: "Thar Desert · Golden Hour",
    note: "A herd of sovereign Marwari horses galloping across the desert sand at dusk. Nearly lost after 1947, revived through dedicated studbook registries."
  },
  {
    id: "hf_20261009_002316_a9ac0234-9080-4a64-8d92-cf0705055f6b",
    title: "The Rising Dust",
    place: "Hyderabad · Arena One",
    note: "A Marwari stallion emerging from a towering cloud of golden arena dust. The hard-boned desert breed feels at home when the ground lifts."
  },
  {
    id: "hf_20261009_002317_1504aa62-05a7-47df-9bf5-fbb2b0c78ecc",
    title: "The Molten Sky",
    place: "Thar Basin · Dusk",
    note: "A Marwari stallion rearing against a molten gold sunset sky. Known for exceptional shoulder elevation and battlefield bravery."
  },
  {
    id: "hf_20261009_002435_48940254-f4cb-49fe-9236-d84b15570955",
    title: "The Full Gallop",
    place: "Osian Sands · Rajasthan",
    note: "A stallion at full stride across open dunes. Slim, hard-legged, and enduring, bred to cover desert distances without breaking cadence."
  },
  {
    id: "hf_20261009_002317_26761800-94f0-40d6-a6b2-a35941ddc7e0",
    title: "The Honest Eye",
    place: "Stable Pavilion · Early Light",
    note: "Close-up of the arched forehead, dark eye, and inward-pointing ear tip. The ancient breed seal of purity recognized worldwide."
  },
  {
    id: "hf_20261009_002435_480a7609-4bd8-46c6-83b4-8c740f8aaf4b",
    title: "The Lance at Speed",
    place: "Circuit Ground · Hyderabad",
    note: "A senior cadet lowering the tent-pegging lance at a gallop. 750 milliseconds to read the ground, align the point, and pierce the target."
  },
  {
    id: "hf_20261009_002317_0f749476-7e8d-47bf-b57a-9adcb7b21741",
    title: "The Ridge Silhouette",
    place: "Sam Dunes · Thar Border",
    note: "A lone Marwari silhouetted against the amber horizon. Eight centuries of adaptation to extreme heat, cold, and desert solitude."
  },
  {
    id: "hf_20261009_134210_875318e8-ba4f-4012-86bd-3a472486c8a1",
    title: "Traced in Gold",
    place: "Night Stable · Lantern Pass",
    note: "A jet-black stallion traced by a thin line of warm lantern light. The prized Kala coat revered in classical Rajput ballads."
  },
  {
    id: "hf_20261011_125701_03894133-4ebe-4853-bbf3-fb8b894c5b42",
    title: "The Cavalry Line",
    place: "Deccan Plateau · Trail Ride",
    note: "Cadets riding in cavalry formation through the golden dust plume. Discipline, alignment, and synchronous cadence across the squadron."
  },
  {
    id: "hf_20261011_125701_e77bf110-1d6e-4276-b777-a60ccce661b9",
    title: "The Dune Sentinel",
    place: "Bikaner Ridge · Sunset",
    note: "A stallion watching the desert wind shift. The Marwari's senses detect approaching dust storms long before they reach camp."
  },
  {
    id: "hf_20261011_142335_cc424b5d-501a-4bc6-9af2-edce6dba169a",
    title: "Portrait of Kala",
    place: "Studbook Studio · Jodhpur",
    note: "High-contrast portrait of a black Marwari stallion with the white star forehead marking and inwards curled ear tips."
  },
  {
    id: "hf_20261011_142423_18de8c55-e9b9-4415-970e-a1d04f0176ce",
    title: "The Nukra Lineage",
    place: "Sandstone Courtyard · Dawn",
    note: "A pure white Nukra horse against weathered fort stone. Prized in ceremonial history and preserved through careful selection."
  },
  {
    id: "hf_20261009_133621_81837c50-d744-4170-a4c4-28e23c303420",
    title: "The Royal Nachni",
    place: "Nagaur Fair · Evening",
    note: "A ceremonial dancing Marwari performing the rhythmic lateral gait (revaal) at twilight, decorated in traditional brass and silver tack."
  },
  {
    id: "hf_20261009_135918_8c0e7aab-156d-44e1-a197-f7562ec9938a",
    title: "Chetak IX",
    place: "Registry Stall 01 · Sovereign Studbook",
    note: "Purebred dark bay Marwari with white star. The foundation sovereign stallion of the Black Stallion Academy breeding programme."
  },
  {
    id: "hf_20261009_135918_2230edd8-75d6-4133-9449-ca7c6e1b1fee",
    title: "Veer of Kathiawar",
    place: "Registry Stall 02 · Sovereign Studbook",
    note: "Chestnut-gold stallion of the historic cavalry lineage. Agile, high-velocity turn rate, and sharp response to seat and rein."
  },
  {
    id: "hf_20261009_140621_aeee0f2d-2fd4-4714-867f-a68aaf3e58c1",
    title: "Kesar's Skewbald Coat",
    place: "Paddock Three · Morning",
    note: "A rare skewbald Marwari stallion whose dual-tone pattern mirrors the traditional heraldic banners of the desert clans."
  },
  {
    id: "hf_20261009_140620_a883058c-4b10-47ea-a035-0d79c6a905fc",
    title: "The Four White Socks",
    place: "Pasture Ridge · Noon",
    note: "Arbudh, light bay with four clean white socks (Panchkalyan). Regarded in folklore as an auspicious sign for the rider."
  },
  {
    id: "hf_20261009_002640_5b5f28cc-654a-499d-8b0e-35093d96acb5",
    title: "Three Lances Lowered",
    place: "Tournament Field · Gallop",
    note: "Three cadets charging synchronously in competition lanes. The hallmark test of team precision and unshakeable nerve.",
    tall: true
  },
  {
    id: "hf_20261009_134451_6575fc93-f93a-4d03-91fc-2a48c3788c1e",
    title: "The Cadet's Touch",
    place: "Arena Gate · First Light",
    note: "A young cadet quietly touching the curved ear tip of her assigned mount before mounting. The relationship starts on the ground."
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
