"use client";

import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { useLenis } from "lenis/react";
import { useEffect, useRef, useState } from "react";
import { CrestMark } from "@/components/brand/CrestMark";
import { Wordmark } from "@/components/brand/Wordmark";
import { SoundToggle } from "@/components/site/SoundToggle";
import { AnimatedMenuText } from "@/components/ui/animated-menu";
import { acts, corridors, isConsolePath, navCta, navSearch, primaryNav, reels, tools, type Act } from "@/lib/content/site";
import { ease } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";
import nav from "./SiteNav.module.css";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Global navigation. Hides while scrolling down, returns on the way up.
 */
export function SiteNav() {
  // The staff console has its own header (app/admin/AdminShell.tsx); the film's bar and reels menu stay on the public site.
  if (isConsolePath(usePathname())) return null;
  return <PublicNav />;
}

function PublicNav() {
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setHidden(y > 240 && y > prev && !open);
  });

  return (
    <>
      <motion.header
        className="no-print fixed inset-x-0 top-0 z-[60]"
        animate={{ y: hidden ? "-110%" : "0%" }}
        transition={{ duration: 0.6, ease: ease.citadel }}
      >
        {/* 14 Nov 2026 (owner's reference). Heights are unchanged so no page's top clearance moves: phones 64 px (the strip is
            hidden), from 768 px a 24 px wine strip over a 56 px bar = 80 px. */}
        <div className={cn(nav.strip, nav.stripLine, "hidden h-6 items-center md:flex")}>
          <div className="gutter relative flex w-full items-center justify-center">
            <p className="t-inscribe whitespace-nowrap text-[0.6rem] leading-none tracking-[0.28em] min-[75rem]:text-[0.66rem] min-[85rem]:text-[0.72rem] min-[85rem]:tracking-[0.3em]">
              Interscholastic Cavalry Heritage <span aria-hidden className="mx-[0.9em] text-antique">•</span> Stoic Leadership{" "}
              <span aria-hidden className="mx-[0.9em] text-antique">•</span> Discipline
            </p>
            <p className="t-story absolute right-[max(16px,4vw)] hidden whitespace-nowrap text-[0.78rem] leading-none text-offwhite/85 min-[1180px]:block">
              Hyderabad <span aria-hidden className="mx-1 opacity-60">|</span> 2026
            </p>
          </div>
        </div>
        <div className="border-b border-copper/30 bg-night">
          <div className="gutter flex h-16 items-center gap-3 md:h-14 md:gap-5">
            <Link href="/" className="flex shrink-0 items-center gap-2.5 md:gap-3" aria-label="The Black Stallion Academy of Horsemanship, home">
              <CrestMark className="h-10 w-10 md:h-10 md:w-10" decorative />
              <Wordmark layout="bold" className="hidden min-[340px]:inline-flex" />
            </Link>

            <span aria-hidden className="mx-1 hidden h-8 w-px shrink-0 bg-copper/35 min-[75rem]:block xl:mx-3" />

            <nav aria-label="Primary" className="hidden min-w-0 flex-1 items-center justify-evenly min-[75rem]:flex">
              {primaryNav.map((l) => {
                const here = pathname === l.href || pathname.startsWith(`${l.href}/`);
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    aria-current={here ? "page" : undefined}
                    className={cn(
                      nav.link,
                      "t-story flex h-14 items-center whitespace-nowrap px-1 text-[1.02rem] leading-none text-bone transition-colors hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-gold min-[85rem]:text-[1.1rem]",
                    )}
                  >
                    {l.label}
                  </Link>
                );
              })}
            </nav>
            <div className="min-w-0 flex-1 min-[75rem]:hidden" />

            <span aria-hidden className="mx-1 hidden h-8 w-px shrink-0 bg-copper/35 min-[75rem]:block xl:mx-3" />

            <div className="flex shrink-0 items-center gap-0.5 sm:gap-1.5">
              <Link
                href={navSearch.href}
                aria-label={navSearch.label}
                title={navSearch.label}
                className="hidden h-11 w-11 place-items-center text-bone transition-colors hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold md:grid"
              >
                <Search size={19} strokeWidth={1.6} aria-hidden />
              </Link>
              <SoundToggle variant="editorial" />
              <Link
                href={navCta.href}
                className={cn(
                  nav.enrol,
                  "t-story ml-1 hidden items-center gap-2 whitespace-nowrap px-4 py-2.5 text-[1rem] leading-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold md:inline-flex xl:px-5",
                )}
              >
                Enrol a Cadet
                <ArrowRight size={16} strokeWidth={1.6} aria-hidden />
              </Link>
              <button
                type="button"
                onClick={() => setOpen(true)}
                aria-expanded={open}
                aria-controls="site-menu"
                aria-label="Reels: all pages"
                className="grid h-11 w-11 place-items-center text-bone transition-colors hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
              >
                <span aria-hidden className="flex flex-col gap-[5px]">
                  <span className="block h-px w-6 bg-current" />
                  <span className="block h-px w-4 self-end bg-current" />
                </span>
              </button>
            </div>
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
      data-lenis-prevent
      className="tone-light no-print fixed inset-0 z-[80] overflow-y-auto overscroll-contain bg-umber"
      initial={{ clipPath: "inset(0 0 100% 0)" }}
      animate={{ clipPath: "inset(0 0 0% 0)" }}
      exit={{ clipPath: "inset(0 0 100% 0)" }}
      transition={{ duration: 0.8, ease: ease.inOut }}
    >
      <div className="gutter flex h-16 items-center justify-between gap-6 md:h-20">
        <Link href="/" onClick={onClose} className="flex items-center gap-3" aria-label="The Black Stallion Academy of Horsemanship, home">
          <CrestMark className="h-[3.25rem] w-[3.25rem] md:h-[3.75rem] md:w-[3.75rem]" decorative />
          <Wordmark layout="inline" />
        </Link>
        <Link href="/about" onClick={onClose} className="label hidden text-dust transition-colors hover:text-bone sm:inline">
          [ About the academy ]
        </Link>
        <button ref={closeRef} type="button" onClick={onClose} className="label px-2 py-2.5 text-bone hover:text-gold">
          Close ✕
        </button>
      </div>

      {/* Below 1200 px the header bar has no room for the five links, so they lead the menu. */}
      <nav aria-label="Primary" className="gutter pt-4 min-[75rem]:hidden">
        <ul className="grid grid-cols-2 gap-x-6 sm:grid-cols-3">
          {[...primaryNav, { label: "Search", href: navSearch.href }].map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                onClick={onClose}
                aria-current={pathname === l.href || pathname.startsWith(`${l.href}/`) ? "page" : undefined}
                className="t-story flex min-h-12 items-center justify-between border-b border-line text-[1.25rem] text-bone transition-colors hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold aria-[current=page]:text-gold"
              >
                {l.label}
                <ArrowRight size={16} strokeWidth={1.5} aria-hidden className="text-copper" />
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* The reels in their three acts, side by side (the original structure; the parchment ground and the colours are the 31 Oct ones). */}
      <div className="gutter grid gap-12 pb-12 pt-6 md:grid-cols-3 md:gap-10 md:pt-12">
        {(Object.keys(acts) as Act[]).map((act, col) => (
          <motion.div
            key={act}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: ease.citadel, delay: 0.25 + col * 0.08 }}
          >
            <p className="label border-b border-line pb-3 text-brass">
              Act {acts[act].numeral} · {acts[act].name}
            </p>
            <ul className="mt-4">
              {byAct(act).map((r) => {
                const isStatueLink = r.href === "/statue";
                const active = pathname === r.href || pathname.startsWith(`${r.href}/`) || (isStatueLink && pathname === "/lithos");
                return (
                  <li key={r.href}>
                    <ReelLink href={r.href} onClose={onClose} active={active} n={r.n} title={r.title}>
                      {isStatueLink && (
                        // From 1280 px only: in the narrower three-column menu it ran into the next column.
                        <span className="hidden rounded-full border border-gold/50 bg-gold/15 px-2.5 py-0.5 font-mono text-[0.62rem] uppercase tracking-widest text-gold transition-colors group-hover:bg-gold group-hover:text-night xl:inline-block">
                          3D Model
                        </span>
                      )}
                    </ReelLink>
                  </li>
                );
              })}
              {tools.filter((t) => t.act === act).map((t) => (
                <li key={t.href}>
                  <ReelLink href={t.href} onClose={onClose} active={pathname === t.href} n={t.n} title={t.title}>
                    <span className="hidden rounded-full border border-gold/50 bg-gold/15 px-2.5 py-0.5 font-mono text-[0.62rem] uppercase tracking-widest text-gold transition-colors group-hover:bg-gold group-hover:text-night xl:inline-block">
                      {t.badge}
                    </span>
                  </ReelLink>
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>

      {/* Contacts stay stacked until 1280 px: in one row they ran past the dialog at 768 and 1024 px. */}
      <div className="gutter flex flex-col gap-6 border-t border-line py-8 xl:flex-row xl:items-center xl:justify-between">
        <ul className="flex flex-col gap-2 xl:flex-row xl:flex-wrap xl:gap-x-8">
          {corridors.map((c) => (
            <li key={c.id} className="t-ui text-sm text-sand">
              <span className="label mr-2 text-dust">{c.title}</span>
              <a className="hover:text-gold" href={`mailto:${c.email}`}>
                {c.email}
              </a>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
          <Link href="/admin/login" onClick={onClose} className="label text-dust hover:text-bone">
            Staff sign-in
          </Link>
          <Link href={navCta.href} onClick={onClose} className="label text-gold hover:text-bone">
            {navCta.label} →
          </Link>
        </div>
      </div>

      <p aria-hidden className="t-inscribe mt-4 select-none overflow-hidden whitespace-nowrap px-[1vw] text-center text-[16.5vw] leading-[0.78] tracking-[-0.02em] text-bone">
        Chapters
      </p>
    </motion.div>
  );
}

/** One row of the reels menu: the title rolls letter by letter on hover and on keyboard focus. */
function ReelLink({ href, onClose, active, n, title, children }: { href: string; onClose: () => void; active: boolean; n: number; title: string; children?: React.ReactNode }) {
  const [hot, setHot] = useState(false);
  return (
    <Link
      href={href}
      onClick={onClose}
      aria-current={active ? "page" : undefined}
      onMouseEnter={() => setHot(true)}
      onMouseLeave={() => setHot(false)}
      onFocus={() => setHot(true)}
      onBlur={() => setHot(false)}
      className="group flex items-center justify-between gap-4 border-b border-line py-3"
    >
      <div className="flex items-baseline gap-4">
        <span className="font-mono text-xs text-gold/80">{pad(n)}</span>
        <AnimatedMenuText
          center
          active={hot}
          className={cn("t-voice text-[clamp(1.35rem,2.4vw,2rem)] transition-colors group-hover:text-gold group-focus-visible:text-gold", active ? "text-gold" : "text-bone")}
        >
          {title}
        </AnimatedMenuText>
      </div>
      {children}
    </Link>
  );
}
