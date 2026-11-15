"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { applyTheme, getServerTheme, getTheme, subscribeTheme } from "@/lib/theme/theme";

/**
 * Nav button that switches the whole site between the light (default) and dark themes. Restored 14 Nov 2026 (owner): the
 * 1fd536e "always dark" pass had deleted it with lib/theme and the boot script; it now sits beside Search in the editorial
 * bar with the same plain-icon treatment so the bar reads as one row of controls.
 */
export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribeTheme, getTheme, getServerTheme);
  const dark = theme === "dark";
  return (
    <button
      type="button"
      onClick={() => applyTheme(dark ? "light" : "dark")}
      aria-pressed={dark}
      aria-label={dark ? "Dark mode on. Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
      className="grid h-11 w-10 shrink-0 sm:w-11 place-items-center text-bone transition-colors hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
    >
      {dark ? <Sun size={18} strokeWidth={1.5} aria-hidden /> : <Moon size={18} strokeWidth={1.5} aria-hidden />}
    </button>
  );
}
