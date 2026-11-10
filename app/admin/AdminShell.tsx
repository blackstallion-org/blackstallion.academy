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
  const [theme, setTheme] = usePref("bsah-admin-theme", "dark");
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
    <div ref={scopeRef} data-admin-shell className={cn("console flex min-h-[100svh] bg-black text-white antialiased transition-colors duration-300", dark && "tone-photo")}>
      {/* The sidebar: a deep obsidian column with 28px rounded right corners, glowing accents, and collapsible view. */}
      <aside aria-label="Staff console" className="hidden shrink-0 transition-[width] duration-200 lg:block" style={{ width: collapsed ? "5.5rem" : "16.5rem" }}>
        <div className="sticky top-0 flex h-[100svh] flex-col overflow-hidden rounded-r-[28px] border-r border-white/10 bg-[#050507] shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_-1px_0_0_rgba(255,255,255,0.06)] relative z-40">
          <Link href="/admin" className={cn("flex items-center gap-3.5 px-6 pb-4 pt-6 transition-opacity hover:opacity-90", collapsed && "justify-center px-0")} aria-label="Console overview">
            <CrestMark className="h-9 w-9 shrink-0 drop-shadow-[0_0_12px_rgba(232,255,31,0.25)]" decorative />
            <span className={cn("text-sm font-bold tracking-tight text-white", collapsed && "sr-only")}>
              Black Stallion
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-[#E8FF1F]">Staff console</span>
            </span>
          </Link>
          <SideNav current={current} inside={inside} collapsed={collapsed} />
          <SideFoot name={name} collapsed={collapsed} onCollapse={() => setCollapsedPref(collapsed ? "open" : "collapsed")} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* The header: sticky obsidian bar with hairline border and Finance Bento accents */}
        <header className="sticky top-0 z-30 border-b border-white/10 bg-black/85 backdrop-blur-xl">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={() => setDrawer(true)}
              aria-label="Open the console menu"
              aria-expanded={drawer}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 text-white/70 hover:bg-white/[0.06] hover:text-white lg:hidden"
            >
              <Menu className="h-5 w-5" aria-hidden />
            </button>
            <div className="min-w-0 flex-1 flex items-center gap-3">
              <div>
                <p className="truncate text-sm font-semibold text-white">Welcome back, {name.trim().split(/\s+/)[0] || "staff"}</p>
              </div>
              <span className="hidden sm:inline-flex items-center rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-0.5 text-[11px] font-medium text-[#E8FF1F]">
                {sectionTitle(current)}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <Link href="/admin/enquiries?status=new" aria-label="New enquiries" title="New enquiries" className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-white/70 transition-colors hover:border-white/20 hover:bg-white/[0.08] hover:text-[#E8FF1F]">
                <Bell className="h-4 w-4" aria-hidden />
              </Link>
              <ThemeButton dark={dark} onToggle={() => setTheme(dark ? "light" : "dark")} />
              <Link href="/" className="hidden items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/70 transition-colors hover:border-white/20 hover:bg-white/[0.08] hover:text-white md:flex">
                View site <ArrowUpRight className="h-3 w-3" aria-hidden />
              </Link>
              <span aria-hidden className="mx-1.5 hidden h-5 w-px bg-white/10 sm:block" />
              <span aria-hidden title={name} className="hidden h-8 w-8 place-items-center rounded-full bg-[#E8FF1F] text-xs font-bold uppercase text-[#0b0b0c] shadow-[0_0_10px_rgba(232,255,31,0.25)] sm:grid">
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
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduced ? 0 : 0.25 }}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Console menu"
              className="console absolute inset-y-0 left-0 flex w-[min(20rem,88vw)] flex-col overflow-y-auto rounded-r-[28px] border-r border-white/10 bg-[#050507] shadow-2xl"
              initial={reduced ? false : { x: "-100%" }}
              animate={{ x: 0 }}
              exit={reduced ? { opacity: 0 } : { x: "-100%" }}
              transition={{ duration: reduced ? 0 : 0.4, ease: ease.citadel }}
            >
              <div className="flex items-center justify-between px-5 pb-3 pt-5 border-b border-white/10">
                <span className="flex items-center gap-3">
                  <CrestMark className="h-8 w-8 drop-shadow-[0_0_10px_rgba(232,255,31,0.25)]" decorative />
                  <span className="text-sm font-bold text-white">Staff console</span>
                </span>
                <button type="button" onClick={() => setDrawer(false)} aria-label="Close the console menu" className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 text-white/70 hover:text-white">
                  <X className="h-4 w-4" aria-hidden />
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
    <nav aria-label="Console sections" className="no-scrollbar flex-1 overflow-y-auto px-3.5 py-4">
      {ADMIN_GROUPS.map((group, gi) => (
        <div key={group.label} className={cn(gi > 0 && "mt-7")}>
          <p className={cn("px-3.5 text-[11px] font-bold uppercase tracking-wider text-white/40", collapsed && "sr-only")}>{group.label}</p>
          <ul className="mt-2.5 flex flex-col gap-1">
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
                      "group relative flex min-h-11 items-center gap-3 rounded-2xl px-3.5 py-2.5 transition-all duration-200",
                      collapsed && "justify-center px-0",
                      active
                        ? "bg-white/[0.08] text-white font-semibold border border-white/12 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]"
                        : "text-white/60 hover:text-white hover:bg-white/[0.05]",
                    )}
                  >
                    <Icon className={cn("h-4 w-4 shrink-0 transition-colors", active ? "text-[#E8FF1F]" : "text-white/40 group-hover:text-white/80")} aria-hidden />
                    <span className={cn("truncate text-sm", active && "font-semibold", collapsed && "sr-only")}>{s.label}</span>
                    {active && !collapsed && (
                      <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-[#E8FF1F] shadow-[0_0_8px_#E8FF1F]" aria-hidden />
                    )}
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
    <button type="button" onClick={onToggle} aria-pressed={dark} aria-label={dark ? "Switch to the light console" : "Switch to the dark console"} className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-white/70 transition-colors hover:border-white/20 hover:bg-white/[0.08] hover:text-[#E8FF1F]">
      {dark ? <Sun className="h-4 w-4" aria-hidden /> : <Moon className="h-4 w-4" aria-hidden />}
    </button>
  );
}

function SideFoot({ name, collapsed, onCollapse }: { name: string; collapsed: boolean; onCollapse?: () => void }) {
  return (
    <div className="border-t border-white/10 p-4">
      <div className={cn("flex items-center gap-3 px-1 pb-3", collapsed && "justify-center px-0")}>
        <span aria-hidden className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#E8FF1F] text-xs font-bold uppercase text-[#0b0b0c] shadow-[0_0_12px_rgba(232,255,31,0.3)]">
          {name.trim().slice(0, 1) || "S"}
        </span>
        <p className={cn("min-w-0 flex-1 truncate text-xs font-medium text-white/90", collapsed && "sr-only")}>{name}</p>
      </div>
      <div className={cn("flex gap-2", collapsed ? "flex-col" : "items-stretch")}>
        <form action={signOut} className={cn(!collapsed && "flex-1")}>
          <button className="flex min-h-9 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-xs font-medium text-white/75 transition-all hover:border-white/20 hover:bg-white/[0.08] hover:text-white" title="Sign out">
            <LogOut className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className={cn(collapsed && "sr-only")}>Sign out</span>
          </button>
        </form>
        {onCollapse && (
          <button type="button" onClick={onCollapse} aria-pressed={collapsed} aria-label={collapsed ? "Expand the sidebar" : "Collapse the sidebar"} className="grid min-h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-white/60 transition-all hover:border-white/20 hover:bg-white/[0.08] hover:text-white">
            {collapsed ? <PanelLeftOpen className="h-3.5 w-3.5" aria-hidden /> : <PanelLeftClose className="h-3.5 w-3.5" aria-hidden />}
          </button>
        )}
      </div>
    </div>
  );
}
