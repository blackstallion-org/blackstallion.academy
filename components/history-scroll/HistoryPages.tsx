import Link from "next/link";
import { asset } from "@/lib/content/asset";
import { historyAsset, missingAssets } from "@/lib/content/history/assets";
import type { HistoryPage, Scene } from "@/lib/content/history/types";
import { HistoryArt } from "./HistoryArt";
import { HistoryScrollRoot, ReadingToggle } from "./HistoryScrollRoot";
import { worldFor } from "@/lib/content/history/motion";
import { SceneArt, SceneReading } from "./Scene";
import "./history-scroll.css";

const SHARED = ["SH01", "SH02", "SH03"];

const allScenes = (page: HistoryPage) => page.chapters.flatMap((c) => c.scenes);
const pageAssetIds = (page: HistoryPage) => [
  ...(page.opening.asset ? [page.opening.asset] : []),
  ...allScenes(page).flatMap((s) => [s.layers.B, s.layers.S, s.layers.F]),
  ...SHARED,
];

function grainUrl() {
  const g = historyAsset("SH01");
  return g.ready ? asset(g.path) : undefined;
}

function Title({ page, children }: { page: HistoryPage; children?: React.ReactNode }) {
  return (
    <header className="hs-title gutter">
      <div className="mx-auto max-w-6xl">
        <p className="hs-label">{page.opening.label}</p>
        <h1 className="hs-h1 mt-5 max-w-[14ch]">
          {page.opening.inscription}
          <span className="hs-voice">{page.opening.voice}</span>
        </h1>
        <p className="hs-lede mt-7 max-w-[40rem]">{page.opening.lede}</p>
        {children}
      </div>
    </header>
  );
}

function ChapterIndex({ items }: { items: { href: string; num: string; label: string }[] }) {
  return (
    <nav aria-label="Scenes" className="hs-index mt-10">
      <p className="hs-label mb-3">Contents</p>
      <ol>
        {items.map((it) => (
          <li key={it.href}>
            <a href={it.href}>
              <span className="hs-num">{it.num}</span>
              <span>{it.label}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function Related({ page }: { page: HistoryPage }) {
  return (
    <section aria-labelledby="hs-related-h" className="gutter border-t border-[var(--hs-rule)] py-[clamp(4rem,10vh,7rem)]">
      <div className="mx-auto max-w-6xl">
        <p className="hs-label">Continue the scroll</p>
        <h2 id="hs-related-h" className="hs-h2 mt-3">More painted histories</h2>
        <ul className="mt-8 grid gap-x-10 gap-y-2 md:grid-cols-2">
          {page.related.map((r) => (
            <li key={r.href} className="border-b border-[var(--hs-rule)]">
              <Link href={r.href} className="group flex flex-col gap-1 py-5 focus-visible:outline-2">
                <span className="hs-h3 group-hover:text-[var(--hs-vermilion)]">{r.label}</span>
                <span className="hs-lede text-[1rem]">{r.blurb}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** In development only: the ledger ids this page still shows as placeholders. */
function MissingNote({ page }: { page: HistoryPage }) {
  if (process.env.NODE_ENV === "production") return null;
  const missing = missingAssets(pageAssetIds(page));
  if (!missing.length) return null;
  return (
    <p className="gutter pb-10 font-mono text-[0.7rem] text-[var(--hs-ink-soft)]">
      DEV · {missing.length} illustrations pending in docs/history-scrolls/ASSET_LEDGER.json: {missing.join(", ")}
    </p>
  );
}

/* ------------------------------------------------------------------ anthology: opening + natural-flow sections */

export function AnthologyPage({ page }: { page: HistoryPage }) {
  const scenes = allScenes(page);
  return (
    <HistoryScrollRoot grain={grainUrl()} world={worldFor(page.route)}>
      <Title page={page}>
        <ChapterIndex items={scenes.map((s, i) => ({ href: `#${s.anchor}`, num: String(i + 1).padStart(2, "0"), label: s.title }))} />
      </Title>
      {page.opening.asset && (
        <figure className="gutter pb-[clamp(3rem,8vh,6rem)]">
          <div className="hs-frame mx-auto max-w-7xl overflow-hidden">
            <HistoryArt id={page.opening.asset} sizes="(min-width: 1280px) 1280px, 92vw" priority className="h-auto w-full" />
          </div>
        </figure>
      )}
      {scenes.map((scene, i) => (
        <section
          key={scene.id}
          id={scene.anchor}
          aria-labelledby={`${scene.anchor}-h`}
          className="hs-scene hs-anth"
          data-hs-scene
          data-side={scene.side}
          style={{ zIndex: scenes.length - i }}
        >
          <SceneArt scene={scene} priority={i === 0} />
          <SceneReading scene={scene} heading="h2" />
        </section>
      ))}
      <Related page={page} />
      <MissingNote page={page} />
    </HistoryScrollRoot>
  );
}

/* ------------------------------------------------------------------ personal story: four chapters of two scenes */

export function PersonalStoryPage({ page }: { page: HistoryPage }) {
  const rosette = historyAsset("SH03");
  const nextOf = (ci: number, si: number, scene: Scene) => {
    const chapter = page.chapters[ci];
    const after = page.chapters[ci + 1];
    if (si < chapter.scenes.length - 1) {
      const n = chapter.scenes[si + 1];
      return { href: `#${n.anchor}`, label: `Next: ${n.title} ↓` };
    }
    return after ? { href: `#${after.id}`, label: `Skip to chapter ${after.numeral}: ${after.title} ↓` } : { href: "#afterword", label: `After ${scene.title.toLowerCase()}: the afterword ↓` };
  };
  return (
    <HistoryScrollRoot grain={grainUrl()} world={worldFor(page.route)}>
      <Title page={page}>
        <div className="hs-controls mt-8">
          <ReadingToggle />
          <a className="hs-button" href={`#${page.chapters[0].id}`}>
            Begin the scroll ↓
          </a>
        </div>
        <ChapterIndex items={page.chapters.map((c) => ({ href: `#${c.id}`, num: c.numeral, label: c.title }))} />
      </Title>
      {page.chapters.map((chapter, ci) => (
        <div key={chapter.id}>
          <header id={chapter.id} className="hs-chapter gutter">
            {rosette.ready && (
              <div className="hs-rosette" aria-hidden>
                <HistoryArt id="SH03" sizes="40px" decorative className="h-full w-full" />
              </div>
            )}
            <p className="hs-numeral">CHAPTER {chapter.numeral}</p>
            <h2 className="hs-h2 mt-2">{chapter.title}</h2>
          </header>
          {chapter.scenes.map((scene, si) => (
            <section
              key={scene.id}
              id={scene.anchor}
              aria-labelledby={`${scene.anchor}-h`}
              className="hs-scene hs-pers"
              data-hs-scene
              data-side={scene.side}
            >
              <div className="hs-stage">
                <SceneArt scene={scene} priority={ci === 0 && si === 0} />
                <SceneReading scene={scene} heading="h3" next={nextOf(ci, si, scene)} />
              </div>
              <div className="hs-run" aria-hidden />
            </section>
          ))}
        </div>
      ))}
      {page.afterword && (
        <section id="afterword" aria-labelledby="afterword-h" className="gutter border-t border-[var(--hs-rule)] py-[clamp(4rem,10vh,8rem)]">
          <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
            <div>
              <p className="hs-label">{page.afterword.label}</p>
              <h2 id="afterword-h" className="hs-h2 mt-3">
                {page.afterword.inscription}
                <span className="hs-voice">{page.afterword.voice}</span>
              </h2>
            </div>
            <div>
              {page.afterword.paragraphs.map((p, i) => (
                <p key={i} className="mb-6 max-w-[38rem] font-[family-name:var(--font-serif)] text-[1.12rem] leading-[1.75] text-[var(--hs-ink-soft)]">
                  {p}
                </p>
              ))}
            </div>
          </div>
        </section>
      )}
      <Related page={page} />
      <MissingNote page={page} />
    </HistoryScrollRoot>
  );
}
