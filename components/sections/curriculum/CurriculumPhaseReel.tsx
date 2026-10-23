"use client";

import React from "react";

const FILM_URL = "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260922_195107_ed3f055a-3a13-4a71-b743-e10310454246.mp4";

export function CurriculumPhaseReel() {
  return (
    <section
      aria-label="The Eye of the Sovereign · Four Phases of the Saddle"
      className="relative w-full overflow-hidden bg-[#0A0908] tone-dark border-y border-line/30"
    >
      <div className="relative aspect-[16/9] lg:aspect-[21/9] w-full min-h-[480px] lg:min-h-[640px] overflow-hidden">
        <video
          src={FILM_URL}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="h-full w-full object-cover"
        />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-night via-night/35 to-transparent pointer-events-none" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-night/40 via-transparent to-transparent pointer-events-none" />

        <div className="gutter absolute inset-0 flex flex-col justify-end pb-10 sm:pb-16 z-10 pointer-events-auto">
          <div className="max-w-2xl">
            <span className="font-mono text-[0.68rem] uppercase tracking-[0.22em] text-gold font-bold block mb-2">
              Phase Progression · Cinema Reel
            </span>
            <h2 className="t-voice text-3xl sm:text-4xl lg:text-5xl text-bone font-light tracking-tight m-0 [text-shadow:0_3px_15px_rgba(0,0,0,0.85)]">
              The Eye of the Sovereign Stallion
            </h2>
            <p className="t-story mt-3 max-w-xl text-sand/90 text-sm sm:text-base leading-relaxed">
              Before a cadet touches the rein, they must read the ear and the eye. Thirteen sovereign pillars mastered across four tactical phases.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
