"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { Headline } from "@/components/film/Headline";
import { Label } from "@/components/film/Marks";
import { pillars, ranks } from "@/lib/content/curriculum";
import { ledger } from "@/lib/content/home";
import { cn } from "@/lib/utils";
import { asset } from "@/lib/content/asset";

/**
 * §7 · The ledger, simplified: one full-width instruction photograph, the four ranks as a selectable row beneath it,
 * and only the selected rank's pillars (existing curriculum data) listed below. No labels sit on the photograph.
 */
export function LedgerAscent() {
  const [selected, setSelected] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const rank = ranks[selected];

  const onKey = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = ranks.length - 1;
    const next =
      event.key === "ArrowRight" || event.key === "ArrowDown" ? (index === last ? 0 : index + 1)
      : event.key === "ArrowLeft" || event.key === "ArrowUp" ? (index === 0 ? last : index - 1)
      : event.key === "Home" ? 0
      : event.key === "End" ? last
      : -1;
    if (next < 0) return;
    event.preventDefault();
    setSelected(next);
    tabs.current[next]?.focus();
  };

  return (
    <section id="ledger" aria-labelledby="ledger-h" data-parallax-skip className="relative bg-night pt-24 md:pt-28">
      <div className="gutter pb-10 md:pb-14">
        <Label>The ledger</Label>
        <Headline id="ledger-h" className="mt-4" inscription={ledger.inscription} voice={ledger.voice} />
        <p className="t-story mt-6 max-w-2xl text-lede text-sand">{ledger.body}</p>
      </div>

      <div className="relative aspect-[4/3] w-full sm:aspect-[16/9] lg:aspect-[21/9]">
        <Image
          src={asset("/images/cadet-arena-instructor.webp")}
          alt="A cadet riding in the arena while an academy instructor watches"
          fill
          sizes="100vw"
          className="object-cover object-center"
        />
      </div>

      <div className="gutter py-[clamp(3rem,8vh,6rem)]">
        <div role="tablist" aria-label="Cadet ranks" className="grid grid-cols-2 gap-x-6 gap-y-2 lg:grid-cols-4">
          {ranks.map((item, index) => {
            const active = index === selected;
            return (
              <button
                key={item.id}
                ref={(el) => {
                  tabs.current[index] = el;
                }}
                type="button"
                role="tab"
                id={`ledger-tab-${item.id}`}
                aria-selected={active}
                aria-controls="ledger-panel"
                tabIndex={active ? 0 : -1}
                onClick={() => setSelected(index)}
                onKeyDown={(event) => onKey(event, index)}
                className={cn(
                  "border-t-2 py-5 text-left transition-colors duration-300",
                  active ? "border-gold text-bone" : "border-line text-dust hover:border-brass hover:text-sand",
                )}
              >
                <span className="font-mono block text-xs text-brass">Rank {item.numeral}</span>
                <span className="t-voice mt-2 block text-[clamp(1.4rem,2.4vw,2rem)] leading-tight">{item.name}</span>
                <span className="t-ui mt-2 block text-sm">{item.short}</span>
              </button>
            );
          })}
        </div>

        <div
          id="ledger-panel"
          role="tabpanel"
          aria-labelledby={`ledger-tab-${rank.id}`}
          className="mt-12 grid gap-10 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] md:gap-14"
        >
          <div>
            <h3 className="t-voice text-[clamp(2rem,3.4vw,3rem)] leading-tight text-bone">{rank.name}</h3>
            <p className="t-story mt-4 max-w-md text-sand">{rank.detail}</p>
            <p className="t-ui mt-4 text-sm text-dust">{rank.insignia}</p>
            <Link
              href={`/curriculum#rank-${rank.id}`}
              className="label mt-8 inline-block border-b border-line pb-1 text-sand transition-colors hover:border-gold hover:text-bone"
            >
              The full curriculum
            </Link>
          </div>
          <ul className="border-t border-line">
            {rank.pillars.map((n) => {
              const pillar = pillars[n - 1];
              return (
                <li key={n} className="grid gap-2 border-b border-line py-5 sm:grid-cols-[6rem_1fr] sm:gap-6">
                  <span className="font-mono pt-1 text-xs text-brass">Pillar {n}</span>
                  <div>
                    <p className="t-voice text-xl text-bone">{pillar.name}</p>
                    <p className="t-story mt-2 text-sand">{pillar.sub}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
