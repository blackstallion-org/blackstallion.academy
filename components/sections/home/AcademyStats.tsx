"use client";

import { useEffect, useRef, useState } from "react";
import { hero } from "@/lib/content/home";

/** Native scroll-snap keeps touch scrolling and the desktop three-column layout. */
export function AcademyStats() {
  const listRef = useRef<HTMLDListElement>(null);
  const [active, setActive] = useState(0);
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActive(Number((visible.target as HTMLElement).dataset.card));
    }, { root: list, threshold: [0.5, 0.8] });
    Array.from(list.children).forEach((child) => observer.observe(child));
    return () => observer.disconnect();
  }, []);
  const go = (index: number) => {
    const list = listRef.current, card = list?.children[index] as HTMLElement | undefined;
    if (list && card) list.scrollTo({ left: card.offsetLeft - list.offsetLeft, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  };
  return <div aria-label="Academy at a glance" aria-roledescription="carousel">
    <dl ref={listRef} tabIndex={0} aria-label="Academy figures; scroll horizontally on small screens" className="relative flex snap-x snap-mandatory gap-6 overflow-x-auto border-t border-brass sm:grid sm:grid-cols-3 sm:gap-0 sm:overflow-visible">
      {hero.stats.map((stat, index) => <div key={stat.value} data-card={index} className={`min-w-[85%] snap-start py-6 sm:min-w-0 sm:py-4 ${index ? "sm:border-l sm:border-brass sm:pl-6 md:pl-8" : "sm:pr-4"}`}><dt className="sr-only">{stat.label}</dt><dd className="t-voice text-[clamp(1.85rem,3.4vw,2.8rem)] leading-none text-gold">{stat.value}</dd><dd className="label mt-3 text-[0.65rem] text-dust md:text-[0.72rem]">{stat.label}</dd></div>)}
    </dl>
    <div role="group" aria-label="Choose an academy figure" className="flex justify-center sm:hidden">{hero.stats.map((stat, index) => <button key={stat.value} type="button" aria-label={`Show figure ${index + 1}: ${stat.label}`} aria-pressed={active === index} onClick={() => go(index)} className="grid h-11 w-11 place-items-center"><span aria-hidden className={`h-1.5 w-1.5 rounded-full ${active === index ? "bg-gold" : "bg-brass/40"}`} /></button>)}</div>
  </div>;
}
