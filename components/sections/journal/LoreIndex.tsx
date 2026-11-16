"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const ROMAN = ["I", "II", "III", "IV"];

/**
 * The four-part index of The Traditional Lore. It sticks under the site bar while the chapters scroll past and marks the
 * chapter in view. Plain anchor links, so it works without JavaScript; on phones it scrolls sideways instead of wrapping.
 * 17 Nov 2026 (owner: text showed around it on scroll): a solid ground; when the site bar hides it moves up to the top edge
 * (`.lore-index` in globals.css, keyed on html[data-nav-hidden]) so no strip of page shows above it; and app/journal/page.tsx
 * wraps it with the four chapters, so it stops sticking after chapter IV instead of riding over the vow.
 */
export function LoreIndex({ chapters }: { chapters: { id: string; name: string }[] }) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    // The chapter that holds the line 40% down the viewport is "here"; above the first chapter, none is.
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = window.innerHeight * 0.4;
      const here = chapters.find((c) => {
        const box = document.getElementById(c.id)?.getBoundingClientRect();
        return box ? box.top <= line && box.bottom > line : false;
      });
      setActive(here?.id ?? null);
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); cancelAnimationFrame(frame); };
  }, [chapters]);

  return (
    <nav aria-label="The four parts of the lore" className="lore-index sticky top-16 z-30 border-y border-line bg-night md:top-20">
      <ol className="no-scrollbar gutter flex gap-x-8 overflow-x-auto md:justify-between md:gap-x-6">
        {chapters.map((c, i) => {
          const on = active === c.id;
          return (
            <li key={c.id} className="shrink-0">
              <a
                href={`#${c.id}`}
                aria-current={on ? "location" : undefined}
                className={cn(
                  "group flex min-h-14 items-center gap-3 border-b-2 py-3 transition-colors duration-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-gold",
                  on ? "border-gold" : "border-transparent",
                )}
              >
                <span className={cn("font-mono text-[0.65rem] tracking-[0.14em]", on ? "text-gold" : "text-dust")}>{ROMAN[i]}</span>
                <span className={cn("t-ui whitespace-nowrap text-[0.95rem] transition-colors", on ? "text-bone" : "text-sand group-hover:text-bone")}>{c.name}</span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
