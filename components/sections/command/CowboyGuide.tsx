"use client";

import Image from "next/image";
import { asset } from "@/lib/content/asset";
import { cn } from "@/lib/utils";
import styles from "./CowboyGuide.module.css";

export type GuideState = "greeting" | "idle" | "listening" | "thinking" | "answering";

/**
 * The Command's guide (R21/R22, 2 Nov 2026): an original horseman in a wide-brim hat, drawn for the academy (Higgsfield
 * gpt_image_2_5, one character sheet and three poses made from it; see docs/claude-site-brief-2026-11-02/IMPLEMENTATION_LOG.md).
 * The owner's cartoon cowboy was direction only: this is not that character. He replaces the Spline robot and follows the desk:
 * he tips his hat on arrival, listens while a question is being typed, thinks while the answer is prepared and explains while it
 * comes in. The poses cross-fade; a slow breath keeps him alive in between. Reduced motion: the poses change without the breath.
 */
const POSES: Record<Exclude<GuideState, "idle">, { src: string; label: string }> = {
  greeting: { src: asset("/media/guide-greet.webp"), label: "tips his hat in greeting" },
  listening: { src: asset("/media/guide-listen.webp"), label: "is listening" },
  thinking: { src: asset("/media/guide-think.webp"), label: "is thinking" },
  answering: { src: asset("/media/guide-answer.webp"), label: "is answering" },
};
const ORDER = ["greeting", "listening", "thinking", "answering"] as const;

export function CowboyGuide({ state, className, sizes = "(min-width: 1024px) 30vw, 60vw", priority = false }: { state: GuideState; className?: string; sizes?: string; priority?: boolean }) {
  const pose = state === "idle" ? "listening" : state;
  return (
    <div
      role="img"
      aria-label={`The academy's guide, a horseman in a wide-brim hat, ${POSES[pose].label}.`}
      className={cn("relative aspect-[3/4]", styles.guide, state === "answering" && styles.speaking, className)}
    >
      {ORDER.map((key) => (
        <Image
          key={key}
          src={POSES[key].src}
          alt=""
          aria-hidden
          fill
          sizes={sizes}
          priority={priority && key === "greeting"}
          className={cn("object-contain object-bottom transition-opacity duration-300 ease-out motion-reduce:transition-none", key === pose ? "opacity-100" : "opacity-0")}
        />
      ))}
    </div>
  );
}
