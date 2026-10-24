"use client";

import { useEffect, useRef } from "react";
import { playEffect } from "@/lib/audio/engine";

/** Invisible marker. Plays the stallion breath once, the first time it scrolls into view, if sound is on. */
export function BreathCue({ className }: { className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          playEffect("breath", 0.45);
          io.disconnect();
        }
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <span ref={ref} aria-hidden className={className ?? "pointer-events-none block h-px w-full"} />;
}
