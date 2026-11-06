import Link from "next/link";
import { WORLD_COPY, WORLDS_FINAL } from "@/lib/content/worlds";
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
 * The stills are frames rendered from the real scenes (public/worlds/posters). Text fades only (globals handle reduced motion).
 */
export function WorldsFallback({ reason }: { reason: "reduced" | "webgl" | "error" }) {
  return (
    <section className={`${styles.fallback} tone-photo`} aria-label="Four Worlds">
      {reason !== "reduced" && (
        <p className={`label ${styles.fallbackNote}`}>
          {reason === "webgl" ? "Your browser cannot show the 3D film, so here are its four worlds as stills." : "The 3D film could not start, so here are its four worlds as stills."}
        </p>
      )}
      {CHAPTERS.map((c) => {
        const copy = WORLD_COPY[c.id];
        return (
          <article key={c.id} className={styles.still}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/worlds/posters/${c.id}.webp`} alt={ALT[c.id]} loading={c.id === "origins" ? "eager" : "lazy"} className={styles.stillImg} />
            <div className={styles.stillShade} aria-hidden />
            <div className={styles.stillText}>
              <p className="label text-gold">
                <span className="font-mono">{c.n}</span> — {c.title.toUpperCase()}
              </p>
              <p className={`label ${styles.sub}`}>{c.subtitle.toUpperCase()}</p>
              <span className={styles.rule} aria-hidden />
              <h2 className={styles.headline}>
                <span className="t-inscribe block">{copy.inscription}</span>
                <span className="t-voice block text-gold">{copy.voice}</span>
              </h2>
              <p className={styles.line}>{copy.line}</p>
              {copy.note && <p className={styles.note}>{copy.note}</p>}
            </div>
          </article>
        );
      })}
      <div className={styles.fallbackFinal}>
        <h2 className={styles.finalHeadline}>
          <span className="t-inscribe block">{WORLDS_FINAL.inscription}</span>
          <span className="t-voice block text-gold">{WORLDS_FINAL.voice}</span>
        </h2>
        <div className={styles.ctas}>
          <Link href={WORLDS_FINAL.primary.href} className={styles.primary}><span className="label">{WORLDS_FINAL.primary.label}</span></Link>
          <Link href={WORLDS_FINAL.secondary.href} className={styles.secondary}><span className="label">{WORLDS_FINAL.secondary.label}</span></Link>
        </div>
      </div>
    </section>
  );
}
