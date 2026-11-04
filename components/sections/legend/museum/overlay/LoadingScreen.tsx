import { asset } from "@/lib/content/asset";
import Image from "next/image";
import { GALLERY } from "@/lib/content/museum";
import styles from "./overlay.module.css";

/**
 * Shown until the first frame of the museum has rendered. It opens on a still of the closed doors (the same view the
 * live scene starts on), so the top of the page is never a blank panel while the 3D code and shaders load; the live
 * scene then fades in over it. The bar is an indeterminate shimmer: the scene is mostly
 * procedural, so there is no meaningful percentage to report. A polite status region: "Hall ready" is announced as it
 * fades (it leaves the accessibility tree once hidden, when the fade ends), and so is the slow-load notice if it appears.
 */
export function LoadingScreen({ visible, slow }: { visible: boolean; slow: boolean }) {
  return (
    <div className={styles.loader} data-visible={visible} role="status" aria-live="polite">
      <Image src={asset("/images/legend/museum/entrance-poster.webp")} alt="" fill priority sizes="100vw" className={styles.loaderPoster} />
      <span className={styles.loaderScrim} aria-hidden="true" />
      <div className={styles.loaderBody}>
        <p className={styles.loaderBrand}>{GALLERY.name}</p>
        <span className={styles.loaderBar} aria-hidden="true" />
        <p className={styles.loaderText}>{visible ? "Preparing the hall…" : "Hall ready"}</p>
        <p className={styles.heroAttribution}>{GALLERY.attribution}</p>
        {visible && slow && (
          <p className={styles.loaderSlow}>
            This is taking longer than usual. <a href="#plates">See the six plates without 3D</a>
          </p>
        )}
      </div>
    </div>
  );
}
