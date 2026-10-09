"use client";

import { useLenis } from "lenis/react";
import { useEffect, useState } from "react";
import { chapters } from "@/lib/content/film";
import { cn } from "@/lib/utils";

/** Fixed chapter progress rail (right edge, desktop) and a chapter counter (mobile). */
export function ChapterRail() {
  const [active, setActive] = useState(0);
  const lenis = useLenis();

  useEffect(() => {
    const sections = chapters.map((c) => document.getElementById(c.id)).filter(Boolean) as HTMLElement[];
    const onScroll = () => {
      const mid = window.innerHeight * 0.5;
      let idx = 0;
      sections.forEach((s, i) => {
        if (s.getBoundingClientRect().top <= mid) idx = i;
      });
      setActive(idx);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const go = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { duration: 2.2 });
    else el.scrollIntoView();
  };

  const current = chapters[active];

  return (
    <>
      <nav aria-label="Chapters" className="fixed right-5 top-1/2 z-[60] hidden -translate-y-1/2 lg:block">
        <ol className="flex flex-col items-end gap-4">
          {chapters.map((c, i) => (
            <li key={c.id}>
              <a
                href={`#${c.id}`}
                onClick={go(c.id)}
                aria-current={i === active ? "step" : undefined}
                className="group flex items-center gap-3"
              >
                <span
                  className={cn(
                    "label text-[0.68rem] transition-all duration-500",
                    i === active ? "text-gold opacity-100" : "text-sand/0 group-hover:text-sand/80",
                  )}
                >
                  {c.numeral && <span className="mr-2 font-mono tracking-normal">{c.numeral}</span>}
                  {c.label}
                </span>
                <span
                  className={cn(
                    "block h-px transition-all duration-700 ease-[var(--ease-film)]",
                    i === active ? "w-10 bg-gold" : i < active ? "w-4 bg-brass/70" : "w-4 bg-sand/30",
                  )}
                />
              </a>
            </li>
          ))}
        </ol>
      </nav>
      <p
        aria-live="polite"
        className="label fixed bottom-5 left-5 z-[60] text-[0.68rem] text-sand/80 lg:hidden"
      >
        {current.numeral ? `${current.numeral} · ` : ""}
        {current.label}
      </p>
    </>
  );
}
