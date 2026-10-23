import Image from "next/image";
import Link from "next/link";
import { ViscousLiquidCanvas } from "@/components/sections/shared/ViscousLiquidCanvas";
import styles from "./ReferencePanels.module.css";

const firstRide = [
  {
    image: "/images/cinematic-images/pexels-v-marin-701396667-29487828.webp",
    alt: "A quiet first contact between a person and a horse",
    title: "First, meet the horse.",
    copy: "Before the saddle, there is a conversation. Learn to notice, approach and listen.",
    position: "49% 50%",
  },
  {
    image: "/images/bond-intimacy-vertical.webp",
    alt: "A rider close to a horse",
    title: "Build trust on the ground.",
    copy: "A calm beginning makes room for confidence to follow.",
    position: "50% 45%",
  },
  {
    image: "/images/cinematic-images/pexels-cristian-rojas-8064265.webp",
    alt: "A stirrup fitted to a saddle",
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
            <div className={styles.ridePhoto}><Image src={item.image} alt={item.alt} fill sizes="(min-width: 800px) 50vw, 100vw" style={{ objectPosition: item.position }} /></div>
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

/** An original Marwari portrait with full-bleed Navier-Stokes liquid reveal. */
export function MarwariPortrait() {
  return (
    <ViscousLiquidCanvas
      id="marwari-portrait"
      label="REEL 06A · STUDBOOK VISUAL STUDY"
      title="The Sovereign Marwari"
      subtitle="Indigenous Rajasthani warhorse lineage. Microchipped under ISO 11784 telemetry with distinct lyre-curved ears and unyielding composure."
      imageUrl="/images/editorial/marwari-study.webp"
      fullScreen={true}
      ctaText="Explore Marwari Legend"
      ctaHref="/legend"
    />
  );
}
