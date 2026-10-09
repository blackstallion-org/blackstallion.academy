import { cn } from "@/lib/utils";
import { blaze, earLeft, earRight } from "./paths";

type CrestProps = {
  className?: string;
  title?: string;
  /** Hide the ring text at small sizes, where it can't be read anyway. */
  simple?: boolean;
};

/**
 * PLACEHOLDER crest: motto ring, crossed lances, ear monogram.
 * Replaced by the hand-vectorised STPCI-style medallion (asset A1).
 */
export function Crest({ className, title = "Black Stallion Academy crest", simple = false }: CrestProps) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={cn("h-24 w-24 text-brass", className)}
      role="img"
      aria-label={title}
    >
      <defs>
        <path id="crest-arc-top" d="M30 100 A70 70 0 0 1 170 100" />
        <path id="crest-arc-bottom" d="M24 100 A76 76 0 0 0 176 100" />
      </defs>

      {/* Rings */}
      <circle cx="100" cy="100" r="95" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="100" cy="100" r="88" fill="none" stroke="currentColor" strokeWidth="0.6" opacity="0.6" />
      <circle cx="100" cy="100" r="62" fill="none" stroke="currentColor" strokeWidth="1" />

      {!simple && (
        <g fill="currentColor" className="font-display" fontSize="11.5" letterSpacing="2.6">
          <text textAnchor="middle">
            <textPath href="#crest-arc-top" startOffset="50%">
              DOMINUS SUI · DOMINUS EQUI
            </textPath>
          </text>
          <text textAnchor="middle" fontSize="9" letterSpacing="2.2">
            <textPath href="#crest-arc-bottom" startOffset="50%" dominantBaseline="hanging">
              BLACK STALLION ACADEMY
            </textPath>
          </text>
          {/* Separators at 3 and 9 o'clock */}
          <path d="M19 100 l3 -3 l3 3 l-3 3 Z" />
          <path d="M175 100 l3 -3 l3 3 l-3 3 Z" />
        </g>
      )}

      {/* Crossed lances, tips up */}
      <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="currentColor">
        <line x1="62" y1="148" x2="134" y2="58" />
        <line x1="138" y1="148" x2="66" y2="58" />
        <path d="M134 58 l7 -12 l-1.5 13.5 Z" stroke="none" />
        <path d="M66 58 l-7 -12 l1.5 13.5 Z" stroke="none" />
        {/* Pennants */}
        <path d="M126 68 l10 -2 l-6 8 Z" stroke="none" opacity="0.75" />
        <path d="M74 68 l-10 -2 l6 8 Z" stroke="none" opacity="0.75" />
      </g>

      {/* Ear monogram on a carbon disc so it reads over the lances */}
      <circle cx="100" cy="100" r="34" fill="var(--color-carbon)" stroke="currentColor" strokeWidth="1" />
      <g transform="translate(76 74) scale(0.75)" fill="currentColor">
        <path d={earLeft} />
        <path d={earRight} />
        <path d={blaze} />
      </g>
    </svg>
  );
}
