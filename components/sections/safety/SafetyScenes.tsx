"use client";

import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { FilmImage } from "@/components/film/FilmImage";
import { Headline } from "@/components/film/Headline";
import { Label, ReelMark } from "@/components/film/Marks";
import { CountUp } from "@/components/motion/CountUp";
import { kitLabels, orders, people, record, shields } from "@/lib/content/academy";
import { ease } from "@/lib/motion/tokens";

/** Title card · T10 still life. Signature: numbered labels pin themselves to each piece of kit. */
export function SafetyTitle() {
  return (
    <section aria-labelledby="safety-h" className="relative min-h-[100svh] overflow-hidden">
      <FilmImage name="safetyKit" priority />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      <ul className="absolute inset-0 hidden md:block">
        {kitLabels.map((k, i) => (
          <motion.li
            key={k.n}
            className="absolute flex items-center gap-2"
            style={{ left: `${k.x}%`, top: `${k.y}%` }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: ease.citadel, delay: 1 + i * 0.2 }}
          >
            <span className="font-mono grid h-7 w-7 place-items-center rounded-full border border-gold bg-night/70 text-[0.65rem] text-gold">{k.n}</span>
            <span className="label bg-night/60 px-2 py-1 text-bone">{k.name}</span>
          </motion.li>
        ))}
      </ul>
      <div className="gutter relative flex min-h-[100svh] flex-col justify-end pb-[10vh]">
        <ReelMark n={9} act="citadel" />
        <Headline id="safety-h" as="h1" size="poster" animate="mount" className="mt-6" inscription="Safety" voice="before speed." />
        <p className="t-story mt-6 max-w-xl text-sand">No lance is lowered until the basics are second nature.</p>
      </div>
    </section>
  );
}

/** §1 · S12 shield columns (second use) with titles. */
export function ShieldColumns() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  return (
    <section aria-labelledby="shields-h" className="gutter relative py-[clamp(6rem,14vh,12rem)]">
      <Label>The three shields</Label>
      <Headline id="shields-h" className="mt-4" inscription="People, horses," voice="and cover." />
      <div ref={ref} className="mt-14 grid gap-10 lg:grid-cols-3 lg:gap-0">
        {shields.map((s, i) => (
          <motion.div
            key={s.title}
            className="relative lg:px-10 lg:first:pl-0 lg:[&:not(:first-child)]:border-l lg:[&:not(:first-child)]:border-line"
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1, ease: ease.citadel, delay: i * 0.2 }}
          >
            <svg viewBox="0 0 40 48" className="h-12 w-10 text-brass" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden>
              <path d="M20 2 L37 8 V22 C37 34 29 42 20 46 C11 42 3 34 3 22 V8 Z" />
              <path d="M20 10 V38 M12 22 H28" strokeWidth="0.8" />
            </svg>
            <p className="t-voice mt-6 whitespace-nowrap text-[clamp(2.4rem,10vw,4.5rem)] leading-none text-gold lg:text-[clamp(2.4rem,4.3vw,4.5rem)]">{s.big}</p>
            <p className="label mt-4 text-bone">{s.title}</p>
            <p className="mt-2 max-w-xs text-sand">{s.line}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/** §2 · S51 orders of the day: a numbered protocol in mono, typed line by line. */
export function OrdersOfTheDay() {
  const ref = useRef<HTMLOListElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  return (
    <section aria-labelledby="orders-h" className="relative bg-umber/40 py-[clamp(6rem,14vh,12rem)]">
      <div className="gutter grid gap-12 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)]">
        <div>
          <Label>Protocol</Label>
          <Headline id="orders-h" className="mt-4" inscription="Orders" voice="of the day." />
          <p className="mt-6 max-w-sm text-sand">Posted in every tack room. Read aloud before the first session of the week.</p>
        </div>
        <ol ref={ref} className="font-mono flex flex-col gap-0 border-t border-line">
          {orders.map((o, i) => (
            <motion.li
              key={o}
              className="grid grid-cols-[3rem_1fr] gap-4 border-b border-line py-5 text-[0.95rem] text-bone"
              initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
              animate={inView ? { opacity: 1, clipPath: "inset(0 0% 0 0)" } : {}}
              transition={{ duration: 0.9, ease: ease.citadel, delay: i * 0.15 }}
            >
              <span className="text-gold">{String(i + 1).padStart(2, "0")}</span>
              <span>{o}</span>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/** §3 · S52 number wall. */
export function NumberWall() {
  return (
    <section aria-labelledby="record-h" className="gutter relative py-[clamp(6rem,14vh,12rem)]">
      <Label>The record</Label>
      <Headline id="record-h" className="mt-4" inscription="The numbers" voice="we publish." />
      <dl className="mt-14 grid grid-cols-2 gap-x-6 gap-y-14 lg:grid-cols-4">
        {record.map((n) => (
          <div key={n.label}>
            <dd className="t-inscribe whitespace-nowrap text-[clamp(2.2rem,10vw,5.5rem)] leading-none text-gold lg:text-[clamp(2.2rem,5.1vw,5.5rem)]">
              <CountUp value={n.value} prefix={n.prefix ?? ""} suffix={n.suffix} />
            </dd>
            <dt className="label mt-4 text-sand">
              {n.label}
              {n.sample && <span className="ml-2 text-dust">· sample</span>}
            </dt>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** §4 · the people in the arena. */
export function People() {
  return (
    <section aria-labelledby="people-h" className="relative pb-[clamp(6rem,14vh,12rem)]">
      <div className="gutter">
        <Label>Faculty</Label>
        <Headline id="people-h" className="mt-4" inscription="The people" voice="in the arena." />
      </div>
      <div className="gutter mt-12 grid gap-6 md:grid-cols-[1.4fr_1fr]">
        {people.map((p) => (
          <figure key={p.role}>
            <div className="relative aspect-[4/3] overflow-hidden md:aspect-auto md:h-[60svh]">
              <FilmImage name={p.image} sizes="(min-width: 768px) 55vw, 100vw" />
            </div>
            <figcaption className="mt-4">
              <p className="t-voice text-2xl text-bone">{p.role}</p>
              <p className="mt-1 text-sand">{p.line}</p>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
