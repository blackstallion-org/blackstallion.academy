"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { PASSPORT_HREF, useStallionEnabled } from "@/components/hero/stallion-flags";

const StallionStage = dynamic(() => import("@/components/hero/StallionStage").then((m) => m.StallionStage), { ssr: false });

/**
 * The interactive stallion under the opening film. Shown only while it is under review (`?stallion=preview`)
 * or once NEXT_PUBLIC_STALLION_MODEL is set; without WebGL it falls back to a rendered still and a plain link.
 */
export function StallionHero() {
  const enabled = useStallionEnabled();
  const [failed, setFailed] = useState(false);
  if (!enabled) return null;
  return (
    <section aria-label="The Marwari stallion" className="tone-dark relative h-[100svh] min-h-[36rem] overflow-hidden bg-night pt-24 md:pt-28">
      <div className="gutter relative z-10 flex flex-wrap items-baseline justify-between gap-4">
        <p className="label text-brass">The Stallion · Kala Marwari</p>
        <p className="label text-dust">Move, tilt or drag. Click to open the passport.</p>
      </div>
      <div className="absolute inset-x-0 bottom-0 top-24 md:top-28">
        {failed ? (
          <Link href={PASSPORT_HREF} className="relative block h-full w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-gold">
            <Image src="/models/marwari-hero-poster.webp" alt="A black Marwari stallion with inward-curving ears." fill sizes="100vw" className="object-contain" />
            <span className="label absolute bottom-[8%] right-4 border border-line bg-night/70 px-3 py-2 text-sand sm:right-[6%]">Open the Sovereign Passport →</span>
          </Link>
        ) : (
          <StallionStage className="h-full w-full" onStatus={(s) => s === "failed" && setFailed(true)} />
        )}
      </div>
    </section>
  );
}
