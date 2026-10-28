"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { Headline } from "@/components/film/Headline";
import { Label } from "@/components/film/Marks";
import { ErrorBoundary } from "@/components/3d/ErrorBoundary";
import type { CloakInput } from "@/components/3d/cloak/CloakStage";
import { HERO_MODEL, HERO_MODEL_MOBILE } from "@/components/3d/marwari-paths";
import { lastExhibit as copy } from "@/lib/content/exhibit";
import { useNearViewport, useOnScreen } from "@/lib/motion/use-near-viewport";
import { useReducedMotion } from "@/lib/motion/reduced";
import { useCapabilities } from "@/lib/3d/use-capabilities";
import { cn } from "@/lib/utils";

// three/webgpu, the node materials and the model load in their own client-only chunk, only when the stage is near.
const CloakStage = dynamic(() => import("@/components/3d/cloak/CloakStage"), { ssr: false });

const hasWebGPU = () => typeof navigator !== "undefined" && "gpu" in navigator;

/**
 * The end of the museum: the Marwari with its coat dissolving into glass (the "Predator cloak" material from the
 * React Three Fiber demo, ported to TSL node materials, on the site's rigged horse). Dark scene (`tone-dark`).
 * Hover or press-and-hold dissolves the coat; the button pins it for keyboard and switch users.
 * Without WebGPU or WebGL 2 the stage shows a photograph and a short note instead.
 */
export function LastExhibit() {
  const stageRef = useRef<HTMLDivElement>(null);
  const near = useNearViewport(stageRef);
  const onScreen = useOnScreen(stageRef);
  const reduced = useReducedMotion();
  const capabilities = useCapabilities();
  const input = useRef<CloakInput>({ hovered: false, holding: false, pinned: false });
  const [pinned, setPinned] = useState(false);
  const [cloaked, setCloaked] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const lastCloaked = useRef(false);

  const supported = capabilities !== null && (capabilities.webgl || hasWebGPU()) && !failed;
  const quality = capabilities?.quality ?? "low";

  const onReady = useCallback(() => setReady(true), []);
  const onHover = useCallback((hovered: boolean) => {
    input.current.hovered = hovered;
  }, []);
  const onProgress = useCallback((p: number) => {
    const next = p > 0.5;
    if (next !== lastCloaked.current) {
      lastCloaked.current = next;
      setCloaked(next);
    }
  }, []);
  const onError = useCallback((error: Error) => {
    console.error("[Marwari exhibit] 3D stage unavailable:", error.message);
    setFailed(true);
  }, []);

  useEffect(() => {
    const release = () => {
      input.current.holding = false;
    };
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    return () => {
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
    };
  }, []);

  const togglePin = () => {
    input.current.pinned = !input.current.pinned;
    setPinned(input.current.pinned);
  };

  return (
    <section id="exhibit" aria-labelledby="exhibit-h" data-parallax-skip className="tone-dark relative bg-night pt-[clamp(6rem,12vh,9rem)]">
      <div className="gutter pb-10 md:pb-14">
        <Label>{copy.label}</Label>
        <Headline id="exhibit-h" className="mt-4" inscription={copy.inscription} voice={copy.voice} />
        <p className="t-story mt-6 max-w-2xl text-lede text-sand">{copy.body}</p>
      </div>

      <div
        ref={stageRef}
        className="relative h-[78svh] min-h-[460px] w-full overflow-hidden bg-night lg:h-[84svh]"
        onPointerDown={(event) => {
          if (event.button !== 0 || (event.target as HTMLElement).closest("button")) return;
          input.current.holding = true;
        }}
      >
        {/* The photograph holds the frame until the 3D stage is drawing (and stays where 3D cannot run). */}
        <Image
          src="/images/black-marwari-stallion.webp"
          alt={copy.alt}
          fill
          sizes="100vw"
          className={cn("object-cover object-center transition-opacity duration-700", ready && supported ? "opacity-0" : "opacity-100")}
        />
        {near && supported && capabilities ? (
          <div className="absolute inset-0" aria-hidden>
            <ErrorBoundary fallback={null} onError={onError}>
              <CloakStage
                model={quality === "high" ? HERO_MODEL : HERO_MODEL_MOBILE}
                input={input}
                quality={quality}
                reduced={reduced}
                visible={onScreen}
                onReady={onReady}
                onProgress={onProgress}
                onHover={onHover}
              />
            </ErrorBoundary>
          </div>
        ) : null}
        <div aria-hidden className="shade-b pointer-events-none absolute inset-0" />

        <div className="gutter pointer-events-none absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-x-8 gap-y-4 pb-8 md:pb-12">
          <div className="max-w-md">
            <p className="label text-brass">
              <span className="[@media(hover:none)]:hidden">{copy.hintPointer}</span>
              <span className="hidden [@media(hover:none)]:inline">{copy.hintTouch}</span>
            </p>
            <p className="t-ui mt-2 text-sm text-dust" aria-live="polite">
              {supported ? (cloaked ? copy.stateCloaked : copy.stateVisible) : copy.unsupported}
            </p>
            <p className="t-ui mt-1 text-xs text-dust">{copy.note}</p>
          </div>
          {supported ? (
            <button
              type="button"
              aria-pressed={pinned}
              onClick={togglePin}
              className="label pointer-events-auto border border-line px-5 py-3 text-bone transition-colors hover:border-gold hover:text-gold focus-visible:border-gold"
            >
              {pinned ? copy.unpin : copy.pin}
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
