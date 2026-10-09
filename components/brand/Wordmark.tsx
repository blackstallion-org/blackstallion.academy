import { cn } from "@/lib/utils";

type WordmarkProps = {
  className?: string;
  /** "stacked" for footers and the crest lockup, "inline" for the nav. */
  layout?: "stacked" | "inline";
};

/** PLACEHOLDER wordmark set in Cinzel until the final logotype (asset A2). */
export function Wordmark({ className, layout = "stacked" }: WordmarkProps) {
  if (layout === "inline") {
    return (
      <span className={cn("font-display text-sm tracking-[0.14em] text-ink", className)}>
        Black Stallion <span className="text-brass">Academy</span>
      </span>
    );
  }
  return (
    <span className={cn("inline-flex flex-col items-center font-display leading-none text-ink", className)}>
      <span className="text-[1.35em] font-semibold tracking-[0.16em]">Black Stallion</span>
      <span aria-hidden className="my-[0.45em] h-px w-full bg-brass/50" />
      <span className="text-[0.62em] tracking-[0.32em] text-brass">Academy of Horsemanship</span>
    </span>
  );
}
