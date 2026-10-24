"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ExpandableTextProps {
  children: ReactNode;
  lines?: 1 | 2 | 3;
  className?: string;
  buttonClassName?: string;
}

export function ExpandableText({
  children,
  lines = 2,
  className,
  buttonClassName,
}: ExpandableTextProps) {
  const [expanded, setExpanded] = useState(false);

  const clampClass = {
    1: "line-clamp-1",
    2: "line-clamp-2",
    3: "line-clamp-3",
  }[lines];

  return (
    <div className={cn("relative", className)}>
      <div className={cn("transition-all duration-300", !expanded && clampClass)}>
        {children}
      </div>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "mt-2 inline-flex items-center gap-1 font-mono text-[0.68rem] uppercase tracking-[0.16em] text-[#844628] hover:text-gold transition-colors focus:outline-none cursor-pointer",
          buttonClassName
        )}
        aria-expanded={expanded}
      >
        <span>{expanded ? "Read less" : "Read more"}</span>
        <span className="text-[0.6rem] transition-transform duration-200">
          {expanded ? "↑" : "↓"}
        </span>
      </button>
    </div>
  );
}
