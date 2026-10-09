import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "quiet" | "ghost";
type Size = "md" | "lg";

const base =
  "group/button relative inline-flex items-center justify-center gap-3 rounded-plate font-sans font-medium tracking-[0.04em] " +
  "transition-[color,background-color,border-color,box-shadow] duration-200 ease-in-out " +
  "disabled:pointer-events-none disabled:opacity-40 aria-disabled:pointer-events-none aria-disabled:opacity-40";

const variants: Record<Variant, string> = {
  /** Brass hairline, the default call to action. Never a solid gold fill. */
  primary:
    "border border-brass/70 text-ink bg-brass/[0.04] hover:border-parchment-gold hover:bg-brass/[0.1] hover:shadow-brass-strong active:bg-brass/[0.14]",
  /** Carbon plate for secondary actions. */
  quiet:
    "border border-brass/25 bg-carbon text-ink hover:border-brass/60 hover:text-parchment-gold",
  /** Text only, for tertiary actions inside dense UI. */
  ghost:
    "border border-transparent text-brass underline-offset-[6px] decoration-brass/40 hover:text-parchment-gold hover:underline",
};

const sizes: Record<Size, string> = {
  md: "h-11 px-5 text-sm",
  lg: "h-14 px-8 text-[0.95rem]",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
};

type ButtonAsButton = CommonProps &
  Omit<ComponentPropsWithoutRef<"button">, keyof CommonProps> & { href?: undefined };
type ButtonAsLink = CommonProps &
  Omit<ComponentPropsWithoutRef<typeof Link>, keyof CommonProps> & { href: string };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

/** Brand button. Pass `href` to render a Next.js link with the same styling. */
export function Button({ variant = "primary", size = "md", className, children, ...props }: ButtonProps) {
  const classes = cn(base, variants[variant], sizes[size], className);
  if (typeof props.href === "string") {
    const linkProps = props as ButtonAsLink;
    return (
      <Link {...linkProps} className={classes}>
        {children}
      </Link>
    );
  }
  const buttonProps = props as ButtonAsButton;
  return (
    <button type="button" {...buttonProps} className={classes}>
      {children}
    </button>
  );
}
