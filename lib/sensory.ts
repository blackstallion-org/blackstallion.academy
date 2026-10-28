import { soundEnabled } from "@/lib/audio/engine";

/**
 * Optional sensory feedback (haptics) for interactive scenes. Everything here is safe by construction:
 * off under reduced motion, off when the visitor has switched the site's Sound toggle off (that toggle is the one
 * "no sensory effects" control), only where the Vibration API exists, only after the visitor has interacted with the page,
 * and only ever a few milliseconds long. Call it from a pointer or key handler, never from a timer or on load.
 */

/** Fails closed: if the preference cannot be read, assume the visitor wants no effects. */
export function prefersReducedMotion(): boolean {
  try {
    return typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return true;
  }
}

type ActivationNavigator = Navigator & { userActivation?: { hasBeenActive: boolean } };

export function hapticsAllowed(): boolean {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return false;
  if (prefersReducedMotion() || !soundEnabled()) return false;
  const activation = (navigator as ActivationNavigator).userActivation;
  return activation ? activation.hasBeenActive : true;
}

/** Hard ceiling for one pulse. */
export const HAPTIC_MAX_MS = 20;

/** One short pulse. Returns whether the browser accepted it. */
export function haptic(ms = 6): boolean {
  if (!hapticsAllowed()) return false;
  try {
    return navigator.vibrate(Math.max(1, Math.min(HAPTIC_MAX_MS, ms)));
  } catch {
    return false;
  }
}
