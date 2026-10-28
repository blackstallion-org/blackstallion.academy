import { FilmImage } from "@/components/film/FilmImage";
import styles from "./HeroOpening.module.css";

/** The dust-and-dark opening laid over the hero film (see the stylesheet). Decorative: hidden from assistive tech. */
export function HeroOpening() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-[5]">
      <div className={styles.bloom} />
      <div className={`${styles.dust} ${styles.dustA}`}>
        <div className={styles.dustFar}>
          <FilmImage name="dustWall" blend="screen" grade="none" sizes="100vw" />
        </div>
        <div className={styles.dustNear}>
          <FilmImage name="dustPlume" blend="screen" grade="none" sizes="100vw" />
        </div>
      </div>
      <div className={styles.veil} />
    </div>
  );
}
