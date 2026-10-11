import { cn } from "@/lib/utils";

type WordmarkProps = {
  className?: string;
  /** "stacked" for footers, "inline" for the nav. */
  layout?: "stacked" | "inline";
};

/** PLACEHOLDER wordmark set in Kalnia (inscription voice) until the final logotype arrives. */
export function Wordmark({ className, layout = "stacked" }: WordmarkProps) {
  if (layout === "inline") {
    return (
      <span className={cn("t-inscribe text-[0.82rem] leading-none tracking-[0.06em] text-bone", className)}>
        Black Stallion
      </span>
    );
  }
  return (
    <span className={cn("inline-flex flex-col leading-none text-bone", className)}>
      <span className="t-inscribe text-[1.5em] tracking-[0.04em]">Black Stallion</span>
      <span aria-hidden className="my-[0.6em] h-px w-full bg-brass" />
      <span className="label text-[0.62em] text-dust">Academy of Horsemanship</span>
    </span>
  );
}
