"use client";

import Link from "next/link";
import { UserRound } from "lucide-react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useIsPresent, useMotionValueEvent, useScroll } from "motion/react";
import { useLenis } from "lenis/react";
import { useEffect, useRef, useState } from "react";
import { CrestMark } from "@/components/brand/CrestMark";
import { Wordmark } from "@/components/brand/Wordmark";
import { SoundToggle } from "@/components/site/SoundToggle";
import { AnimatedMenuText } from "@/components/ui/animated-menu";
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
  // The menu belongs to the route it was opened on: a new route closes it without an effect (and a locked page cannot outlive it).
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt === pathname;
  const { scrollY } = useScroll();
  const lenis = useLenis();

  // The page is locked while the menu is open and released the moment it starts to close (not when its 0.8 s exit has finished, which is
  // when the old code released it: a tap on a link left the new page unscrollable for most of a second, and any re-render in between
  // re-locked it). Cleanup restores both locks, so nothing else can leave the page stuck.
  useEffect(() => {
    if (!open) return;
    lenis?.stop();
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "";
      lenis?.start();
    };
  }, [open, lenis]);
  // A page restored from the back-forward cache never comes back locked.
  useEffect(() => {
    const onShow = (e: PageTransitionEvent) => { if (e.persisted && !open) { document.documentElement.style.overflow = ""; lenis?.start(); } };
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, [open, lenis]);
  /* Over dark hero scenes (home, science, why, schools, cadets, statue, equipment, and the marble-to-living-horse openings of anatomy, curriculum and parents), the bar reads light-on-dark; everywhere else it is ivory and ink. */
  const isDarkHero = ["/", "/science", "/why", "/schools", "/cadets", "/statue", "/lithos", "/equipment", "/anatomy", "/curriculum", "/parents"].includes(pathname);
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
              prefetch={false} // visitors do not need the staff login page fetched in the background on every page
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
              onClick={() => setOpenAt(pathname)}
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
      <AnimatePresence>{open && <Menu onClose={() => setOpenAt(null)} />}</AnimatePresence>
    </>
  );
}

function Menu({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();
  const panel = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });
  // While the menu wipes away (0.8 s) it is already closed: let touches and the wheel through to the page underneath.
  const present = useIsPresent();

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
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
    return () => {
      document.removeEventListener("keydown", onKey);
      opener?.focus();
    };
  }, []);

  const byAct = (act: Act) => reels.filter((r) => r.act === act);

  return (
    <motion.div
      id="site-menu"
      ref={panel}
      role="dialog"
      aria-modal="true"
      aria-label="All reels"
      data-lenis-prevent
      className="tone-dark surface-leather no-print fixed inset-0 z-[80] overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]"
      style={present ? undefined : { pointerEvents: "none" }}
      initial={{ clipPath: "inset(0 0 100% 0)" }}
      animate={{ clipPath: "inset(0 0 0% 0)" }}
      exit={{ clipPath: "inset(0 0 100% 0)" }}
      transition={{ duration: 0.8, ease: ease.inOut }}
    >
      <div className="gutter flex h-16 items-center justify-between md:h-20">
        <Link href="/" onClick={onClose} className="flex items-center gap-3">
          <CrestMark className="h-12 w-12" decorative />
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
                const isStatueLink = r.href === "/statue";
                const active = pathname === r.href || pathname.startsWith(`${r.href}/`) || (isStatueLink && pathname === "/lithos");
                return (
                  <li key={r.href}>
                    <ReelLink href={r.href} onClose={onClose} active={active} n={r.n} title={r.title}>
                      {isStatueLink && (
                        // From 1280 px only: in the narrower three-column menu it ran into the next column.
                        <span className="hidden rounded-full border border-gold/50 bg-gold/15 px-2.5 py-0.5 font-mono text-[0.62rem] uppercase tracking-widest text-gold shadow-[0_0_12px_rgba(201,166,107,0.3)] transition-colors group-hover:bg-gold group-hover:text-black xl:inline-block">
                          3D Model
                        </span>
                      )}
                    </ReelLink>
                  </li>
                );
              })}
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
        <div className="flex flex-wrap gap-6">
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
