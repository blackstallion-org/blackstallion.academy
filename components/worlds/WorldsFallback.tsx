import Link from "next/link";
import { WORLD_SWISS, WORLDS_CREDITS, WORLDS_FINAL } from "@/lib/content/worlds";
import { CHAPTERS } from "./core/timeline";
import styles from "./four-worlds.module.css";

const ALT: Record<string, string> = {
  origins: "A black Marwari horse on a grassy hill above a green valley, a river and the academy at golden hour.",
  life: "A translucent horse drawn in light, its skeleton and muscles glowing gold among living cells.",
  legacy: "The black Marwari in the desert below a Rajasthan hill fort, a cavalry column in the haze.",
  beyond: "The black Marwari on a gold-lit platform in orbit, a planet and its rings behind.",
};

/**
 * The Four Worlds without the 3D engine: shown for reduced motion, when WebGL 2 is not available, or if the engine fails.
 * The stills are frames rendered from the real scenes (public/worlds/posters), set in the same Swiss type as the film.
 */
export function WorldsFallback({ reason }: { reason: "reduced" | "webgl" | "error" }) {
  return (
    <section className={`${styles.fallback} tone-photo`} aria-label="Four Worlds">
      {reason !== "reduced" && (
        <p className={styles.fallbackNote}>
          {reason === "webgl" ? "Your browser cannot show the 3D film, so here are its four worlds as stills." : "The 3D film could not start, so here are its four worlds as stills."}
        </p>
      )}
      {CHAPTERS.map((c) => {
        const copy = WORLD_SWISS[c.id];
        return (
          <article key={c.id} className={styles.still}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/worlds/posters/${c.id}.webp`} alt={ALT[c.id]} loading={c.id === "origins" ? "eager" : "lazy"} className={styles.stillImg} />
            <div className={styles.stillShade} aria-hidden />
            <div className={styles.stillText}>
              <span className={styles.numeral} aria-hidden>{c.n}</span>
              <div className={styles.cardText}>
                <h2 className={styles.title}>{c.title}</h2>
                <p className={styles.line}>{copy.line}</p>
                {copy.note && <p className={styles.note}>{copy.note}</p>}
              </div>
            </div>
          </article>
        );
      })}
      <div className={styles.fallbackFinal}>
        <h2 className={styles.finalHead}>{WORLDS_FINAL.inscription}</h2>
        <p className={styles.finalSub}>{WORLDS_FINAL.sub}</p>
        <div className={styles.ctas}>
          <Link href={WORLDS_FINAL.primary.href} className={styles.primary}>{WORLDS_FINAL.primary.label} <span aria-hidden>→</span></Link>
          <Link href={WORLDS_FINAL.secondary.href} className={styles.secondary}>{WORLDS_FINAL.secondary.label} <span aria-hidden>→</span></Link>
        </div>
      </div>
      <p className={styles.fallbackNote}>{WORLDS_CREDITS}</p>
    </section>
  );
}
