import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/** tailwind-merge needs to know our custom scales, or it confuses
 *  `text-display-1` (a size) with `text-gold` (a colour) and drops one. */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ["poster", "display-1", "display-2", "display-3", "lede"],
      tracking: ["label"],
      ease: ["citadel", "film"],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
