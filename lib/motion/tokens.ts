import type { Transition, Variants } from "motion/react";

/**
 * BSAH motion tokens. Weighted, never bouncy.
 * Source: docs/brand/cinematic-design-manifesto.md + docs/design-brief.md.
 */

export const ease = {
  /** The house curve. Use it for everything unless there is a reason not to. */
  citadel: [0.16, 1, 0.3, 1],
  /** Symmetric curve for things that leave as deliberately as they arrive (curtain). */
  inOut: [0.65, 0, 0.35, 1],
} as const satisfies Record<string, [number, number, number, number]>;

export const dur = {
  /** Hover, focus, brass border highlight */
  micro: 0.2,
  /** Drawers, modals, tabs */
  ui: 0.4,
  /** Text and image reveals */
  reveal: 0.8,
  /** Page curtain, chapter changes */
  cinematic: 1.4,
} as const;

/** Delay between lines or list items */
export const stagger = 0.06;

export const transition = {
  micro: { duration: dur.micro, ease: ease.citadel },
  ui: { duration: dur.ui, ease: ease.citadel },
  reveal: { duration: dur.reveal, ease: ease.citadel },
  cinematic: { duration: dur.cinematic, ease: ease.inOut },
} satisfies Record<string, Transition>;

/** Default viewport settings for scroll reveals: fire once, a little before fully in view. */
export const inViewOnce = { once: true, amount: 0.35 } as const;

/* ---------------------------------------------------------------- variants */

/** Rise 24px and fade in. The default reveal. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: transition.reveal },
};

export const fade: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: transition.reveal },
};

/** Parent that staggers its children. */
export const staggerChildren = (delayChildren = 0): Variants => ({
  hidden: {},
  visible: { transition: { staggerChildren: stagger, delayChildren } },
});

/** A line rising out of a clipping mask (used by SplitLines). */
export const lineReveal: Variants = {
  hidden: { y: "110%" },
  visible: { y: "0%", transition: { duration: dur.reveal, ease: ease.citadel } },
};

/** The brass seal: lands heavy, settles, no overshoot. */
export const sealStamp: Variants = {
  hidden: { opacity: 0, scale: 1.15, rotate: 4 },
  visible: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: { duration: 0.5, ease: ease.citadel },
  },
};

/** Obsidian curtain that lifts off the page on navigation. */
export const curtain: Variants = {
  covered: { y: "0%" },
  lifted: { y: "-100%", transition: { duration: dur.cinematic * 0.65, ease: ease.inOut, delay: 0.15 } },
};
