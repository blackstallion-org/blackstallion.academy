import Image from "next/image";
import Link from "next/link";
import styles from "./ReferencePanels.module.css";

const firstRide = [
  {
    image: "/media/legend-today.webp",
    alt: "A young cadet touching the curled ear of a Marwari stallion at dawn",
    title: "First, meet the horse.",
    copy: "Before the saddle, there is a conversation. Learn to notice, approach and listen.",
    position: "49% 50%",
  },
  {
    image: "/media/curr-groundcare.webp",
    alt: "A cadet picking a horse's hoof in a sunlit stable",
    title: "Build trust on the ground.",
    copy: "A calm beginning makes room for confidence to follow.",
    position: "50% 45%",
  },
  {
    image: "/media/legend-chetak.webp",
    alt: "Weathered leather tack and oxidized bronze stirrups on dark stone",
    title: "Get to know the tack.",
    copy: "The small details matter when horse and rider begin to move together.",
    position: "50% 50%",
  },
  {
    image: "/images/science-rider-posture.webp",
    alt: "A rider sitting on a horse in profile",
    title: "Then, find your seat.",
    copy: "Start with balance, attention and a pace you can understand.",
    position: "54% 50%",
  },
];

/** A photographic first-lesson sequence inspired by the supplied four-panel reference. */
export function FirstRideEditorial() {
  return (
    <section className={styles.firstRide} aria-labelledby="first-ride-title">
      <div className={styles.rideIntro}>
        <p className={styles.folio}>Black Stallion Academy of Horsemanship</p>
        <h2 id="first-ride-title">Every rider begins <em>somewhere.</em></h2>
        <p>Four moments from first contact to the saddle.</p>
      </div>
      <div className={styles.rideGrid}>
        {firstRide.map((item, index) => (
          <article className={styles.ridePanel} key={item.title}>
            <div className={styles.ridePhoto}>
              <Image
                src={item.image}
                alt={item.alt}
                fill
                sizes="(min-width: 1280px) 46vw, (min-width: 800px) 48vw, 100vw"
                style={{ objectPosition: item.position }}
              />
            </div>
            <div className={styles.rideCopy}>
              <span className={styles.panelNumber}>0{index + 1}</span>
              <h3>{item.title}</h3>
              <p>{item.copy}</p>
            </div>
          </article>
        ))}
      </div>
      <Link className={styles.rideLink} href="/contact">Ask about the first ride <span aria-hidden>↗</span></Link>
    </section>
  );
}

const materials = [
  { image: "/images/legend/legend-sand.png", alt: "Light-coated Marwari horse", name: "Ivory", color: "#e2d3c2" },
  { image: "/images/equipment/stable-bridles.webp", alt: "Leather bridles in the stable", name: "Chestnut", color: "#844628" },
  { image: "/images/equipment/horseshoe-farrier.webp", alt: "Farrier at work with a horseshoe", name: "Sage", color: "#78735b" },
  { image: "/images/equipment/traditional-saddle.webp", alt: "Traditional riding saddle", name: "Leather", color: "#271c17" },
];

/** The reference palette becomes a useful visual index of the equipment story. */
export function MaterialsEditorial() {
  return (
    <section className={styles.materials} aria-labelledby="materials-title">
      <div className={styles.materialHeader}>
        <p className={styles.folio}>The feel of the stable</p>
        <h2 id="materials-title">Horse, leather, iron, earth.</h2>
        <p>Materials with a purpose. Every piece of tack has a place in the relationship between rider and horse.</p>
      </div>
      <div className={styles.materialGrid}>
        {materials.map((item) => (
          <figure className={styles.material} key={item.name}>
            <div className={styles.materialImage}><Image src={item.image} alt={item.alt} fill sizes="(min-width: 750px) 25vw, 50vw" /></div>
            <div className={styles.swatch} style={{ backgroundColor: item.color }} aria-hidden />
            <figcaption>{item.name}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

/** A full-bleed interlude, placed before the history chapters begin. */
export function MarwariInterlude() {
  return (
    <section className={styles.interlude} aria-labelledby="interlude-title">
      <div className={styles.interludePhoto}>
        <Image src="/images/presence/presence-mist-traveler.webp" alt="A person walking beside a horse in a misty landscape" fill sizes="(min-width: 800px) 58vw, 100vw" />
      </div>
      <div className={styles.interludeWords}>
        <p className={styles.folio}>The Marwari · an opening note</p>
        <h2 id="interlude-title">Where the horse <em>became a story.</em></h2>
        <p>Before the names and dates, there was the bond. Follow the Marwari from the land that shaped it to the riders who carry its legacy today.</p>
        <a href="#ocean">Begin the legend <span aria-hidden>↗</span></a>
      </div>
    </section>
  );
}

/**
 * The Sovereign Marwari: one clear, uninterrupted photograph at full width on the light page, with the title and
 * lineage line above it and the route to the legend below. No overlay, no reveal effect.
 */
export function MarwariPortrait() {
  return (
    <section aria-labelledby="marwari-portrait-h" className="relative bg-night" data-parallax-skip>
      <div className="gutter pb-10 pt-[clamp(5rem,12vh,9rem)] md:pb-14">
        <p className="label text-brass">Reel 07A · Studbook visual study</p>
        <h2 id="marwari-portrait-h" className="t-voice mt-4 text-[clamp(2.5rem,6vw,5.5rem)] leading-[1.02] text-bone">
          The Sovereign Marwari
        </h2>
        <p className="t-story mt-5 max-w-2xl text-lede text-sand">
          Indigenous Rajasthani warhorse lineage. Microchipped under ISO 11784 telemetry with distinct lyre-curved ears and unyielding composure.
        </p>
      </div>
      <div className="relative aspect-[4/5] w-full sm:aspect-[4/3]">
        <Image
          src="/images/editorial/marwari-study.webp"
          alt="A bay Marwari stallion with inward-curving ears and a white blaze, against a warm studio backdrop"
          fill
          sizes="100vw"
          className="object-cover"
          style={{ objectPosition: "50% 0%" }}
        />
      </div>
      <div className="gutter py-8 md:py-10">
        <Link href="/legend" className="label inline-block border-b border-line pb-1 text-sand transition-colors hover:border-gold hover:text-bone">
          Explore Marwari Legend
        </Link>
      </div>
    </section>
  );
}
