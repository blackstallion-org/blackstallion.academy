"use client";

import { useState } from "react";
import { CowboyGuide, type GuideState } from "./CowboyGuide";
import { Terminal } from "./Terminal";

/** The information desk with its guide beside it (R21): the guide's pose follows what the desk is doing. */
export function GuideDesk({ chips }: { chips: string[] }) {
  const [state, setState] = useState<GuideState>("greeting");
  return (
    <div className="grid items-end gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,15rem)] lg:grid-cols-[minmax(0,1fr)_minmax(0,18rem)]">
      <Terminal variant="editorial" titleAs="h2" titleId="cmd-h" chips={chips} onStatus={setState} />
      {/* phones: a small figure that stays in the corner while the desk is on screen, so his reactions are seen while typing */}
      <div className="pointer-events-none sticky bottom-3 z-10 ml-auto w-24 md:bottom-6 md:ml-0 md:w-full">
        <CowboyGuide state={state} sizes="(min-width: 1024px) 18rem, (min-width: 768px) 15rem, 6rem" />
      </div>
    </div>
  );
}
