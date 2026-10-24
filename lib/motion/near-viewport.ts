/**
 * Runs `callback` once, the first time `element` comes within `margin` of the viewport.
 *
 * Scroll-linked GSAP set-ups (SplitText, ScrollTrigger, scrubbed tweens) measure layout when they are created.
 * Creating dozens of them during hydration forced a long, layout-thrashing task on phones; creating each one
 * as it approaches the viewport keeps the result identical (they are all offscreen until then) at a fraction
 * of the start-up cost. One shared IntersectionObserver per margin keeps the bookkeeping cheap.
 *
 * Returns a cancel function. Without IntersectionObserver the callback runs on the next frame.
 */
type Entry = { observer: IntersectionObserver; callbacks: Map<Element, Set<() => void>> };

const registry = new Map<string, Entry>();
/** About one screen above and below the viewport: set-ups finish before anything they touch is visible. */
export const NEAR_VIEWPORT = "100% 0px";

function entryFor(margin: string): Entry {
  let entry = registry.get(margin);
  if (entry) return entry;
  const callbacks = new Map<Element, Set<() => void>>();
  const observer = new IntersectionObserver((records) => {
    for (const record of records) {
      if (!record.isIntersecting) continue;
      const pending = callbacks.get(record.target);
      callbacks.delete(record.target);
      observer.unobserve(record.target);
      pending?.forEach((run) => run());
    }
  }, { rootMargin: margin });
  entry = { observer, callbacks };
  registry.set(margin, entry);
  return entry;
}

export function whenNearViewport(element: Element, callback: () => void, margin: string = NEAR_VIEWPORT): () => void {
  if (typeof IntersectionObserver === "undefined") {
    const frame = requestAnimationFrame(callback);
    return () => cancelAnimationFrame(frame);
  }
  const { observer, callbacks } = entryFor(margin);
  let set = callbacks.get(element);
  if (!set) {
    set = new Set();
    callbacks.set(element, set);
    observer.observe(element);
  }
  let done = false;
  const run = () => { done = true; callback(); };
  set.add(run);
  return () => {
    if (done) return;
    const current = callbacks.get(element);
    current?.delete(run);
    if (current && current.size === 0) {
      callbacks.delete(element);
      observer.unobserve(element);
    }
  };
}
