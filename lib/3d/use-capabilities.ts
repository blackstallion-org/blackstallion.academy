"use client";

import { useSyncExternalStore } from "react";
import { canUseWebGL, detectQualityTier, type QualityTier } from "./device-tier";

export type Capabilities = { webgl: boolean; quality: QualityTier };

let cached: Capabilities | null = null;
const noopSubscribe = () => () => {};

function read(): Capabilities {
  cached ??= { webgl: canUseWebGL(), quality: detectQualityTier() };
  return cached;
}

/** Device capabilities, measured once on the client. `null` during server rendering and hydration. */
export function useCapabilities(): Capabilities | null {
  return useSyncExternalStore(noopSubscribe, read, () => null);
}
