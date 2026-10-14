"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CrestMark } from "@/components/brand/CrestMark";
import { corridors, entity, legalNav } from "@/lib/content/site";
import { mediaSrc } from "@/lib/content/media";

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

const COPYRIGHT_YEAR = 2026;
const SPOTLIGHT_R = 260;

/**
 * Meridian-style cinematic video footer adapted for BSAH with interactive
 * Spotlight Dual-Layer Reveal ("Layers hold tales of time").
 */
export function Footer() {
  const footerRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [cursorPos, setCursorPos] = useState<{ x: number; y: number }>({ x: -999, y: -999 });
  const mouse = useRef<{ x: number; y: number }>({ x: -999, y: -999 });
  const smooth = useRef<{ x: number; y: number }>({ x: -999, y: -999 });
  const rafRef = useRef<number | null>(null);

  // Background video observer
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

  // Spotlight smooth cursor tracking
  useEffect(() => {
    const footer = footerRef.current;
    if (!footer) return;

    const rect = footer.getBoundingClientRect();
    const initialX = rect.width * 0.5;
    const initialY = rect.height * 0.45;
    mouse.current = { x: initialX, y: initialY };
    smooth.current = { x: initialX, y: initialY };
    setCursorPos({ x: initialX, y: initialY });

    const handleMouseMove = (e: MouseEvent) => {
      const b = footer.getBoundingClientRect();
      mouse.current = {
        x: e.clientX - b.left,
        y: e.clientY - b.top,
      };
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!e.touches.length) return;
      const t = e.touches[0];
      const b = footer.getBoundingClientRect();
      mouse.current = {
        x: t.clientX - b.left,
        y: t.clientY - b.top,
      };
    };

    const animate = () => {
      smooth.current.x += (mouse.current.x - smooth.current.x) * 0.12;
      smooth.current.y += (mouse.current.y - smooth.current.y) * 0.12;

      setCursorPos({
        x: Math.round(smooth.current.x * 10) / 10,
        y: Math.round(smooth.current.y * 10) / 10,
      });

      rafRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    footer.addEventListener("touchmove", handleTouchMove, { passive: true });
    footer.addEventListener("touchstart", handleTouchMove, { passive: true });
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      footer.removeEventListener("touchmove", handleTouchMove);
      footer.removeEventListener("touchstart", handleTouchMove);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const revealImageSrc = mediaSrc("rearing") || mediaSrc("heroDust") || "/media/rearing.png";

  const spotlightMask = {
    WebkitMaskImage: `radial-gradient(circle ${SPOTLIGHT_R}px at ${cursorPos.x}px ${cursorPos.y}px, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 40%, rgba(0,0,0,0.75) 60%, rgba(0,0,0,0.38) 75%, rgba(0,0,0,0.12) 88%, transparent 100%)`,
    maskImage: `radial-gradient(circle ${SPOTLIGHT_R}px at ${cursorPos.x}px ${cursorPos.y}px, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 40%, rgba(0,0,0,0.75) 60%, rgba(0,0,0,0.38) 75%, rgba(0,0,0,0.12) 88%, transparent 100%)`,
  };

  return (
    <footer
      ref={footerRef}
      className="footer-meridian no-print relative overflow-hidden select-none"
      aria-label="Site Footer"
    >
      {/* Background ambient video */}
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

      {/* Spotlight Dual-Layer Reveal: Hidden golden stallion illuminated under torchlight cursor */}
      <div
        className="absolute inset-0 bg-center bg-cover bg-no-repeat pointer-events-none z-[1] opacity-90 transition-opacity duration-300"
        style={{
          backgroundImage: `url(${revealImageSrc})`,
          ...spotlightMask,
        }}
        aria-hidden="true"
      />

      {/* Subtle Golden Glow Halo following cursor */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute rounded-full z-[2] transition-opacity duration-300"
        style={{
          width: `${SPOTLIGHT_R * 2}px`,
          height: `${SPOTLIGHT_R * 2}px`,
          left: `${cursorPos.x - SPOTLIGHT_R}px`,
          top: `${cursorPos.y - SPOTLIGHT_R}px`,
          background: "radial-gradient(circle, rgba(212,175,55,0.1) 0%, rgba(212,175,55,0.02) 60%, transparent 80%)",
        }}
      />

      {/* Dark gradient overlay for pristine contrast */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/60 z-[3]"
      />

      {/* Content block: Spotlight Callout, brand emblem, wordmark, tagline, nav and legal copy */}
      <div className="footer-meridian__content relative z-[10]">
        {/* Spotlight Editorial Heading */}
        <div className="py-4 sm:py-6 text-center pointer-events-none select-none">
          <p className="font-mono text-[0.62rem] sm:text-[0.68rem] tracking-[0.3em] uppercase text-gold/80 mb-2">
            The Gate Closes · The Legend Remains
          </p>
          <h2 className="leading-[0.95] text-white">
            <span
              className="block font-serif italic text-3xl sm:text-5xl md:text-6xl text-[#FAF7F0]"
              style={{
                fontFamily: 'var(--font-kalnia), var(--font-newsreader), "Playfair Display", Georgia, serif',
                letterSpacing: "-0.03em",
              }}
            >
              Layers hold
            </span>
            <span
              className="block font-serif font-light text-2xl sm:text-4xl md:text-5xl uppercase tracking-tight text-white/90 -mt-1"
              style={{
                fontFamily: 'var(--font-kalnia), var(--font-newsreader), "Playfair Display", serif',
                letterSpacing: "-0.02em",
              }}
            >
              tales of time
            </span>
          </h2>
        </div>

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
            © {COPYRIGHT_YEAR} {entity.parent} · Operating arm: {entity.operator} (BSAH) · Sanctioned by the {entity.council} ({entity.councilShort}) · {entity.city}.
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
