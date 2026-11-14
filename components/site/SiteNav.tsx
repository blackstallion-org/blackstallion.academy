"use client";

import Link from "next/link";
import { ArrowRight, ChevronDown, Search, UserRound } from "lucide-react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { useLenis } from "lenis/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { CrestMark } from "@/components/brand/CrestMark";
import { Wordmark } from "@/components/brand/Wordmark";
import { SoundToggle } from "@/components/site/SoundToggle";
import { AnimatedMenuText } from "@/components/ui/animated-menu";
import { acts, corridors, isConsolePath, menuHolds, navCta, navMenus, reels, tools, type Act, type NavMenu } from "@/lib/content/site";
import { useReducedMotion } from "@/lib/motion/reduced";
import { ease } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";

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
  // The open mega menu (an index into navMenus), and whether it was opened from the keyboard (then focus moves into it).
  const [mega, setMega] = useState<number | null>(null);
  const [viaKeyboard, setViaKeyboard] = useState(false);
  const triggers = useRef<(HTMLButtonElement | null)[]>([]);
  const pathname = usePathname();
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setHidden(y > 240 && y > prev && !open && mega === null);
  });

  // A new page closes whatever was open.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setMega(null);
  }

  const closeMega = useCallback(
    (returnFocus: boolean) => {
      if (returnFocus && mega !== null) triggers.current[mega]?.focus();
      setMega(null);
    },
    [mega],
  );

  return (
    <>
      <motion.header
        className={cn(
          "no-print fixed inset-x-0 top-0 z-[60] transition-colors duration-500",
          // A solid brand surface with a hairline rule in every state, so the bar stays legible over light sections.
          "border-b border-line/60 bg-night",
        )}
        animate={{ y: hidden ? "-110%" : "0%" }}
        transition={{ duration: 0.6, ease: ease.citadel }}
      >
        {/* The crest and the academy's name sit together on the left (the name is one line, close to the crest); the five
            words open the full-screen menus beside it; the controls stay on the right. */}
        <div className="gutter flex h-16 items-center gap-3 md:h-20 md:gap-4">
          <Link href="/" className="flex shrink-0 items-center gap-2.5 md:gap-3" aria-label="The Black Stallion Academy of Horsemanship, home">
            {/* Crest a quarter larger (2 Nov 2026): 52 px inside the 64 px phone bar, 60 px inside the 80 px desktop bar. */}
            <CrestMark className="h-[3.25rem] w-[3.25rem] md:h-[3.75rem] md:w-[3.75rem]" decorative />
            <Wordmark layout="bold" className="hidden min-[340px]:inline-flex" />
          </Link>

          <nav aria-label="Primary" className="hidden min-w-0 flex-1 items-center gap-[clamp(0.9rem,1.7vw,2rem)] pl-[clamp(0.75rem,2.2vw,2.5rem)] min-[75rem]:flex">
            {navMenus.map((m, i) => {
              const here = menuHolds(m, pathname);
              const isOpen = mega === i;
              return (
                <button
                  key={m.label}
                  ref={(el) => {
                    triggers.current[i] = el;
                  }}
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls="mega-menu"
                  data-here={here || undefined}
                  onClick={(e) => {
                    setViaKeyboard(e.detail === 0);
                    setMega(isOpen ? null : i);
                  }}
                  // Once a menu is open, moving along the bar switches it.
                  onPointerEnter={(e) => {
                    if (e.pointerType === "mouse" && mega !== null && !isOpen) setMega(i);
                  }}
                  className="t-story group relative flex h-full items-center gap-1.5 whitespace-nowrap text-[1.05rem] leading-none text-bone transition-colors hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-gold aria-expanded:text-gold min-[1440px]:text-[1.12rem]"
                >
                  <span className="relative">
                    {m.label}
                    {/* A copper rule under the word: full while its menu is open, fainter where you are. */}
                    <span
                      aria-hidden
                      className={cn(
                        "absolute inset-x-0 -bottom-2 h-px origin-left scale-x-0 bg-copper transition-transform duration-500 ease-[var(--ease-citadel)] group-hover:scale-x-100 group-focus-visible:scale-x-100 aria-expanded:scale-x-100",
                      )}
                      style={here && !isOpen ? { transform: "scaleX(0.55)" } : undefined}
                    />
                  </span>
                  <ChevronDown
                    size={13}
                    strokeWidth={1.6}
                    aria-hidden
                    className="text-copper transition-transform duration-500 ease-[var(--ease-citadel)] group-aria-expanded:rotate-180"
                  />
                </button>
              );
            })}
          </nav>
          <div className="min-w-0 flex-1 min-[75rem]:hidden" />

          <div className="flex shrink-0 items-center gap-1 sm:gap-3">
            <Link
              href="/admin/login"
              aria-label="Staff sign-in"
              title="Staff sign-in"
              className="hidden h-11 w-11 shrink-0 place-items-center rounded-full border border-line text-bone transition-colors hover:border-gold hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold sm:grid"
            >
              <UserRound size={18} strokeWidth={1.5} aria-hidden />
            </Link>
            <SoundToggle />
            <Link
              href={navCta.href}
              className="label hidden whitespace-nowrap border border-line/45 px-4 py-2.5 text-bone transition-colors hover:border-gold hover:text-gold min-[1440px]:inline-block"
            >
              {navCta.label}
            </Link>
            <button
              type="button"
              onClick={() => {
                setMega(null);
                setOpen(true);
              }}
              aria-expanded={open}
              aria-controls="site-menu"
              aria-label="Reels: all pages"
              className="label flex min-h-11 items-center gap-3 px-2 py-2.5 text-bone hover:text-gold"
            >
              {/* Phones show the menu mark only, so the full academy name fits beside the crest. */}
              <span className="hidden sm:inline">Reels</span>
              <span aria-hidden className="flex flex-col gap-[5px]">
                <span className="block h-px w-6 bg-current" />
                <span className="block h-px w-4 self-end bg-current" />
              </span>
            </button>
          </div>
        </div>
      </motion.header>
      <AnimatePresence>
        {mega !== null && <MegaMenu key="mega" menu={navMenus[mega]} index={mega} focusFirst={viaKeyboard} onClose={closeMega} />}
      </AnimatePresence>
      <AnimatePresence>{open && <Menu onClose={() => setOpen(false)} />}</AnimatePresence>
    </>
  );
}

/** Where each column's numbering starts, so a menu's links read 01 to 09 across its three columns. */
const columnStarts = (menu: NavMenu) => menu.columns.map((_, c) => menu.columns.slice(0, c).reduce((n, col) => n + col.links.length, 0));

/**
 * The header's full-screen editorial mega menu: the ivory page drawn down under the bar, the menu's title and one line, then
 * three columns of numbered italic links under thin rules. The bar stays above it, so moving along the five words switches
 * menus in place. Escape closes and returns focus to the word; a keyboard opening moves focus to the first link; tabbing out
 * closes it. Reduced motion: a plain fade.
 */
function MegaMenu({ menu, index, focusFirst, onClose }: { menu: NavMenu; index: number; focusFirst: boolean; onClose: (returnFocus: boolean) => void }) {
  const pathname = usePathname();
  const lenis = useLenis();
  const reduced = useReducedMotion();
  const panel = useRef<HTMLDivElement>(null);
  const starts = columnStarts(menu);

  useEffect(() => {
    lenis?.stop();
    document.documentElement.style.overflow = "hidden";
    // The bar's words only exist from 1200 px; below that the menu would be unreachable, so it closes.
    const wide = window.matchMedia("(min-width: 75rem)");
    const onWidth = () => !wide.matches && onClose(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose(true);
    wide.addEventListener("change", onWidth);
    document.addEventListener("keydown", onKey);
    return () => {
      wide.removeEventListener("change", onWidth);
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
      lenis?.start();
    };
  }, [lenis, onClose]);

  useEffect(() => {
    if (focusFirst) panel.current?.querySelector<HTMLElement>("a")?.focus();
  }, [index, focusFirst]);

  return (
    <motion.div
      id="mega-menu"
      ref={panel}
      role="region"
      aria-label={`${menu.label}: all pages`}
      data-lenis-prevent
      onBlur={(e) => {
        const to = e.relatedTarget as HTMLElement | null;
        if (to && !panel.current?.contains(to) && !to.closest("header")) onClose(false);
      }}
      className="tone-light no-print fixed inset-x-0 bottom-0 top-16 z-[59] hidden overflow-y-auto overscroll-contain bg-night min-[75rem]:block md:top-20"
      initial={reduced ? { opacity: 0 } : { clipPath: "inset(0 0 100% 0)" }}
      animate={reduced ? { opacity: 1 } : { clipPath: "inset(0 0 0% 0)" }}
      exit={reduced ? { opacity: 0 } : { clipPath: "inset(0 0 100% 0)" }}
      transition={{ duration: reduced ? 0.2 : 0.75, ease: ease.inOut }}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={index}
          className="gutter mx-auto flex min-h-full max-w-[96rem] flex-col pb-10 pt-[clamp(2.25rem,6vh,4.5rem)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
        >
          <div className="flex items-start justify-between gap-10 border-b border-line pb-7">
            <div>
              <p className="label text-brass">
                {pad(index + 1)} <span aria-hidden className="text-dust">/</span> {pad(navMenus.length)}
              </p>
              <h2 className="t-inscribe mt-4 text-[clamp(2.1rem,3.3vw,3.25rem)] leading-none text-bone">{menu.label}</h2>
              <p className="t-story mt-4 max-w-[46ch] text-lg italic text-sand">{menu.lead}</p>
            </div>
            <button
              type="button"
              onClick={() => onClose(true)}
              className="label -mr-2 inline-flex min-h-11 shrink-0 items-center gap-2 px-2 text-bone transition-colors hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            >
              Close <span aria-hidden>✕</span>
            </button>
          </div>

          <div className="grid flex-1 grid-cols-3 gap-x-[clamp(2rem,4.5vw,5rem)] pt-10">
            {menu.columns.map((col, c) => (
              <motion.section
                key={col.heading}
                aria-labelledby={`mega-${index}-${c}`}
                initial={{ opacity: 0, y: reduced ? 0 : 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: reduced ? 0.2 : 0.7, ease: ease.citadel, delay: reduced ? 0 : 0.2 + c * 0.07 }}
              >
                <h3 id={`mega-${index}-${c}`} className="label border-b border-line pb-3 text-brass">
                  {col.heading}
                </h3>
                <ul>
                  {col.links.map((l, k) => {
                    const here = pathname === l.href;
                    return (
                      <li key={l.href}>
                        <Link
                          href={l.href}
                          onClick={() => onClose(false)}
                          aria-current={here ? "page" : undefined}
                          className="group/link flex items-baseline gap-5 border-b border-line py-[clamp(0.85rem,1.9vh,1.25rem)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                        >
                          <span className="w-6 shrink-0 font-mono text-xs text-gold/80">{pad(starts[c] + k + 1)}</span>
                          <span
                            className={cn(
                              "t-voice min-w-0 flex-1 text-[clamp(1.45rem,2.05vw,2.05rem)] leading-[1.15] transition-[color,transform] duration-500 ease-[var(--ease-citadel)] group-hover/link:translate-x-1.5 group-hover/link:text-gold group-focus-visible/link:text-gold motion-reduce:transition-none motion-reduce:group-hover/link:translate-x-0",
                              here ? "text-gold" : "text-bone",
                            )}
                          >
                            {l.label}
                          </span>
                          <ArrowRight
                            size={16}
                            strokeWidth={1.5}
                            aria-hidden
                            className="shrink-0 self-center text-copper opacity-0 transition-opacity duration-500 group-hover/link:opacity-100 group-focus-visible/link:opacity-100"
                          />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </motion.section>
            ))}
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-between gap-x-10 gap-y-4 border-t border-line pt-6">
            <Link href="/command" onClick={() => onClose(false)} className="label inline-flex min-h-11 items-center gap-2 text-dust transition-colors hover:text-bone">
              <Search size={14} strokeWidth={1.6} aria-hidden /> Ask the Command
            </Link>
            <Link href={navCta.href} onClick={() => onClose(false)} className="label inline-flex min-h-11 items-center text-gold transition-colors hover:text-bone">
              {navCta.label} →
            </Link>
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

/** One group of the phone menu: the header word as a disclosure, opening onto its three numbered columns. */
function MenuGroup({ menu, onClose }: { menu: NavMenu; onClose: () => void }) {
  const pathname = usePathname();
  const [shown, setShown] = useState(() => menuHolds(menu, pathname));
  const reduced = useReducedMotion();
  const starts = columnStarts(menu);
  const id = `menu-group-${menu.label.toLowerCase()}`;
  const holds = menuHolds(menu, pathname);
  return (
    <li className="border-b border-line">
      <button
        type="button"
        aria-expanded={shown}
        aria-controls={id}
        onClick={() => setShown((v) => !v)}
        className="group flex min-h-14 w-full items-center justify-between gap-4 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
      >
        <span className={cn("t-voice text-[1.6rem] transition-colors group-hover:text-gold", holds ? "text-gold" : "text-bone")}>{menu.label}</span>
        <ChevronDown size={18} strokeWidth={1.5} aria-hidden className="text-copper transition-transform duration-500 group-aria-expanded:rotate-180" />
      </button>
      <AnimatePresence initial={false}>
        {shown && (
          <motion.div
            id={id}
            initial={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={reduced ? { opacity: 1 } : { height: "auto", opacity: 1 }}
            exit={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: reduced ? 0.15 : 0.5, ease: ease.citadel }}
            className="overflow-hidden"
          >
            <p className="t-story pb-2 italic text-sand">{menu.lead}</p>
            <div className="grid gap-x-8 gap-y-6 pb-6 pt-3 sm:grid-cols-3">
              {menu.columns.map((col, c) => (
                <div key={col.heading}>
                  <p className="label border-b border-line pb-2 text-brass">{col.heading}</p>
                  <ul>
                    {col.links.map((l, k) => (
                      <li key={l.href}>
                        <Link
                          href={l.href}
                          onClick={onClose}
                          aria-current={pathname === l.href ? "page" : undefined}
                          className="flex min-h-12 items-baseline gap-4 border-b border-line py-2.5 text-bone transition-colors hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold aria-[current=page]:text-gold"
                        >
                          <span className="w-5 shrink-0 font-mono text-[0.68rem] text-gold/80">{pad(starts[c] + k + 1)}</span>
                          <span className="t-voice text-[1.2rem] leading-snug">{l.label}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
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

      {/* Below 1200 px the bar has no room for the five words, so their menus lead this one, as disclosures. */}
      <nav aria-label="Primary" className="gutter pt-4 min-[75rem]:hidden">
        <ul className="border-t border-line">
          {navMenus.map((m) => (
            <MenuGroup key={m.label} menu={m} onClose={onClose} />
          ))}
          <li className="border-b border-line">
            <Link
              href="/command"
              onClick={onClose}
              className="flex min-h-14 items-center justify-between gap-4 text-bone transition-colors hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            >
              <span className="t-voice text-[1.6rem]">Ask the Command</span>
              <Search size={18} strokeWidth={1.5} aria-hidden className="text-copper" />
            </Link>
          </li>
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
