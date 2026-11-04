/**
 * Site colour theme (4 Nov 2026, owner): light by default, dark as a visitor choice. The choice is kept in localStorage
 * and applied as <html data-theme="dark"> by `themeBootScript` before first paint, so a returning visitor never sees a
 * flash of the other theme. Styles: app/globals.css → "Dark mode".
 */
export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "bsah-theme";
const LIGHT_BAR = "#F3EDE2";
const DARK_BAR = "#171412";

/** Inlined in <head> (app/layout.tsx). Plain ES5 so it runs before any bundle. */
export const themeBootScript = `try{if(localStorage.getItem("${THEME_STORAGE_KEY}")==="dark"){document.documentElement.dataset.theme="dark"}}catch(e){}`;

const listeners = new Set<() => void>();

export function getTheme(): Theme {
  return typeof document !== "undefined" && document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

export function getServerTheme(): Theme {
  return "light";
}

export function subscribeTheme(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function applyTheme(next: Theme): void {
  const root = document.documentElement;
  const animate = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (animate) root.classList.add("theme-switching");
  if (next === "dark") root.dataset.theme = "dark";
  else delete root.dataset.theme;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, next);
  } catch {
    // Private mode or blocked storage: the choice still applies for this page view.
  }
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", next === "dark" ? DARK_BAR : LIGHT_BAR);
  if (animate) window.setTimeout(() => root.classList.remove("theme-switching"), 400);
  listeners.forEach((listener) => listener());
}
