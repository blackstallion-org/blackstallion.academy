import { cn } from "@/lib/utils";
import { MONOGRAM_VIEWBOX, blaze, earLeft, earRight } from "./paths";

type MonogramProps = {
  className?: string;
  /** Accessible name. Omit when the mark sits beside visible brand text. */
  title?: string;
};

/** The ear monogram (placeholder). Inherits colour from `currentColor`. */
export function Monogram({ className, title }: MonogramProps) {
  return (
    <svg
      viewBox={MONOGRAM_VIEWBOX}
      className={cn("h-8 w-8 text-dust", className)}
      fill="currentColor"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <path d={earLeft} />
      <path d={earRight} />
      <path d={blaze} />
    </svg>
  );
}
