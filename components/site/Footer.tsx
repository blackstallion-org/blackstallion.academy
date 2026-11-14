"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Wordmark } from "@/components/brand/Wordmark";
import { corridors, entity, footerNav, hidesFooter, legalNav, LOGO } from "@/lib/content/site";
import { whenNearViewport } from "@/lib/motion/near-viewport";
import { saveDataMode } from "@/lib/motion/save-data";
import { asset } from "@/lib/content/asset";
import { MUSIC } from "@/lib/audio/mixer";

/** A 76 kB still that only matters once the footer is about to be seen (it sits ~23,000 px down the home page). */
const FOOTER_POSTER = asset("/video/footer-ambient-poster.webp");

const COPYRIGHT_YEAR = 2026;

/**
 * Meridian-style cinematic video footer adapted for BSAH.
 * 70% warm natural editorial palette with atmospheric equine footage blend.
 */
export function Footer() {
  // The staff console (sign-in, dashboard, every /admin page) and the member account are applications, not pages of the film: no public footer.
  if (hidesFooter(usePathname())) return null;
  return <PublicFooter />;
}

function PublicFooter() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const footerRef = useRef<HTMLElement>(null);

  // Poster: set a screen and a half ahead of the footer instead of fetching it at load. Same picture, same place; the
  // video has preload="none", so nothing else of it is requested until it plays.
  useEffect(() => {
    const footer = footerRef.current;
    const video = videoRef.current;
    if (!footer || !video) return;
    return whenNearViewport(footer, () => { video.poster = FOOTER_POSTER; }, "150% 0px");
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || saveDataMode()) {
      video.removeAttribute("autoplay");
      video.pause();
      return;
    }

    if (!("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const playPromise = video.play();
            if (playPromise !== undefined) {
              playPromise.catch(() => {});
            }
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.15 }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <footer ref={footerRef} className="footer-meridian no-print" aria-label="Site Footer">
      {/* Background ambient video (rendered first in DOM, visually placed lower via CSS flex order) */}
      <video
        ref={videoRef}
        className="footer-meridian__video"
        muted
        loop
        playsInline
        preload="none"
        aria-hidden="true"
        tabIndex={-1}
        disablePictureInPicture
      >
        <source src={asset("/video/footer-ambient-h264.mp4")} type="video/mp4" />
        <source src={asset("/video/footer-ambient.mp4")} type="video/mp4" />
        <source
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260928_144832_2b6b23aa-4416-4fcb-9df4-132349c59edc.mp4"
          type="video/mp4"
        />
      </video>

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
          <em>{entity.motto}.</em> {entity.mottoEn}. The interscholastic equestrian leadership academy and national circuit.
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
            Music: “{MUSIC.title}” by {MUSIC.author}. Field recordings: Freesound contributors (CC0).
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
