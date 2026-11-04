"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { loadStrideRig, type StrideRig } from "./rig";

/** Hydration-safe media query: false on the server and for the first client render. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export type RigState = { status: "idle" | "loading" | "ready" | "failed"; rig: StrideRig | null; progress: number };

/** Loads the horse, the rider and every curve once `enabled`; disposes them on unmount. */
export function useStrideRig(enabled: boolean): RigState {
  const [state, setState] = useState<RigState>({ status: "idle", rig: null, progress: 0 });
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let loaded: StrideRig | null = null;
    // start after the first paint so the headline is never waiting on the model
    const start = () => {
      setState((s) => ({ ...s, status: "loading" }));
      loadStrideRig((progress) => !cancelled && setState((s) => (s.status === "loading" ? { ...s, progress } : s)))
        .then((rig) => {
          if (cancelled) {
            rig.dispose();
            return;
          }
          loaded = rig;
          setState({ status: "ready", rig, progress: 1 });
        })
        .catch((error) => {
          console.warn("[stride] the animation could not be loaded", error instanceof Error ? error.message : error);
          if (!cancelled) setState({ status: "failed", rig: null, progress: 0 });
        });
    };
    const id = window.setTimeout(start, 60);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
      loaded?.dispose();
    };
  }, [enabled]);
  return state;
}
