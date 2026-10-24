"use client";

import { useSyncExternalStore } from "react";
import { HERO_MODEL } from "@/components/3d/marwari-paths";

/** Where the camera dolly lands: the digital Sovereign Passport. */
export const PASSPORT_HREF = "/cadets#passport";
/** The rigged hero stallion; NEXT_PUBLIC_STALLION_MODEL overrides it (e.g. a commissioned sculpt). */
export const MODEL_URL = process.env.NEXT_PUBLIC_STALLION_MODEL || HERO_MODEL;

const MODEL_CONFIGURED = Boolean(process.env.NEXT_PUBLIC_STALLION_MODEL);
const noSubscribe = () => () => {};
/**
 * The 3D centrepiece is on when NEXT_PUBLIC_STALLION_MODEL is set. Until the owner approves it for everyone,
 * the hero keeps its film and `?stallion=preview` shows the stallion for review.
 */
export function useStallionEnabled() {
  return useSyncExternalStore(
    noSubscribe,
    () => MODEL_CONFIGURED || new URLSearchParams(window.location.search).get("stallion") === "preview",
    () => MODEL_CONFIGURED,
  );
}
