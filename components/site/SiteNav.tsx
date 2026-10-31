"use client";

import Link from "next/link";
import { UserRound } from "lucide-react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { useLenis } from "lenis/react";
import { useEffect, useRef, useState } from "react";
import { CrestMark } from "@/components/brand/CrestMark";
import { Wordmark } from "@/components/brand/Wordmark";
import { SoundToggle } from "@/components/site/SoundToggle";
import { AnimatedMenuText } from "@/components/ui/animated-menu";
import { CrowdCanvas } from "@/components/motion/CrowdCanvas";
import { acts, corridors, isConsolePath, navCta, primaryNav, reelFor, reels, TOTAL_REELS, type Act } from "@/lib/content/site";
import { ease } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Global navigation. Hides while scrolling down, returns on the way up.
 * The reel counter tells the visitor where they are in the film.
 */
export function SiteNav() {
  // The staff console has its own header (app/admin/AdminShell.tsx); the film's bar and reels menu stay on the public site.
  if (isConsolePath(usePathname())) return null;
  return <PublicNav />;
}

function PublicNav() {
  const pathname = usePathname();
  const reel = reelFor(pathname);
  const [hidden, setHidden] = useState(false);
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  const { scrollY } = useScroll();
  /* Over dark hero scenes (home, science, why, schools, cadets, statue, equipment, and the marble-to-living-horse openings of anatomy, curriculum and parents), the bar reads light-on-dark; everywhere else it is ivory and ink. */
  const isDarkHero = ["/", "/command", "/fleet", "/science", "/why", "/schools", "/cadets", "/statue", "/lithos", "/equipment", "/anatomy", "/curriculum", "/parents"].includes(pathname);
  const overFilm = isDarkHero && !solid;

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
          overFilm && "tone-dark",
          // A solid brand surface with a hairline rule in every state, so the bar stays legible over light sections.
          "border-b border-line/60 bg-night",
        )}
        animate={{ y: hidden ? "-110%" : "0%" }}
        transition={{ duration: 0.6, ease: ease.citadel }}
      >
        <div className="gutter flex h-16 items-center justify-between gap-6 md:h-20">
          <div className="flex min-w-0 items-center gap-4">
            <Link href="/" className="flex shrink-0 items-center gap-3 whitespace-nowrap" aria-label="Black Stallion Academy, home">
              <CrestMark className="h-12 w-12" decorative />
              <Wordmark layout="inline" className="hidden sm:inline" />
            </Link>
            {reel && (
              // Only where the primary links leave room (from 1536 px); between 1280 and 1440 px it made the bar wrap.
              <span className="label hidden min-w-0 items-center gap-2 whitespace-nowrap border-l border-line pl-4 text-dust 2xl:flex">
                <span className="font-mono tracking-[0.1em] text-gold">
                  {pad(reel.n)}/{TOTAL_REELS}
                </span>
                <span className="truncate">{reel.title}</span>
              </span>
            )}
          </div>

          <nav aria-label="Primary" className="hidden xl:block">
            <ul className="flex items-center gap-6 whitespace-nowrap 2xl:gap-8">
              {primaryNav.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <li key={item.href}>
                    <TopNavLink href={item.href} label={item.label} active={active} />
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/login"
              aria-label="Staff sign-in"
              title="Staff sign-in"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-line text-bone transition-colors hover:border-gold hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            >
              <UserRound size={18} strokeWidth={1.5} aria-hidden />
            </Link>
            <SoundToggle />
            <Link
              href={navCta.href}
              className="label hidden whitespace-nowrap border border-line/45 px-4 py-2.5 text-bone transition-colors hover:border-gold hover:text-gold md:inline-block"
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
        <Link href="/" onClick={onClose} className="flex items-center gap-3">
          <CrestMark className="h-11 w-11" decorative />
          <Wordmark layout="inline" />
        </Link>
        <Link href="/about" onClick={onClose} className="label hidden text-dust transition-colors hover:text-bone sm:inline">
          [ About the academy ]
        </Link>
        <button ref={closeRef} type="button" onClick={onClose} className="label px-2 py-2.5 text-bone hover:text-gold">
          Close ✕
        </button>
      </div>

      {/* The chapters: one quiet list on one ground (31 Oct 2026: was three act columns on leather). */}
      <motion.ol
        className="gutter mx-auto w-full max-w-[52rem] pb-10 pt-6 md:pt-10"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: ease.citadel, delay: 0.25 }}
      >
        {reels.map((r) => {
          const isStatueLink = r.href === "/statue";
          const active = pathname === r.href || pathname.startsWith(`${r.href}/`) || (isStatueLink && pathname === "/lithos");
          return (
            <li key={r.href}>
              <ReelLink href={r.href} onClose={onClose} active={active} n={r.n} title={r.title} act={r.act} />
            </li>
          );
        })}
      </motion.ol>

      <div className="gutter mx-auto flex w-full max-w-[52rem] flex-col gap-4 pb-6 sm:flex-row sm:flex-wrap sm:items-baseline sm:justify-between">
        <ul className="flex flex-col gap-1.5">
          {corridors.map((c) => (
            <li key={c.id} className="font-mono text-[0.72rem] uppercase tracking-[0.12em] text-dust">
              {c.title} ·{" "}
              <a className="text-sand hover:text-bone" href={`mailto:${c.email}`}>
                {c.email}
              </a>
            </li>
          ))}
        </ul>
        <Link href={navCta.href} onClick={onClose} className="label text-gold hover:text-bone">
          {navCta.label} →
        </Link>
      </div>

      {/* The crowd that came to watch walks the foot of the menu, above the word; still under reduced motion. */}
      <div aria-hidden className="relative">
        <div className="relative h-[clamp(7rem,14vw,11rem)] w-full overflow-hidden">
          <CrowdCanvas src="/animations/crowd-peeps.png" rows={15} cols={7} scale={0.3} className="absolute bottom-0 h-full w-full" />
        </div>
        <p className="t-inscribe select-none overflow-hidden whitespace-nowrap px-[1vw] text-center text-[16.5vw] leading-[0.78] tracking-[-0.02em] text-bone">
          Chapters
        </p>
      </div>
    </motion.div>
  );
}

/** One chapter row: number, a short rule, the title (rolls letter by letter on hover and focus) and its act. */
function ReelLink({ href, onClose, active, n, title, act }: { href: string; onClose: () => void; active: boolean; n: number; title: string; act: Act }) {
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
      className="group grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-x-4 py-1.5 sm:grid-cols-[2.25rem_3rem_minmax(0,1fr)_8.5rem] sm:gap-x-6"
    >
      <span className="font-mono text-xs text-dust">{pad(n)}</span>
      <span aria-hidden className="hidden h-px w-full bg-line transition-colors group-hover:bg-bone sm:block" />
      <AnimatedMenuText
        active={hot}
        className={cn(
          "t-inscribe min-w-0 truncate text-[clamp(1.45rem,3.4vw,2.6rem)] normal-case leading-[1.15] tracking-[-0.01em] transition-colors",
          active ? "text-gold" : "text-bone group-hover:text-gold group-focus-visible:text-gold",
        )}
      >
        {title}
      </AnimatedMenuText>
      <span className="font-mono text-[0.62rem] uppercase leading-snug tracking-[0.14em] text-dust">
        Act {acts[act].numeral}
        <span className="hidden sm:block">{acts[act].name}</span>
      </span>
    </Link>
  );
}

/** Desktop primary link with the same letter roll (hover and focus). */
function TopNavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  const [hot, setHot] = useState(false);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      onMouseEnter={() => setHot(true)}
      onMouseLeave={() => setHot(false)}
      onFocus={() => setHot(true)}
      onBlur={() => setHot(false)}
      className={cn("label block py-1 transition-colors hover:text-gold", active ? "text-gold" : "text-sand")}
    >
      <AnimatedMenuText center active={hot}>{label}</AnimatedMenuText>
    </Link>
  );
}
