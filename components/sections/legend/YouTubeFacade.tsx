"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

/**
 * A privacy-friendly YouTube embed: until the visitor presses play, the page shows our own still and makes no request to
 * YouTube. Pressing play swaps in the youtube-nocookie player and starts the film. No dependency, keyboard and screen-reader
 * friendly (a real <button>), and the 16:9 box never changes size, so nothing jumps.
 */
export function YouTubeFacade({ id, title, poster, posterAlt, caption }: { id: string; title: string; poster: string; posterAlt: string; caption: string }) {
  const [playing, setPlaying] = useState(false);
  const frame = useRef<HTMLIFrameElement>(null);
  // the Play button unmounts when the player arrives, so hand keyboard focus to the player instead of dropping it to <body>
  useEffect(() => {
    if (playing) frame.current?.focus();
  }, [playing]);
  return (
    <figure>
      <div className="tone-photo relative aspect-video w-full overflow-hidden bg-night">
        {playing ? (
          <iframe
            ref={frame}
            tabIndex={-1}
            className="absolute inset-0 h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`}
            title={title}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <button type="button" onClick={() => setPlaying(true)} className="group absolute inset-0 block h-full w-full text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-6px] focus-visible:outline-gold" aria-label={`Play the film: ${title}`}>
            <Image src={poster} alt={posterAlt} fill sizes="(min-width: 1024px) 60vw, 100vw" className="object-cover transition-transform duration-[1600ms] group-hover:scale-[1.03]" />
            <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-night/85 via-night/25 to-transparent" />
            <span aria-hidden className="absolute left-1/2 top-1/2 grid h-20 w-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-gold/70 bg-night/40 backdrop-blur-[2px] transition-colors duration-500 group-hover:bg-gold/90">
              <svg viewBox="0 0 24 24" className="ml-1 h-7 w-7 fill-bone transition-colors group-hover:fill-night" aria-hidden>
                <path d="M7 4.5v15l12.5-7.5z" />
              </svg>
            </span>
            <span className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-3 p-5 md:p-7">
              <span className="t-voice text-xl text-bone md:text-2xl">{title}</span>
              <span className="label text-sand">Play film · plays from YouTube</span>
            </span>
          </button>
        )}
      </div>
      <figcaption className="t-ui mt-3 text-sm text-dust">{caption}</figcaption>
    </figure>
  );
}
