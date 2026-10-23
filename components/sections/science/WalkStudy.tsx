"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useInView } from "motion/react";
import { useReducedMotion } from "@/lib/motion/reduced";
import styles from "./WalkStudy.module.css";

const axes = [
  { symbol: "↕", title: "Up / down", detail: "Vertical", path: "M0 65 Q60 0 120 65 T240 65 T360 65 T480 65 T600 65 T720 65 T840 65 T960 65 T1080 65 T1200 65" },
  { symbol: "⇄", title: "Forward / back", detail: "Antero-posterior", path: "M0 65 Q60 25 120 65 T240 65 T360 65 T480 65 T600 65 T720 65 T840 65 T960 65 T1080 65 T1200 65" },
  { symbol: "↔", title: "Side to side", detail: "Lateral", path: "M0 65 Q60 40 120 65 T240 65 T360 65 T480 65 T600 65 T720 65 T840 65 T960 65 T1080 65 T1200 65" },
];

export function WalkStudy() {
  const ref = useRef<HTMLElement>(null);
  const visible = useInView(ref, { amount: 0.15 });
  const reduced = useReducedMotion();
  const [playing, setPlaying] = useState(true);
  const [axis, setAxis] = useState(0);
  const moving = playing && visible && !reduced;

  return (
    <section ref={ref} id="the-walk" aria-labelledby="pulse-h" className={styles.study} data-moving={moving}>
      <header className={styles.topline}>
        <span>The Matrix <i /> Movement study</span>
        <button type="button" aria-label={playing ? "Pause movement study" : "Play movement study"} aria-pressed={playing} onClick={() => setPlaying(!playing)}>
          <span>{playing ? "Pause study" : "Play study"}</span><b aria-hidden="true">{playing ? "Ⅱ" : "▷"}</b>
        </button>
      </header>
      <div className={styles.composition}>
        <div className={styles.copy}>
          <p className={styles.label}>The walk</p>
          <h2 id="pulse-h">A hundred<br />steps<br /><em>a minute.</em></h2>
        </div>
        <div className={styles.stage}>
          {/* The photograph remains still; the overlay illustrates movement, not measured data. */}
          <Image width={1376} height={768} src="/images/science-rider-posture.webp" alt="A young rider sitting upright on a walking bay horse" className={styles.horse} />
          <svg viewBox="0 0 1000 700" className={styles.tracking} aria-hidden="true">
            <path d="M370 365 Q460 340 530 350 T685 335" />
            <ellipse cx="515" cy="350" rx="72" ry="43" />
            <path d="M515 270 V420 M430 350 H600" className={styles.crosshair} />
            {[370, 460, 530, 685].map((x, i) => <g key={x} className={styles.marker} style={{ animationDelay: `${i * -0.3}s` }}><circle cx={x} cy={i === 3 ? 335 : 350} r="12" /><circle cx={x} cy={i === 3 ? 335 : 350} r="4" /></g>)}
          </svg>
          <span className={styles.photoNote}>Horse + rider / a shared rhythm</span>
        </div>

      </div>
      <div className={styles.context}><div>          <p className={styles.description}>At a walk, a horse’s back moves the rider’s pelvis forward, sideways and up and down about a hundred times a minute: the same pattern the body makes when it walks.</p>
          <p className={styles.caption}>A natural rhythm. A constant conversation.</p>
</div>        <aside className={styles.explanation}>
          <p className={styles.label}>Three dimensions. One stride.</p>
          <p>The horse’s back guides the rider’s pelvis through a repeating pattern of movement.</p>
          <div className={styles.axes}>
            {axes.map((item, index) => <button type="button" key={item.title} aria-pressed={axis === index} onClick={() => setAxis(index)}><span aria-hidden="true">{item.symbol}</span><span><strong>{item.title}</strong><small>{item.detail}</small></span><i /></button>)}
          </div>
          <p className={styles.smallNote}>Select a direction to explore the rhythm below.</p>
        </aside></div>
      <div className={styles.dataRow}>
        <div className={styles.stat}><strong>≈100</strong><span>movements / min</span><small>Source · American Hippotherapy Association</small></div>
        <div className={styles.graph}>
          <div className={styles.legend}><span><i />Horse’s back movement</span><span><i />Rider’s pelvis movement</span></div>
          <div className={styles.chart}>
            <div className={styles.scale}><span>Up</span><span>Neutral</span><span>Down</span></div>
            <svg viewBox="0 0 600 130" preserveAspectRatio="none" role="img" aria-label={`Illustrative ${axes[axis].title.toLowerCase()} movement of horse and rider`}>
              <path d="M0 20 H600 M0 65 H600 M0 110 H600" className={styles.grid} />
              <g className={styles.waves}><path d={axes[axis].path} className={styles.riderWave} transform="translate(-12 8)" /><path d={axes[axis].path} className={styles.horseWave} /></g>
              <path d="M300 0 V130" className={styles.cursor} />
            </svg>
          </div>
          <div className={styles.graphFoot}><span>{axes[axis].detail} movement</span><span>Illustration of rhythm · not a clinical measurement</span></div>
        </div>
      </div>
      <div className={styles.filmstrip} aria-hidden="true">{Array.from({ length: 9 }, (_, i) => <div key={i} style={{ animationDelay: `${i * -0.27}s` }}><Image width={1376} height={768} src="/images/science-rider-posture.webp" alt="" /><span>{String(i + 1).padStart(2, "0")}</span></div>)}</div>
      <footer className={styles.bottomline}><span>The walk / motion study</span><span>Balance begins with movement</span></footer>
    </section>
  );
}
