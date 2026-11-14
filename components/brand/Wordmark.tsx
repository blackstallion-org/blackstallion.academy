import { cn } from "@/lib/utils";

type WordmarkProps = {
  /** With `size="custom"`, set a text size here to scale the whole lockup (both lines are sized in em). */
  className?: string;
  /** "bar" (default): the sizes that fit the 64 / 80 px nav bar, stepping down on phones. "custom": the caller's text size. */
  size?: "bar" | "custom";
  /** The one lockup. Kept as a prop so every call reads `<Wordmark layout="inline" />`. */
  layout?: "inline";
};

/**
 * The brand lockup (owner's standing rule, CLAUDE.md → Navigation): BLACK STALLION with ACADEMY OF HORSEMANSHIP under it,
 * always both lines, beside the crest in the nav, the Reels menu, the console header and the footer. One variant only.
 * Both lines are sized in em, so a caller scales it with a text size; on a tight bar it shrinks, the second line never drops.
 * PLACEHOLDER type until the final logotype arrives.
 */
export function Wordmark({ className, layout = "inline", size = "bar" }: WordmarkProps) {
  if (layout === "inline") {
    return (
      <span
        className={cn(
          "inline-flex flex-col justify-center whitespace-nowrap text-bone",
          size === "bar" && "text-[0.8rem] min-[400px]:text-[0.88rem] sm:text-[1rem] md:text-[1.08rem] min-[1440px]:text-[1.22rem]",
          className,
          // after every size class: tailwind-merge drops a line-height that comes before a font size
          "leading-none",
        )}
      >
        <span className="t-inscribe text-[1em] font-[600] tracking-[0.07em]">Black Stallion</span>
        <span className="label mt-[0.45em] text-[0.5em] tracking-[0.15em] text-gold">Academy of Horsemanship</span>
      </span>
    );
  }
  return null;
}
