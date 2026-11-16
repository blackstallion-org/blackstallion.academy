"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Wordmark } from "@/components/brand/Wordmark";
import { corridors, entity, footerNav, hidesFooter, legalNav, LOGO } from "@/lib/content/site";
import { useReducedMotion } from "@/lib/motion/reduced";
import { ease } from "@/lib/motion/tokens";
import { asset } from "@/lib/content/asset";
import { MUSIC } from "@/lib/audio/mixer";
import { introFilm } from "@/lib/content/intro-film";
import { journeyFilm } from "@/lib/content/journey-film";

const COPYRIGHT_YEAR = 2026;

/**
 * The site footer (16 Nov 2026, owner's brief: the stone-bridge film felt unrelated and was replaced). It opens with a quiet
 * heritage band printed on the page's own ivory, so the section above runs straight into it: a black Marwari stallion in
 * profile (a transparent cut-out, no box), the academy's motto in the two-voice headline, a brass hairline. Restrained motion:
 * the horse and the words settle in once as the band enters view; reduced motion shows them at rest. Then the seals, the one
 * lockup, the numbered pages, the three corridors and the small print, unchanged.
 */
export function Footer() {
  // The staff console (sign-in, dashboard, every /admin page) and the member account are applications, not pages of the film: no public footer.
  if (hidesFooter(usePathname())) return null;
  return <PublicFooter />;
}

function PublicFooter() {
  const band = useRef<HTMLDivElement>(null);
  const seen = useInView(band, { once: true, amount: 0.35 });
  const reduced = useReducedMotion();
  const settle = (delay: number) => ({
    initial: reduced ? false : ({ opacity: 0, y: 14 } as const),
    animate: seen || reduced ? { opacity: 1, y: 0 } : undefined,
    transition: { duration: 1.6, ease: ease.citadel, delay },
  });

  return (
    <footer className="footer-meridian no-print" aria-label="Site Footer">
      {/* Heritage band: the horse and the motto, on the page's own ground. */}
      <div ref={band} className="footer-meridian__heritage gutter">
        <div className="mx-auto grid max-w-6xl items-end gap-6 md:grid-cols-12 md:gap-10">
          <motion.figure {...settle(0)} className="relative md:col-span-7">
            <div aria-hidden className="footer-meridian__ground" />
            <Image
              src={asset("/images/fleet/stallion-facing-left.webp")}
              alt="A black Marwari stallion with a white blaze, standing in profile"
              width={1536}
              height={1024}
              sizes="(min-width: 768px) 56vw, 92vw"
              loading="lazy"
              className="relative h-auto w-full"
            />
          </motion.figure>
          <div className="pb-[clamp(1rem,5vw,4rem)] text-center md:col-span-5 md:text-left">
            <motion.p {...settle(0.25)} className="label text-brass">{entity.motto}</motion.p>
            <motion.p {...settle(0.4)} className="mt-4 text-[clamp(1.9rem,3.6vw,3.1rem)] leading-[1.08]">
              <span className="t-inscribe block text-[0.62em] tracking-[0.2em] text-bone">Master of oneself,</span>
              <span className="t-voice block text-gold">master of the horse.</span>
            </motion.p>
            <motion.p {...settle(0.55)} className="t-story mx-auto mt-5 max-w-sm text-sand md:mx-0">
              Eight hundred years of the Marwari, handed to your child.
            </motion.p>
          </div>
        </div>
      </div>

      {/* Content block: brand emblem, wordmark, tagline, nav and legal copy */}
      <div className="footer-meridian__content">
        {/* The two seals as supplied (backgrounds removed, nothing redrawn): the academy and its governing council. */}
        <div className="footer-meridian__mark flex flex-wrap items-end justify-center gap-x-8 gap-y-5">
          <figure className="flex flex-col items-center gap-3">
            {/* The 192 px logo, served as is (unoptimized): it shows at 80 to 96 px, and the image optimiser can flatten a cut-out logo onto a dark square or serve a stale copy of it. */}
            <Image src={LOGO.sm} alt="The Black Stallion Academy of Horsemanship crest" width={192} height={192} unoptimized className="h-[4.5rem] w-[4.5rem] sm:h-20 sm:w-20" />
            <figcaption className="label text-[0.62rem]">The academy</figcaption>
          </figure>
          <span aria-hidden="true" className="hidden h-10 w-px bg-current opacity-25 sm:block" />
          <figure className="flex flex-col items-center gap-3">
            <Image src="/brand/stpci-medal.webp" alt="School Tent Pegging Council of India seal" width={720} height={745} className="h-[4.5rem] w-auto object-contain sm:h-20" />
            <figcaption className="label text-[0.62rem]">The council</figcaption>
          </figure>
        </div>

        <p className="footer-meridian__brand">
          {/* The one lockup (CLAUDE.md → Navigation), scaled up; the crest is the seal above. */}
          <Link href="/" aria-label="The Black Stallion Academy of Horsemanship, home">
            <Wordmark layout="inline" size="custom" className="items-center text-[clamp(1.5rem,3.2vw,2.6rem)]" />
          </Link>
        </p>

        <p className="footer-meridian__tagline">
          The interscholastic equestrian leadership academy and national circuit.
        </p>

        {/* The main pages with their own reel numbers and titles (lib/content/site.ts → footerNav), the same as every menu. */}
        <nav className="footer-meridian__nav" aria-label="Footer Navigation">
          <ul>
            {footerNav.map((link) => (
              <li key={link.href}>
                <Link href={link.href}>
                  <span className="mr-1.5 font-mono text-[0.72em] text-gold/80">{String(link.n).padStart(2, "0")}</span>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Tri-Corridor Direct Contacts */}
        <div className="footer-meridian__corridors" aria-label="Direct Corridors">
          {corridors.map((c, i) => (
            <span key={c.id} className="footer-meridian__corridor-item">
              <span className="footer-meridian__corridor-label">{c.title.toUpperCase()}:</span>
              <a href={`mailto:${c.email}`} className="footer-meridian__corridor-link">
                {c.email}
              </a>
              {i < corridors.length - 1 && <span className="footer-meridian__corridor-sep" aria-hidden="true">·</span>}
            </span>
          ))}
        </div>

        {/* Institutional copyright, regulatory authority & legal directory */}
        <div className="footer-meridian__copy">
          <p>
            © {COPYRIGHT_YEAR} {entity.parent} · Operating arm: {entity.operator} (BSAH) · Sanctioned by the {entity.council} ({entity.councilShort}) · {entity.city}.
          </p>
          {/* Music credit (public/audio/LICENSES.md). */}
          <p className="mt-2 opacity-80">
            Music: “{MUSIC.title}” by {MUSIC.author}. Opening film: “{introFilm.music.title}”, {introFilm.music.credit}. {journeyFilm.label}: “{journeyFilm.music.title}” by {journeyFilm.music.author} ({journeyFilm.music.licence}). Field recordings: Freesound contributors (CC0).
          </p>
          <div className="footer-meridian__legal">
            {legalNav.map((l) => (
              <Link key={l.href} href={l.href}>
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
