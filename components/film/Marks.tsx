import Link from "next/link";
import type { ReactNode } from "react";
import { acts, TOTAL_REELS, type Act } from "@/lib/content/site";
import { cn } from "@/lib/utils";

const pad = (n: number) => String(n).padStart(2, "0");

/** "REEL 05 / 15 · ACT II · THE CITADEL" */
export function ReelMark({ n, act, className }: { n: number; act: Act; className?: string }) {
  return (
    <p className={cn("label flex flex-wrap items-center gap-x-3 gap-y-1 text-brass", className)}>
      <span className="font-mono text-[0.7rem] tracking-[0.12em] text-gold">
        REEL {pad(n)} / {TOTAL_REELS}
      </span>
      <span aria-hidden className="h-px w-6 bg-brass/60" />
      <span>
        Act {acts[act].numeral} · {acts[act].name}
      </span>
    </p>
  );
}

/** Small section label. With `reel`, prefixes "REEL 05 ·". */
export function Label({ children, reel, className }: { children: ReactNode; reel?: number; className?: string }) {
  return (
    <p className={cn("label text-brass", className)}>
      {reel !== undefined && <span className="mr-2 font-mono tracking-[0.12em] text-gold/90">REEL {pad(reel)} ·</span>}
      {children}
    </p>
  );
}

type CtaProps = {
  href: string;
  children: ReactNode;
  variant?: "solid" | "ghost" | "link";
  className?: string;
};

/** Calls to action. Solid for the one action that matters, ghost for the second, link inside copy. */
export function Cta({ href, children, variant = "ghost", className }: CtaProps) {
  const base = "label group inline-flex items-center gap-3 transition-colors duration-300";
  const styles = {
    solid: "bg-gold px-6 py-4 text-night hover:bg-bone",
    ghost: "border border-brass/45 px-6 py-4 text-bone hover:border-gold hover:text-gold",
    link: "text-gold hover:text-bone",
  }[variant];
  return (
    <Link href={href} className={cn(base, styles, className)}>
      <span>{children}</span>
      <Arrow className="transition-transform duration-500 ease-[var(--ease-citadel)] group-hover:translate-x-1" />
    </Link>
  );
}

export function Arrow({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 10" className={cn("h-2.5 w-6", className)} aria-hidden fill="none" stroke="currentColor" strokeWidth="1.2">
      <path d="M0 5h22M18 1l4 4-4 4" />
    </svg>
  );
}

/** The section divider: a hairline with a lance tip and a horseshoe seal. */
export function LanceRule({ className, label }: { className?: string; label?: string }) {
  return (
    <div className={cn("flex items-center gap-4 text-brass", className)} role="separator">
      <svg viewBox="0 0 40 10" className="h-2.5 w-10 shrink-0" aria-hidden fill="currentColor">
        <path d="M0 5 L10 2 L40 4.6 L40 5.4 L10 8 Z" />
      </svg>
      <span className="hairline flex-1" />
      {label ? <span className="label whitespace-nowrap">{label}</span> : <Horseshoe />}
      <span className="hairline flex-1" />
      <svg viewBox="0 0 40 10" className="h-2.5 w-10 shrink-0 rotate-180" aria-hidden fill="currentColor">
        <path d="M0 5 L10 2 L40 4.6 L40 5.4 L10 8 Z" />
      </svg>
    </div>
  );
}

export function Horseshoe({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("h-5 w-5 shrink-0", className)} aria-hidden fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M6 20 C3 15 3 7 8 4.5 C10.5 3.2 13.5 3.2 16 4.5 C21 7 21 15 18 20" strokeLinecap="round" />
      <circle cx="6.3" cy="13" r="0.8" fill="currentColor" />
      <circle cx="17.7" cy="13" r="0.8" fill="currentColor" />
      <circle cx="8" cy="7.5" r="0.8" fill="currentColor" />
      <circle cx="16" cy="7.5" r="0.8" fill="currentColor" />
    </svg>
  );
}

/** Hoofprint, used as a bullet. */
export function Hoof({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={cn("h-4 w-4 shrink-0", className)} aria-hidden fill="currentColor">
      <path d="M10 2.5c-4 0-6.5 3.4-6.5 7.4 0 3.3 1.6 6 3.4 7.6.5.4 1.2 0 1.1-.6l-.4-3.4c-.1-.9.6-1.6 1.5-1.6h1.8c.9 0 1.6.7 1.5 1.6l-.4 3.4c-.1.6.6 1 1.1.6 1.8-1.6 3.4-4.3 3.4-7.6 0-4-2.5-7.4-6.5-7.4Zm0 3.2c1.6 0 2.6 1.3 2.6 2.9 0 .7-.6 1.2-1.3 1.2H8.7c-.7 0-1.3-.5-1.3-1.2 0-1.6 1-2.9 2.6-2.9Z" />
    </svg>
  );
}

/** Status dot used in registries. */
export function StatusDot({ status, className }: { status: "rest" | "arena" | "feed" | "live"; className?: string }) {
  const color = { rest: "bg-[#6f9a6a]", arena: "bg-gold", feed: "bg-brass", live: "bg-blood" }[status];
  return (
    <span className={cn("relative inline-flex h-2 w-2", className)} aria-hidden>
      <span className={cn("absolute inset-0 rounded-full animate-pulse-ring", color)} />
      <span className={cn("relative h-2 w-2 rounded-full", color)} />
    </span>
  );
}
