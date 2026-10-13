/**
 * GSAP singleton + plugin registration.
 * Import this ONCE at the top of any client component that uses GSAP.
 * Registers: ScrollTrigger, SplitText, Flip (client-side only).
 */

import { gsap } from "gsap";

// Only register on the client (avoids SSR errors)
if (typeof window !== "undefined") {
  // Dynamic import to keep SSR safe — plugins are async-registered
  import("gsap/ScrollTrigger").then(({ ScrollTrigger }) => {
    gsap.registerPlugin(ScrollTrigger);
  });
  import("gsap/SplitText").then(({ SplitText }) => {
    gsap.registerPlugin(SplitText);
  });
}

export { gsap };
export type { gsap as GSAPType };
