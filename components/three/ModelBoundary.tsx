"use client";

import { Component, type ReactNode } from "react";

/**
 * Error boundary for 3D model content inside a <Canvas>. If a GLB fails to download or decode (network, CDN,
 * missing file, decoder error), the 3D layer renders nothing instead of taking the whole route down; the
 * surrounding photography and copy stay on screen. Optional onFailure lets a scene show its own static fallback.
 */
export class ModelBoundary extends Component<{ children: ReactNode; fallback?: ReactNode; onFailure?: (error: unknown) => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.warn("[bsah] 3D model unavailable; showing the page without it.", error instanceof Error ? error.message : error);
    this.props.onFailure?.(error);
  }
  render() {
    return this.state.failed ? (this.props.fallback ?? null) : this.props.children;
  }
}
