"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { mediaSrc, type MediaKey } from "@/lib/content/media";
import { cn } from "@/lib/utils";

/**
 * A word cut out of a photograph: the letters are a clip path and the image drifts slowly behind them,
 * following the pointer a little (adapted from React Bits "MaskedHeading"). Glyphs rise into place once,
 * word by word, when the heading scrolls into view.
 *
 * Accessibility: the visible text lives in a real heading element (the measured copy is transparent text,
 * so it is read and selectable); the SVG and image are aria-hidden. Reduced motion: no rise, no drift.
 */
type MaskedWordProps = {
  text: string;
  image: MediaKey;
  as?: "h1" | "h2" | "h3" | "p";
  /** Font size as a share of the element's width. */
  textScale?: number;
  /** How far the photo follows the pointer, px. */
  parallax?: number;
  /** Idle drift, px. */
  drift?: number;
  /** Image overscan so drift never shows an edge. */
  fillScale?: number;
  className?: string;
  id?: string;
};

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);

type Box = { x: number; y: number; cx: number; cy: number };

export function MaskedWord({ text, image, as: Tag = "h2", textScale = 0.16, parallax = 22, drift = 14, fillScale = 1.25, className, id }: MaskedWordProps) {
  const rootRef = useRef<HTMLHeadingElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const mediaRef = useRef<HTMLImageElement>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const baseRefs = useRef<(HTMLElement | null)[]>([]);
  const glyphRefs = useRef<(SVGTextElement | null)[]>([]);
  const boxes = useRef<Box[]>([]);
  const states = useRef<{ y: number }[]>([]);
  const clipId = `mw-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const words = text.split(/\s+/).filter(Boolean);
  const glyphs = words.flatMap((word, w) => Array.from(word).map((char) => ({ char, w })));
  const src = mediaSrc(image);

  const renderGlyphs = useCallback(() => {
    glyphRefs.current.forEach((el, i) => {
      if (!el) return;
      const st = states.current[i];
      if (!st || st.y === 0) el.removeAttribute("transform");
      else el.setAttribute("transform", `translate(0 ${st.y.toFixed(2)})`);
    });
  }, []);

  const sync = useCallback(() => {
    const root = rootRef.current;
    const measure = measureRef.current;
    if (!root || !measure) return;
    root.style.fontSize = `${clamp(root.clientWidth * textScale, 36, 260).toFixed(1)}px`;
    const cs = getComputedStyle(measure);
    const fontPx = parseFloat(cs.fontSize) || 48;
    const range = document.createRange();
    const out: Box[] = [];
    let index = 0;
    wordRefs.current.forEach((box, w) => {
      const base = baseRefs.current[w];
      const node = box?.firstChild;
      if (!box || !base || !node || node.nodeType !== 3) return;
      const boxRect = box.getBoundingClientRect();
      let offset = 0;
      for (const char of Array.from((node as Text).data)) {
        range.setStart(node, offset);
        range.setEnd(node, offset + char.length);
        offset += char.length;
        const r = range.getBoundingClientRect();
        const x = box.offsetLeft + (r.left - boxRect.left);
        out[index++] = { x, y: base.offsetTop, cx: x + r.width / 2, cy: base.offsetTop - fontPx * 0.36 };
      }
    });
    boxes.current = out;
    out.forEach((b, i) => {
      const el = glyphRefs.current[i];
      if (!el) return;
      el.setAttribute("x", b.x.toFixed(2));
      el.setAttribute("y", String(b.y));
      el.style.fontFamily = cs.fontFamily;
      el.style.fontSize = cs.fontSize;
      el.style.fontWeight = cs.fontWeight;
      el.style.fontStyle = cs.fontStyle;
      el.style.letterSpacing = cs.letterSpacing;
    });
    renderGlyphs();
  }, [renderGlyphs, textScale]);

  // Layout + pointer drift.
  useEffect(() => {
    const root = rootRef.current;
    const media = mediaRef.current;
    if (!root || !media) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ro = new ResizeObserver(() => sync());
    ro.observe(root);
    document.fonts?.ready.then(() => sync()).catch(() => {});
    const off = { x: 0, y: 0, tx: 0, ty: 0 };
    let raf = 0;
    let last = 0;
    let clock = 0;
    let visible = true;
    const place = () => {
      const maxX = ((fillScale - 1) / 2) * root.clientWidth;
      const maxY = ((fillScale - 1) / 2) * root.clientHeight;
      media.style.transform = `translate3d(${clamp(off.x, -maxX, maxX).toFixed(2)}px, ${clamp(off.y, -maxY, maxY).toFixed(2)}px, 0) scale(${fillScale})`;
    };
    const frame = (now: number) => {
      raf = 0;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      clock += dt;
      const e = 1 - Math.exp(-dt / 0.25);
      off.x += (off.tx + Math.sin(clock * 0.21) * drift - off.x) * e;
      off.y += (off.ty + Math.cos(clock * 0.17) * drift * 0.6 - off.y) * e;
      place();
      if (visible && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => {
      if (reduce || raf || !visible) return;
      last = 0;
      raf = requestAnimationFrame(frame);
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const r = root.getBoundingClientRect();
      off.tx = -clamp(((e.clientX - r.left) / (r.width || 1)) * 2 - 1, -1, 1) * parallax;
      off.ty = -clamp(((e.clientY - r.top) / (r.height || 1)) * 2 - 1, -1, 1) * parallax;
    };
    const onLeave = () => {
      off.tx = 0;
      off.ty = 0;
    };
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) wake();
    });
    io.observe(root);
    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerleave", onLeave);
    place();
    wake();
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
    };
  }, [sync, parallax, drift, fillScale]);

  // Rise reveal, once.
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const list = glyphs.map(() => ({ y: 0 }));
    states.current = list;
    sync();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const size = parseFloat(getComputedStyle(root).fontSize) || 48;
    list.forEach((s) => (s.y = size * 1.15));
    renderGlyphs();
    let tween: gsap.core.Tween | null = null;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        tween = gsap.to(list, {
          y: 0,
          duration: 1.4,
          ease: "power4.out",
          stagger: (i: number) => glyphs[i].w * 0.12 + i * 0.015,
          onUpdate: renderGlyphs,
        });
        io.disconnect();
      },
      { threshold: 0.3 },
    );
    io.observe(root);
    return () => {
      io.disconnect();
      tween?.kill();
    };
    // glyphs derives from text
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, sync, renderGlyphs]);

  return (
    <Tag ref={rootRef} id={id} className={cn("t-inscribe relative block select-text leading-[1.02]", className)}>
      <span ref={measureRef} className="relative block text-transparent">
        {words.map((word, i) => (
          <span
            key={`${word}-${i}`}
            ref={(el) => {
              wordRefs.current[i] = el;
            }}
            className="relative inline-block whitespace-nowrap pr-[0.28em]"
          >
            {word}
            <i
              ref={(el) => {
                baseRefs.current[i] = el;
              }}
              aria-hidden
              className="inline-block h-0 w-0 align-baseline"
            />
          </span>
        ))}
      </span>
      <svg aria-hidden focusable="false" className="pointer-events-none absolute h-0 w-0">
        <defs>
          <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
            {glyphs.map((g, i) => (
              <text
                key={i}
                ref={(el) => {
                  glyphRefs.current[i] = el;
                }}
              >
                {g.char}
              </text>
            ))}
          </clipPath>
        </defs>
      </svg>
      <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden bg-brass" style={{ clipPath: `url(#${clipId})` }}>
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element -- clipped, transformed every frame; next/image adds nothing here
          <img ref={mediaRef} src={src} alt="" draggable={false} className="absolute inset-0 h-full w-full object-cover [filter:var(--grade-film)]" />
        ) : null}
      </span>
    </Tag>
  );
}
