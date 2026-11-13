import { asset } from "./asset";
import manifest from "./real-horses.manifest.json";

/**
 * Real horse photographs for /fleet (owner's photos, published 14 Nov 2026 with the owner's confirmed permission).
 * The provenance record (exact source filename, checksum, edits and every exclusion) is lib/content/real-horses.manifest.json,
 * written by scripts/build-real-horse-gallery.py. This module hands the page only what it shows: no source filenames.
 *
 * A gallery is ONE individual horse (same session, matching markings, tack and setting). The horses are "Horse Study 01-08":
 * no names, breed claims, pedigree or ownership, and none of them is an academy fleet profile.
 */
export type RealPhoto = { src: string; width: number; height: number; label: string; caption: string; alt: string };
export type RealHorse = { slug: string; title: string; setting: string; note: string; photos: RealPhoto[] };

const viewSrc = (slug: string, view: string) => asset(`/images/horses/real/${slug}/${view}.webp`);
const collectionSrc = (name: string) => asset(`/images/horses/real/collection/${name}.webp`);

export const REAL_HORSES: RealHorse[] = manifest.galleries.map((g) => ({
  slug: g.slug,
  title: g.title,
  setting: g.setting,
  note: g.note,
  photos: g.images.map((im) => ({ src: viewSrc(g.slug, im.view), width: im.width, height: im.height, label: im.label, caption: im.caption, alt: im.alt })),
}));

export const REAL_COLLECTION: RealPhoto[] = manifest.collection.map((c) => {
  const name = c.file.split("/").pop()!.replace(/\.webp$/, "");
  return { src: collectionSrc(name), width: c.width, height: c.height, label: "Single photograph", caption: "", alt: c.alt };
});

export const REAL_HORSE_NOTE =
  "Photographs of real horses, published with permission. They are not records of the academy’s fleet: no names, breeding or ownership are given, and each gallery holds only photographs of one horse from one session.";

/** One real photograph for a contemporary section elsewhere on the site (a lead view chosen for its crop). */
export const realPhoto = (slug: string, index = 0): RealPhoto => {
  const h = REAL_HORSES.find((x) => x.slug === slug);
  if (!h) throw new Error(`unknown real horse ${slug}`);
  return h.photos[index];
};
