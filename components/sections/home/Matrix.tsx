"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import gsap from "gsap";
import { useReducedMotion } from "@/lib/motion/reduced";
import { useDialogFocus } from "@/lib/motion/use-dialog-focus";
import { SomaticMap } from "./SomaticMap";
import { whenNearViewport } from "@/lib/motion/near-viewport";

export type AnatomicalPart = "brain" | "spine" | "muscle" | "heart";

interface SystemData {
  id: AnatomicalPart;
  number: string;
  label: string;
  upperLabel: string;
  headline: string;
  description: string;
  evidenceSummary: string;
  statusBadge: string;
  cautionNote: string;
  studyTitle: string;
  authors: string;
  studyBody: string;
  reviewNote: string;
  url: string;
}

const ORDER: AnatomicalPart[] = ["brain", "spine", "muscle", "heart"];

const DATA: Record<AnatomicalPart, SystemData> = {
  brain: {
    id: "brain",
    number: "01",
    label: "Brain",
    upperLabel: "BRAIN",
    headline: "Calmer mind.<br/>Stronger decisions.",
    description:
      "Steering a living animal means reading, deciding and correcting every second, with calm hands and clear intent. This builds focus, emotional control and confidence that carries beyond the arena.",
    evidenceSummary:
      "In a randomised trial, children in a 12-week horse programme had lower stress-hormone levels than a wait-list group (Pendry et al., 2014).",
    statusBadge: "Peer-Reviewed RCT",
    cautionNote: "",
    studyTitle:
      "Randomized trial examines effects of equine facilitated learning on adolescents' basal cortisol levels",
    authors:
      "Patricia Pendry, Annelise N. Smith, Stephanie M. Roeter (2014) • Human-Animal Interaction Bulletin, Vol. 2(1), 80–95",
    studyBody:
      "In a randomized controlled trial of youth (grades 5–8), participation in a 12-week equine-facilitated learning programme resulted in significantly lower afternoon and total basal salivary cortisol levels compared with wait-list controls.",
    reviewNote:
      "Verified Citation: Supports HPA-axis stress-hormone regulation and emotional composure in youth equine programmes.",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6339889/",
  },
  spine: {
    id: "spine",
    number: "02",
    label: "Spine",
    upperLabel: "SPINE",
    headline: "Dynamic posture.<br/>Natural alignment.",
    description:
      "Every stride transfers three-dimensional movement from the horse’s back into the rider’s pelvis. The vertebral column absorbs and balances this motion along its natural cervical, thoracic and lumbar curves—responsive rather than rigid.",
    evidenceSummary:
      "Three-dimensional motion analysis shows that rhythmic equine gait entrains the rider’s pelvic and spinal kinematics to support dynamic trunk alignment and postural control (Mutoh et al., 2018).",
    statusBadge: "3D Kinematic Study",
    cautionNote: "",
    studyTitle:
      "A possible mechanism of horseback riding on dynamic trunk alignment",
    authors:
      "Tomoko Mutoh, Tatsuya Mutoh, Hideo Takada, et al. (2018) • PLOS ONE, 13(9): e0203791",
    studyBody:
      "Synchronized accelerometer and kinematic analyses demonstrate that the regular three-dimensional acceleration of a walking horse stimulates continuous pelvic and vertebral postural adjustments, promoting dynamic spinal alignment.",
    reviewNote:
      "Verified Citation: Demonstrates biomechanical trunk and spinal alignment responses during horseback riding without implying a rigid or artificially straight spine.",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6138947/",
  },
  muscle: {
    id: "muscle",
    number: "03",
    label: "Muscle",
    upperLabel: "MUSCLE",
    headline: "Deep stabilizers.<br/>Quiet strength.",
    description:
      "Staying balanced in motion engages core stabilizers, lower-back musculature, pelvic and gluteal stabilizers, and inner-thigh adductors in coordinated rhythm—building functional endurance without stiff bracing.",
    evidenceSummary:
      "Surface electromyography (sEMG) confirms targeted recruitment of deep core, lumbopelvic and upper-leg stabilizer muscles during horseback riding across walking and trotting gaits (Rigby et al., 2025).",
    statusBadge: "sEMG Biomechanics",
    cautionNote: "",
    studyTitle:
      "Core Muscle Recruitment during Horseback Riding: A Pilot Study",
    authors:
      "B. Rhett Rigby, et al. (2025) • PubMed PMID: 40550154 / PMC9803444",
    studyBody:
      "Surface electromyography recordings of riders demonstrate active recruitment of rectus abdominis, erector spinae, gluteal pelvic stabilizers, and thigh adductors to maintain dynamic equilibrium in the saddle.",
    reviewNote:
      "Verified Citation: Directly measures trunk, pelvic, and lower-limb muscular activation during riding.",
    url: "https://pubmed.ncbi.nlm.nih.gov/40550154/",
  },
  heart: {
    id: "heart",
    number: "04",
    label: "Heart",
    upperLabel: "HEART",
    headline: "Steady rhythm.<br/>Co-regulated calm.",
    description:
      "Attentive breathing and quiet physical partnership with a responsive horse engage autonomic regulation, supporting composure under focus without exaggerated cardiovascular strain.",
    evidenceSummary:
      "Controlled studies of equine-assisted sessions examine autonomic nervous system balance via heart rate variability (HRV) and parasympathetic recovery in youth (García-Gómez et al., 2020).",
    statusBadge: "Flagged for Clinical Review",
    cautionNote:
      "Scientific Review Note: Published HRV studies focus primarily on therapeutic youth cohorts. Broad cardiovascular claims for recreational riders should be reviewed before clinical assertion.",
    studyTitle:
      "Equine-assisted therapeutic activities and their influence on the autonomic nervous system: A systematic review",
    authors:
      "A. García-Gómez, M. Guerrero-Barona, et al. (2020) • Complementary Therapies in Clinical Practice, 39: 101167",
    studyBody:
      "Systematic review evaluating heart rate variability (HRV), vagal tone, and sympathetic-parasympathetic balance during human-horse interaction and therapeutic riding sessions.",
    reviewNote:
      "Flagged for Review (Compliance): Avoids inventing BPM readings or claiming stress-hormone trials prove structural cardiac changes.",
    url: "https://pubmed.ncbi.nlm.nih.gov/32379693/",
  },
};

export function Matrix({ initialPart }: { initialPart?: AnatomicalPart } = {}) {
  const [selectedPart, setSelectedPart] = useState<AnatomicalPart>(initialPart || "brain");
  const [compositeMode, setCompositeMode] = useState<boolean>(false);
  const [showRegGrid, setShowRegGrid] = useState<boolean>(false);
  const [forceReducedMotion, setForceReducedMotion] = useState<boolean>(false);
  // The four overlay plates (about 100 kB) are first seen when the stage is on screen: they are requested a screen and
  // a half ahead of it instead of at load (they used to be fetched with the page although the stage sits far down).
  const [layersNear, setLayersNear] = useState<boolean>(false);

  // Deep links (#part or ?part=) are read after hydration, in a frame callback rather than synchronously in the effect.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const id = window.requestAnimationFrame(() => {
      const hash = window.location.hash.replace("#", "") as AnatomicalPart;
      const searchParam = new URLSearchParams(window.location.search).get("part") as AnatomicalPart;
      const target = ORDER.includes(hash) ? hash : ORDER.includes(searchParam) ? searchParam : null;
      if (target) setSelectedPart(target);
    });
    return () => window.cancelAnimationFrame(id);
  }, []);
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = forceReducedMotion || prefersReducedMotion;
  const [showEvidenceModal, setShowEvidenceModal] = useState<boolean>(false);
  const [showInspectorModal, setShowInspectorModal] = useState<boolean>(false);

  const prevPartRef = useRef<AnatomicalPart>("brain");
  const containerRef = useRef<HTMLDivElement>(null);
  useDialogFocus(showEvidenceModal || showInspectorModal, containerRef);
  const evidenceTextRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<AnatomicalPart, HTMLButtonElement | null>>({
    brain: null,
    spine: null,
    muscle: null,
    heart: null,
  });

  // Update Callout Styles
  const updateCalloutStyles = useCallback(
    (activeId: AnatomicalPart) => {
      ORDER.forEach((id) => {
        const isSelected = compositeMode || id === activeId;
        const isPrimary = id === activeId;
        const badge = document.getElementById(`bsah-badge-${id}`);
        const num = document.getElementById(`bsah-num-${id}`);
        const label = document.getElementById(`bsah-label-${id}`);
        const line = document.getElementById(`bsah-line-${id}`);
        const anchor = document.getElementById(`bsah-anchor-${id}`);
        const focusRing = document.getElementById(`bsah-focus-ring-${id}`);

        if (badge) {
          badge.setAttribute("fill", isPrimary ? "#4A3525" : "#EBE5D7");
          badge.setAttribute("stroke", isPrimary ? "#4A3525" : "#8C7B69");
          badge.setAttribute("stroke-width", isPrimary ? "1.8" : "1.3");
        }
        if (num) {
          num.setAttribute("fill", isPrimary ? "#F3EFE6" : "#4A3525");
        }
        if (label) {
          label.setAttribute("fill", isPrimary ? "#2F2016" : "#6E5D4E");
        }
        if (line) {
          line.setAttribute("stroke", isPrimary ? "#4A3525" : "#8C7B69");
          line.setAttribute("stroke-width", isPrimary ? "1.6" : "1.15");
        }
        if (anchor) {
          anchor.setAttribute("fill", isPrimary ? "#C8923E" : "#6E5D4E");
          anchor.setAttribute("r", isPrimary ? "4.2" : "3");
        }
        if (focusRing) {
          gsap.killTweensOf(focusRing);
          if (isSelected && !reduceMotion) {
            gsap.fromTo(
              focusRing,
              { opacity: 0, scale: 0.92, transformOrigin: "center center" },
              { opacity: isPrimary ? 0.6 : 0.3, scale: 1, duration: 0.45, ease: "power2.out" }
            );
          } else {
            gsap.set(focusRing, { opacity: isSelected ? 0.55 : 0, scale: 1 });
          }
        }
      });
    },
    [compositeMode, reduceMotion]
  );

  // Animate anatomical layers & masks
  const animateLayers = useCallback(
    (nextId: AnatomicalPart) => {
      ORDER.forEach((id) => {
        const layerGroup = document.getElementById(`bsah-overlay-layer-${id}`);
        const boundary = document.getElementById(`bsah-boundary-${id}`);
        if (!layerGroup) return;

        gsap.killTweensOf(layerGroup);
        if (boundary) gsap.killTweensOf(boundary);

        const shouldShow = compositeMode || id === nextId;

        if (!shouldShow) {
          gsap.to(layerGroup, {
            opacity: 0,
            scale: 1,
            duration: reduceMotion ? 0 : 0.2,
            ease: "power2.out",
            overwrite: "auto",
          });
          return;
        }

        if (reduceMotion) {
          gsap.set(layerGroup, { opacity: 1, scale: 1 });
        } else {
          gsap.to(layerGroup, {
            opacity: 1,
            scale: 1,
            duration: 0.45,
            ease: "power2.out",
            overwrite: "auto",
          });
        }

        // SVG Mask Animations
        if (id === "brain" && !reduceMotion) {
          const maskCircle = document.getElementById("bsah-mask-reveal-brain");
          if (maskCircle) {
            gsap.killTweensOf(maskCircle);
            gsap.fromTo(
              maskCircle,
              { attr: { r: 20 } },
              { attr: { r: 145 }, duration: 0.65, ease: "power2.out" }
            );
          }
          if (boundary) {
            gsap.fromTo(
              boundary,
              { opacity: 0.15 },
              { opacity: 0.85, duration: 0.55, ease: "power2.out" }
            );
          }
        } else if (id === "spine") {
          const maskRect = document.getElementById("bsah-mask-reveal-spine");
          if (maskRect) {
            gsap.killTweensOf(maskRect);
            if (reduceMotion) {
              gsap.set(maskRect, { attr: { height: 560 } });
              if (boundary) gsap.set(boundary, { opacity: 0.85, strokeDashoffset: 0 });
            } else {
              gsap.fromTo(
                maskRect,
                { attr: { y: 330, height: 0 } },
                { attr: { y: 330, height: 560 }, duration: 0.65, ease: "power2.out" }
              );
              if (boundary) {
                gsap.fromTo(
                  boundary,
                  { opacity: 0, strokeDasharray: 600, strokeDashoffset: 600 },
                  { opacity: 0.85, strokeDashoffset: 0, duration: 0.65, ease: "power2.out" }
                );
              }
            }
          }
        } else if (id === "muscle") {
          const maskRect = document.getElementById("bsah-mask-reveal-muscle");
          const subRings = document.querySelectorAll("#bsah-muscle-subregions .bsah-muscle-sub-ring");
          if (maskRect) {
            gsap.killTweensOf(maskRect);
            gsap.killTweensOf(subRings);
            if (reduceMotion) {
              gsap.set(maskRect, { attr: { height: 500 } });
              gsap.set(subRings, { opacity: 0.45 });
            } else {
              gsap.fromTo(
                maskRect,
                { attr: { y: 540, height: 80 } },
                { attr: { y: 540, height: 500 }, duration: 0.65, ease: "power2.out" }
              );
              gsap.fromTo(
                subRings,
                { opacity: 0 },
                {
                  opacity: 0.65,
                  duration: 0.32,
                  stagger: 0.16,
                  yoyo: true,
                  repeat: 1,
                  ease: "power2.out",
                }
              );
            }
          }
        } else if (id === "heart") {
          const maskCircle = document.getElementById("bsah-mask-reveal-heart");
          if (maskCircle) {
            gsap.killTweensOf(maskCircle);
            if (reduceMotion) {
              gsap.set(maskCircle, { attr: { r: 95 } });
            } else {
              gsap.fromTo(
                maskCircle,
                { attr: { r: 20 } },
                { attr: { r: 95 }, duration: 0.65, ease: "power2.out" }
              );
              gsap.fromTo(
                layerGroup,
                { scale: 1, transformOrigin: "736px 576px" },
                {
                  scale: 1.032,
                  duration: 0.26,
                  yoyo: true,
                  repeat: 1,
                  delay: 0.18,
                  ease: "power2.out",
                }
              );
            }
          }
        }
      });

      // Animate active callout line drawing & label
      if (!reduceMotion) {
        const activeLine = document.getElementById(`bsah-line-${nextId}`);
        const activeLabel = document.getElementById(`bsah-label-${nextId}`);
        if (activeLine) {
          const x1 = parseFloat(activeLine.getAttribute("x1") || "0");
          const y1 = parseFloat(activeLine.getAttribute("y1") || "0");
          const x2 = parseFloat(activeLine.getAttribute("x2") || "0");
          const y2 = parseFloat(activeLine.getAttribute("y2") || "0");
          const len = Math.hypot(x2 - x1, y2 - y1);
          gsap.killTweensOf(activeLine);
          gsap.fromTo(
            activeLine,
            { strokeDasharray: len, strokeDashoffset: len },
            { strokeDashoffset: 0, duration: 0.45, ease: "power2.out" }
          );
        }
        if (activeLabel) {
          gsap.killTweensOf(activeLabel);
          gsap.fromTo(
            activeLabel,
            { opacity: 0.25 },
            { opacity: 1, duration: 0.35, ease: "power2.out" }
          );
        }
      }
    },
    [compositeMode, reduceMotion]
  );

  const selectPart = useCallback(
    (nextId: AnatomicalPart, focusTab = false) => {
      if (!DATA[nextId]) return;
      prevPartRef.current = selectedPart;
      setSelectedPart(nextId);

      if (focusTab) {
        tabRefs.current[nextId]?.focus();
      }

      // Smooth text transition on right panel
      if (evidenceTextRef.current && !reduceMotion) {
        gsap.killTweensOf(evidenceTextRef.current);
        gsap.fromTo(
          evidenceTextRef.current,
          { opacity: 0.3, y: 4 },
          { opacity: 1, y: 0, duration: 0.28, ease: "power2.out" }
        );
      }
    },
    [selectedPart, reduceMotion]
  );

  // Trigger layer and callout animation whenever selection or composite changes. The opening reveal waits until the
  // stage approaches the viewport (it used to play, unseen, during hydration); later changes run immediately.
  const armedRef = useRef(false);
  useEffect(() => {
    const container = containerRef.current;
    let context: gsap.Context | undefined;
    const run = () => {
      armedRef.current = true;
      context = gsap.context(() => {
        updateCalloutStyles(selectedPart);
        animateLayers(selectedPart);
      }, containerRef);
    };
    let cancel = () => {};
    if (armedRef.current || !container) run();
    else cancel = whenNearViewport(container, run);
    return () => { cancel(); context?.revert(); };
  }, [selectedPart, compositeMode, updateCalloutStyles, animateLayers]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    return whenNearViewport(container, () => setLayersNear(true), "150% 0px");
  }, []);

  // Handle global Escape key for modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowEvidenceModal(false);
        setShowInspectorModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const currentIdx = ORDER.indexOf(selectedPart);
  const currentData = DATA[selectedPart];

  const handleTabKeyDown = (e: React.KeyboardEvent, index: number) => {
    let targetIdx: number | null = null;
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      targetIdx = (index + 1) % ORDER.length;
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      targetIdx = (index - 1 + ORDER.length) % ORDER.length;
    }
    if (targetIdx !== null) {
      selectPart(ORDER[targetIdx], true);
    }
  };

  const handlePrev = () => {
    const prevIdx = (currentIdx - 1 + ORDER.length) % ORDER.length;
    selectPart(ORDER[prevIdx]);
  };

  const handleNext = () => {
    const nextIdx = (currentIdx + 1) % ORDER.length;
    selectPart(ORDER[nextIdx]);
  };

  return (
    <section
      id="matrix-h"
      aria-label="Reel 04 · The Matrix"
      ref={containerRef}
      className="relative w-full overflow-hidden bg-[#EBE5D7] text-[#3B291D] py-6 sm:py-10 transition-colors duration-300 font-sans"
    >
      {/* Fonts are the site's self-hosted editorial pair (no third-party font requests). */}

      <style jsx global>{`
        .bsah-font-editorial {
          font-family: var(--font-display);
        }
        .bsah-font-mono {
          font-family: var(--font-mono);
        }
        .bsah-stage-wrapper {
          position: relative;
          width: 100%;
          aspect-ratio: 1600 / 1200;
          user-select: none;
          overflow: hidden;
        }
        .bsah-layer {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          will-change: opacity, transform;
        }
        .bsah-callout-btn {
          cursor: pointer;
          outline: none;
        }
        .bsah-callout-btn:focus-visible circle.bsah-badge {
          stroke: #3B291D;
          stroke-width: 3px;
        }
      `}</style>

      {/* TOP EDITORIAL BAR */}
      <header className="w-full max-w-[1560px] mx-auto px-5 sm:px-9 lg:px-14 pb-3 flex items-center justify-between border-b border-[#D5CBB8]/70">
        <div className="flex items-center gap-2.5 text-[11px] bsah-font-mono tracking-[0.2em] uppercase text-[#6E5D4E]">
          <span>REEL 03</span>
          <span className="text-[#A89984]">•</span>
          <span>THE MATRIX</span>
        </div>

        <div className="flex items-center gap-5 sm:gap-8">
          {/* Reel Progress Indicator */}
          <div className="hidden sm:flex items-center gap-3.5 text-[11px] bsah-font-mono tracking-[0.12em] text-[#6E5D4E]">
            <span>
              <strong className="font-medium text-[#3B291D]">03</strong> / 05
            </span>
            <div className="w-28 h-[1.5px] bg-[#D5CBB8] relative overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-[#5C4432] transition-all duration-300"
                style={{ width: "60%" }}
              />
            </div>
          </div>

          {/* Quick QA & Registration Inspector Trigger */}
          <button
            type="button"
            onClick={() => setShowInspectorModal(true)}
            aria-label="Open Registration and QA Inspector"
            title="Inspect 1600×1200 Coordinate Registration & Architecture"
            className="w-9 h-9 rounded-full border border-[#C9BEA9] flex flex-col items-center justify-center gap-[3.5px] hover:bg-[#DFD7C6] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4A3423] cursor-pointer"
          >
            <span className="w-3.5 h-[1.2px] bg-[#3B291D]" />
            <span className="w-3.5 h-[1.2px] bg-[#3B291D]" />
          </button>
        </div>
      </header>

      {/* MAIN EDITORIAL THREE-COLUMN SECTION */}
      <div className="w-full max-w-[1560px] mx-auto px-5 sm:px-9 lg:px-14 py-4 lg:py-6 my-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
          {/* 1. LEFT COLUMN: Headline + Anatomical Navigation + Vignette Callout */}
          <div className="lg:col-span-3 flex flex-col justify-between space-y-6 lg:space-y-8 order-1">
            {/* Editorial Headline */}
            <div>
              <p className="bsah-font-editorial italic text-[24px] sm:text-[28px] lg:text-[31px] leading-snug text-[#4B3829] mb-0.5">
                What twenty minutes
              </p>
              <h2 className="bsah-font-editorial font-semibold text-[50px] sm:text-[62px] xl:text-[70px] leading-[0.92] tracking-[-0.02em] text-[#4A3525] m-0">
                does to
                <br />
                a child.
              </h2>
            </div>

            {/* 01-04 Anatomical Navigation */}
            <nav aria-label="Anatomical System Selector" className="w-full">
              <div
                role="tablist"
                aria-label="Four Anatomical Regions"
                className="flex lg:flex-col overflow-x-auto border-t border-b lg:border-b-0 border-[#D5CBB8] divide-x lg:divide-x-0 lg:divide-y divide-[#D5CBB8]"
              >
                {/* 01 Brain */}
                <button
                  type="button"
                  role="tab"
                  id="bsah-tab-brain"
                  ref={(el) => {
                    tabRefs.current.brain = el;
                  }}
                  data-part="brain"
                  aria-selected={selectedPart === "brain"}
                  aria-controls="bsah-panel-evidence"
                  onClick={() => selectPart("brain")}
                  onKeyDown={(e) => handleTabKeyDown(e, 0)}
                  className={`flex-1 lg:flex-initial min-w-[132px] lg:min-w-0 flex items-center justify-between px-3.5 py-3 lg:px-4 lg:py-3.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4A3525] transition-colors cursor-pointer ${
                    selectedPart === "brain" ? "bg-[#E0D7C6]/75" : "bg-transparent hover:bg-[#E7DFCF]/60"
                  }`}
                >
                  <div className="flex items-baseline gap-3 lg:gap-5">
                    <span className="bsah-font-mono text-[11px] tracking-[0.14em] text-[#6E5D4E]">01</span>
                    <span className="bsah-font-editorial text-[22px] lg:text-[28px] leading-none text-[#3B291D] font-medium">
                      Brain
                    </span>
                  </div>
                  <svg viewBox="0 0 48 48" className="w-8 h-8 lg:w-10 lg:h-10 shrink-0 text-[#5C4938]" fill="none">
                    <path
                      d="M14 27C10.5 26 9 22.5 10.5 19C11.2 15 15 12 19.5 12.2C21.5 10.5 25.5 10.2 28.5 11.8C33.5 12 37.5 15.5 38 20.5C39.5 24 37.5 28 33.5 29C31.5 30 28 30.2 25.5 29.5L23.5 36.5L20 36.5L21 29.5C18.5 29.2 16 28.2 14 27Z"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M16 20C18.5 18 22 18.5 24 21M24 15.5C26.5 16 29.5 18 30 21M18 24.5C21 23.5 25 24 28 25.5"
                      stroke="currentColor"
                      strokeWidth="0.95"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>

                {/* 02 Spine */}
                <button
                  type="button"
                  role="tab"
                  id="bsah-tab-spine"
                  ref={(el) => {
                    tabRefs.current.spine = el;
                  }}
                  data-part="spine"
                  aria-selected={selectedPart === "spine"}
                  aria-controls="bsah-panel-evidence"
                  onClick={() => selectPart("spine")}
                  onKeyDown={(e) => handleTabKeyDown(e, 1)}
                  className={`flex-1 lg:flex-initial min-w-[132px] lg:min-w-0 flex items-center justify-between px-3.5 py-3 lg:px-4 lg:py-3.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4A3525] transition-colors cursor-pointer ${
                    selectedPart === "spine" ? "bg-[#E0D7C6]/75" : "bg-transparent hover:bg-[#E7DFCF]/60"
                  }`}
                >
                  <div className="flex items-baseline gap-3 lg:gap-5">
                    <span className="bsah-font-mono text-[11px] tracking-[0.14em] text-[#6E5D4E]">02</span>
                    <span className="bsah-font-editorial text-[22px] lg:text-[28px] leading-none text-[#4E3D30] font-medium">
                      Spine
                    </span>
                  </div>
                  <svg viewBox="0 0 48 48" className="w-8 h-8 lg:w-10 lg:h-10 shrink-0 text-[#6E5D4E]" fill="none">
                    <path d="M27 7C24.5 13 21.5 19 21.5 25C21.5 31 24.5 36 20.5 41" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
                    <rect x="22" y="9" width="6.5" height="2.4" rx="0.8" stroke="currentColor" strokeWidth="0.95" />
                    <rect x="20.5" y="13.5" width="6.5" height="2.4" rx="0.8" stroke="currentColor" strokeWidth="0.95" />
                    <rect x="19" y="18" width="6.8" height="2.5" rx="0.8" stroke="currentColor" strokeWidth="0.95" />
                    <rect x="18.5" y="22.5" width="7" height="2.5" rx="0.8" stroke="currentColor" strokeWidth="0.95" />
                    <rect x="19" y="27" width="7" height="2.5" rx="0.8" stroke="currentColor" strokeWidth="0.95" />
                    <rect x="19.5" y="31.5" width="6.8" height="2.5" rx="0.8" stroke="currentColor" strokeWidth="0.95" />
                    <rect x="18" y="36" width="6.5" height="2.4" rx="0.8" stroke="currentColor" strokeWidth="0.95" />
                  </svg>
                </button>

                {/* 03 Muscle */}
                <button
                  type="button"
                  role="tab"
                  id="bsah-tab-muscle"
                  ref={(el) => {
                    tabRefs.current.muscle = el;
                  }}
                  data-part="muscle"
                  aria-selected={selectedPart === "muscle"}
                  aria-controls="bsah-panel-evidence"
                  onClick={() => selectPart("muscle")}
                  onKeyDown={(e) => handleTabKeyDown(e, 2)}
                  className={`flex-1 lg:flex-initial min-w-[132px] lg:min-w-0 flex items-center justify-between px-3.5 py-3 lg:px-4 lg:py-3.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4A3525] transition-colors cursor-pointer ${
                    selectedPart === "muscle" ? "bg-[#E0D7C6]/75" : "bg-transparent hover:bg-[#E7DFCF]/60"
                  }`}
                >
                  <div className="flex items-baseline gap-3 lg:gap-5">
                    <span className="bsah-font-mono text-[11px] tracking-[0.14em] text-[#6E5D4E]">03</span>
                    <span className="bsah-font-editorial text-[22px] lg:text-[28px] leading-none text-[#4E3D30] font-medium">
                      Muscle
                    </span>
                  </div>
                  <svg viewBox="0 0 48 48" className="w-8 h-8 lg:w-10 lg:h-10 shrink-0 text-[#6E5D4E]" fill="none">
                    <path d="M13 36C14 27 19 18 29 11L35 13C33 23 27 32 17 38L13 36Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                    <path d="M17 33C20 26 24 20 31 14M20 35C24 28 28 22 33 16" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" />
                  </svg>
                </button>

                {/* 04 Heart */}
                <button
                  type="button"
                  role="tab"
                  id="bsah-tab-heart"
                  ref={(el) => {
                    tabRefs.current.heart = el;
                  }}
                  data-part="heart"
                  aria-selected={selectedPart === "heart"}
                  aria-controls="bsah-panel-evidence"
                  onClick={() => selectPart("heart")}
                  onKeyDown={(e) => handleTabKeyDown(e, 3)}
                  className={`flex-1 lg:flex-initial min-w-[132px] lg:min-w-0 flex items-center justify-between px-3.5 py-3 lg:px-4 lg:py-3.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4A3525] transition-colors cursor-pointer ${
                    selectedPart === "heart" ? "bg-[#E0D7C6]/75" : "bg-transparent hover:bg-[#E7DFCF]/60"
                  }`}
                >
                  <div className="flex items-baseline gap-3 lg:gap-5">
                    <span className="bsah-font-mono text-[11px] tracking-[0.14em] text-[#6E5D4E]">04</span>
                    <span className="bsah-font-editorial text-[22px] lg:text-[28px] leading-none text-[#4E3D30] font-medium">
                      Heart
                    </span>
                  </div>
                  <svg viewBox="0 0 48 48" className="w-8 h-8 lg:w-10 lg:h-10 shrink-0 text-[#6E5D4E]" fill="none">
                    <path d="M22 16C18.5 15.5 15 18.5 15 23C15 29.5 21.5 34.5 26 37C30.5 34 34 28.5 33.5 23C33 18.5 29.5 16 26 17.5L22 16Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                    <path d="M21 16V11.5M25 16.5V10.5L28 12M28.5 17L31.5 13.5" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </nav>

            {/* Bottom-Left Editorial Callout ("Real change. Measurable growth.") */}
            <div className="hidden lg:flex items-center justify-between pt-3 border-t border-[#D5CBB8]/80">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-full overflow-hidden border border-[#C5B9A5] shrink-0">
                  <img
                    src="/images/matrix/child-rider-thumb.webp"
                    loading="lazy"
                    decoding="async"
                    alt="Equestrian child rider thumbnail"
                    className="w-full h-full object-cover scale-125"
                  />
                </div>
                <div className="bsah-font-editorial text-[16px] leading-[1.22] text-[#4A3525]">
                  <p className="m-0">Real change.</p>
                  <p className="m-0">Measurable growth.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowInspectorModal(true)}
                aria-label="Compare all four physiological systems"
                title="View All 4 Systems Summary & Composite Mode"
                className="w-9 h-9 rounded-full border border-[#C9BEA9] flex items-center justify-center text-[#4A3525] hover:bg-[#DFD7C6] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4A3525] cursor-pointer"
              >
                <span className="text-xs">›</span>
              </button>
            </div>
          </div>

          {/* 2. CENTER COLUMN: Registered 1600x1200 Rider & Anatomical Overlay Stage */}
          <div className="lg:col-span-9 order-2 flex flex-col items-center justify-center">
            <div className="bsah-stage-wrapper max-w-[880px] w-full">
              {/* LAYER 0: Base Rider & Horse Image (Stationary, 1600x1200 Coordinate Space) */}
              <img
                src="/images/matrix/rider-base.webp"
                loading="lazy"
                decoding="async"
                alt="Realistic child equestrian rider in side-profile composition on a dapple-grey horse facing right"
                width={1600}
                height={1200}
                className="bsah-layer object-contain"
                draggable={false}
              />

              {/* LAYER 1: SVG Stage for Registered Anatomical Overlays, SVG Masks & Callout Annotations */}
              <svg
                id="bsah-matrix-stage-svg"
                viewBox="0 0 1600 1200"
                className="bsah-layer pointer-events-none"
                preserveAspectRatio="xMidYMid meet"
                aria-label="Interactive Anatomical Visualization Stage"
              >
                <defs>
                  {/* Soft Feather Filters for Anatomical Masks */}
                  <filter id="bsah-feather-soft" x="-15%" y="-15%" width="130%" height="130%">
                    <feGaussianBlur stdDeviation="8" />
                  </filter>
                  <filter id="bsah-glow-gold" x="-25%" y="-25%" width="150%" height="150%">
                    <feGaussianBlur stdDeviation="5" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>

                  {/* 01 BRAIN SVG MASK */}
                  <mask id="bsah-mask-brain" maskUnits="userSpaceOnUse" x="0" y="0" width="1600" height="1200">
                    <rect width="1600" height="1200" fill="black" />
                    <circle id="bsah-mask-reveal-brain" cx="800" cy="295" r="145" fill="white" filter="url(#bsah-feather-soft)" />
                  </mask>

                  {/* 02 SPINE SVG MASK */}
                  <mask id="bsah-mask-spine" maskUnits="userSpaceOnUse" x="0" y="0" width="1600" height="1200">
                    <rect width="1600" height="1200" fill="black" />
                    <rect id="bsah-mask-reveal-spine" x="620" y="330" width="210" height="560" fill="white" filter="url(#bsah-feather-soft)" />
                  </mask>

                  {/* 03 MUSCLE SVG MASK */}
                  <mask id="bsah-mask-muscle" maskUnits="userSpaceOnUse" x="0" y="0" width="1600" height="1200">
                    <rect width="1600" height="1200" fill="black" />
                    <rect id="bsah-mask-reveal-muscle" x="560" y="540" width="410" height="500" fill="white" filter="url(#bsah-feather-soft)" />
                  </mask>

                  {/* 04 HEART SVG MASK */}
                  <mask id="bsah-mask-heart" maskUnits="userSpaceOnUse" x="0" y="0" width="1600" height="1200">
                    <rect width="1600" height="1200" fill="black" />
                    <circle id="bsah-mask-reveal-heart" cx="736" cy="576" r="95" fill="white" filter="url(#bsah-feather-soft)" />
                  </mask>
                </defs>

                {/* Editorial Background Geometric Compass Rings & Crosshairs */}
                <g stroke="#B7A995" strokeWidth="1" fill="none" opacity="0.42">
                  <circle cx="775" cy="515" r="295" />
                  <circle cx="775" cy="515" r="395" strokeDasharray="3 6" />
                  <line x1="775" y1="85" x2="775" y2="945" strokeOpacity="0.38" />
                  <line x1="345" y1="515" x2="1205" y2="515" strokeOpacity="0.38" />
                </g>

                {/* REGISTERED OVERLAY 01: BRAIN */}
                <g id="bsah-overlay-layer-brain" opacity={selectedPart === "brain" || compositeMode ? 1 : 0}>
                  <image
                    href={layersNear ? "/images/matrix/brain-overlay.webp" : undefined}
                    x="0"
                    y="0"
                    width="1600"
                    height="1200"
                    mask="url(#bsah-mask-brain)"
                    preserveAspectRatio="none"
                  />
                  <path
                    id="bsah-boundary-brain"
                    d="M 705 295 C 710 255, 748 222, 805 220 C 855 222, 886 258, 890 302 C 885 332, 858 348, 826 355 C 810 370, 798 395, 775 395 C 756 392, 754 364, 738 352 C 714 340, 702 318, 705 295 Z"
                    fill="none"
                    stroke="#DFAD58"
                    strokeWidth="1.6"
                    filter="url(#bsah-glow-gold)"
                    opacity="0.78"
                  />
                </g>

                {/* REGISTERED OVERLAY 02: SPINE */}
                <g id="bsah-overlay-layer-spine" opacity={selectedPart === "spine" || compositeMode ? 1 : 0}>
                  <image
                    href={layersNear ? "/images/matrix/spine-overlay.webp" : undefined}
                    x="0"
                    y="0"
                    width="1600"
                    height="1200"
                    mask="url(#bsah-mask-spine)"
                    preserveAspectRatio="none"
                  />
                  <path
                    id="bsah-boundary-spine"
                    d="M 780 348 C 765 415, 718 485, 710 575 C 704 665, 720 740, 712 795 C 704 830, 682 850, 665 856"
                    fill="none"
                    stroke="#DFAD58"
                    strokeWidth="1.8"
                    strokeDasharray="5 5"
                    opacity="0.85"
                  />
                </g>

                {/* REGISTERED OVERLAY 03: MUSCLE */}
                <g id="bsah-overlay-layer-muscle" opacity={selectedPart === "muscle" || compositeMode ? 1 : 0}>
                  <image
                    href={layersNear ? "/images/matrix/muscle-overlay.webp" : undefined}
                    x="0"
                    y="0"
                    width="1600"
                    height="1200"
                    mask="url(#bsah-mask-muscle)"
                    preserveAspectRatio="none"
                  />
                  <path
                    id="bsah-boundary-muscle"
                    d="M 620 775 C 655 700, 745 695, 795 760 C 845 825, 905 905, 922 980"
                    fill="none"
                    stroke="#DFAD58"
                    strokeWidth="1.5"
                    opacity="0.65"
                  />
                  <g id="bsah-muscle-subregions">
                    <ellipse
                      className="bsah-muscle-sub-ring"
                      cx="745"
                      cy="655"
                      rx="56"
                      ry="42"
                      transform="rotate(-12 745 655)"
                      fill="none"
                      stroke="#E8BA6B"
                      strokeWidth="1.6"
                      strokeDasharray="4 4"
                      opacity="0"
                    />
                    <ellipse
                      className="bsah-muscle-sub-ring"
                      cx="715"
                      cy="775"
                      rx="76"
                      ry="54"
                      transform="rotate(18 715 775)"
                      fill="none"
                      stroke="#E8BA6B"
                      strokeWidth="1.6"
                      strokeDasharray="4 4"
                      opacity="0"
                    />
                    <ellipse
                      className="bsah-muscle-sub-ring"
                      cx="835"
                      cy="895"
                      rx="84"
                      ry="46"
                      transform="rotate(40 835 895)"
                      fill="none"
                      stroke="#E8BA6B"
                      strokeWidth="1.6"
                      strokeDasharray="4 4"
                      opacity="0"
                    />
                  </g>
                </g>

                {/* REGISTERED OVERLAY 04: HEART */}
                <g id="bsah-overlay-layer-heart" opacity={selectedPart === "heart" || compositeMode ? 1 : 0}>
                  <image
                    href={layersNear ? "/images/matrix/heart-overlay.webp" : undefined}
                    x="0"
                    y="0"
                    width="1600"
                    height="1200"
                    mask="url(#bsah-mask-heart)"
                    preserveAspectRatio="none"
                  />
                  <path
                    id="bsah-boundary-heart"
                    d="M 702 522 C 724 514, 758 522, 774 546 C 788 576, 786 616, 776 636 C 758 646, 728 632, 704 602 C 690 578, 692 542, 702 522 Z"
                    fill="none"
                    stroke="#DFAD58"
                    strokeWidth="1.5"
                    opacity="0.7"
                  />
                </g>

                {/* QA REGISTRATION GRID OVERLAY */}
                {showRegGrid && (
                  <g opacity="0.9" className="pointer-events-none">
                    <rect x="2" y="2" width="1596" height="1196" fill="none" stroke="#A56938" strokeWidth="2" strokeDasharray="8 4" />
                    <line x1="800" y1="0" x2="800" y2="1200" stroke="#A56938" strokeWidth="1" strokeDasharray="4 4" />
                    <line x1="0" y1="600" x2="1600" y2="600" stroke="#A56938" strokeWidth="1" strokeDasharray="4 4" />
                    <rect x="680" y="220" width="220" height="200" fill="none" stroke="#D97706" strokeWidth="1.2" />
                    <text x="685" y="214" fill="#92400E" fontSize="13" fontFamily="monospace">BRAIN ROI (680,220)-(900,420)</text>
                    <rect x="648" y="344" width="148" height="516" fill="none" stroke="#D97706" strokeWidth="1.2" />
                    <text x="505" y="360" fill="#92400E" fontSize="13" fontFamily="monospace">SPINE ROI</text>
                    <rect x="585" y="560" width="360" height="460" fill="none" stroke="#D97706" strokeWidth="1.2" />
                    <text x="588" y="1038" fill="#92400E" fontSize="13" fontFamily="monospace">MUSCLE ROI (585,560)-(945,1020)</text>
                    <rect x="690" y="514" width="96" height="130" fill="none" stroke="#D97706" strokeWidth="1.2" />
                    <text x="875" y="635" fill="#92400E" fontSize="13" fontFamily="monospace">HEART ROI</text>
                  </g>
                )}

                {/* CIRCULAR FOCUS GUIDES */}
                <circle id="bsah-focus-ring-brain" cx="800" cy="295" r="92" fill="none" stroke="#C8923E" strokeWidth="1.2" strokeDasharray="4 4" opacity="0.55" />
                <circle id="bsah-focus-ring-spine" cx="712" cy="595" r="135" fill="none" stroke="#C8923E" strokeWidth="1.2" strokeDasharray="4 4" opacity="0" />
                <circle id="bsah-focus-ring-muscle" cx="765" cy="815" r="145" fill="none" stroke="#C8923E" strokeWidth="1.2" strokeDasharray="4 4" opacity="0" />
                <circle id="bsah-focus-ring-heart" cx="736" cy="576" r="68" fill="none" stroke="#C8923E" strokeWidth="1.2" strokeDasharray="4 4" opacity="0" />

                {/* INTERACTIVE CALLOUT ANNOTATIONS */}
                {/* 01 BRAIN */}
                <g
                  className="bsah-callout-btn pointer-events-auto"
                  onClick={() => selectPart("brain")}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selectPart("brain"); } }}
                  role="button"
                  tabIndex={0}
                >
                  <line id="bsah-line-brain" x1="760" y1="149" x2="768" y2="235" stroke="#4A3525" strokeWidth="1.6" />
                  <circle id="bsah-anchor-brain" cx="768" cy="235" r="4" fill="#C8923E" />
                  <circle className="bsah-badge" id="bsah-badge-brain" cx="760" cy="125" r="24" fill="#4A3525" stroke="#4A3525" strokeWidth="1.6" />
                  <text id="bsah-num-brain" x="760" y="130" textAnchor="middle" fill="#F3EFE6" fontSize="14" style={{ fontFamily: "var(--font-mono)" }} fontWeight="500">
                    01
                  </text>
                  <text id="bsah-label-brain" x="798" y="130" textAnchor="start" fill="#3B291D" fontSize="14" style={{ fontFamily: "var(--font-sans)" }} fontWeight="600" letterSpacing="0.16em">
                    BRAIN
                  </text>
                </g>

                {/* 02 SPINE */}
                <g
                  className="bsah-callout-btn pointer-events-auto"
                  onClick={() => selectPart("spine")}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selectPart("spine"); } }}
                  role="button"
                  tabIndex={0}
                >
                  <line id="bsah-line-spine" x1="557" y1="465" x2="695" y2="525" stroke="#8C7B69" strokeWidth="1.15" />
                  <circle id="bsah-anchor-spine" cx="695" cy="525" r="3.2" fill="#6E5D4E" />
                  <circle className="bsah-badge" id="bsah-badge-spine" cx="535" cy="455" r="24" fill="#EBE5D7" stroke="#8C7B69" strokeWidth="1.3" />
                  <text id="bsah-num-spine" x="535" y="460" textAnchor="middle" fill="#4A3525" fontSize="14" style={{ fontFamily: "var(--font-mono)" }} fontWeight="500">
                    02
                  </text>
                  <text id="bsah-label-spine" x="535" y="498" textAnchor="middle" fill="#5C4938" fontSize="13.5" style={{ fontFamily: "var(--font-sans)" }} fontWeight="600" letterSpacing="0.16em">
                    SPINE
                  </text>
                </g>

                {/* 03 MUSCLE */}
                <g
                  className="bsah-callout-btn pointer-events-auto"
                  onClick={() => selectPart("muscle")}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selectPart("muscle"); } }}
                  role="button"
                  tabIndex={0}
                >
                  <line id="bsah-line-muscle" x1="489" y1="740" x2="645" y2="775" stroke="#8C7B69" strokeWidth="1.15" />
                  <circle id="bsah-anchor-muscle" cx="645" cy="775" r="3.2" fill="#6E5D4E" />
                  <circle className="bsah-badge" id="bsah-badge-muscle" cx="465" cy="735" r="24" fill="#EBE5D7" stroke="#8C7B69" strokeWidth="1.3" />
                  <text id="bsah-num-muscle" x="465" y="740" textAnchor="middle" fill="#4A3525" fontSize="14" style={{ fontFamily: "var(--font-mono)" }} fontWeight="500">
                    03
                  </text>
                  <text id="bsah-label-muscle" x="465" y="778" textAnchor="middle" fill="#5C4938" fontSize="13.5" style={{ fontFamily: "var(--font-sans)" }} fontWeight="600" letterSpacing="0.16em">
                    MUSCLE
                  </text>
                </g>

                {/* 04 HEART */}
                <g
                  className="bsah-callout-btn pointer-events-auto"
                  onClick={() => selectPart("heart")}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selectPart("heart"); } }}
                  role="button"
                  tabIndex={0}
                >
                  <line id="bsah-line-heart" x1="972" y1="499" x2="774" y2="568" stroke="#8C7B69" strokeWidth="1.15" />
                  <circle id="bsah-anchor-heart" cx="774" cy="568" r="3.2" fill="#6E5D4E" />
                  <circle className="bsah-badge" id="bsah-badge-heart" cx="995" cy="492" r="24" fill="#EBE5D7" stroke="#8C7B69" strokeWidth="1.3" />
                  <text id="bsah-num-heart" x="995" y="497" textAnchor="middle" fill="#4A3525" fontSize="14" style={{ fontFamily: "var(--font-mono)" }} fontWeight="500">
                    04
                  </text>
                  <text id="bsah-label-heart" x="1032" y="497" textAnchor="start" fill="#5C4938" fontSize="13.5" style={{ fontFamily: "var(--font-sans)" }} fontWeight="600" letterSpacing="0.16em">
                    HEART
                  </text>
                </g>
              </svg>
            </div>
          </div>

          {/* 3. RIGHT COLUMN: Selected Title, Description, Evidence & Thumbnails */}
          <div
            id="bsah-panel-evidence"
            role="tabpanel"
            aria-labelledby={`bsah-tab-${selectedPart}`}
            className="lg:col-span-12 order-3 grid gap-10 border-t border-[#D5CBB8] pt-8 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]"
          >
            <div ref={evidenceTextRef} className="space-y-4">
              {/* Category Index & Label */}
              <div className="flex items-center gap-3 text-[12px] tracking-[0.2em] uppercase text-[#6E5D4E]">
                <span className="bsah-font-mono">{currentData.number}</span>
                <span className="inline-block w-5 h-[1px] bg-[#B7A995]" />
                <span className="font-semibold text-[#4A3525]">{currentData.upperLabel}</span>
              </div>

              {/* Editorial Serif Title */}
              <h2
                className="bsah-font-editorial text-[34px] sm:text-[38px] xl:text-[42px] leading-[1.06] tracking-[-0.01em] text-[#2F2016] m-0"
                dangerouslySetInnerHTML={{ __html: currentData.headline }}
              />

              {/* Editorial Description */}
              <p className="text-[17px] leading-[1.75] text-[#544335] m-0">
                {currentData.description}
              </p>

              {/* Supported Evidence Block */}
              <div className="border-t border-[#D5CBB8] pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#A56938]" />
                    <span className="text-[10.5px] font-semibold tracking-[0.2em] uppercase text-[#4A3525]">
                      SUPPORTED EVIDENCE
                    </span>
                  </div>
                  <span className="text-[10px] bsah-font-mono uppercase tracking-wider px-2 py-0.5 bg-[#E0D7C6] text-[#4A3525]">
                    {currentData.statusBadge}
                  </span>
                </div>

                <p className="text-[16px] leading-[1.7] text-[#5C4B3B] m-0">
                  {currentData.evidenceSummary}
                </p>

                {/* Scientific Caution Note (if any) */}
                {currentData.cautionNote && (
                  <div className="text-[14px] leading-[1.65] text-[#6E4E2E] bg-[#E3DAC8] px-3 py-2 border-l-2 border-[#A56938]">
                    {currentData.cautionNote}
                  </div>
                )}

                <div className="pt-1.5">
                  <button
                    type="button"
                    onClick={() => setShowEvidenceModal(true)}
                    className="inline-flex items-center gap-4 px-5 py-2.5 border border-[#C2B6A3] text-[11px] font-medium tracking-[0.18em] uppercase text-[#3B291D] hover:bg-[#3B291D] hover:text-[#F3EFE6] hover:border-[#3B291D] transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4A3525] cursor-pointer"
                  >
                    <span>SEE THE EVIDENCE</span>
                    <span aria-hidden="true">→</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom-Right 4-Thumbnail Strip */}
            <div className="pt-3 border-t border-[#D5CBB8]/60 lg:border-t-0">
              <div className="grid grid-cols-4 gap-2" role="group" aria-label="Anatomical Detail Thumbnails">
                {ORDER.map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => selectPart(id)}
                    aria-label={`Select ${DATA[id].label} view`}
                    aria-pressed={selectedPart === id}
                    className={`relative aspect-square overflow-hidden border transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 ${
                      selectedPart === id
                        ? "border-[#4A3525] ring-1 ring-[#4A3525] opacity-100"
                        : "border-[#C9BEA9] opacity-60 hover:opacity-90"
                    }`}
                  >
                    <img
                      src={`/images/matrix/${id}-thumb.webp`}
                      loading="lazy"
                      decoding="async"
                      alt={`${DATA[id].label} anatomical detail`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>

              <div className="mt-3 flex items-center justify-between gap-4">
                <div className="relative h-[2px] flex-1 bg-[#D5CBB8] overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-[#4A3525] transition-all duration-300"
                    style={{ width: `${((currentIdx + 1) / ORDER.length) * 100}%` }}
                  />
                </div>
                <div className="flex items-center gap-1.5 text-[#4A3525]">
                  <button
                    type="button"
                    onClick={handlePrev}
                    aria-label="Previous anatomical region"
                    className="w-7 h-7 flex items-center justify-center hover:bg-[#DFD7C6] rounded transition-colors text-sm cursor-pointer"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    aria-label="Next anatomical region"
                    className="w-7 h-7 flex items-center justify-center hover:bg-[#DFD7C6] rounded transition-colors text-sm cursor-pointer"
                  >
                    →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM FOOTER */}
      <footer className="w-full max-w-[1560px] mx-auto px-5 sm:px-9 lg:px-14 pb-2 pt-2 flex flex-wrap items-center justify-between gap-2 text-[10px] bsah-font-mono tracking-[0.22em] uppercase text-[#6E5D4E]">
        <span>THE BLACK STALLION ACADEMY</span>
        <span>
          STAGE COORDINATE SPACE: 1600 × 1200 • ACTIVE: {currentData.number} {currentData.upperLabel}
          {compositeMode ? " (COMPOSITE MODE)" : ""}
        </span>
      </footer>

      <div className="gutter pb-10"><SomaticMap /></div>

      {/* MODAL 1: EVIDENCE CITATION */}
      {showEvidenceModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="bsah-modal-evidence-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowEvidenceModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]"
        >
          <div className="bg-[#F3EFE6] border border-[#C5B9A5] max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-4 text-[#2F2016]">
            <div className="flex items-center justify-between border-b border-[#D5CBB8] pb-3">
              <span className="text-[11px] bsah-font-mono uppercase tracking-[0.18em] text-[#6E5D4E]">
                {currentData.number} — {currentData.upperLabel} • CLINICAL & BIOMECHANICAL EVIDENCE
              </span>
              <button
                type="button"
                onClick={() => setShowEvidenceModal(false)}
                aria-label="Close Evidence Modal"
                className="w-7 h-7 flex items-center justify-center text-xs bsah-font-mono hover:bg-[#E2DAC9] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <h3 id="bsah-modal-evidence-title" className="bsah-font-editorial text-2xl sm:text-3xl leading-snug text-[#2F2016] m-0">
              {currentData.studyTitle}
            </h3>

            <p className="text-xs bsah-font-mono text-[#6E5D4E] m-0">
              {currentData.authors}
            </p>

            <p className="text-sm leading-relaxed text-[#4A3728] m-0">
              {currentData.studyBody}
            </p>

            <div className="text-xs leading-relaxed text-[#5C4938] bg-[#E6DFD0] p-3.5 border-l-2 border-[#A56938]">
              <strong>Scientific Scope Note:</strong> {currentData.reviewNote}
            </div>

            <div className="pt-3 border-t border-[#D5CBB8] flex flex-wrap items-center justify-between gap-3">
              <a
                href={currentData.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-[#4A3525] underline underline-offset-4 hover:text-[#2F2016]"
              >
                <span>View Peer-Reviewed Source (PubMed / PMC)</span>
                <span>↗</span>
              </a>
              <button
                type="button"
                onClick={() => setShowEvidenceModal(false)}
                className="px-5 py-2 bg-[#3B291D] text-[#F3EFE6] text-[11px] bsah-font-mono uppercase tracking-widest hover:bg-[#523B2B] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: PRODUCTION QA & REGISTRATION INSPECTOR */}
      {showInspectorModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="bsah-modal-inspector-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowInspectorModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]"
        >
          <div className="bg-[#F3EFE6] border border-[#C5B9A5] max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-5 text-[#2F2016] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#D5CBB8] pb-3">
              <span className="text-[11px] bsah-font-mono uppercase tracking-[0.18em] text-[#6E5D4E]">
                BSAH REEL 03 • PRODUCTION QA & REGISTRATION CONTROLS
              </span>
              <button
                type="button"
                onClick={() => setShowInspectorModal(false)}
                aria-label="Close QA Inspector"
                className="w-7 h-7 flex items-center justify-center text-xs bsah-font-mono hover:bg-[#E2DAC9] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <h3 id="bsah-modal-inspector-title" className="bsah-font-editorial text-2xl sm:text-3xl leading-snug m-0">
              Stage Coordinate Registration & Motion Controls
            </h3>

            <div className="space-y-3 text-sm">
              <label className="flex items-center justify-between p-3 bg-[#E6DFD0]/70 border border-[#D5CBB8] cursor-pointer">
                <div>
                  <p className="font-medium text-[#2F2016] m-0">Show 1600×1200 Coordinate Registration Grid</p>
                  <p className="text-xs text-[#6E5D4E] m-0">Overlays SVG bounding boxes and ROI anchors on the stage</p>
                </div>
                <input
                  type="checkbox"
                  checked={showRegGrid}
                  onChange={(e) => setShowRegGrid(e.target.checked)}
                  className="w-4 h-4 accent-[#4A3525]"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-[#E6DFD0]/70 border border-[#D5CBB8] cursor-pointer">
                <div>
                  <p className="font-medium text-[#2F2016] m-0">Composite All-Systems X-Ray Preview</p>
                  <p className="text-xs text-[#6E5D4E] m-0">Displays Brain, Spine, Muscle & Heart layers simultaneously</p>
                </div>
                <input
                  type="checkbox"
                  checked={compositeMode}
                  onChange={(e) => setCompositeMode(e.target.checked)}
                  className="w-4 h-4 accent-[#4A3525]"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-[#E6DFD0]/70 border border-[#D5CBB8] cursor-pointer">
                <div>
                  <p className="font-medium text-[#2F2016] m-0">Simulate Reduced Motion (prefers-reduced-motion)</p>
                  <p className="text-xs text-[#6E5D4E] m-0">Disables nonessential GSAP mask/line tweens for instant state switching</p>
                </div>
                <input
                  type="checkbox"
                  checked={forceReducedMotion}
                  onChange={(e) => setForceReducedMotion(e.target.checked)}
                  className="w-4 h-4 accent-[#4A3525]"
                />
              </label>
            </div>

            <div className="border-t border-[#D5CBB8] pt-4 space-y-2 text-xs text-[#544335]">
              <p className="bsah-font-mono uppercase tracking-wider text-[#4A3525] font-semibold m-0">
                Registered Asset Pipeline (2000×1500 Master / 1600×1200 Stage)
              </p>
              <ul className="space-y-1 bsah-font-mono text-[11px] list-none p-0 m-0">
                <li>• /images/matrix/rider-base.webp (Stationary base layer)</li>
                <li>• /images/matrix/brain-overlay.webp + brain-mask.svg</li>
                <li>• /images/matrix/spine-overlay.webp + spine-mask.svg</li>
                <li>• /images/matrix/muscle-overlay.webp + muscle-mask.svg</li>
                <li>• /images/matrix/heart-overlay.webp + heart-mask.svg</li>
              </ul>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowInspectorModal(false)}
                className="px-5 py-2 bg-[#3B291D] text-[#F3EFE6] text-[11px] bsah-font-mono uppercase tracking-widest hover:bg-[#523B2B] cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
