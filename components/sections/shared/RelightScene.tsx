"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useCallback, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { ErrorBoundary } from "@/components/3d/ErrorBoundary";
import type { RelightInput } from "@/components/3d/relight/RelightStage";
import { Headline } from "@/components/film/Headline";
import { Label } from "@/components/film/Marks";
import type { RelightCopy, RelightItem } from "@/lib/content/relight";
import type { RelightPreset } from "@/components/3d/relight/RelightStage";
import { useCapabilities } from "@/lib/3d/use-capabilities";
import { useReducedMotion } from "@/lib/motion/reduced";
import { useNearViewport, useOnScreen } from "@/lib/motion/use-near-viewport";
import { cn } from "@/lib/utils";

// three/webgpu and the relighting shader load in their own client-only chunk, only when the stage is near.
const RelightStage = dynamic(() => import("@/components/3d/relight/RelightStage"), { ssr: false });

const hasWebGPU = () => typeof navigator !== "undefined" && "gpu" in navigator;
const KEY_STEP = 0.14;
const clamp = (v: number) => Math.max(-1, Math.min(1, v));

/**
 * A relit picture: a dark scene in which the pointer is a light over a photograph, with raking light and self-shadow
 * from a depth map made from the picture (the Codrops "Relighting Images" shader, components/3d/relight). Dark scene
 * (`tone-dark`). Pointer, touch drag or arrow keys carry the light; with several items a tab row swaps the picture.
 * Where WebGPU and WebGL 2 are both missing the picture stays, with a CSS glow that follows the pointer instead.
 * Used by /fleet ("Light the stallion", lantern preset) and /anatomy ("Read it in stone", marble preset).
 */
export function RelightScene({
  id,
  copy,
  items,
  preset = "lantern",
  flip = false,
}: {
  id: string;
  copy: RelightCopy;
  items: readonly RelightItem[];
  preset?: RelightPreset;
  /** Picture on the left on wide screens. */
  flip?: boolean;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const near = useNearViewport(stageRef);
  const onScreen = useOnScreen(stageRef);
  const reduced = useReducedMotion();
  const capabilities = useCapabilities();
  const input = useRef<RelightInput>({ key: null });
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const [selected, setSelected] = useState(0);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [glow, setGlow] = useState({ x: 62, y: 38 });
  const horse = items[selected];

  const supported = capabilities !== null && (capabilities.webgl || hasWebGPU()) && !failed;
  const quality = capabilities?.quality ?? "low";
  const onReady = useCallback(() => setReady(true), []);
  const onError = useCallback((error: Error) => {
    console.error(`[${id}] relit stage unavailable:`, error.message);
    setFailed(true);
  }, [id]);

  const onStageKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const moves: Record<string, [number, number]> = { ArrowLeft: [-KEY_STEP, 0], ArrowRight: [KEY_STEP, 0], ArrowUp: [0, KEY_STEP], ArrowDown: [0, -KEY_STEP] };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    const current = input.current.key ?? { x: 0.3, y: 0.25 };
    input.current.key = { x: clamp(current.x + move[0]), y: clamp(current.y + move[1]) };
    if (!supported) setGlow((g) => ({ x: Math.max(0, Math.min(100, g.x + move[0] * 50)), y: Math.max(0, Math.min(100, g.y - move[1] * 50)) }));
  };
  const onStagePointer = (event: PointerEvent<HTMLDivElement>) => {
    input.current.key = null;
    if (supported) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setGlow({ x: ((event.clientX - rect.left) / rect.width) * 100, y: ((event.clientY - rect.top) / rect.height) * 100 });
  };

  const onTabKey = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = items.length - 1;
    const next =
      event.key === "ArrowRight" || event.key === "ArrowDown" ? (index === last ? 0 : index + 1)
      : event.key === "ArrowLeft" || event.key === "ArrowUp" ? (index === 0 ? last : index - 1)
      : event.key === "Home" ? 0
      : event.key === "End" ? last
      : -1;
    if (next < 0) return;
    event.preventDefault();
    setSelected(next);
    tabs.current[next]?.focus();
  };

  return (
    <section id={id} aria-labelledby={`${id}-h`} data-parallax-skip className="tone-dark relative bg-night py-[clamp(5rem,12vh,9rem)]">
      <div
        className={cn(
          "gutter grid gap-12 lg:items-center lg:gap-16",
          flip ? "lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]" : "lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]",
        )}
      >
        <div className={cn(flip && "lg:order-2")}>
          <Label>{copy.label}</Label>
          <Headline id={`${id}-h`} className="mt-4" inscription={copy.inscription} voice={copy.voice} />
          <p className="t-story mt-6 max-w-xl text-lede text-sand">{copy.body}</p>

          {items.length > 1 ? (
            <>
              <div role="tablist" aria-label={copy.tablist ?? copy.label} className="mt-10 grid gap-x-6 sm:grid-cols-3 lg:grid-cols-1">
                {items.map((item, index) => {
                  const active = index === selected;
                  return (
                    <button
                      key={item.id}
                      ref={(el) => {
                        tabs.current[index] = el;
                      }}
                      type="button"
                      role="tab"
                      id={`${id}-tab-${item.id}`}
                      aria-selected={active}
                      aria-controls={`${id}-panel`}
                      tabIndex={active ? 0 : -1}
                      onClick={() => setSelected(index)}
                      onKeyDown={(event) => onTabKey(event, index)}
                      className={cn(
                        "border-t-2 py-4 text-left transition-colors duration-300",
                        active ? "border-gold text-bone" : "border-line text-dust hover:border-brass hover:text-sand",
                      )}
                    >
                      <span className="t-voice block text-[clamp(1.4rem,2.2vw,1.9rem)] leading-tight">{item.name}</span>
                      <span className="t-ui mt-1 block text-sm">{item.coat}</span>
                    </button>
                  );
                })}
              </div>
              <div id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-tab-${horse.id}`} className="mt-4 border-t border-line pt-4">
                {copy.sample ? <p className="label text-brass">{copy.sample}</p> : null}
                {horse.character ? <p className="t-story mt-2 italic text-bone">{horse.character}</p> : null}
              </div>
            </>
          ) : horse.caption ? (
            <p className="t-story mt-10 border-t border-line pt-4 italic text-bone">{horse.caption}</p>
          ) : null}

          <p className="label mt-8 text-brass" id={`${id}-hint`}>
            <span className="[@media(hover:none)]:hidden">{copy.hintPointer}</span>
            <span className="hidden [@media(hover:none)]:inline">{copy.hintTouch}</span>
          </p>
          <p className="t-ui mt-2 text-sm text-dust">{supported || capabilities === null ? copy.hintKeys : copy.unsupported}</p>
          <p className="t-ui mt-1 text-xs text-dust">{copy.note}</p>
        </div>

        <div
          ref={stageRef}
          role="group"
          aria-label={copy.stageLabel}
          aria-describedby={`${id}-hint`}
          tabIndex={0}
          onKeyDown={onStageKey}
          onPointerMove={onStagePointer}
          className={cn("relative aspect-[4/5] max-h-[82svh] w-full touch-pan-y overflow-hidden bg-night focus-visible:outline-offset-4", flip && "lg:order-1")}
        >
          {/* The photograph holds the frame until the relit stage is drawing (and stays, dimmed under a glow, where 3D cannot run). */}
          <Image
            key={horse.id}
            src={horse.image}
            alt={horse.alt}
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className={cn("object-cover object-center transition-opacity duration-700", ready && supported ? "opacity-0" : supported ? "opacity-60" : "opacity-100")}
          />
          {!supported && capabilities !== null ? (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{ background: `radial-gradient(circle at ${glow.x}% ${glow.y}%, transparent 0%, color-mix(in oklab, var(--color-night) 55%, transparent) 22%, var(--color-night) 62%)` }}
            />
          ) : null}
          {near && supported && capabilities ? (
            <div className="absolute inset-0" aria-hidden>
              <ErrorBoundary fallback={null} onError={onError}>
                <RelightStage
                  image={horse.image}
                  depth={horse.depth}
                  input={input}
                  quality={quality}
                  reduced={reduced}
                  visible={onScreen}
                  preset={preset}
                  onReady={onReady}
                  onError={onError}
                />
              </ErrorBoundary>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
