/* The six-panel legacy scroll. It sits in normal document flow after the pinned chapters: no pin, no GSAP, nothing to scrub. */
/* eslint-disable @next/next/no-img-element */

import { asset } from "@/lib/content/asset";
import "./story.css";

export function LegacyScroll() {
  return (
    <section className="ms-legacy" aria-labelledby="ms-legacy-title">
      <h2 id="ms-legacy-title" className="sr-only">
        The Marwari legacy in six panels
      </h2>
      <figure className="ms-legacy__figure">
        <img
          className="ms-legacy__img"
          src={asset("/images/story/marwari/legacy-scroll.webp")}
          width={724}
          height={2172}
          loading="lazy"
          decoding="async"
          alt="A six-panel painted scroll on a continuous blue ground. The Bond: a rider with his black horse. The Call: a rider beside his horse before a fort. Haldighati: a cavalry charge under a sun banner. Courage: a rider rearing before war elephants. The Escape: a horse and rider fording a river. Remembrance: a rider beside his horse at dusk, beneath a chhatri."
        />
      </figure>
    </section>
  );
}
