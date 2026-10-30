"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * A small per-browser preference (sidebar collapsed, theme, dashboard layout) kept in localStorage. The server render and the first
 * client render both use the fallback, so nothing mismatches while hydrating; the saved value then appears. Every read and write is
 * wrapped, because storage can be blocked (a private window, a policy) and the console must work without it.
 */
const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
};

/** Holds a choice for this page load when storage refuses it. */
const memory = new Map<string, string>();

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key) ?? memory.get(key) ?? null;
  } catch {
    return memory.get(key) ?? null;
  }
}

export function usePref(key: string, fallback: string): [string, (value: string) => void] {
  const value = useSyncExternalStore(subscribe, () => read(key) ?? fallback, () => fallback);
  const set = useCallback(
    (next: string) => {
      memory.set(key, next);
      try {
        window.localStorage.setItem(key, next);
      } catch {
        /* storage blocked: the choice lasts until the next load only */
      }
      listeners.forEach((l) => l());
    },
    [key],
  );
  return [value, set];
}
