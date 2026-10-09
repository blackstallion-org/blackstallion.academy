"use client";

import { AnimatePresence, motion, useScroll, useTransform } from "motion/react";
import { useRef, useState } from "react";
import { FilmImage } from "../FilmImage";
import { Crest } from "@/components/brand/Crest";
import { SealStamp } from "@/components/motion/SealStamp";
import { corridors, creed } from "@/lib/content/film";
import { cn } from "@/lib/utils";
import { r } from "../range";

const film = [0.7, 0, 0.2, 1] as const;

/**
 * Chapter VIII and the end credits. Three gates, one for each audience.
 * Signature moment: the chosen gate opens into its form; sending it lands the seal.
 */
export function Contact() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end end"] });
  const scale = useTransform(scrollYProgress, r(0, 1), [1.25, 1]);
  const [open, setOpen] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);

  return (
    <section ref={ref} id="contact" data-chapter="contact" aria-label="Chapter VIII: Contact" className="relative bg-night">
      <div className="relative min-h-[100svh] overflow-hidden">
        <FilmImage name="duneSilhouette" scale={scale} position="50% 65%" />
        <div className="absolute inset-0 bg-gradient-to-b from-night via-night/40 to-night" />

        <div className="relative flex min-h-[100svh] flex-col justify-center gap-12 px-5 py-28 sm:px-10 lg:pl-[8vw] lg:pr-28">
          <div>
            <p className="label mb-6 text-gold">
              Chapter VIII <span className="mx-3 text-sand/50">/</span> The Gate
            </p>
            <h2 className="font-display text-display-1 tracking-display opsz-display">
              Ride with us.
            </h2>
          </div>

          <ul className="max-w-[1000px] border-t border-sand/20">
            {corridors.map((c, i) => {
              const isOpen = open === c.id;
              return (
                <li key={c.id} className="border-b border-sand/20">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`gate-${c.id}`}
                    onClick={() => setOpen(isOpen ? null : c.id)}
                    className="group flex w-full items-baseline gap-5 py-6 text-left sm:gap-10"
                  >
                    <span className="font-mono text-sm text-brass">0{i + 1}</span>
                    <span className="flex-1">
                      <span className={cn("block font-display text-[clamp(2rem,5vw,4.5rem)] leading-none transition-colors duration-500", isOpen ? "italic text-gold" : "text-bone group-hover:text-sand")}>
                        {c.title}
                      </span>
                      <span className="mt-3 block max-w-[52ch] text-sand/80">{c.line}</span>
                    </span>
                    <span className={cn("label hidden text-sand/70 transition-transform duration-500 sm:block", isOpen && "rotate-45 text-gold")} aria-hidden>
                      +
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        id={`gate-${c.id}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.8, ease: film }}
                        className="overflow-hidden"
                      >
                        {sent === c.id ? (
                          <div className="flex items-center gap-8 pb-10">
                            <SealStamp trigger="manual" play label="RECEIVED" className="h-24 w-24" />
                            <p className="max-w-[40ch] italic text-sand">
                              Received. (Preview only: this form connects to the database in the next session.)
                            </p>
                          </div>
                        ) : (
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              setSent(c.id);
                            }}
                            className="grid gap-6 pb-10 sm:grid-cols-3"
                          >
                            {[
                              ["Name", "text", "name"],
                              ["Phone", "tel", "tel"],
                              [c.id === "schools" ? "School" : "Email", c.id === "schools" ? "text" : "email", c.id === "schools" ? "organization" : "email"],
                            ].map(([label, type, auto]) => (
                              <label key={label} className="block">
                                <span className="label text-[0.66rem] text-sand/70">{label}</span>
                                <input
                                  required
                                  type={type}
                                  autoComplete={auto}
                                  className="mt-2 w-full border-b border-sand/30 bg-transparent py-2 text-lg text-bone outline-none transition-colors focus:border-gold"
                                />
                              </label>
                            ))}
                            <button type="submit" className="label justify-self-start border border-brass/70 px-6 py-3 text-bone transition-colors hover:border-gold hover:text-gold sm:col-span-3">
                              {c.cta}
                            </button>
                          </form>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <EndCredits />
    </section>
  );
}

function EndCredits() {
  return (
    <footer className="relative px-5 pb-16 pt-24 text-center sm:px-10">
      <Crest className="mx-auto h-24 w-24" simple />
      <p className="mt-8 font-display text-display-3 italic text-gold">Dominus Sui, Dominus Equi</p>
      <p className="label mt-3 text-sand/70">Master of oneself, master of the horse</p>
      <div className="mx-auto mt-14 grid max-w-[900px] gap-8 sm:grid-cols-3">
        {[
          ["A production of", "Vicarius Infinitum Holdings Pvt Ltd"],
          ["Operated by", "The Black Stallion Academy of Horsemanship Pvt Ltd"],
          ["Governed by", "School Tent Pegging Council of India"],
        ].map(([k, v]) => (
          <div key={k}>
            <p className="label text-[0.62rem] text-dust">{k}</p>
            <p className="mt-2 font-display text-lg text-bone">{v}</p>
          </div>
        ))}
      </div>
      <ul className="mx-auto mt-14 flex max-w-[60ch] flex-col gap-3 italic text-sand/80">
        {creed.map((l) => (
          <li key={l}>{l}</li>
        ))}
      </ul>
      <p className="label mt-16 text-[0.62rem] text-dust">
        <span className="font-mono tracking-normal">© 2026</span> · blackstallion.academy · Imagery is AI-generated placeholder until the academy shoot
      </p>
    </footer>
  );
}
