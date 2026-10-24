"use client";

import Image from "next/image";
import { useState } from "react";
import { BlueprintPlan } from "./BlueprintPlan";
import { tierById, type TierId } from "@/lib/content/schools";

/** Retain the supplied thumbnail; reuse the existing plan if that image cannot decode. */
export function CitadelHubImage({ src, alt, tier }: { src: string; alt: string; tier: TierId }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <div role="img" aria-label={`${alt}: illustrative site plan`} className="pointer-events-none h-full w-full bg-[#EFE7D6]"><BlueprintPlan tier={tierById(tier)} /></div>;
  return <Image src={src} alt={alt} width={320} height={192} onError={() => setFailed(true)} className="h-full w-full object-cover transition-transform duration-500 hover:scale-105" />;
}
