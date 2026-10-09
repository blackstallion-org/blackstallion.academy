import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/** tailwind-merge needs to know our custom scales, or it confuses
 *  `text-display-1` (a size) with `text-ink` (a colour) and drops one. */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ["display-1", "display-2", "display-3", "lede"],
      tracking: ["display", "plate"],
      radius: ["plate"],
      shadow: ["brass", "brass-strong"],
      ease: ["citadel"],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
