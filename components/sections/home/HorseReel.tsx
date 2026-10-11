"use client";

import { useEffect, useRef, useState } from "react";
import { FilmImage } from "@/components/film/FilmImage";
import { Headline } from "@/components/film/Headline";
import { Label } from "@/components/film/Marks";
import { heroVideo, LOCAL_MEDIA } from "@/lib/content/media";

/**
 * The stallion that used to open the page, now its own scene right after the opening film.
 * Photograph + loop (placeholder art until the real footage exists). Reduced motion: still image only.
 */
export function HorseReel() {
  const ref = useRef<HTMLVideoElement>(null);
  const [ok, setOk] = useState(false);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    ref.current?.play().catch(() => {});
  }, []);
  return (
    <section aria-labelledby="horse-h" className="relative min-h-[80svh] overflow-hidden">
      <FilmImage name="heroDust" />
      <video
        ref={ref}
        className="absolute inset-0 h-full w-full object-cover transition-opacity duration-[1600ms] motion-reduce:hidden"
        style={{ opacity: ok ? 0.9 : 0, objectPosition: "62% 45%" }}
        src={LOCAL_MEDIA ? heroVideo.file : heroVideo.remote}
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden
        onCanPlay={() => setOk(true)}
      />
      <div aria-hidden className="absolute inset-0 shade-b" />
      <div aria-hidden className="absolute inset-0 shade-l opacity-70" />
      <div className="gutter relative flex min-h-[80svh] flex-col justify-end pb-[10vh]">
        <Label>The Marwari</Label>
        <Headline id="horse-h" as="h2" className="mt-4" inscription="Black as the night it rides out of," voice="calm as a king." />
      </div>
    </section>
  );
}
