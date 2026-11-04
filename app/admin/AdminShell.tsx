"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowUpRight,
  Bell,
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
import { CrestMark } from "@/components/brand/CrestMark";
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
    <div ref={scopeRef} data-admin-shell className={cn("console flex min-h-[100svh] transition-colors duration-300", dark && "tone-photo")}>
      {/* The sidebar (Mosaic): a white, full-height column with rounded right corners; it collapses to icons on a desktop. */}
      <aside aria-label="Staff console" className="hidden shrink-0 transition-[width] duration-200 lg:block" style={{ width: collapsed ? "5rem" : "16rem" }}>
        <div className={cn("sticky top-0 flex h-[100svh] flex-col overflow-hidden rounded-r-2xl bg-ember shadow-[var(--plate-shadow)]", dark && "border-r border-line")}>
          <Link href="/admin" className={cn("flex items-center gap-3 px-6 pb-4 pt-5", collapsed && "justify-center px-0")} aria-label="Console overview">
            <CrestMark className="h-9 w-9 shrink-0" decorative />
            <span className={cn("t-ui text-sm font-bold leading-tight text-bone", collapsed && "sr-only")}>Black Stallion<span className="block text-[0.65rem] font-semibold uppercase tracking-wide text-dust">Staff console</span></span>
          </Link>
          <SideNav current={current} inside={inside} collapsed={collapsed} />
          <SideFoot name={name} collapsed={collapsed} onCollapse={() => setCollapsedPref(collapsed ? "open" : "collapsed")} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* The header (Mosaic): sticky, on the page colour with a hairline under it. The greeting and section on the left;
            new enquiries, the public site, the theme and the signed-in initial on the right. The public nav and footer are not shown on /admin. */}
        <header className="sticky top-0 z-30 border-b border-line bg-night/90 backdrop-blur-md">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={() => setDrawer(true)}
              aria-label="Open the console menu"
              aria-expanded={drawer}
              className="grid h-11 w-11 shrink-0 place-items-center text-sand hover:text-gold lg:hidden"
            >
              <Menu className="h-6 w-6" aria-hidden />
            </button>
            <div className="min-w-0 flex-1">
              <p className="t-ui truncate text-[0.95rem] font-semibold text-bone">Welcome back, {name.trim().split(/\s+/)[0] || "staff"}</p>
              <p className="label truncate text-[0.62rem] text-dust">{sectionTitle(current)}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Link href="/admin/enquiries?status=new" aria-label="New enquiries" title="New enquiries" className="grid h-10 w-10 place-items-center rounded-full text-sand transition-colors hover:bg-umber hover:text-gold">
                <Bell className="h-[1.05rem] w-[1.05rem]" aria-hidden />
              </Link>
              <ThemeButton dark={dark} onToggle={() => setTheme(dark ? "light" : "dark")} />
              <Link href="/" className="label hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sand transition-colors hover:bg-umber hover:text-gold md:flex">
                View site <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
              <span aria-hidden className="mx-2 hidden h-6 w-px bg-line sm:block" />
              <span aria-hidden title={name} className="hidden h-8 w-8 place-items-center rounded-full bg-gold text-xs font-semibold uppercase text-night sm:grid">
                {name.trim().slice(0, 1) || "S"}
              </span>
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[96rem] min-w-0 grow px-4 py-8 sm:px-6 lg:px-8">{children}</main>
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
              className={cn("console absolute inset-y-0 left-0 flex w-[min(20rem,88vw)] flex-col overflow-y-auto rounded-r-2xl bg-ember shadow-xl", dark && "tone-photo")}
              initial={reduced ? false : { x: "-100%" }}
              animate={{ x: 0 }}
              exit={reduced ? { opacity: 0 } : { x: "-100%" }}
              transition={{ duration: reduced ? 0 : 0.4, ease: ease.citadel }}
            >
              <div className="flex items-center justify-between px-5 pb-2 pt-4">
                <span className="flex items-center gap-3">
                  <CrestMark className="h-9 w-9" decorative />
                  <span className="t-ui text-sm font-bold text-bone">Staff console</span>
                </span>
                <button type="button" onClick={() => setDrawer(false)} aria-label="Close the console menu" className="grid h-11 w-11 place-items-center text-sand hover:text-gold">
                  <X className="h-5 w-5" aria-hidden />
                </button>
              </div>
              <SideNav current={current} inside={inside} collapsed={false} onNavigate={() => setDrawer(false)} />
              <SideFoot name={name} collapsed={false} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SideNav({ current, inside, collapsed, onNavigate }: { current: AdminSection; inside: boolean; collapsed: boolean; onNavigate?: () => void }) {
  return (
    <nav aria-label="Console sections" className="no-scrollbar flex-1 overflow-y-auto px-4 py-3">
      {ADMIN_GROUPS.map((group, gi) => (
        <div key={group.label} className={cn(gi > 0 && "mt-7")}>
          <p className={cn("px-3 text-xs font-semibold uppercase text-dust", collapsed && "sr-only")}>{group.label}</p>
          <ul className="mt-3 flex flex-col gap-0.5">
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
                      "group relative flex min-h-11 items-center gap-3 rounded-lg px-3 transition-colors",
                      collapsed && "justify-center",
                      active ? "bg-gradient-to-r from-gold/[0.12] to-gold/[0.04] text-bone" : "text-sand hover:text-bone",
                    )}
                  >
                    <Icon className={cn("h-4 w-4 shrink-0", active ? "text-gold" : "text-dust")} aria-hidden />
                    <span className={cn("t-ui truncate text-sm font-medium", collapsed && "sr-only")}>{s.label}</span>
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
    <button type="button" onClick={onToggle} aria-pressed={dark} aria-label={dark ? "Switch to the light console" : "Switch to the dark console"} className="grid h-10 w-10 place-items-center rounded-full text-sand transition-colors hover:bg-umber hover:text-gold">
      {dark ? <Sun className="h-[1.05rem] w-[1.05rem]" aria-hidden /> : <Moon className="h-[1.05rem] w-[1.05rem]" aria-hidden />}
    </button>
  );
}

function SideFoot({ name, collapsed, onCollapse }: { name: string; collapsed: boolean; onCollapse?: () => void }) {
  return (
    <div className="border-t border-line p-4">
      <div className={cn("flex items-center gap-3 px-1 pb-3", collapsed && "justify-center px-0")}>
        <span aria-hidden className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gold text-xs font-semibold uppercase text-night">
          {name.trim().slice(0, 1) || "S"}
        </span>
        <p className={cn("t-ui min-w-0 flex-1 truncate text-sm font-medium text-bone", collapsed && "sr-only")}>{name}</p>
      </div>
      <div className={cn("flex gap-2", collapsed ? "flex-col" : "items-stretch")}>
        <form action={signOut} className={cn(!collapsed && "flex-1")}>
          <button className="t-ui flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-umber px-3 text-sm font-medium text-bone transition-colors hover:text-gold" title="Sign out">
            <LogOut className="h-4 w-4 shrink-0" aria-hidden />
            <span className={cn(collapsed && "sr-only")}>Sign out</span>
          </button>
        </form>
        {onCollapse && (
          <button type="button" onClick={onCollapse} aria-pressed={collapsed} aria-label={collapsed ? "Expand the sidebar" : "Collapse the sidebar"} className="grid min-h-10 w-10 shrink-0 place-items-center rounded-lg bg-umber text-sand transition-colors hover:text-gold">
            {collapsed ? <PanelLeftOpen className="h-4 w-4" aria-hidden /> : <PanelLeftClose className="h-4 w-4" aria-hidden />}
          </button>
        )}
      </div>
    </div>
  );
}
