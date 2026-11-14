import { cn } from "@/lib/utils";

type WordmarkProps = {
  className?: string;
  /** "stacked" for footers, "inline" for small lockups, "bold" for the nav bar's centre. */
  layout?: "stacked" | "inline" | "bold";
};

/** PLACEHOLDER wordmark set in Kalnia (inscription voice) until the final logotype arrives. */
export function Wordmark({ className, layout = "stacked" }: WordmarkProps) {
  if (layout === "bold") {
    // The header lockup (14 Nov 2026, owner's reference): one line, the crest sits beside it in the nav. BLACK STALLION is the
    // larger word; the academy's name follows in bold chestnut caps. Below 1700 px only BLACK STALLION shows, so the bar keeps
    // room for the five menu words and the controls. Sizes step up with the viewport; nothing wraps.
    return (
      <span className={cn("inline-flex items-baseline gap-x-[0.85em] whitespace-nowrap leading-none text-bone", className)}>
        <span className="t-inscribe text-[1.05rem] font-[500] tracking-[0.09em] min-[400px]:text-[1.15rem] sm:text-[1.36rem] min-[1024px]:text-[1.5rem] min-[1536px]:text-[1.7rem]">
          Black Stallion
        </span>
        <span className="t-inscribe hidden font-[700] tracking-[0.02em] text-gold min-[1700px]:inline min-[1700px]:text-[1.15rem]">
          Academy of Horsemanship
        </span>
      </span>
    );
  }
  if (layout === "inline") {
    // The full name beside the crest (owner's request, 2 Nov 2026): the BLACK STALLION identity on top, the academy's
    // name beneath it. Compact on phones so the 64 px bar keeps room for the controls; the two lines never wrap.
    return (
      <span className={cn("inline-flex flex-col justify-center whitespace-nowrap leading-none text-bone", className)}>
        <span className="t-inscribe text-[0.76rem] tracking-[0.06em] sm:text-[0.82rem]">Black Stallion</span>
        <span className="label mt-[0.35em] text-[0.52rem] tracking-[0.1em] text-brass sm:text-[0.56rem] sm:tracking-[0.14em]">Academy of Horsemanship</span>
      </span>
    );
  }
  return (
    <span className={cn("inline-flex flex-col leading-none text-bone", className)}>
      <span className="t-inscribe text-[1.5em] tracking-[0.04em]">Black Stallion</span>
      <span aria-hidden className="my-[0.6em] h-px w-full bg-line" />
      <span className="label text-[0.62em] text-brass">Academy of Horsemanship</span>
    </span>
  );
}
