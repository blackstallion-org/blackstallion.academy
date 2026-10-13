"use client";

import Link from "next/link";
import { useState } from "react";
import { FilmImage } from "@/components/film/FilmImage";
import { Headline } from "@/components/film/Headline";
import { Arrow, Hoof, Label } from "@/components/film/Marks";
import { doors } from "@/lib/content/home";
import { cn } from "@/lib/utils";

/**
 * §6 Three doors · S06 triptych.
 * Signature: the door you lean toward widens and brightens; the others dim like closing gates.
 */
export function Doors() {
  const [open, setOpen] = useState(0);

  return (
    <section aria-labelledby="doors-h" className="relative py-[clamp(6rem,14vh,12rem)]">
      <div className="gutter mb-12">
        <Label>Choose your door</Label>
        <Headline id="doors-h" className="mt-4" inscription={doors.inscription} voice={doors.voice} />
      </div>

      <div className="gutter flex flex-col gap-3 lg:h-[78svh] lg:flex-row">
        {doors.items.map((d, i) => {
          const active = open === i;
          return (
            <Link
              key={d.who}
              href={d.href}
              onMouseEnter={() => setOpen(i)}
              onFocus={() => setOpen(i)}
              className={cn(
                "group relative block min-h-[68svh] overflow-hidden transition-[flex-grow] duration-[900ms] ease-[var(--ease-citadel)] lg:min-h-0",
                active ? "lg:flex-[2.4]" : "lg:flex-1",
              )}
            >
              <FilmImage
                name={d.image}
                sizes="(min-width: 1024px) 50vw, 100vw"
                imgClassName="opacity-100"
              />
              <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-between p-6 md:p-8">
                <div className="flex items-start justify-between">
                  <span className="font-mono text-xs text-gold">0{i + 1}</span>
                  <span className="label text-sand lg:[writing-mode:vertical-rl]">{d.who}</span>
                </div>
                <div>
                  <p className="t-voice text-display-3 text-bone">{d.title}</p>
                  <ul
                    className={cn(
                      "mt-5 flex flex-col gap-3 transition-all duration-700",
                      active ? "lg:max-h-60 lg:opacity-100" : "lg:max-h-0 lg:overflow-hidden lg:opacity-0",
                    )}
                  >
                    {d.points.map((pt) => (
                      <li key={pt} className="flex items-start gap-3 text-sm text-sand md:text-base">
                        <Hoof className="mt-1 h-3.5 w-3.5 text-brass" />
                        {pt}
                      </li>
                    ))}
                  </ul>
                  <span className="label mt-6 inline-flex items-center gap-3 text-gold">
                    {d.cta}
                    <Arrow className="transition-transform duration-500 group-hover:translate-x-1" />
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
