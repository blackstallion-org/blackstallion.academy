"use client";

import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Label } from "@/components/film/Marks";
import { hotspotCopy } from "@/lib/content/stride";
import { LIMBS, LIMB_LABEL } from "@/lib/stride/constants";
import type { StrideClock } from "@/lib/stride/clock";
import { hotspotReadouts } from "@/lib/stride/readouts";
import { StrideGraph } from "./StrideChart";
import type { ChannelId, StrideData } from "@/lib/stride/rig";
import { CAMERAS, VIEWS, type HotspotId, type StrideStore } from "@/lib/stride/store";
import { ease } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";

type Props = {
  /** The view and camera controls sit on the stage (wide screens in the laboratory); here they would be a duplicate. */
  toolsOnStage?: boolean;
  /** null while the animation loads, or when the 3D view is unavailable: the parts list and the words still work. */
  data: StrideData | null;
  clock: StrideClock;
  store: StrideStore;
  reduced: boolean;
  onSelect: (id: HotspotId | null) => void;
  className?: string;
};

const seg = "label px-3 py-2.5 text-[0.64rem] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold";

export function LabPanel({ data, clock, store, reduced, onSelect, toolsOnStage = false, className }: Props) {
  useSyncExternalStore(store.subscribe, store.getVersion, store.getVersion);
  const { hotspot } = store;
  const live = !!data;
  const selected = hotspot ? hotspotCopy.find((h) => h.id === hotspot)! : null;

  return (
    <div className={cn("flex flex-col gap-10", className)}>
      <header>
        <Label>Movement laboratory</Label>
        <h2 id="lab-h" className="t-inscribe mt-3 text-display-3 leading-[1.08] text-bone">
          Move through one stride.
        </h2>
        <p className="mt-3 max-w-md text-sand">
          Play it, slow it, step through it frame by frame, change the view, and touch a part of the horse or the rider.
        </p>
      </header>

      {data && (
        <section aria-labelledby="lab-graph">
          <p id="lab-graph" className="label mb-3 text-brass">What the saddle does</p>
          <StrideGraph data={data} clock={clock} />
        </section>
      )}

      {live && !toolsOnStage && (
        <section aria-labelledby="lab-view">
          <ViewControls store={store} />
        </section>
      )}

      <section aria-labelledby="lab-parts">
        <p id="lab-parts" className="label text-brass">Parts to look at</p>
        <ul className="mt-3 grid grid-cols-2 gap-x-6 border-t border-line sm:grid-cols-2">
          {hotspotCopy.map((h, i) => {
            const on = hotspot === h.id;
            return (
              <li key={h.id} className="border-b border-line">
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => onSelect(on ? null : h.id)}
                  className={cn("group flex w-full items-baseline gap-3 py-3 text-left focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-gold", on ? "text-gold" : "text-bone")}
                >
                  <span className="font-mono text-[0.68rem] text-dust">{String(i + 1).padStart(2, "0")}</span>
                  <span className="t-ui text-[0.95rem] transition-transform duration-300 group-hover:translate-x-0.5 motion-reduce:transition-none">{h.label}</span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="mt-6 min-h-[14rem]" aria-live="polite">
          <AnimatePresence mode="wait" initial={false}>
            {selected ? (
              <motion.article
                key={selected.id}
                data-testid="hotspot-card"
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduced ? 0.01 : 0.5, ease: ease.citadel }}
              >
                <div className="flex items-center gap-3">
                  <span aria-hidden className="h-px w-8 bg-gold" />
                  <p className="label text-gold">{selected.label}</p>
                </div>
                <h3 className="t-inscribe mt-3 text-[1.55rem] leading-[1.15] text-bone">{selected.title}</h3>
                <p className="mt-3 text-[1.02rem] leading-[1.65] text-sand">{selected.body}</p>
                <p className="mt-3 text-[1rem] italic leading-[1.6] text-dust">{selected.watch}</p>
                {data && <Readouts id={selected.id} data={data} clock={clock} />}
              </motion.article>
            ) : (
              <p key="none" className="t-ui text-[0.9rem] text-dust">
                Choose a part from the list, or touch one of the gold points on the horse.
              </p>
            )}
          </AnimatePresence>
        </div>
      </section>

      {data && <Numbers data={data} />}
    </div>
  );
}

function Readouts({ id, data, clock }: { id: HotspotId; data: StrideData; clock: StrideClock }) {
  const items = useMemo(() => hotspotReadouts(id, data), [id, data]);
  const refs = useRef<(HTMLElement | null)[]>([]);
  useEffect(() => {
    const draw = (c: StrideClock) => items.forEach((it, i) => refs.current[i] && (refs.current[i]!.textContent = it.value(c.phase)));
    draw(clock);
    return clock.subscribe(draw);
  }, [items, clock]);
  return (
    <dl className="mt-5 grid gap-x-6 gap-y-2 border-t border-line pt-4 sm:grid-cols-2">
      {items.map((it, i) => (
        <div key={it.key} className={cn("flex flex-col", it.key === "rg" && "sm:col-span-2")}>
          <dt className="label text-[0.6rem] text-dust">{it.label}</dt>
          <dd ref={(el) => void (refs.current[i] = el)} className="font-mono text-[0.82rem] text-bone" />
        </div>
      ))}
      <p className="t-ui text-[0.72rem] italic text-dust sm:col-span-2">From the animation, not measured.</p>
    </dl>
  );
}

const CH_ORDER: ChannelId[] = ["vertical", "lateral", "foreaft", "pitch", "roll"];

/** The animation's own numbers, so nothing on the page is a claim about a living horse. */
function Numbers({ data }: { data: StrideData }) {
  const f = (v: number, d = 1) => v.toFixed(d);
  const worst = (get: (l: (typeof LIMBS)[number]) => number) => Math.max(...LIMBS.map(get));
  const tempo = 0.8 / data.strideSeconds; // authored speeds are at 0.8 s a stride
  return (
    <section aria-labelledby="lab-numbers">
      <p id="lab-numbers" className="label text-brass">Numbers from the animation</p>
      <p className="t-ui mt-2 text-[0.78rem] text-dust">Read from the playing clip. Illustrative: derived from the animation, not measured.</p>
      <table className="mt-4 w-full border-t border-line text-left text-[0.82rem]">
        <caption className="sr-only">Peak-to-peak movement of the horse’s back at the saddle and of the rider’s pelvis over one stride</caption>
        <thead>
          <tr className="label text-[0.6rem] text-dust">
            <th scope="col" className="py-2 pr-3 font-normal">Movement over one stride</th>
            <th scope="col" className="py-2 pr-3 text-right font-normal">Horse’s back</th>
            <th scope="col" className="py-2 pr-3 text-right font-normal">Rider’s pelvis</th>
            <th scope="col" className="py-2 text-right font-normal">Cycles a stride</th>
          </tr>
        </thead>
        <tbody className="font-mono">
          {CH_ORDER.map((id) => {
            const c = data.channels[id];
            return (
              <tr key={id} className="border-t border-line">
                <th scope="row" className="t-ui py-2 pr-3 text-left font-normal text-bone">{c.label}</th>
                <td className="py-2 pr-3 text-right text-bone">{f(c.horseP2P, c.unit === "mm" ? 1 : 2)} {c.unit}</td>
                <td className="py-2 pr-3 text-right text-gold">{f(c.riderP2P, c.unit === "mm" ? 1 : 2)} {c.unit}</td>
                <td className="py-2 text-right text-sand">{c.perStride}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <dl className="mt-5 grid gap-x-6 gap-y-3 border-t border-line pt-4 text-[0.82rem] sm:grid-cols-2">
        <Fact label="Tempo" value={`${Math.round(60 / data.strideSeconds)} strides a minute (authored at 75)`} />
        <Fact label="Seat cycles a minute" value={`${Math.round(data.seatCyclesPerMinute)} (up and down)`} />
        <Fact label="Hooves down at once" value={`${data.minSupport} to ${data.maxSupport}`} />
        <Fact label="Landing order" value={`${data.touchdownOrder.map((l) => LIMB_LABEL[l].toLowerCase()).join(", ")}`} />
        <Fact label="Gap between landings" value={`${data.touchdownGaps.map((g) => `${Math.round(g * 100)}%`).join(", ")} of a stride`} />
        <Fact label="Planted hoof, distance moved over the ground" value={`${f(worst((l) => data.feet[l].driftCm))} cm at most (the clip as authored: ${f(worst((l) => data.feetAuthored[l].driftCm))} cm)`} />
        <Fact label="Planted hoof, speed over the ground" value={`${f(worst((l) => data.feet[l].plantedSpeedMps) * tempo * 100, 0)} cm/s at most (as authored: ${f(worst((l) => data.feetAuthored[l].plantedSpeedMps) * tempo * 100, 0)})`} />
      </dl>
    </section>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <dt className="label text-[0.6rem] text-dust">{label}</dt>
      <dd className="font-mono text-bone">{value}</dd>
    </div>
  );
}

/** What is shown (horse and rider, horse, rider, skeleton) and where the camera stands. Every button changes the real scene. */
export function ViewControls({ store, vertical = false, className }: { store: StrideStore; vertical?: boolean; className?: string }) {
  useSyncExternalStore(store.subscribe, store.getVersion, store.getVersion);
  const { view, camera, skeleton, hotspot, manual } = store;
  return (
    <div className={cn("grid gap-5", className)}>
      <div>
        <p id="lab-view" className="label text-brass">Show</p>
        <div className={cn("mt-2 flex gap-x-1 gap-y-1", vertical ? "flex-col items-start" : "flex-wrap items-center")} role="group" aria-label="What is shown">
          {VIEWS.map((v) => (
            <button key={v.id} type="button" aria-pressed={view === v.id} onClick={() => store.patch({ view: v.id })} className={cn(seg, view === v.id ? "bg-bone text-night" : "text-dust hover:text-bone")}>
              {v.label}
            </button>
          ))}
          {!vertical && <span aria-hidden className="mx-1 h-4 w-px bg-line" />}
          <button type="button" aria-pressed={skeleton} onClick={() => store.patch({ skeleton: !skeleton })} className={cn(seg, skeleton ? "bg-bone text-night" : "text-dust hover:text-bone")}>
            Skeleton
          </button>
        </div>
      </div>
      <div>
        <p className="label text-brass">Camera</p>
        <div className={cn("mt-2 flex gap-x-1 gap-y-1", vertical ? "flex-col items-start" : "flex-wrap items-center")} role="group" aria-label="Camera angle">
          {CAMERAS.filter((c) => c.id !== "beauty").map((c) => {
            const on = manual && !hotspot && camera === c.id;
            return (
              <button key={c.id} type="button" aria-pressed={on} onClick={() => store.patch({ camera: c.id, hotspot: null, manual: true })} className={cn(seg, on ? "bg-bone text-night" : "text-dust hover:text-bone")}>
                {c.label}
              </button>
            );
          })}
        </div>
        <p className={cn("t-ui mt-2 text-[0.76rem] text-dust", vertical && "max-w-[9rem]")}>Drag the horse to turn the view. The wheel never zooms.</p>
      </div>
    </div>
  );
}
