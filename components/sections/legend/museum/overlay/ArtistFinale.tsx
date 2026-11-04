import type { Ref } from "react";
import { CURATOR, GALLERY } from "@/lib/content/museum";
import styles from "./overlay.module.css";

/** Closing card at the end of the walk (the page opens with the museum), before the story of the Marwari. Faded in by the scroll timeline. */
export function ArtistFinale({ ref }: { ref?: Ref<HTMLElement> }) {
  return (
    <aside ref={ref} className={styles.finale} aria-labelledby="finale-title">
      <p className={styles.finaleEyebrow}>{GALLERY.name}</p>
      <h2 id="finale-title" className={styles.finaleName} tabIndex={-1}>
        {CURATOR.name}
      </h2>
      <div className={styles.panelDivider} aria-hidden="true">
        <span className={styles.diamond} />
      </div>
      <p className={styles.finaleStatement}>{CURATOR.closing}</p>
      <div className={styles.finaleActions}>
        <a className={styles.panelNext} href="#legend-story">
          {CURATOR.closingCue} <span aria-hidden="true">→</span>
        </a>
        <a className={styles.panelBack} href="#plates">
          The six plates
        </a>
      </div>
    </aside>
  );
}
