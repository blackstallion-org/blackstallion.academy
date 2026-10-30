import type { Ref } from "react";
import { GALLERY } from "@/lib/content/museum";
import styles from "./overlay.module.css";
import { ScrollIndicator } from "./ScrollIndicator";

/**
 * Overlay for the closed doors. The museum name is carved into the 3D entrance above the doors, so the heading is
 * kept for screen readers only; the attribution, tagline and scroll cue sit quietly at the foot of the view.
 * Faded out by the scroll timeline as the doors open. (An h2: the page's h1 is the /legend title card.)
 */
export function EntranceHero({ ref }: { ref?: Ref<HTMLDivElement> }) {
  return (
    <div ref={ref} className={styles.hero}>
      <h2 className={styles.visuallyHidden} tabIndex={-1}>
        {GALLERY.name}: {GALLERY.subtitle}. {GALLERY.attribution}.
      </h2>
      <p className={styles.heroAttribution} aria-hidden="true">
        {GALLERY.attribution}
      </p>
      <p className={styles.heroTagline}>{GALLERY.tagline}</p>
      <ScrollIndicator />
    </div>
  );
}
