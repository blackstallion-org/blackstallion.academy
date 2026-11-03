import type { ComponentPropsWithoutRef } from "react";

/**
 * A plain paragraph. It used to fade in word by word as the page scrolled; the owner asked for every paragraph to be static (3 Nov 2026),
 * so the text is shown in full ink from the start. The component stays, rather than ninety edits across the site, and keeps the
 * `data-scroll-text-reveal` marker, which the home page's own detail-rise skips, so these paragraphs do not animate there either.
 */
export function ScrollRevealText({ children, ...props }: ComponentPropsWithoutRef<"p">) {
  return <p {...props} data-scroll-text-reveal="words">{children}</p>;
}
