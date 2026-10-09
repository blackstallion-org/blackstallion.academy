"use client";

import { useLenis } from "lenis/react";
import { useEffect, useState } from "react";
import { Monogram } from "@/components/brand/Monogram";
import { cn } from "@/lib/utils";

/** Minimal title bar: the mark, the name, and one way in. Fades back while you read. */
export function FilmNav() {
  const lenis = useLenis();
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setHidden(y > 120 && y > last);
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const go = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (lenis && el) lenis.scrollTo(el, { duration: 2.4 });
    else el?.scrollIntoView();
  };

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-[65] transition-[transform,opacity] duration-700 ease-[var(--ease-film)]",
        hidden ? "-translate-y-full opacity-0" : "translate-y-0 opacity-100",
      )}
    >
      <div className="flex items-center justify-between px-5 py-5 sm:px-10 sm:py-7">
        <a href="#prologue" onClick={go("prologue")} className="flex items-center gap-3" aria-label="Black Stallion Academy, back to the top">
          <Monogram className="h-7 w-7 text-brass" />
          <span className="label hidden text-[0.7rem] text-bone/90 sm:inline">Black Stallion Academy</span>
        </a>
        <a
          href="#contact"
          onClick={go("contact")}
          className="label group relative text-[0.72rem] text-bone transition-colors duration-300 hover:text-gold"
        >
          Enrol a cadet
          <span className="absolute -bottom-1.5 left-0 h-px w-full origin-left scale-x-50 bg-brass transition-transform duration-500 group-hover:scale-x-100" />
        </a>
      </div>
    </header>
  );
}
