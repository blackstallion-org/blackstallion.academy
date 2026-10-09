import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

type CardProps<T extends ElementType> = {
  as?: T;
  /**
   * default: the manifesto card (carbon, brass hairline, glow).
   * plate:   adds engraved corner marks, for registry entries (studbook, passport, ledger).
   * quiet:   no glow, for cards inside cards or dense lists.
   */
  variant?: "default" | "plate" | "quiet";
  /** Brightens the hairline on hover. Use only when the whole card is clickable. */
  interactive?: boolean;
  className?: string;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "className" | "children">;

const corner = "pointer-events-none absolute h-3 w-3 border-brass/80";

export function Card<T extends ElementType = "div">({
  as,
  variant = "default",
  interactive = false,
  className,
  children,
  ...props
}: CardProps<T>) {
  const Tag = (as ?? "div") as ElementType;
  return (
    <Tag
      className={cn(
        "bsah-card relative p-6 sm:p-8",
        variant === "quiet" && "shadow-none",
        interactive &&
          "transition-[border-color,box-shadow] duration-200 ease-in-out hover:border-brass/60 hover:shadow-brass-strong",
        className,
      )}
      {...props}
    >
      {variant === "plate" && (
        <>
          <span aria-hidden className={cn(corner, "left-2 top-2 border-l border-t")} />
          <span aria-hidden className={cn(corner, "right-2 top-2 border-r border-t")} />
          <span aria-hidden className={cn(corner, "bottom-2 left-2 border-b border-l")} />
          <span aria-hidden className={cn(corner, "bottom-2 right-2 border-b border-r")} />
        </>
      )}
      {children}
    </Tag>
  );
}
