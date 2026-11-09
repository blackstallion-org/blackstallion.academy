"use client";

import dynamic from "next/dynamic";
import { Component, useCallback, useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import { useReducedMotion } from "@/lib/motion/reduced";
import { ALEXANDER_ROUTE, RELIEFS } from "@/lib/content/history/reliefs";
import type { ReliefId } from "@/lib/content/history/types";

import type { PlateSource } from "./reliefs/ReliefCanvas";

const ReliefCanvas = dynamic(() => import("./reliefs/ReliefCanvas"), { ssr: false });

/* At most one WebGL scene on the page: the relief nearest the viewport centre holds the slot. */
let active: ReliefId | null = null;
const listeners = new Set<() => void>();
const claim = (id: ReliefId | null) => {
  if (active === id) return;
  active = id;
  listeners.forEach((l) => l());
};
const subscribe = (l: () => void) => (listeners.add(l), () => listeners.delete(l));
const useActive = () => useSyncExternalStore(subscribe, () => active, () => null);

const hasWebGL = () => {
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
};

class Boundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/**
 * Mounts a painted relief over its region of the scene once the scene is near the viewport. The flat painting below it
 * is always present: if WebGL is missing, the context is lost, the chunk fails to load, or motion is reduced, the relief
 * simply never appears and the story is unchanged.
 */
export function ReliefMount({ id, plate }: { id: ReliefId; plate?: PlateSource }) {
  const spec = RELIEFS[id];
  const ref = useRef<HTMLDivElement>(null);
  const labels = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const current = useActive();
  const [near, setNear] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = ref.current;
    // Without WebGL the observer never starts, so the relief never mounts and the flat painting stays.
    if (!el || reduced || !hasWebGL()) return;
    const io = new IntersectionObserver(
      ([e]) => {
        setNear(e.isIntersecting);
        if (e.isIntersecting) claim(id);
        else if (active === id) claim(null);
      },
      { rootMargin: "25% 0px" },
    );
    io.observe(el);
    const onVis = () => setHidden(document.visibilityState === "hidden");
    document.addEventListener("visibilitychange", onVis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      if (active === id) claim(null);
    };
  }, [id, reduced]);

  const markReady = useCallback(() => setReady(true), []);
  const mounted = near && current === id && !failed && !reduced;
  const d = spec.bounds;
  const m = spec.mobile ?? d;
  const style = {
    "--rx": `${d.x}%`, "--ry": `${d.y}%`, "--rw": `${d.w}%`, "--rh": `${d.h}%`,
    "--rmx": `${m.x}%`, "--rmy": `${m.y}%`, "--rmw": `${m.w}%`, "--rmh": `${m.h}%`,
  } as CSSProperties;
  return (
    <div
      ref={ref}
      className="hs-layer hs-layer-relief"
      style={style}
      aria-hidden
      data-relief={id}
    >
      {mounted && (
        <Boundary onError={() => setFailed(true)}>
          <ReliefCanvas
            id={id}
            paused={hidden}
            track={ref}
            onReady={markReady}
            onLost={() => setFailed(true)}
            className={`hs-relief-canvas ${spec.kind === "map" ? "hs-relief-map" : ""}`}
            ready={ready}
            labels={labels}
            plate={plate}
          />
        </Boundary>
      )}
      {id === "AL04" && mounted && (
        <div ref={labels} className="hs-map-labels" data-ready={ready}>
          {ALEXANDER_ROUTE.map((s) => (
            <span key={s.name} className="hs-map-label" data-stop={s.name} data-below={s.below || undefined}>
              {s.name}
              {s.year && <small>{s.year}</small>}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
