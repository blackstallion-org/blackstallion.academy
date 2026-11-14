"use client";
import { useEffect, useRef, useState } from "react";

/**
 * "What twenty minutes does to a child." — the brain, spine, muscle and heart plate (public/anatomy/matrix.html), the supplied
 * 2D animation put back on /anatomy (1 Nov 2026). Same frame, same height message; no three.js, so the visibility message is ignored.
 * The frame is #EBE5D7, the backdrop colour of the rider photograph inside it, so the picture has no visible edge.
 */
export function MatrixPlate() {
  return (
    <AnatomyFrame
      src="/anatomy/matrix.html"
      label="What twenty minutes does to a child."
      title="What twenty minutes does to a child. Interactive plate of the brain, spine, muscle and heart of a young rider, with the research behind each"
      className="relative bg-[#EBE5D7] pt-16 md:pt-20"
    />
  );
}

function AnatomyFrame({ src, id, label, title, className }: { src: string; id?: string; label: string; title: string; className: string }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const visible = useRef(false);
  const [height, setHeight] = useState(1000);

  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const post = () => {
      el.contentWindow?.postMessage({ type: "bsah-anatomy-visibility", visible: visible.current }, window.location.origin);
    };
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== el.contentWindow) return;
      if (event.data?.type === "bsah-anatomy-height" && Number.isFinite(event.data.height)) {
        setHeight(Math.max(480, Math.min(4000, Math.ceil(event.data.height))));
      }
    };
    window.addEventListener("message", onMessage);
    // The frame may finish loading before React attaches its message listener.
    // Measure it once on attachment and on load so its initial height is never lost.
    const syncFrame = () => {
      const body = el.contentDocument?.body;
      if (body) setHeight(Math.max(480, Math.min(4000, Math.ceil(body.getBoundingClientRect().height))));
      post();
    };
    el.addEventListener("load", syncFrame);
    if (el.contentDocument?.readyState === "complete") syncFrame();
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible.current = entry.isIntersecting;
        post();
      },
      { rootMargin: "120px 0px" },
    );
    observer.observe(el);
    return () => {
      window.removeEventListener("message", onMessage);
      el.removeEventListener("load", syncFrame);
      observer.disconnect();
    };
  }, []);

  return (
    <section id={id} aria-label={label} data-parallax-skip className={className}>
      <iframe
        ref={frame}
        src={src}
        title={title}
        loading="lazy"
        className="block w-full border-0"
        style={{ height }}
      />
    </section>
  );
}
