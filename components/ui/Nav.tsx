"use client";

import { useLenis } from "lenis/react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { Monogram } from "@/components/brand/Monogram";
import { Wordmark } from "@/components/brand/Wordmark";
import { Button } from "@/components/ui/Button";
import { navCta, primaryNav } from "@/lib/content/nav";
import { fadeUp, staggerChildren, transition } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";

function isActive(pathname: string | null, href: string) {
  return !!pathname && (pathname === href || pathname.startsWith(`${href}/`));
}

/** Desktop links. Reads the pathname, so it sits inside <Suspense> (cacheComponents). */
function DesktopLinks({ withActive }: { withActive: boolean }) {
  const pathname = usePathname();
  return (
    <ul className="hidden items-center gap-7 lg:flex">
      {primaryNav.map((item) => {
        const active = withActive && isActive(pathname, item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative py-2 text-sm tracking-[0.02em] text-ink/80 transition-colors duration-200 ease-in-out hover:text-parchment-gold",
                active && "text-brass",
              )}
            >
              {item.label}
              <span
                aria-hidden
                className={cn(
                  "absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-brass transition-transform duration-200 ease-in-out",
                  active && "scale-x-100",
                )}
              />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function StaticDesktopLinks() {
  return (
    <ul className="hidden items-center gap-7 lg:flex">
      {primaryNav.map((item) => (
        <li key={item.href}>
          <Link href={item.href} className="py-2 text-sm tracking-[0.02em] text-ink/80">
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Site navigation: transparent over heroes, a carbon bar with a brass hairline once scrolled. */
export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const lenis = useLenis();
  const menuButton = useRef<HTMLButtonElement>(null);
  const firstLink = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock scroll and move focus while the menu is open; Escape closes it.
  useEffect(() => {
    if (!open) return;
    const trigger = menuButton.current;
    lenis?.stop();
    document.documentElement.style.overflow = "hidden";
    firstLink.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      lenis?.start();
      document.documentElement.style.overflow = "";
      window.removeEventListener("keydown", onKey);
      trigger?.focus();
    };
  }, [open, lenis]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color] duration-[400ms] ease-citadel",
        scrolled || open ? "border-brass/20 bg-carbon/95" : "border-transparent bg-transparent",
      )}
    >
      <nav aria-label="Primary" className="mx-auto flex h-16 max-w-[1320px] items-center justify-between gap-6 px-5 sm:h-20 sm:px-8">
        <Link href="/" className="flex items-center gap-3" aria-label="Black Stallion Academy, home">
          <Monogram className="h-8 w-8 sm:h-9 sm:w-9" />
          <Wordmark layout="inline" className="hidden sm:inline" />
        </Link>

        <Suspense fallback={<StaticDesktopLinks />}>
          <DesktopLinks withActive />
        </Suspense>

        <div className="flex items-center gap-3">
          <Button href={navCta.href} size="md" className="hidden md:inline-flex">
            {navCta.label}
          </Button>
          <button
            ref={menuButton}
            type="button"
            className="inline-flex h-11 items-center gap-3 rounded-plate border border-brass/25 px-4 text-sm text-ink lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
          >
            <span aria-hidden className="relative block h-3 w-5">
              <span
                className={cn(
                  "absolute left-0 top-0 h-px w-full bg-brass transition-transform duration-[400ms] ease-citadel",
                  open && "translate-y-1.5 rotate-45",
                )}
              />
              <span
                className={cn(
                  "absolute bottom-0 left-0 h-px w-full bg-brass transition-transform duration-[400ms] ease-citadel",
                  open && "-translate-y-1.5 -rotate-45",
                )}
              />
            </span>
            {open ? "Close" : "Menu"}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            className="fixed inset-x-0 bottom-0 top-16 overflow-y-auto border-t border-brass/20 bg-obsidian sm:top-20 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={transition.ui}
          >
            <motion.ul
              className="flex flex-col gap-1 px-5 py-10 sm:px-8"
              variants={staggerChildren(0.05)}
              initial="hidden"
              animate="visible"
            >
              {primaryNav.map((item, i) => (
                <motion.li key={item.href} variants={fadeUp}>
                  <Link
                    ref={i === 0 ? firstLink : undefined}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="block border-b border-brass/15 py-4 font-display text-2xl tracking-display text-ink"
                  >
                    {item.label}
                  </Link>
                </motion.li>
              ))}
              <motion.li variants={fadeUp} className="pt-8">
                <Button href={navCta.href} size="lg" className="w-full" onClick={() => setOpen(false)}>
                  {navCta.label}
                </Button>
              </motion.li>
            </motion.ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
