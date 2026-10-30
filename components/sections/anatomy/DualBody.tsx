"use client";
import { useEffect, useRef, useState } from "react";

/**
 * "One conversation. Two bodies." — the single shared anatomy exhibit (homepage + /anatomy).
 * The light three.js exhibit lives in a same-origin iframe (public/anatomy/dual-body.html) so its
 * scripts and styles stay isolated from the site's animation and CSS systems. The frame reports its
 * content height; this wrapper tells it when it is on screen so it can stop rendering offscreen.
 */
export function DualBody() {
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
    // Re-send the current visibility once the frame's script is listening.
    el.addEventListener("load", post);
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
      el.removeEventListener("load", post);
      observer.disconnect();
    };
  }, []);

  return (
    <section aria-label="One conversation. Two bodies." data-parallax-skip className="relative bg-umber pt-24 md:pt-28">
      <iframe
        ref={frame}
        src="/anatomy/dual-body.html"
        title="One conversation. Two bodies. Interactive Marwari horse and cadet rider anatomy"
        loading="lazy"
        className="block w-full border-0"
        style={{ height }}
      />
    </section>
  );
}
