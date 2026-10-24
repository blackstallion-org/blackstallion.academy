"use client";

import { useEffect, useRef, useState } from "react";
import { Menu } from "lucide-react";

// Asset URLs specified exactly
const BG_IMAGE_1 =
  "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260609_195923_b0ba8ace-1d1d-4f2c-9a28-1ab84b330680.png&w=1280&q=85";
const BG_IMAGE_2 =
  "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260609_201152_bba90a12-bf12-459f-91f0-51f237dbaf3b.png&w=1280&q=85";

// Spotlight radius
const SPOTLIGHT_R = 260;

interface RevealLayerProps {
  image: string;
  cursorX: number;
  cursorY: number;
}

function RevealLayer({ image, cursorX, cursorY }: RevealLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const revealRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas dimensions to window viewport
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Create radial gradient for spotlight mask
    const gradient = ctx.createRadialGradient(
      cursorX,
      cursorY,
      0,
      cursorX,
      cursorY,
      SPOTLIGHT_R
    );

    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.4, "rgba(255,255,255,1)");
    gradient.addColorStop(0.6, "rgba(255,255,255,0.75)");
    gradient.addColorStop(0.75, "rgba(255,255,255,0.4)");
    gradient.addColorStop(0.88, "rgba(255,255,255,0.12)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");

    // Fill arc with radial gradient
    ctx.beginPath();
    ctx.arc(cursorX, cursorY, SPOTLIGHT_R, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Apply as maskImage
    try {
      const dataURL = canvas.toDataURL();
      if (revealRef.current) {
        revealRef.current.style.maskImage = `url(${dataURL})`;
        revealRef.current.style.webkitMaskImage = `url(${dataURL})`;
        revealRef.current.style.maskSize = "100% 100%";
        revealRef.current.style.webkitMaskSize = "100% 100%";
      }
    } catch {
      // Hardware-accelerated CSS mask fallback
      if (revealRef.current) {
        const cssMask = `radial-gradient(circle ${SPOTLIGHT_R}px at ${cursorX}px ${cursorY}px, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 40%, rgba(0,0,0,0.75) 60%, rgba(0,0,0,0.4) 75%, rgba(0,0,0,0.12) 88%, transparent 100%)`;
        revealRef.current.style.maskImage = cssMask;
        revealRef.current.style.webkitMaskImage = cssMask;
      }
    }
  }, [cursorX, cursorY]);

  return (
    <>
      {/* Hidden canvas for generating mask */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ display: "none" }}
      />

      {/* Reveal layer with spotlight mask */}
      <div
        ref={revealRef}
        className="absolute inset-0 bg-center bg-cover bg-no-repeat z-30 pointer-events-none"
        style={{ backgroundImage: `url(${image})` }}
      />
    </>
  );
}

function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between p-4 sm:p-5">
      {/* Left: Logo + Wordmark */}
      <div className="flex items-center gap-3">
        <svg
          width="26"
          height="26"
          viewBox="0 0 256 256"
          fill="#ffffff"
          className="flex-shrink-0"
          aria-hidden="true"
        >
          <path d="M 256 256 L 128 256 L 0 128 L 128 128 Z M 256 128 L 128 128 L 0 0 L 128 0 Z" />
        </svg>
        <span className="text-white text-2xl font-playfair italic">Lithos</span>
      </div>

      {/* Center Pill Navigation */}
      <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 bg-white/20 backdrop-blur-md border border-white/30 rounded-full px-2 py-2 items-center gap-1">
        <button
          type="button"
          className="bg-white text-gray-900 px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer"
        >
          Course
        </button>
        {["Field Guides", "Geology", "Plans", "Live Tour"].map((item) => (
          <button
            key={item}
            type="button"
            className="text-white/80 hover:bg-white/20 hover:text-white transition-colors px-4 py-1.5 rounded-full text-sm font-medium cursor-pointer"
          >
            {item}
          </button>
        ))}
      </div>

      {/* Right: Sign Up (Desktop) */}
      <button
        type="button"
        className="hidden md:block bg-white text-gray-900 text-sm font-semibold px-6 py-2.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
      >
        Sign Up
      </button>

      {/* Mobile Menu Button */}
      <button
        type="button"
        onClick={() => setMobileMenuOpen((o) => !o)}
        aria-label="Toggle menu"
        className="md:hidden text-white p-2 cursor-pointer"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Mobile dropdown drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-4 right-4 mt-2 bg-black/90 border border-white/20 backdrop-blur-lg rounded-2xl p-4 flex flex-col gap-2">
          {["Course", "Field Guides", "Geology", "Plans", "Live Tour"].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="text-white text-left px-3 py-2 rounded-lg hover:bg-white/10 text-sm font-medium"
            >
              {item}
            </button>
          ))}
          <button
            type="button"
            className="mt-2 w-full bg-white text-gray-900 text-sm font-semibold py-2.5 rounded-full"
          >
            Sign Up
          </button>
        </div>
      )}
    </nav>
  );
}

export function LithosHero() {
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number }>({ x: -999, y: -999 });
  const mouse = useRef<{ x: number; y: number }>({ x: -999, y: -999 });
  const smooth = useRef<{ x: number; y: number }>({ x: -999, y: -999 });
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    // Center spotlight initially on screen mount
    const initialX = window.innerWidth * 0.5;
    const initialY = window.innerHeight * 0.45;
    mouse.current = { x: initialX, y: initialY };
    smooth.current = { x: initialX, y: initialY };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!e.touches.length) return;
      mouse.current.x = e.touches[0].clientX;
      mouse.current.y = e.touches[0].clientY;
    };

    // Animation loop with smoothing (lerp)
    const animate = () => {
      smooth.current.x += (mouse.current.x - smooth.current.x) * 0.1;
      smooth.current.y += (mouse.current.y - smooth.current.y) * 0.1;

      setCursorPos({
        x: Math.round(smooth.current.x * 10) / 10,
        y: Math.round(smooth.current.y * 10) / 10,
      });

      rafRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchstart", handleTouchMove, { passive: true });
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchstart", handleTouchMove);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return (
    <div
      className="min-h-screen bg-white tracking-[-0.02em]"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      {/* Navigation */}
      <Navigation />

      {/* Hero Section */}
      <section
        className="relative w-full overflow-hidden h-screen bg-black"
        style={{ height: "100dvh" }}
      >
        {/* Layer 1: Base Image (z-10) with hero-zoom Ken Burns animation */}
        <div
          className="absolute inset-0 bg-center bg-cover bg-no-repeat z-10 hero-zoom"
          style={{ backgroundImage: `url(${BG_IMAGE_1})` }}
        />

        {/* Layer 2: Reveal Image with Spotlight Mask (z-30) */}
        <RevealLayer
          image={BG_IMAGE_2}
          cursorX={cursorPos.x}
          cursorY={cursorPos.y}
        />

        {/* Layer 3: Heading (z-50) */}
        <div className="absolute top-[14%] left-0 right-0 flex flex-col items-center text-center px-5 pointer-events-none z-50">
          <h1 className="text-white leading-[0.95]">
            <span
              className="block font-playfair italic font-normal text-5xl sm:text-7xl md:text-8xl hero-anim hero-reveal"
              style={{ letterSpacing: "-0.05em", animationDelay: "0.25s" }}
            >
              Layers hold
            </span>
            <span
              className="block font-normal text-5xl sm:text-7xl md:text-8xl -mt-1 hero-anim hero-reveal"
              style={{ letterSpacing: "-0.08em", animationDelay: "0.42s" }}
            >
              tales of time
            </span>
          </h1>
        </div>

        {/* Layer 4: Bottom-left paragraph (z-50) */}
        <div
          className="hidden sm:block absolute bottom-14 left-10 md:left-14 max-w-[260px] z-50 hero-anim hero-fade"
          style={{ animationDelay: "0.7s" }}
        >
          <p className="text-sm text-white/80 leading-relaxed">
            Every layer of sediment records a chapter of our planet, from ancient seabeds to drifting ash, layered across millions of years beneath us.
          </p>
        </div>

        {/* Layer 5: Bottom-right block (z-50) */}
        <div
          className="absolute bottom-10 sm:bottom-24 left-5 right-5 sm:left-auto sm:right-10 md:right-14 max-w-full sm:max-w-[260px] flex flex-col items-start gap-4 sm:gap-5 z-50 hero-anim hero-fade"
          style={{ animationDelay: "0.85s" }}
        >
          <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
            Our interactive maps let you peel back the crust to trace how stones, fossils, and deep time combine to shape the ground beneath your feet.
          </p>
          <button
            type="button"
            className="bg-[#e8702a] hover:bg-[#d2611f] text-white text-sm font-medium px-7 py-3 rounded-full transition-all hover:scale-[1.03] active:scale-95 hover:shadow-lg hover:shadow-[#e8702a]/30 pointer-events-auto cursor-pointer"
          >
            Start Digging
          </button>
        </div>
      </section>
    </div>
  );
}
