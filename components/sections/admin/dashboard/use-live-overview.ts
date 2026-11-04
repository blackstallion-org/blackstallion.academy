"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { arrivals, type OverviewSnapshot } from "@/lib/admin/overview";

export type LiveState = "live" | "retrying" | "paused";

/** How often an open, visible dashboard asks for fresh figures. */
export const REFRESH_MS = 10_000;
const MAX_BACKOFF_MS = 60_000;
const FLASH_MS = 4_500;

/**
 * Keeps a dashboard snapshot fresh. While the tab is visible it asks `refresh()` every ten seconds; when the tab comes back it asks at
 * once; if a call fails it keeps the figures it has, says "retrying" and backs off (doubling, up to a minute) until one succeeds.
 * Nothing runs while the tab is hidden, and never two calls at once. Arrivals (ids new since the last snapshot) are reported for a
 * few seconds so the feed can flash them; `sinceOpen` counts the enquiries that arrived after this page was opened.
 */
export function useLiveOverview(initial: OverviewSnapshot, refresh: () => Promise<OverviewSnapshot>, intervalMs: number = REFRESH_MS) {
  const [snapshot, setSnapshot] = useState(initial);
  const [state, setState] = useState<LiveState>("live");
  const [lastOkAt, setLastOkAt] = useState(() => Date.parse(initial.generatedAt) || 0);
  const [fresh, setFresh] = useState<ReadonlySet<string>>(new Set());
  const [sinceOpen, setSinceOpen] = useState(0);
  const latest = useRef(initial);
  const inFlight = useRef(false);
  const failures = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flash = useRef<ReturnType<typeof setTimeout> | null>(null);
  const run = useRef<() => void>(() => {});

  const apply = useCallback((next: OverviewSnapshot) => {
    const prev = latest.current;
    const newIds = arrivals(prev.activity, next.activity);
    const newEnquiries = arrivals(prev.rows, next.rows).size;
    latest.current = next;
    setSnapshot(next);
    if (newIds.size) {
      setFresh(newIds);
      if (flash.current) clearTimeout(flash.current);
      flash.current = setTimeout(() => setFresh(new Set()), FLASH_MS);
    }
    if (newEnquiries) setSinceOpen((n) => n + newEnquiries);
  }, []);

  useEffect(() => {
    let stopped = false;
    const schedule = (ms: number) => {
      if (timer.current) clearTimeout(timer.current);
      if (stopped) return;
      timer.current = setTimeout(() => run.current(), ms);
    };
    run.current = async () => {
      if (stopped) return;
      if (document.hidden) {
        setState("paused");
        return; // the visibilitychange handler restarts the loop
      }
      if (inFlight.current) return;
      inFlight.current = true;
      try {
        const next = await refresh();
        if (stopped) return;
        failures.current = 0;
        apply(next);
        setLastOkAt(Date.now());
        setState("live");
        schedule(intervalMs);
      } catch {
        if (stopped) return;
        failures.current += 1;
        setState("retrying");
        schedule(Math.min(MAX_BACKOFF_MS, intervalMs * 2 ** failures.current));
      } finally {
        inFlight.current = false;
      }
    };
    const onVisible = () => {
      if (document.hidden) {
        if (timer.current) clearTimeout(timer.current);
        setState("paused");
      } else {
        run.current();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    schedule(intervalMs);
    return () => {
      stopped = true;
      if (timer.current) clearTimeout(timer.current);
      if (flash.current) clearTimeout(flash.current);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh, apply, intervalMs]);

  /** Ask now (the "refresh" button). */
  const refreshNow = useCallback(() => run.current(), []);
  return { snapshot, state, lastOkAt, fresh, sinceOpen, refreshNow };
}
