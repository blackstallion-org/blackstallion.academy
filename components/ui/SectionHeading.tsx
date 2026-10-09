import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  title: ReactNode;
  /** Cormorant italic line under the title. */
  lede?: ReactNode;
  /**
   * A sequence number (01, 02…). Only when the sections really are a sequence
   * (chapters, steps, ranks). Never as decoration.
   */
  index?: string;
  as?: "h1" | "h2" | "h3";
  size?: "1" | "2" | "3";
  align?: "start" | "center";
  className?: string;
  id?: string;
};

const sizes = {
  "1": "text-display-1",
  "2": "text-display-2",
  "3": "text-display-3",
} as const;

export function SectionHeading({
  title,
  lede,
  index,
  as: Tag = "h2",
  size = "2",
  align = "start",
  className,
  id,
}: SectionHeadingProps) {
  return (
    <header className={cn("flex flex-col gap-5", align === "center" && "items-center text-center", className)}>
      {index && (
        <span className="font-mono text-xs text-brass" aria-hidden>
          {index}
        </span>
      )}
      <Tag id={id} className={cn("font-display tracking-display text-balance text-ink", sizes[size])}>
        {title}
      </Tag>
      {lede && (
        <p
          className={cn(
            "max-w-[36ch] font-editorial text-lede italic text-pretty text-muted",
            align === "center" && "mx-auto",
          )}
        >
          {lede}
        </p>
      )}
    </header>
  );
}
