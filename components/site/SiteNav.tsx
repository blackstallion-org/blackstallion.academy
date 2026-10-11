"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { useLenis } from "lenis/react";
import { useEffect, useRef, useState } from "react";
import { Monogram } from "@/components/brand/Monogram";
import { Wordmark } from "@/components/brand/Wordmark";
import { SoundToggle } from "@/components/site/SoundToggle";
import { acts, corridors, navCta, primaryNav, reelFor, reels, TOTAL_REELS, type Act } from "@/lib/content/site";
import { ease } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Global navigation. Hides while scrolling down, returns on the way up.
 * The reel counter tells the visitor where they are in the film.
 */
export function SiteNav() {
  const pathname = usePathname();
  const reel = reelFor(pathname);
  const [hidden, setHidden] = useState(false);
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setSolid(y > 40);
    setHidden(y > 240 && y > prev && !open);
  });

  return (
    <>
      <motion.header
        className={cn(
          "no-print fixed inset-x-0 top-0 z-[60] transition-colors duration-500",
          solid ? "bg-gradient-to-b from-night/95 via-night/70 to-transparent" : "bg-transparent",
        )}
        animate={{ y: hidden ? "-110%" : "0%" }}
        transition={{ duration: 0.6, ease: ease.citadel }}
      >
        <div className="gutter flex h-16 items-center justify-between gap-6 md:h-20">
          <div className="flex min-w-0 items-center gap-4">
            <Link href="/" className="flex items-center gap-3" aria-label="Black Stallion Academy, home">
              <Monogram className="h-7 w-7" />
              <Wordmark layout="inline" className="hidden sm:inline" />
            </Link>
            {reel && (
              <span className="label hidden items-center gap-2 border-l border-line pl-4 text-dust lg:flex">
                <span className="font-mono tracking-[0.1em] text-gold">
                  {pad(reel.n)}/{TOTAL_REELS}
                </span>
                {reel.title}
              </span>
            )}
          </div>

          <nav aria-label="Primary" className="hidden xl:block">
            <ul className="flex items-center gap-8">
              {primaryNav.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn("label transition-colors hover:text-gold", active ? "text-gold" : "text-sand")}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex items-center gap-3">
            <SoundToggle />
            <Link
              href={navCta.href}
              className="label hidden border border-line/45 px-4 py-2.5 text-bone transition-colors hover:border-gold hover:text-gold md:inline-block"
            >
              {navCta.label}
            </Link>
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-expanded={open}
              aria-controls="site-menu"
              className="label flex items-center gap-3 px-2 py-2.5 text-bone hover:text-gold"
            >
              <span>Reels</span>
              <span aria-hidden className="flex flex-col gap-[5px]">
                <span className="block h-px w-6 bg-current" />
                <span className="block h-px w-4 self-end bg-current" />
              </span>
            </button>
          </div>
        </div>
      </motion.header>
      <AnimatePresence>{open && <Menu onClose={() => setOpen(false)} />}</AnimatePresence>
    </>
  );
}

function Menu({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();
  const lenis = useLenis();
  const panel = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    lenis?.stop();
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && panel.current) {
        const items = panel.current.querySelectorAll<HTMLElement>("a, button");
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
      lenis?.start();
      opener?.focus();
    };
  }, [lenis, onClose]);

  const byAct = (act: Act) => reels.filter((r) => r.act === act);

  return (
    <motion.div
      id="site-menu"
      ref={panel}
      role="dialog"
      aria-modal="true"
      aria-label="All reels"
      className="no-print fixed inset-0 z-[80] overflow-y-auto bg-night"
      initial={{ clipPath: "inset(0 0 100% 0)" }}
      animate={{ clipPath: "inset(0 0 0% 0)" }}
      exit={{ clipPath: "inset(0 0 100% 0)" }}
      transition={{ duration: 0.8, ease: ease.inOut }}
    >
      <div className="gutter flex h-16 items-center justify-between md:h-20">
        <Link href="/" onClick={onClose} className="flex items-center gap-3">
          <Monogram className="h-7 w-7" />
          <Wordmark layout="inline" />
        </Link>
        <button ref={closeRef} type="button" onClick={onClose} className="label px-2 py-2.5 text-bone hover:text-gold">
          Close ✕
        </button>
      </div>

      <div className="gutter grid gap-12 pb-16 pt-8 md:grid-cols-3 md:gap-10 md:pt-16">
        {(Object.keys(acts) as Act[]).map((act, col) => (
          <motion.div
            key={act}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: ease.citadel, delay: 0.25 + col * 0.08 }}
          >
            <p className="label border-b border-line pb-3 text-brass">
              Act {acts[act].numeral} · {acts[act].name} <span className="text-dust">· {acts[act].zone}</span>
            </p>
            <ul className="mt-4">
              {byAct(act).map((r) => {
                const active = pathname === r.href || pathname.startsWith(`${r.href}/`);
                return (
                  <li key={r.href}>
                    <Link
                      href={r.href}
                      onClick={onClose}
                      aria-current={active ? "page" : undefined}
                      className="group flex items-baseline gap-4 border-b border-line py-3"
                    >
                      <span className="font-mono text-xs text-gold/80">{pad(r.n)}</span>
                      <span
                        className={cn(
                          "t-voice text-[clamp(1.35rem,2.4vw,2rem)] leading-tight transition-colors group-hover:text-gold",
                          active ? "text-gold" : "text-bone",
                        )}
                      >
                        {r.title}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        ))}
      </div>

      <div className="gutter flex flex-col gap-6 border-t border-line py-8 md:flex-row md:items-center md:justify-between">
        <ul className="flex flex-col gap-2 md:flex-row md:gap-8">
          {corridors.map((c) => (
            <li key={c.id} className="t-ui text-sm text-sand">
              <span className="label mr-2 text-dust">{c.title}</span>
              <a className="hover:text-gold" href={`mailto:${c.email}`}>
                {c.email}
              </a>
            </li>
          ))}
        </ul>
        <div className="flex gap-6">
          <Link href="/about" onClick={onClose} className="label text-sand hover:text-gold">
            About
          </Link>
          <Link href={navCta.href} onClick={onClose} className="label text-gold hover:text-bone">
            {navCta.label} →
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
