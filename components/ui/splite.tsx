"use client";

import { Component, Suspense, lazy, type ReactNode } from "react";

const Spline = lazy(() => import("@splinetool/react-spline"));

interface SplineSceneProps {
  scene: string;
  className?: string;
}

/** The scene is fetched from Spline's CDN at runtime; if that fails the section must still stand, so nothing is shown. */
class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/**
 * A Spline 3D scene, loaded only when the section it sits in is rendered (the runtime is about a megabyte).
 * The scene file itself is streamed from Spline's CDN; the hosts are allowed in the CSP (next.config.mjs).
 */
export function SplineScene({ scene, className }: SplineSceneProps) {
  return (
    <SceneBoundary>
      <Suspense fallback={null}>
        <Spline scene={scene} className={className} />
      </Suspense>
    </SceneBoundary>
  );
}
