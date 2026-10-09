import { cn } from "@/lib/utils";

type DividerProps = {
  /** line: plain brass hairline · lance: crossed lances at the centre · seal: a small diamond */
  variant?: "line" | "lance" | "seal";
  className?: string;
};

function Lances() {
  return (
    <svg viewBox="0 0 40 24" className="h-5 w-9 shrink-0 text-brass" aria-hidden>
      <g stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
        <line x1="6" y1="21" x2="31" y2="4" />
        <line x1="34" y1="21" x2="9" y2="4" />
      </g>
      <g fill="currentColor">
        <path d="M31 4 l4.5 -3.5 l-2 5 Z" />
        <path d="M9 4 l-4.5 -3.5 l2 5 Z" />
        <path d="M20 9.5 l2.5 2.5 l-2.5 2.5 l-2.5 -2.5 Z" />
      </g>
    </svg>
  );
}

/** Section divider. A real separator for assistive tech, decorative glyph hidden. */
export function Divider({ variant = "line", className }: DividerProps) {
  if (variant === "line") {
    return <hr className={cn("border-0 border-t border-brass/25", className)} />;
  }
  return (
    <div role="separator" className={cn("flex items-center gap-4", className)}>
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-brass/50" />
      {variant === "lance" ? (
        <Lances />
      ) : (
        <span aria-hidden className="h-2 w-2 rotate-45 border border-brass" />
      )}
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-brass/50" />
    </div>
  );
}
