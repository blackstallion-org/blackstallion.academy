"use client";

import Image from "next/image";
import { motion, type MotionValue } from "motion/react";
import { useState } from "react";
import { media, type MediaKey } from "@/lib/content/film";
import { cn } from "@/lib/utils";

export const LOCAL_MEDIA = process.env.NEXT_PUBLIC_LOCAL_MEDIA === "1";

type FilmImageProps = {
  name: MediaKey;
  /** Scroll-driven transforms from the chapter. */
  scale?: MotionValue<number> | number;
  y?: MotionValue<string> | string;
  x?: MotionValue<string> | string;
  opacity?: MotionValue<number> | number;
  filter?: MotionValue<string> | string;
  clipPath?: MotionValue<string> | string;
  priority?: boolean;
  /** "screen" for dust layers shot on black. */
  blend?: "normal" | "screen";
  position?: string;
  className?: string;
};

/**
 * A full-bleed photograph. A graded gradient sits underneath, so the frame
 * still reads as a film still before the file exists or while it loads.
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
  position = "50% 50%",
  className,
}: FilmImageProps) {
  const [state, setState] = useState<"loading" | "ok" | "missing">("loading");
  // Until the files are fetched into public/media (sh scripts/fetch-media.sh, then set
  // NEXT_PUBLIC_LOCAL_MEDIA=1 in .env.local), the browser loads Higgsfield's CDN copy directly.
  const useRemote = !LOCAL_MEDIA;
  const item = media[name];
  const isLayer = blend === "screen";

  return (
    <motion.div
      aria-hidden={isLayer || undefined}
      className={cn("absolute inset-0 overflow-hidden", !isLayer && "film-placeholder", className)}
      style={{ opacity, clipPath, mixBlendMode: isLayer ? "screen" : undefined }}
    >
      {state !== "missing" && (
        <motion.div className="absolute -inset-[6%] will-change-transform" style={{ scale, y, x, filter }}>
          <Image
            src={useRemote ? item.remote : item.src}
            unoptimized={useRemote}
            alt={isLayer ? "" : item.alt}
            fill
            sizes="100vw"
            quality={80}
            priority={priority}
            onLoad={() => setState("ok")}
            onError={() => setState("missing")}
            className={cn(
              "object-cover transition-opacity duration-[1400ms] ease-[var(--ease-film)]",
              state === "ok" ? "opacity-100" : "opacity-0",
            )}
            style={{ objectPosition: position }}
          />
        </motion.div>
      )}
    </motion.div>
  );
}
