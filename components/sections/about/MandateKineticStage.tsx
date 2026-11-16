"use client";

import { MaskedLineKineticStage } from "@/components/sections/shared/MaskedLineKineticStage";
import { creed } from "@/lib/content/creed";

/** The creed on /about; copy in lib/content/creed.ts (made lighter 17 Nov 2026). */
export function MandateKineticStage() {
  return (
    <MaskedLineKineticStage
      id="mandate-kinetic-stage"
      label={creed.label}
      headline={creed.headline}
      caption={creed.caption}
      boxes={creed.boxes.map((b) => ({ ...b }))}
      tone="dark"
    />
  );
}
