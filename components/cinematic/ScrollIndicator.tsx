"use client";

import { useLenis } from "lenis/react";
import { cn } from "@/lib/utils";

/**
 * The restrained "continue" cue at the foot of a cinematic opening.
 * A real button: it scrolls to `target` (an element id) with Lenis when it runs, natively otherwise.
 */
export function ScrollIndicator({ target, label = "Scroll", className }: { target: string; label?: string; className?: string }) {
  const lenis = useLenis();
  const go = () => {
    const el = document.getElementById(target);
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { offset: 0 });
    else el.scrollIntoView({ behavior: "smooth" });
  };
  return (
    <button
      type="button"
      onClick={go}
      className={cn("group flex flex-col items-center gap-2 text-sand transition-colors hover:text-gold focus-visible:text-gold", className)}
    >
      <span className="font-mono text-[0.65rem] uppercase tracking-[0.22em]">{label}</span>
      <span aria-hidden className="relative block h-9 w-px overflow-hidden bg-line">
        <span className="absolute inset-x-0 top-0 h-1/2 bg-gold motion-safe:animate-[cue_2.4s_var(--ease-citadel)_infinite]" />
      </span>
    </button>
  );
}
