"use client";

import Image from "next/image";
import { motion, type MotionValue } from "motion/react";
import { useState } from "react";
import { LOCAL_MEDIA, media, mediaSrc, type MediaKey } from "@/lib/content/media";
import { cn } from "@/lib/utils";

type FilmImageProps = {
  name: MediaKey;
  /** Scroll-driven transforms. */
  scale?: MotionValue<number> | number;
  y?: MotionValue<string> | string;
  x?: MotionValue<string> | string;
  opacity?: MotionValue<number> | number;
  filter?: MotionValue<string> | string;
  clipPath?: MotionValue<string> | string;
  priority?: boolean;
  /** "screen" for dust layers shot on black. */
  blend?: "normal" | "screen";
  /** Overrides the manifest focus (CSS object-position). */
  position?: string;
  /** Extra bleed so parallax never shows an edge. */
  bleed?: boolean;
  sizes?: string;
  /** Unifies the AI stills into one graded look. "film" is a light warm grade; "deep" holds text; "cold" is for the crisis frame. */
  grade?: "film" | "deep" | "cold" | "mono" | "none";
  className?: string;
  imgClassName?: string;
};

/* Grades are CSS variables (app/globals.css) so a still is lighter on ivory pages and
   keeps its darker film grade inside `.tone-dark` scenes. */
const grades = {
  film: "[filter:var(--grade-film)]",
  deep: "[filter:var(--grade-deep)]",
  cold: "[filter:var(--grade-cold)]",
  mono: "[filter:var(--grade-mono)]",
  none: "",
} as const;

/**
 * A photograph that fills its (positioned) parent. A graded gradient sits
 * underneath, so the frame still reads as a film still before the file exists.
 */
export function FilmImage({
  name,
  scale = 1,
  y = "0%",
  x = "0%",
  opacity = 1,
  filter,
  clipPath,
  priority = false,
  blend = "normal",
  position,
  bleed = false,
  sizes = "100vw",
  grade = "none",
  className,
  imgClassName,
}: FilmImageProps) {
  const [state, setState] = useState<"loading" | "ok" | "missing">("loading");
  const item = media[name];
  const src = mediaSrc(name);
  const isLayer = blend === "screen";

  return (
    <motion.div
      aria-hidden={isLayer || undefined}
      className={cn("absolute inset-0 overflow-hidden", !isLayer && "film-placeholder", className)}
      style={{ opacity, clipPath, mixBlendMode: isLayer ? "screen" : undefined }}
    >
      {src && state !== "missing" && (
        <motion.div
          className={cn("absolute will-change-transform", bleed ? "-inset-[7%]" : "inset-0")}
          style={{ scale, y, x, filter }}
        >
          <Image
            src={src}
            unoptimized={!LOCAL_MEDIA || /^https?:/.test(src)}
            alt={isLayer ? "" : (item?.alt ?? "")}
            fill
            sizes={sizes}
            quality={95}
            priority={priority}
            onLoad={() => setState("ok")}
            onError={() => setState("missing")}
            className={cn(
              "object-cover transition-opacity duration-200 ease-out opacity-100",
              !isLayer && grades[grade],
              imgClassName,
            )}
            style={{ objectPosition: position ?? item?.focus ?? "50% 50%" }}
          />
        </motion.div>
      )}
    </motion.div>
  );
}
