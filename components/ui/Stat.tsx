import { CountUp } from "@/components/motion/CountUp";
import { cn } from "@/lib/utils";

type StatProps = {
  value: number;
  label: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  /** Parchment gold for the one number that matters most on a screen. */
  emphasis?: boolean;
  className?: string;
};

/** A telemetry figure: mono number with count-up, Inter label beneath. */
export function Stat({ value, label, prefix, suffix, decimals, emphasis = false, className }: StatProps) {
  return (
    <div className={cn("flex flex-col gap-2 border-t border-brass/25 pt-4", className)}>
      <CountUp
        value={value}
        prefix={prefix}
        suffix={suffix}
        decimals={decimals}
        className={cn(
          "font-mono text-3xl font-medium leading-none sm:text-4xl",
          emphasis ? "text-parchment-gold" : "text-ink",
        )}
      />
      <span className="text-sm text-muted">{label}</span>
    </div>
  );
}
