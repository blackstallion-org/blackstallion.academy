"use client";

import Link from "next/link";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  FileSignature,
  FileText,
  ImageIcon,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  QrCode,
  ScrollText,
  Sun,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { usePref } from "@/components/sections/admin/use-pref";
import { useDialogFocus } from "@/lib/motion/use-dialog-focus";
import { useReducedMotion } from "@/lib/motion/reduced";
import { ease } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";
import { signOut } from "./actions";
import { ADMIN_GROUPS, sectionTitle, type AdminSection, type SectionIcon } from "./AdminNav";

const ICONS: Record<SectionIcon, LucideIcon> = {
  overview: LayoutDashboard,
  leads: Inbox,
  accounts: Users,
  mou: FileSignature,
  qr: QrCode,
  documents: FileText,
  audit: ScrollText,
  media: ImageIcon,
};

/**
 * The staff console's frame: a sidebar that collapses to icons on a desktop, a slide-in drawer on a phone, a light/dark switch, and
 * the signed-in name with sign-out. Every section is a plain link, so the console still navigates without JavaScript (the
 * collapse, the drawer and the theme are enhancements). The sidebar width and the theme are remembered per browser.
 *
 * The dark theme is the site's own `.tone-dark` scope on the console's plate, so every token swaps the way it does on the dark
 * scenes of the public site; nothing is inverted by hand.
 */
export function AdminShell({ name, current, inside = false, children }: { name: string; current: AdminSection; inside?: boolean; children: ReactNode }) {
  const [collapsedPref, setCollapsedPref] = usePref("bsah-admin-side", "open");
  const [theme, setTheme] = usePref("bsah-admin-theme", "light");
  const [drawer, setDrawer] = useState(false);
  const reduced = useReducedMotion();
  const collapsed = collapsedPref === "collapsed";
  const dark = theme === "dark";
  const scopeRef = useRef<HTMLDivElement>(null);
  useDialogFocus(drawer, scopeRef);
  // The site's own bar slides away on the way down the page (components/site/SiteNav.tsx: past 240 px and scrolling down). The
  // phone bar under it follows the same rule, so it never leaves a 64 px gap above itself.
  const [navHidden, setNavHidden] = useState(false);
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (y) => setNavHidden(y > 240 && y > (scrollY.getPrevious() ?? 0)));

  useEffect(() => {
    if (!drawer) return;
    const close = (e: KeyboardEvent) => e.key === "Escape" && setDrawer(false);
    document.addEventListener("keydown", close);
    const wide = window.matchMedia("(min-width: 1024px)");
    const onWide = () => wide.matches && setDrawer(false);
    wide.addEventListener("change", onWide);
    return () => {
      document.removeEventListener("keydown", close);
      wide.removeEventListener("change", onWide);
    };
  }, [drawer]);

  return (
    <div ref={scopeRef} data-admin-shell className={cn("relative -mx-3 px-3 py-3 transition-colors duration-500 sm:-mx-5 sm:px-5 sm:py-5", dark ? "tone-dark border border-line bg-night" : "")}>
      {/* phone: a bar under the site's own nav */}
      <div className={cn("sticky z-30 -mx-3 mb-4 flex items-center justify-between gap-3 border-b border-line bg-night/95 px-3 py-2 backdrop-blur-sm transition-[top] duration-500 sm:-mx-5 sm:px-5 lg:hidden", navHidden ? "top-0" : "top-16")}>
        <button
          type="button"
          onClick={() => setDrawer(true)}
          aria-label="Open the console menu"
          aria-expanded={drawer}
          className="grid h-11 w-11 place-items-center border border-line text-bone hover:border-gold hover:text-gold"
        >
          <Menu className="h-5 w-5" aria-hidden />
        </button>
        <p className="label min-w-0 flex-1 truncate text-brass">{sectionTitle(current)}</p>
        <ThemeButton dark={dark} onToggle={() => setTheme(dark ? "light" : "dark")} />
      </div>

      <div
        className="grid gap-x-8 lg:grid-cols-[var(--side)_minmax(0,1fr)] lg:transition-[grid-template-columns] lg:duration-300"
        style={{ ["--side" as string]: collapsed ? "4.25rem" : "15.5rem" }}
      >
        <aside aria-label="Staff console" className="hidden lg:block">
          <div className="plate sticky top-28 flex max-h-[calc(100svh-8rem)] flex-col overflow-hidden">
            <SideNav current={current} inside={inside} collapsed={collapsed} />
            <SideFoot name={name} collapsed={collapsed} dark={dark} onTheme={() => setTheme(dark ? "light" : "dark")} onCollapse={() => setCollapsedPref(collapsed ? "open" : "collapsed")} />
          </div>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>

      <AnimatePresence>
        {drawer && (
          <div className="fixed inset-0 z-[70] lg:hidden">
            <motion.button
              type="button"
              aria-label="Close the console menu"
              onClick={() => setDrawer(false)}
              className="absolute inset-0 bg-ink/45"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduced ? 0 : 0.25 }}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Console menu"
              className={cn("plate absolute inset-y-0 left-0 flex w-[min(20rem,88vw)] flex-col overflow-y-auto bg-night", dark && "tone-dark")}
              initial={reduced ? false : { x: "-100%" }}
              animate={{ x: 0 }}
              exit={reduced ? { opacity: 0 } : { x: "-100%" }}
              transition={{ duration: reduced ? 0 : 0.4, ease: ease.citadel }}
            >
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <p className="label text-brass">Staff console</p>
                <button type="button" onClick={() => setDrawer(false)} aria-label="Close the console menu" className="grid h-11 w-11 place-items-center border border-line text-bone hover:border-gold hover:text-gold">
                  <X className="h-5 w-5" aria-hidden />
                </button>
              </div>
              <SideNav current={current} inside={inside} collapsed={false} onNavigate={() => setDrawer(false)} />
              <SideFoot name={name} collapsed={false} dark={dark} onTheme={() => setTheme(dark ? "light" : "dark")} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SideNav({ current, inside, collapsed, onNavigate }: { current: AdminSection; inside: boolean; collapsed: boolean; onNavigate?: () => void }) {
  return (
    <nav aria-label="Console sections" className="flex-1 overflow-y-auto px-2 py-3">
      {ADMIN_GROUPS.map((group, gi) => (
        <div key={group.label} className={cn(gi > 0 && "mt-5 border-t border-line pt-4")}>
          <p className={cn("label px-3 pb-2 text-dust", collapsed && "sr-only")}>{group.label}</p>
          <ul className="flex flex-col gap-0.5">
            {group.items.map((s) => {
              const Icon = ICONS[s.icon];
              const active = s.key === current;
              return (
                <li key={s.key}>
                  <Link
                    href={s.href}
                    onClick={onNavigate}
                    title={collapsed ? s.label : undefined}
                    aria-current={active ? (inside ? "true" : "page") : undefined}
                    className={cn(
                      "group relative flex min-h-11 items-center gap-3 px-3 transition-colors",
                      active ? "bg-umber text-gold" : "text-sand hover:bg-umber/60 hover:text-bone",
                    )}
                  >
                    {/* the current section: a gold rule on the left edge, so the state never rests on colour alone */}
                    <span aria-hidden className={cn("absolute inset-y-1.5 left-0 w-0.5 transition-opacity", active ? "bg-gold opacity-100" : "opacity-0")} />
                    <Icon className="h-[1.05rem] w-[1.05rem] shrink-0" aria-hidden />
                    <span className={cn("t-ui truncate text-sm", collapsed && "sr-only")}>{s.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function ThemeButton({ dark, onToggle }: { dark: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} aria-pressed={dark} aria-label={dark ? "Switch to the light console" : "Switch to the dark console"} className="grid h-11 w-11 place-items-center border border-line text-sand hover:border-gold hover:text-gold">
      {dark ? <Sun className="h-4 w-4" aria-hidden /> : <Moon className="h-4 w-4" aria-hidden />}
    </button>
  );
}

function SideFoot({ name, collapsed, dark, onTheme, onCollapse }: { name: string; collapsed: boolean; dark: boolean; onTheme: () => void; onCollapse?: () => void }) {
  return (
    <div className="border-t border-line p-2">
      <div className={cn("flex items-center gap-2 px-1 pb-2", collapsed && "justify-center")}>
        <span aria-hidden className="grid h-9 w-9 shrink-0 place-items-center border border-line font-mono text-xs uppercase text-gold">
          {name.trim().slice(0, 1) || "S"}
        </span>
        <p className={cn("t-ui min-w-0 flex-1 truncate text-sm text-bone", collapsed && "sr-only")}>{name}</p>
      </div>
      <div className={cn("flex gap-1", collapsed ? "flex-col" : "items-stretch")}>
        <form action={signOut} className={cn(!collapsed && "flex-1")}>
          <button className="label flex min-h-11 w-full items-center justify-center gap-2 border border-line px-3 text-bone hover:border-gold hover:text-gold" title="Sign out">
            <LogOut className="h-4 w-4 shrink-0" aria-hidden />
            <span className={cn(collapsed && "sr-only")}>Sign out</span>
          </button>
        </form>
        <button type="button" onClick={onTheme} aria-pressed={dark} aria-label={dark ? "Switch to the light console" : "Switch to the dark console"} className="hidden min-h-11 w-11 shrink-0 place-items-center border border-line text-sand hover:border-gold hover:text-gold lg:grid">
          {dark ? <Sun className="h-4 w-4" aria-hidden /> : <Moon className="h-4 w-4" aria-hidden />}
        </button>
        {onCollapse && (
          <button type="button" onClick={onCollapse} aria-pressed={collapsed} aria-label={collapsed ? "Expand the sidebar" : "Collapse the sidebar"} className="grid min-h-11 w-11 shrink-0 place-items-center border border-line text-sand hover:border-gold hover:text-gold">
            {collapsed ? <PanelLeftOpen className="h-4 w-4" aria-hidden /> : <PanelLeftClose className="h-4 w-4" aria-hidden />}
          </button>
        )}
      </div>
    </div>
  );
}
