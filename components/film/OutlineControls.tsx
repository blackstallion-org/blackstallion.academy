import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import styles from "./OutlineControls.module.css";

/** Put on a section to define the invitation palette tokens (`--inv-*`) for everything inside it. */
export const invitationTheme = styles.theme;

/** Small uppercase caption in the invitation's quiet ivory. */
export const captionClass = styles.caption;

/** The one outlined action of a section: brass hairline, a fine underline that draws in on hover, no fill, no glow. */
export function OutlineButton({ className, children, type = "button", ...props }: ComponentProps<"button">) {
  return (
    <button type={type} className={cn(styles.button, className)} {...props}>
      <span className={styles.line}>{children}</span>
    </button>
  );
}

/** A secondary action: uppercase ivory text with the same drawn-in underline. */
export function LineLink({ className, children, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link className={cn(styles.line, styles.link, className)} {...props}>
      {children}
    </Link>
  );
}
