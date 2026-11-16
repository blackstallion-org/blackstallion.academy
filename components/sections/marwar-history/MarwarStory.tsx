"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { Play } from "lucide-react";
import { DriftCanvas } from "@/components/film/DriftCanvas";
import { Headline } from "@/components/film/Headline";
import { Cta, ReelMark } from "@/components/film/Marks";
import { r } from "@/components/film/range";
import { archive, archiveGaps, reconstructions, type ArchiveItem } from "@/lib/content/history/marwar-archive";
import { archiveSrc, chapters, hotspots, legacyFilm, page, pratapDates, scenes, sources, treaty, type ChapterId, type PlateScene } from "@/lib/content/history/marwar";
import { nextReel } from "@/lib/content/site";
import { useReducedMotion } from "@/lib/motion/reduced";
import { cn } from "@/lib/utils";
import { ArchiveViewer } from "./ArchiveViewer";
import "./marwar.css";

const REEL = 24;

/** Plates shown on the page, in date order, numbered without gaps (003 is a near-duplicate kept only in the archive). */
const shown = archive.filter((a) => a.show !== false).sort((a, b) => a.plate - b.plate);
const plateNo = new Map(shown.map((a, i) => [a.id, i + 1]));
const plateOf = (id: string) => plateNo.get(id) ?? 0;
const byId = (id: string) => {
  const item = shown.find((a) => a.id === id);
  if (!item) throw new Error(`Marwar plate ${id} is not shown`);
  return item;
};
/** What each chapter shows, in the order it shows it. */
const PLATES: Record<ChapterId, string[]> = {
  horsemen: [],
  arrival: ["104"],
  crown: ["101", "102", "103", "011"],
  commander: ["007", "009"],
  lancers: ["001", "005", "002", "004", "008", "006"],
  end: ["010"],
  legacy: [],
};
const chapter = (id: ChapterId) => chapters.find((c) => c.id === id)!;
const kindLabel = (k: ArchiveItem["kind"]) => (k === "photograph" ? "Archive photograph" : "Period painting");
const RELATED = [
  { href: "/story/pratap-chetak", label: "Pratap & Chetak", blurb: "Six painted chapters from Mewar, 1576." },
  { href: "/story/rani-lakshmibai", label: "Rani Lakshmibai", blurb: "The queen who rode out of a besieged fort." },
  { href: "/history/india", label: "Horses of India", blurb: "From Shalihotra to Haifa." },
];

type Open = (chapterId: ChapterId, id: string) => void;

/**
 * Reel 24 · Marwar: the horse, the crown & the empire (/history/marwar). Seven chapters, from the Rathore horsemen before
 * 1818 to the living Marwari. Painted reconstructions (layered plates: the horse breathes, the layers drift a little with the
 * scroll) stand beside genuine archive photographs in ivory mounts; every picture says which it is, and every photograph
 * opens in the viewer with its full record. Copy and provenance: lib/content/history/marwar.ts and marwar-archive.ts.
 * Reduced motion: no parallax, no breathing, no autoplay; everything else reads the same.
 */
export function MarwarStory() {
  const [viewer, setViewer] = useState<{ chapter: ChapterId; index: number } | null>(null);
  const [active, setActive] = useState<ChapterId | null>(null);
  const open: Open = useCallback((c, id) => setViewer({ chapter: c, index: PLATES[c].indexOf(id) }), []);
  const close = useCallback(() => setViewer(null), []);

  // the rail follows the chapter that holds the middle of the screen; it hides over the title and the credits
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-mw-chapter]"));
    const outside = Array.from(document.querySelectorAll<HTMLElement>("[data-mw-outside]"));
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const id = (e.target as HTMLElement).dataset.mwChapter as ChapterId | undefined;
        setActive(id ?? null);
      }
    }, { rootMargin: "-50% 0px -50% 0px" });
    [...els, ...outside].forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const viewerItems = useMemo(() => (viewer ? PLATES[viewer.chapter].map(byId) : []), [viewer]);

  return (
    <div className="mw">
      <Title />

      <Chapter id="horsemen">
        <HorsemenStage />
      </Chapter>

      <Chapter id="arrival">
        <Stage scene={scenes.arrival} />
        <div className="mw-wrap mw-block mw-pair">
          <Treaty />
          <Print item={byId("104")} chapterId="arrival" open={open} sizes="(min-width: 900px) 40vw, 92vw" />
        </div>
      </Chapter>

      <Chapter id="crown">
        <div className="mw-wrap mw-block mw-sheet">
          {PLATES.crown.map((id, i) => (
            <Print key={id} item={byId(id)} chapterId="crown" open={open} sizes={i === 0 ? "(min-width: 900px) 36vw, 92vw" : "(min-width: 900px) 30vw, 92vw"} />
          ))}
        </div>
      </Chapter>

      <Chapter id="commander">
        <div className="mw-wrap mw-block mw-pair">
          <Print item={byId("007")} chapterId="commander" open={open} sizes="(min-width: 900px) 34vw, 92vw" />
          <div className="grid gap-10">
            <Stage scene={scenes.commander} inset />
            <ol className="mw-dates" aria-label="Sir Pratap Singh in dates">
              {pratapDates.map((d) => <li key={d.year}><b>{d.year}</b><span>{d.text}</span></li>)}
            </ol>
          </div>
        </div>
        <div className="mw-wrap mw-block">
          <Print item={byId("009")} chapterId="commander" open={open} sizes="(min-width: 1024px) 70vw, 92vw" />
        </div>
      </Chapter>

      <Chapter id="lancers" dark quote={<>From the sands of Marwar to the fields of <span className="mw-blood">a world war.</span></>}>
        <div className="mw-wrap mw-block mw-strip-legend" aria-hidden>
          <span>Linghem, France · 28 July 1915 · and 1916</span>
          <span>Swipe →</span>
        </div>
        <ul className="mw-strip" aria-label="The Jodhpur Lancers in France, 1915 to 1916: photographs" tabIndex={0}>
          {["001", "005", "002", "004", "008"].map((id) => (
            <li key={id}><Print item={byId(id)} chapterId="lancers" open={open} sizes="(min-width: 768px) 30rem, 78vw" /></li>
          ))}
        </ul>
        <div className="mw-wrap mw-block">
          <Print item={byId("006")} chapterId="lancers" open={open} sizes="(min-width: 1024px) 78rem, 92vw" />
        </div>
        <Stage scene={scenes.lancers} />
        <div className="mw-wrap mw-block">
          <p className="mw-date" aria-label="23 September 1918">23·IX·1918</p>
          <p className="mw-date-cap">Haifa. The Jodhpur and Mysore Lancers take the town; Major Dalpat Singh is mortally wounded.</p>
        </div>
      </Chapter>

      <Chapter id="end">
        <div className="mw-wrap mw-block">
          <Print item={byId("010")} chapterId="end" open={open} sizes="(min-width: 1024px) 78rem, 92vw" />
          <div className="mw-years">
            <p className="mw-year"><b>1947</b><span>11 August: Maharaja Hanwant Singh signs Jodhpur&rsquo;s accession to India.</span></p>
            <p className="mw-year"><b>1949</b><span>30 March: Jodhpur joins Greater Rajasthan; the merger takes effect on 7 April.</span></p>
          </div>
        </div>
      </Chapter>

      <Chapter id="legacy" dark after={<Bridge />}>
        <Film />
        <Stage scene={scenes.legacy} />
      </Chapter>

      <Credits />
      <Closing />

      <Rail active={active} />
      {viewer && <ArchiveViewer items={viewerItems} index={viewer.index} plateOf={plateOf} onClose={close} onIndex={(i) => setViewer({ ...viewer, index: i })} />}
    </div>
  );
}

/* ------------------------------------------------------------------ the title card */
function Title() {
  return (
    <section className="mw-title tone-dark bg-night" data-mw-outside aria-labelledby="mw-title">
      <DriftCanvas density={0.8} />
      <div className="mw-wrap mw-title-inner">
        <ReelMark n={REEL} act="ledger" />
        <span className="label text-brass">{page.kicker}</span>
        <h1 id="mw-title" className="grid gap-3">
          <span className="mw-monument">Marwar</span>
          <span className="mw-title-voice">the horse, the crown &amp; the empire.</span>
        </h1>
        <p className="mw-title-lede">{page.lede}</p>
        <p className="mw-title-note">{page.note}</p>
        <ul className="mw-legend" aria-label="The kinds of picture on this page">
          <li className="mw-tag" data-kind="reconstruction">Artistic reconstruction</li>
          <li className="mw-tag" data-kind="painting">Period painting</li>
          <li className="mw-tag" data-kind="photograph">Archive photograph</li>
          <li className="mw-tag" data-kind="film">AI-generated film</li>
        </ul>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ a chapter */
function Chapter({ id, dark, quote, after, children }: { id: ChapterId; dark?: boolean; quote?: ReactNode; after?: ReactNode; children: ReactNode }) {
  const c = chapter(id);
  return (
    <section id={id} data-mw-chapter={id} className={cn("mw-ch", dark && "tone-dark bg-night")} aria-labelledby={`mw-${id}`}>
      <div className="mw-wrap mw-head">
        <div className="mw-meta">
          <span className="mw-n">{c.n} / 07</span>
          <span className="mw-when">{c.when}</span>
        </div>
        <div>
          <Headline id={`mw-${id}`} inscription={c.inscription} voice={c.voice} size="2" />
          <p className="mw-lede">{c.lede}</p>
          {c.body.map((b) => <p key={b.slice(0, 24)} className="mw-body">{b}</p>)}
        </div>
      </div>
      {children}
      <div className="mw-wrap">
        <motion.p className="mw-quote" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, amount: 0.6 }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}>
          {quote ?? c.quote}
        </motion.p>
        {after}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ a painted plate */
function Stage({ scene, inset, children }: { scene: PlateScene; inset?: boolean; children?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  // the plate drifts a little with the scroll, the subject a little more (2.5D); none of it under reduced motion
  const bgY = useTransform(scrollYProgress, r(0, 1), ["-2.5%", "2.5%"]);
  const bgScale = useTransform(scrollYProgress, r(0, 1), [1.06, 1.02]);
  const subY = useTransform(scrollYProgress, r(0, 1), ["3%", "-3%"]);
  const s = scene.subject;
  return (
    <figure className="mw-stage" data-inset={inset || undefined} ref={ref}>
      <div className="mw-stage-view" style={{ "--fx": scene.fx } as CSSProperties}>
        <div className="mw-plate">
          <motion.div className="mw-layer" style={reduced ? undefined : { y: bgY, scale: bgScale }}>
            <Image src={scene.background} alt={scene.alt} fill sizes={inset ? "(min-width: 900px) 46vw, 100vw" : "100vw"} />
          </motion.div>
          <motion.div
            className="mw-subject"
            style={{ left: `${s.left}%`, top: `${s.top}%`, width: `${s.width}%`, ...(reduced ? {} : { y: subY }) }}
            aria-hidden
          >
            <div className="mw-breathe">
              <Image src={s.src} alt="" width={s.w} height={s.h} sizes={inset ? "(min-width: 900px) 30vw, 70vw" : "70vw"} />
            </div>
          </motion.div>
          {children}
        </div>
      </div>
      <figcaption className={cn("mw-caption", !inset && "mw-wrap px-0")}>
        <span className="mw-tag" data-kind="reconstruction">Artistic reconstruction · 2026</span>
        <span>{scene.caption}</span>
      </figcaption>
    </figure>
  );
}

/** Chapter 01: the plate with three hotspots; their text is set below the picture. */
function HorsemenStage() {
  const [on, setOn] = useState<string | null>(null);
  return (
    <>
      <Stage scene={scenes.horsemen}>
        {hotspots.map((h) => (
          <button
            key={h.id}
            type="button"
            className="mw-spot"
            style={{ left: `${h.x}%`, top: `${h.y}%` }}
            aria-expanded={on === h.id}
            aria-controls={`mw-spot-${h.id}`}
            aria-label={h.label}
            onClick={() => setOn((v) => (v === h.id ? null : h.id))}
          />
        ))}
      </Stage>
      <ul className="mw-wrap mw-spots-text">
        {hotspots.map((h) => (
          <li key={h.id} id={`mw-spot-${h.id}`} data-on={on === null || on === h.id || undefined}><b>{h.label}</b>{h.text}</li>
        ))}
      </ul>
    </>
  );
}

/* ------------------------------------------------------------------ an archive print */
function Print({ item, chapterId, open, sizes }: { item: ArchiveItem; chapterId: ChapterId; open: Open; sizes: string }) {
  const n = String(plateOf(item.id)).padStart(2, "0");
  return (
    <figure className="mw-print" data-kind={item.kind}>
      <button type="button" className="mw-print-open" onClick={() => open(chapterId, item.id)} aria-label={`Open plate ${n}, ${item.title}, with its full record`}>
        <Image src={archiveSrc[item.id]} alt={item.alt} width={item.width} height={item.height} sizes={sizes} style={item.focal ? { objectPosition: item.focal } : undefined} />
      </button>
      <figcaption>
        <span className="mw-plate-line">Plate {n} · {kindLabel(item.kind)} · {item.date}</span>
        <span className="mw-print-title">{item.title}</span>
        <span className="mw-print-credit">{item.credit}</span>
      </figcaption>
    </figure>
  );
}

/* ------------------------------------------------------------------ chapter 02: the treaty */
function Treaty() {
  return (
    <article className="parchment mw-treaty" aria-labelledby="mw-treaty">
      <h3 id="mw-treaty">{treaty.heading}</h3>
      <p className="mw-treaty-dated">{treaty.dated}</p>
      <ol>
        {treaty.articles.map((a) => (
          <li key={a.n}>
            <span className="mw-art">Art. {a.n}</span>
            <div>
              <p>&ldquo;{a.text}&rdquo;</p>
              {"note" in a && a.note && <p className="mw-art-note">{a.note}</p>}
            </div>
          </li>
        ))}
      </ol>
      <p className="mw-treaty-source">Source: <a href={treaty.sourceHref} target="_blank" rel="noopener noreferrer">{treaty.source}</a>. Spelling as printed.</p>
    </article>
  );
}

/* ------------------------------------------------------------------ chapter 07: the film */
function Film() {
  const ref = useRef<HTMLVideoElement>(null);
  const reduced = useReducedMotion();
  const [playing, setPlaying] = useState(false);
  const [chosen, setChosen] = useState(false);

  // plays only while on screen and the tab is visible; never on its own under reduced motion
  useEffect(() => {
    const v = ref.current;
    if (!v || (reduced && !chosen)) return;
    let seen = false;
    const sync = () => { if (seen && !document.hidden) v.play().catch(() => undefined); else v.pause(); };
    const io = new IntersectionObserver(([e]) => { seen = e.isIntersecting; sync(); }, { threshold: 0.35 });
    io.observe(v);
    document.addEventListener("visibilitychange", sync);
    return () => { io.disconnect(); document.removeEventListener("visibilitychange", sync); v.pause(); };
  }, [reduced, chosen]);

  return (
    <figure className="mw-film mw-wrap">
      <div className="mw-film-view">
        <video
          ref={ref}
          src={legacyFilm.src}
          poster={legacyFilm.poster}
          muted
          loop
          playsInline
          preload="none"
          aria-label={legacyFilm.alt}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        />
        {reduced && !playing && (
          <button type="button" className="mw-film-play" onClick={() => { setChosen(true); ref.current?.play().catch(() => undefined); }} aria-label="Play the film">
            <Play size={26} strokeWidth={1.3} aria-hidden />
          </button>
        )}
      </div>
      <figcaption className="mw-caption px-0">
        <span className="mw-tag" data-kind="film">{legacyFilm.label} · 2026</span>
        <span>Not footage of a particular horse.</span>
      </figcaption>
    </figure>
  );
}

function Bridge() {
  return (
    <div className="mw-bridge">
      <Cta href="/legend">The Marwari today</Cta>
      <Cta href="/curriculum">How cadets learn it</Cta>
    </div>
  );
}

/* ------------------------------------------------------------------ credits and the way on */
function Credits() {
  return (
    <section className="mw-ch" id="credits" data-mw-outside aria-labelledby="mw-credits">
      <div className="mw-wrap">
        <span className="label text-brass">The archive</span>
        <h2 id="mw-credits" className="t-voice mt-3 text-[clamp(2rem,1.4rem+2.4vw,3.4rem)] leading-tight text-gold">Every picture, credited.</h2>
        <p className="mw-body">{page.note}</p>
        <div className="mw-index-scroll mt-10">
          <table className="mw-index">
            <thead>
              <tr><th scope="col">Plate</th><th scope="col">Kind</th><th scope="col">Title and date</th><th scope="col">Held by</th><th scope="col">Licence</th><th scope="col">Source</th></tr>
            </thead>
            <tbody>
              {shown.map((a) => (
                <tr key={a.id}>
                  <td>{String(plateOf(a.id)).padStart(2, "0")}</td>
                  <td><span className="mw-tag" data-kind={a.kind}>{kindLabel(a.kind)}</span></td>
                  <td>{a.title}, {a.date}<br /><span className="text-dust">{a.creator}</span></td>
                  <td>{a.holder}{a.reference ? `, ${a.reference}` : ""}</td>
                  <td>{a.licence}</td>
                  <td>
                    <a href={a.source} target="_blank" rel="noopener noreferrer">Commons</a>
                    {a.record && <> · <a href={a.record} target="_blank" rel="noopener noreferrer">Record</a></>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mw-credits-grid">
          <div>
            <h3 className="mw-h3">Reconstructions</h3>
            <ul className="mw-list">{reconstructions.map((x) => <li key={x.id}>{x.title}. <span className="text-dust">{x.made}</span></li>)}</ul>
          </div>
          <div>
            <h3 className="mw-h3">Not yet in the archive</h3>
            <ul className="mw-list">{archiveGaps.map((g) => <li key={g.slice(0, 24)}>{g}</li>)}</ul>
          </div>
          <div>
            <h3 className="mw-h3">Sources</h3>
            <ul className="mw-list">{sources.map((s) => <li key={s.href}><a href={s.href} target="_blank" rel="noopener noreferrer">{s.label}</a></li>)}</ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function Closing() {
  const next = nextReel(REEL);
  return (
    <section className="mw-ch tone-dark bg-night" data-mw-outside aria-label="Where to go next">
      <div className="mw-wrap mw-next">
        <Link href={next.href} className="mw-next-reel">
          <span className="label text-brass">Next reel · {String(next.n).padStart(2, "0")}</span>
          <span className="t-inscribe mt-4 block text-[clamp(1rem,0.8rem+0.8vw,1.4rem)] text-bone">{next.inscription}</span>
          <span className="t-voice block text-[clamp(2rem,1.2rem+3vw,4rem)] leading-tight text-gold">{next.voice}</span>
          <span className="mt-2 block text-sand">{next.title}: {next.blurb}</span>
        </Link>
        <div>
          <span className="label text-brass">{page.bridge}</span>
          <ul className="mw-list mt-4">
            {RELATED.map((x) => <li key={x.href}><Link href={x.href} className="text-gold">{x.label}</Link> <span className="text-dust">· {x.blurb}</span></li>)}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ the chapter rail */
function Rail({ active }: { active: ChapterId | null }) {
  // the rail never sits on a picture: it steps aside while a painting, the film or the photo strip crosses the middle of the screen
  const [covered, setCovered] = useState(false);
  useEffect(() => {
    const on = new Set<Element>();
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) { if (e.isIntersecting) on.add(e.target); else on.delete(e.target); }
      setCovered(on.size > 0);
    }, { rootMargin: "-40% 0px -40% 0px" });
    document.querySelectorAll(".mw-stage:not([data-inset]) .mw-stage-view, .mw-strip").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  const bands: Record<string, string> = { horsemen: "Painting", crown: "Archive", legacy: "Present" };
  return (
    <>
      <nav aria-label="Chapters">
        <ol className="mw-rail" data-hidden={active === null || covered || undefined}>
          {chapters.map((c) => (
            <li key={c.id}>
              {bands[c.id] && <div className="mw-rail-band" aria-hidden>{bands[c.id]}</div>}
              <a href={`#${c.id}`} aria-current={active === c.id ? "true" : undefined}>
                {c.rail}<span className="sr-only">: {c.inscription} {c.voice}</span>
              </a>
            </li>
          ))}
        </ol>
      </nav>
      <div className="mw-ticks" data-hidden={active === null || undefined} aria-hidden>
        {chapters.map((c, i) => <span key={c.id} data-on={active !== null && i <= chapters.findIndex((x) => x.id === active) ? true : undefined} />)}
      </div>
    </>
  );
}
