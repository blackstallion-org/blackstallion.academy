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
  /** Unifies the AI stills into one graded look. "film" darkens and warms; "cold" is for the crisis frame. */
  grade?: "film" | "deep" | "cold" | "mono" | "none";
  className?: string;
  imgClassName?: string;
};

const grades = {
  film: "[filter:saturate(0.82)_brightness(0.8)_contrast(1.06)]",
  deep: "[filter:saturate(0.75)_brightness(0.6)_contrast(1.12)]",
  cold: "[filter:saturate(0.7)_brightness(0.82)_contrast(1.05)]",
  mono: "[filter:grayscale(1)_brightness(0.8)_contrast(1.1)]",
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
  grade = "film",
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
            unoptimized={!LOCAL_MEDIA}
            alt={isLayer ? "" : item.alt}
            fill
            sizes={sizes}
            quality={75}
            priority={priority}
            onLoad={() => setState("ok")}
            onError={() => setState("missing")}
            className={cn(
              "object-cover transition-opacity duration-[1400ms] ease-[var(--ease-film)]",
              state === "ok" ? "opacity-100" : "opacity-0",
              !isLayer && grades[grade],
              imgClassName,
            )}
            style={{ objectPosition: position ?? item.focus ?? "50% 50%" }}
          />
        </motion.div>
      )}
    </motion.div>
  );
}
