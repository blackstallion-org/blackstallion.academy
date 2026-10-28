"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type RefObject } from "react";
import { niceTicks, sampleCyclic } from "@/lib/stride/analysis";
import { AUTHORED, LIMBS, LIMB_LABEL, LIMB_SHORT, SPEEDS, STUDY_STRIDE_SECONDS } from "@/lib/stride/constants";
import type { StrideClock } from "@/lib/stride/clock";
import type { ChannelId, StrideData } from "@/lib/stride/rig";
import { cn } from "@/lib/utils";

const PAD_L = 40;
const PAD_R = 12;

function useWidth(ref: RefObject<HTMLElement | null>, fallback = 520) {
  const [width, setWidth] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setWidth(Math.max(260, Math.round(el.clientWidth)));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return width;
}

/** Dragging on a chart moves the one clock; the chart's own playhead then follows the clock like everything else. */
function useScrub(clock: StrideClock, target: RefObject<HTMLElement | null>, width: number) {
  const dragging = useRef(false);
  const phaseAt = (clientX: number) => {
    const rect = target.current!.getBoundingClientRect();
    const px = Math.min(width - PAD_R, Math.max(PAD_L, clientX - rect.left));
    return Math.min(0.9999, (px - PAD_L) / (width - PAD_L - PAD_R));
  };
  return {
    onPointerDown: (e: React.PointerEvent) => {
      dragging.current = true;
      e.currentTarget.setPointerCapture(e.pointerId);
      clock.pause();
      clock.set(phaseAt(e.clientX));
    },
    onPointerMove: (e: React.PointerEvent) => {
      if (dragging.current) clock.set(phaseAt(e.clientX));
    },
    onPointerUp: () => {
      dragging.current = false;
    },
    onPointerCancel: () => {
      dragging.current = false;
    },
  };
}

const sign = (v: number, unit: string) => `${v >= 0 ? "+" : "−"}${Math.abs(v).toFixed(unit === "mm" ? 1 : 2)} ${unit}`;

/* ------------------------------------------------------------------------------------------------ timeline */

const ROW_H = 12;
const ROW_GAP = 4;
const FOOT_TOP = 22;
const FOOT_H = ROW_H * 4 + ROW_GAP * 3;
const TL_H = FOOT_TOP + FOOT_H + 8 + 30;

/**
 * The stride timeline: four rows show when each hoof is on the ground (read from the animation's own hooves), a tick for each of the
 * 24 authored frames, and the playhead. It is the keyboard control of the page: arrow keys step a frame, Home and End jump to the
 * ends, Page Up and Down jump between landings, Space plays and pauses.
 */
export function StrideTimeline({ data, clock, className }: { data: StrideData; clock: StrideClock; className?: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const width = useWidth(wrapRef);
  const scrub = useScrub(clock, sliderRef, width);
  const x = useCallback((phase: number) => PAD_L + phase * (width - PAD_L - PAD_R), [width]);
  const playhead = useRef<SVGGElement>(null);
  const readFeet = useRef<HTMLParagraphElement>(null);

  const draw = useCallback(
    (c: StrideClock) => {
      playhead.current?.setAttribute("transform", `translate(${x(c.phase).toFixed(1)} 0)`);
      if (readFeet.current) {
        const idx = Math.floor(c.phase * data.samples) % data.samples;
        const down = LIMBS.filter((l) => data.stance[l].mask[idx]).map((l) => LIMB_SHORT[l]);
        readFeet.current.textContent = `Frame ${String(c.frame + 1).padStart(2, "0")} of ${AUTHORED.frames} · ${down.length} hooves down: ${down.join(" ")}`;
      }
      const slider = sliderRef.current;
      if (slider && !c.playing) {
        slider.setAttribute("aria-valuenow", String(c.frame + 1));
        slider.setAttribute("aria-valuetext", `Frame ${c.frame + 1} of ${AUTHORED.frames}, ${Math.round(c.phase * 100)} percent of the stride`);
      }
    },
    [x, data],
  );
  useEffect(() => {
    draw(clock);
    return clock.subscribe(draw);
  }, [clock, draw]);

  const touchdowns = useMemo(() => LIMBS.map((l) => ({ limb: l, phase: data.stance[l].touchdown })).sort((a, b) => a.phase - b.phase), [data]);
  const onKey = (e: React.KeyboardEvent) => {
    const frames = AUTHORED.frames;
    const move = (n: number) => {
      clock.pause();
      for (let i = 0; i < Math.abs(n); i++) clock.step(n > 0 ? 1 : -1);
    };
    switch (e.key) {
      case "ArrowRight":
      case "ArrowUp":
        move(e.shiftKey ? 4 : 1);
        break;
      case "ArrowLeft":
      case "ArrowDown":
        move(e.shiftKey ? -4 : -1);
        break;
      case "Home":
        clock.pause();
        clock.set(0);
        break;
      case "End":
        clock.pause();
        clock.set((frames - 1) / frames);
        break;
      case "PageUp":
      case "PageDown": {
        const here = clock.phase;
        const next =
          e.key === "PageDown"
            ? (touchdowns.find((t) => t.phase > here + 1e-3) ?? touchdowns[0])
            : ([...touchdowns].reverse().find((t) => t.phase < here - 1e-3) ?? touchdowns[touchdowns.length - 1]);
        clock.pause();
        clock.set(next.phase);
        break;
      }
      case " ":
        clock.toggle();
        break;
      default:
        return;
    }
    e.preventDefault();
  };

  const bottom = FOOT_TOP + FOOT_H;
  return (
    <div className={className}>
      <div ref={wrapRef} className="w-full">
        <div
          ref={sliderRef}
          role="slider"
          tabIndex={0}
          aria-label="Position in the stride. Arrow keys step one frame, Shift and arrows four, Home and End jump to the ends, Page Up and Page Down jump between landings, Space plays and pauses."
          aria-valuemin={1}
          aria-valuemax={AUTHORED.frames}
          aria-valuenow={1}
          onKeyDown={onKey}
          {...scrub}
          style={{ touchAction: "pan-y" }}
          data-testid="timeline"
          className="cursor-ew-resize focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
        >
          <svg width={width} height={TL_H} viewBox={`0 0 ${width} ${TL_H}`} role="img" aria-label="Stride timeline: when each hoof is on the ground over one stride, read from the animation." className="block overflow-visible">
            {LIMBS.map((l, i) => {
              const top = FOOT_TOP + i * (ROW_H + ROW_GAP);
              const s = data.stance[l];
              const a = s.touchdown;
              const b = a + s.duty;
              const rects = b <= 1 ? [[a, b]] : [[a, 1], [0, b - 1]];
              return (
                <g key={l}>
                  <text x={PAD_L - 8} y={top + ROW_H - 2} textAnchor="end" className="fill-dust font-mono" fontSize={10}>
                    {LIMB_SHORT[l]}
                  </text>
                  <line x1={PAD_L} x2={width - PAD_R} y1={top + ROW_H / 2} y2={top + ROW_H / 2} stroke="var(--color-line)" strokeWidth={1} />
                  {rects.map(([p, q], k) => (
                    <rect key={k} x={x(p)} width={Math.max(1, x(q) - x(p))} y={top} height={ROW_H} fill={l === "FR" || l === "HR" ? "var(--color-brass)" : "var(--color-bone)"} opacity={0.85}>
                      <title>{`${LIMB_LABEL[l]} hoof on the ground`}</title>
                    </rect>
                  ))}
                </g>
              );
            })}
            {touchdowns.map((t, i) => (
              <g key={t.limb} transform={`translate(${x(t.phase)} 0)`}>
                <line y1={FOOT_TOP - 5} y2={bottom} stroke="var(--color-gold)" strokeWidth={1} strokeDasharray="2 3" opacity={0.75} />
                <text y={FOOT_TOP - 9} textAnchor="middle" className="fill-gold font-mono" fontSize={10}>
                  {i + 1}
                </text>
              </g>
            ))}
            <line x1={PAD_L} x2={width - PAD_R} y1={bottom + 8} y2={bottom + 8} stroke="var(--color-line)" />
            {Array.from({ length: AUTHORED.frames + 1 }, (_, f) => (
              <line key={f} x1={x(f / AUTHORED.frames)} x2={x(f / AUTHORED.frames)} y1={bottom + 8} y2={bottom + (f % 6 === 0 ? 15 : 11)} stroke="var(--color-brass)" strokeWidth={f % 6 === 0 ? 1.2 : 0.7} />
            ))}
            {[0, 0.25, 0.5, 0.75, 1].map((t) => (
              <text key={t} x={x(t)} y={bottom + 28} textAnchor={t === 0 ? "start" : t === 1 ? "end" : "middle"} className="fill-dust font-mono" fontSize={10}>
                {Math.round(t * 100)}%
              </text>
            ))}
            <g ref={playhead} style={{ pointerEvents: "none" }}>
              <line y1={FOOT_TOP - 4} y2={bottom + 8} stroke="var(--color-bone)" strokeWidth={1} />
              <path d={`M-4,${FOOT_TOP - 5} L4,${FOOT_TOP - 5} L0,${FOOT_TOP} Z`} fill="var(--color-bone)" />
            </g>
          </svg>
        </div>
      </div>
      <p ref={readFeet} aria-hidden className="mt-1 font-mono text-[0.7rem] text-dust" />
    </div>
  );
}

/* ------------------------------------------------------------------------------------------------ graph */

const CHANNELS: ChannelId[] = ["vertical", "lateral", "foreaft", "pitch", "roll"];
const SHORT: Record<ChannelId, string> = { vertical: "Up and down", lateral: "Side to side", foreaft: "Forward and back", pitch: "Tilt forward and back", roll: "Tilt side to side" };
const CURVE_TOP = 30;
const CURVE_H = 132;
const GR_H = CURVE_TOP + CURVE_H + 42;

/**
 * The biomechanics graph: two curves over one stride, the horse's back at the saddle and the rider's pelvis, read from the playing
 * animation. Five movements, each in its own units (millimetres or degrees). The playhead and its two dots are moved by the clock, so
 * the graph and the 3D agree while playing and while scrubbing, in both directions.
 */
export function StrideGraph({ data, clock, className }: { data: StrideData; clock: StrideClock; className?: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const plotRef = useRef<HTMLDivElement>(null);
  const width = useWidth(wrapRef);
  const [channel, setChannel] = useState<ChannelId>("vertical");
  const scrub = useScrub(clock, plotRef, width);
  const ch = data.channels[channel];

  const axis = useMemo(() => {
    const span = Math.max(ch.horseP2P, ch.riderP2P, 1e-6);
    const half = span / 2 / 0.78;
    const ticks = niceTicks(-half, half, 4);
    return { max: Math.max(half, ...ticks.map(Math.abs)), ticks };
  }, [ch]);
  const x = useCallback((phase: number) => PAD_L + phase * (width - PAD_L - PAD_R), [width]);
  const y = useCallback((v: number) => CURVE_TOP + CURVE_H / 2 - (v / axis.max) * (CURVE_H / 2), [axis.max]);
  const path = useCallback(
    (series: Float64Array) => {
      let d = "";
      for (let i = 0; i <= series.length; i += 2) d += `${i === 0 ? "M" : "L"}${x(i / series.length).toFixed(1)},${y(series[i % series.length]).toFixed(1)}`;
      return d;
    },
    [x, y],
  );
  const horsePath = useMemo(() => path(ch.horse), [path, ch]);
  const riderPath = useMemo(() => path(ch.rider), [path, ch]);

  const playhead = useRef<SVGGElement>(null);
  const dotHorse = useRef<SVGCircleElement>(null);
  const dotRider = useRef<SVGCircleElement>(null);
  const readHorse = useRef<HTMLSpanElement>(null);
  const readRider = useRef<HTMLSpanElement>(null);
  const draw = useCallback(
    (c: StrideClock) => {
      const hv = sampleCyclic(ch.horse, c.phase);
      const rv = sampleCyclic(ch.rider, c.phase);
      playhead.current?.setAttribute("transform", `translate(${x(c.phase).toFixed(1)} 0)`);
      dotHorse.current?.setAttribute("cy", y(hv).toFixed(1));
      dotRider.current?.setAttribute("cy", y(rv).toFixed(1));
      if (readHorse.current) readHorse.current.textContent = sign(hv, ch.unit);
      if (readRider.current) readRider.current.textContent = sign(rv, ch.unit);
    },
    [x, y, ch],
  );
  useEffect(() => {
    draw(clock);
    return clock.subscribe(draw);
  }, [clock, draw]);

  const bottom = CURVE_TOP + CURVE_H;
  return (
    <div className={cn("select-none", className)}>
      <div className="flex flex-wrap items-center gap-x-1 gap-y-1" role="tablist" aria-label="Movement shown in the graph">
        {CHANNELS.map((id) => (
          <button
            key={id}
            role="tab"
            type="button"
            aria-selected={channel === id}
            onClick={() => setChannel(id)}
            className={cn(
              "label px-2.5 py-2 text-[0.6rem] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold",
              channel === id ? "bg-bone text-night" : "text-dust hover:text-bone",
            )}
          >
            {SHORT[id]}
          </button>
        ))}
      </div>
      <div ref={wrapRef} className="mt-3 w-full">
        <div ref={plotRef} {...scrub} style={{ touchAction: "pan-y" }} className="cursor-ew-resize" data-testid="graph">
          <svg width={width} height={GR_H} viewBox={`0 0 ${width} ${GR_H}`} role="img" aria-label={`Graph of the ${SHORT[channel].toLowerCase()} movement of the horse's back at the saddle and of the rider's pelvis over one stride, in ${ch.unit === "mm" ? "millimetres" : "degrees"}. Illustrative: derived from the animation, not measured.`} className="block overflow-visible">
            <text x={PAD_L} y={12} className="fill-dust font-mono" fontSize={10} letterSpacing="0.06em">
              {SHORT[channel].toUpperCase()} · {ch.unit === "mm" ? "MILLIMETRES" : "DEGREES"}
            </text>
            {axis.ticks.map((t) => (
              <g key={t}>
                <line x1={PAD_L} x2={width - PAD_R} y1={y(t)} y2={y(t)} stroke="var(--color-line)" strokeWidth={t === 0 ? 1.2 : 0.6} strokeDasharray={t === 0 ? "0" : "2 4"} />
                <text x={PAD_L - 7} y={y(t) + 3.5} textAnchor="end" className="fill-dust font-mono" fontSize={10}>
                  {t > 0 ? "+" : t < 0 ? "−" : ""}
                  {Math.abs(t)}
                </text>
              </g>
            ))}
            <path d={horsePath} fill="none" stroke="var(--color-bone)" strokeWidth={1.6} strokeLinejoin="round" />
            <path d={riderPath} fill="none" stroke="var(--color-gold)" strokeWidth={1.6} strokeLinejoin="round" />
            <line x1={PAD_L} x2={width - PAD_R} y1={bottom + 8} y2={bottom + 8} stroke="var(--color-line)" />
            {[0, 0.25, 0.5, 0.75, 1].map((t) => (
              <g key={t}>
                <line x1={x(t)} x2={x(t)} y1={bottom + 8} y2={bottom + 13} stroke="var(--color-brass)" />
                <text x={x(t)} y={bottom + 26} textAnchor={t === 0 ? "start" : t === 1 ? "end" : "middle"} className="fill-sand font-mono" fontSize={10}>
                  {Math.round(t * 100)}%
                </text>
                <text x={x(t)} y={bottom + 38} textAnchor={t === 0 ? "start" : t === 1 ? "end" : "middle"} className="fill-dust font-mono" fontSize={9}>
                  {(t * STUDY_STRIDE_SECONDS).toFixed(1)} s
                </text>
              </g>
            ))}
            <g ref={playhead} style={{ pointerEvents: "none" }}>
              <line y1={CURVE_TOP - 4} y2={bottom + 8} stroke="var(--color-bone)" strokeWidth={1} />
              <circle ref={dotHorse} r={3.6} cx={0} cy={y(0)} fill="var(--color-bone)" stroke="var(--color-night)" strokeWidth={1.5} />
              <circle ref={dotRider} r={3.6} cx={0} cy={y(0)} fill="var(--color-gold)" stroke="var(--color-night)" strokeWidth={1.5} />
            </g>
          </svg>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-baseline gap-x-6 gap-y-1 font-mono text-[0.7rem] text-sand" aria-hidden>
        <span>
          <span className="mr-1.5 inline-block h-[2px] w-4 translate-y-[-3px] bg-bone align-middle" />
          Horse’s back at the saddle <span ref={readHorse} className="ml-1 text-bone" />
        </span>
        <span>
          <span className="mr-1.5 inline-block h-[2px] w-4 translate-y-[-3px] bg-gold align-middle" />
          Rider’s pelvis <span ref={readRider} className="ml-1 text-gold" />
        </span>
      </div>
      <p className="t-ui mt-1.5 text-[0.74rem] italic text-dust">Illustrative: derived from the animation, not measured.</p>
      <p className="sr-only" aria-live="polite">
        {`The ${SHORT[channel].toLowerCase()} movement of the horse's back spans ${ch.horseP2P.toFixed(1)} ${ch.unit === "mm" ? "millimetres" : "degrees"} over a stride and repeats ${ch.perStride} time${ch.perStride > 1 ? "s" : ""} per stride; the rider's pelvis spans ${ch.riderP2P.toFixed(1)}. Illustrative, derived from the animation, not measured.`}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------------------------------------ transport */

export function StrideTransport({ clock, perStride, className }: { clock: StrideClock; perStride: number; className?: string }) {
  useSyncExternalStore(clock.subscribeState, clock.getStateVersion, clock.getStateVersion);
  const playing = clock.playing;
  const speed = clock.speed;
  const btn =
    "flex h-10 w-10 items-center justify-center border border-line text-bone transition-colors hover:border-gold hover:text-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold";
  return (
    <div className={cn("flex flex-wrap items-center gap-x-5 gap-y-3", className)} role="group" aria-label="Playback">
      <div className="flex items-center gap-2">
        <button type="button" className={btn} onClick={() => clock.step(-1)} aria-label="Previous frame">
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
            <path d="M11 3 5 8l6 5V3Z M3 3h1.6v10H3z" fill="currentColor" />
          </svg>
        </button>
        <button type="button" className={cn(btn, "h-11 w-11 bg-bone text-night hover:bg-gold hover:text-night")} onClick={() => clock.toggle()} aria-pressed={playing} aria-label={playing ? "Pause" : "Play"}>
          {playing ? (
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
              <path d="M4 3h3v10H4zM9 3h3v10H9z" fill="currentColor" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
              <path d="M5 3v10l8-5-8-5Z" fill="currentColor" />
            </svg>
          )}
        </button>
        <button type="button" className={btn} onClick={() => clock.step(1)} aria-label="Next frame">
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
            <path d="M5 3v10l6-5-6-5Z M11.4 3H13v10h-1.6z" fill="currentColor" />
          </svg>
        </button>
      </div>
      <div className="flex items-center gap-1" role="group" aria-label="Playback speed">
        {SPEEDS.map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={speed === s}
            onClick={() => clock.setSpeed(s)}
            aria-label={s === 1 ? "Speed: study tempo" : `Speed: ${s === 0.5 ? "half" : "a quarter"} of the study tempo`}
            className={cn(
              "label min-w-[2.8rem] px-2 py-2.5 text-[0.66rem] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold",
              speed === s ? "bg-bone text-night" : "text-dust hover:text-bone",
            )}
          >
            {s === 1 ? "1×" : s === 0.5 ? "½×" : "¼×"}
          </button>
        ))}
      </div>
      <p className="font-mono text-[0.72rem] text-sand" aria-live="off">
        Seat <span className="text-gold">{Math.round(clock.perMinute(perStride))}</span> cycles a minute
      </p>
    </div>
  );
}
