import { cn } from "@/lib/utils";

type WordmarkProps = {
  className?: string;
  /** "stacked" for footers, "inline" for the nav. */
  layout?: "stacked" | "inline";
};

/** PLACEHOLDER wordmark set in Kalnia (inscription voice) until the final logotype arrives. */
export function Wordmark({ className, layout = "stacked" }: WordmarkProps) {
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
