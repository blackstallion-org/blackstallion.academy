"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { CrestMark } from "@/components/brand/CrestMark";
import { corridors, entity, legalNav } from "@/lib/content/site";

const navLinks = [
  { href: "/legend", label: "The Legend" },
  { href: "/anatomy", label: "The Instrument" },
  { href: "/science", label: "Science & Matrix" },
  { href: "/why", label: "Crucible & Cure" },
  { href: "/curriculum", label: "Curriculum" },
  { href: "/fleet", label: "The Studbook" },
  { href: "/schools", label: "For Schools" },
  { href: "/cadets", label: "Cadets" },
  { href: "/parents", label: "Parents" },
  { href: "/tournaments", label: "The Circuit" },
  { href: "/command", label: "Command AI" },
  { href: "/contact", label: "The Gate" },
];

/**
 * Meridian-style cinematic video footer adapted for BSAH.
 * 70% warm natural editorial palette with atmospheric equine footage blend.
 */
export function Footer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
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
    <footer className="footer-meridian no-print" aria-label="Site Footer">
      {/* Background ambient video (rendered first in DOM, visually placed lower via CSS flex order) */}
      <video
        ref={videoRef}
        className="footer-meridian__video"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster="/video/footer-ambient-poster.jpg"
        aria-hidden="true"
        tabIndex={-1}
        disablePictureInPicture
      >
        <source src="/video/footer-ambient-h264.mp4" type="video/mp4" />
        <source src="/video/footer-ambient.mp4" type="video/mp4" />
        <source
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260928_144832_2b6b23aa-4416-4fcb-9df4-132349c59edc.mp4"
          type="video/mp4"
        />
      </video>

      {/* Content block: brand emblem, wordmark, tagline, nav and legal copy */}
      <div className="footer-meridian__content">
        <div className="footer-meridian__mark" aria-hidden="true">
          <CrestMark size="sm" className="h-12 w-12 object-contain" />
        </div>

        <p className="footer-meridian__brand">
          <Link href="/" aria-label="The Black Stallion Academy of Horsemanship Home">
            black stallion academy
          </Link>
        </p>

        <p className="footer-meridian__tagline">
          <em>{entity.motto}.</em> {entity.mottoEn}. The interscholastic equestrian leadership academy and national circuit.
        </p>

        {/* Global horizontal navigation with animated underline hover */}
        <nav className="footer-meridian__nav" aria-label="Footer Navigation">
          <ul>
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href}>{link.label}</Link>
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
            © {currentYear} {entity.parent} · Operating arm: {entity.operator} (BSAH) · Sanctioned by the {entity.council} ({entity.councilShort}) · {entity.city}.
          </p>
          <div className="footer-meridian__legal">
            {legalNav.map((l) => (
              <Link key={l.href} href={l.href}>
                {l.label}
              </Link>
            ))}
            <Link href="/about">About</Link>
            <Link href="/lore">Lore of the Bards</Link>
            <Link href="/privacy">Privacy Notice</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
