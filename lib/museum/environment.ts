"use client";

/**
 * Environment hooks the museum code reads. The Arvista demo shipped its own copies; here they are the site's
 * hydration-safe hooks, so the museum agrees with the rest of /legend about reduced motion and device tier.
 */
export { useCapabilities } from "@/lib/3d/use-capabilities";
export { useReducedMotion as usePrefersReducedMotion } from "@/lib/motion/reduced";
