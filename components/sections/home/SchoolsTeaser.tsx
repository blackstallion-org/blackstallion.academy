"use client";

import { useState } from "react";
import { FilmImage } from "@/components/film/FilmImage";
import { Headline } from "@/components/film/Headline";
import { Cta, Label } from "@/components/film/Marks";
import { BlueprintPlan } from "@/components/sections/schools/BlueprintPlan";
import { schoolsTeaser } from "@/lib/content/home";
import { tiers } from "@/lib/content/schools";
import { cn } from "@/lib/utils";

/**
 * §9 Schools teaser · S09 blueprint (compact).
 * Signature: choosing a tier redraws the site plan, stall by stall.
 */
export function SchoolsTeaser() {
  const [id, setId] = useState(tiers[0].id);
  const tier = tiers.find((t) => t.id === id)!;

  return (
    <section aria-labelledby="schools-h" className="relative overflow-hidden py-[clamp(6rem,14vh,12rem)]">
      <FilmImage name="bgPavilion" grade="deep" className="opacity-30 mix-blend-multiply" />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-night via-night/80 to-night" />

      <div className="gutter relative grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)] lg:items-center">
        <div>
          <Label reel={10}>For school boards</Label>
          <Headline id="schools-h" className="mt-4" inscription={schoolsTeaser.inscription} voice={schoolsTeaser.voice} />
          <p className="mt-6 max-w-md text-sand">{schoolsTeaser.body}</p>

          <div className="mt-10 flex flex-col border-t border-line" role="radiogroup" aria-label="Hub tier">
            {tiers.map((t) => (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={id === t.id}
                onClick={() => setId(t.id)}
                className="group grid grid-cols-[1fr_auto] items-baseline gap-4 border-b border-line py-4 text-left"
              >
                <span>
                  <span className={cn("t-voice block text-2xl transition-colors", id === t.id ? "text-gold" : "text-sand group-hover:text-bone")}>{t.name}</span>
                  <span className="t-ui mt-1 block text-sm text-dust">
                    {t.stables} stables · {t.acres} · {t.cadets} cadets
                  </span>
                </span>
                <span className={cn("font-mono text-sm", id === t.id ? "text-gold" : "text-dust")}>{t.capexLabel}</span>
              </button>
            ))}
          </div>
          <div className="mt-10">
            <Cta href="/schools" variant="solid">
              Enter the school portal
            </Cta>
          </div>
        </div>

        <div className="plate relative aspect-[800/460] w-full p-2">
          <BlueprintPlan tier={tier} />
          <p className="font-mono absolute bottom-3 right-4 text-[0.6rem] text-dust">DRAWING {tier.id.toUpperCase()} · NOT TO SCALE</p>
        </div>
      </div>
    </section>
  );
}
