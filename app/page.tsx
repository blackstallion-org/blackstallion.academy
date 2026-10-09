import { Atmosphere } from "@/components/film/Atmosphere";
import { ChapterRail } from "@/components/film/ChapterRail";
import { FilmNav } from "@/components/film/FilmNav";
import { Campus } from "@/components/film/chapters/Campus";
import { Contact } from "@/components/film/chapters/Contact";
import { Crucible } from "@/components/film/chapters/Crucible";
import { Fleet } from "@/components/film/chapters/Fleet";
import { Legend } from "@/components/film/chapters/Legend";
import { Prologue } from "@/components/film/chapters/Prologue";
import { Ranks } from "@/components/film/chapters/Ranks";
import { Tournaments } from "@/components/film/chapters/Tournaments";
import { Verify } from "@/components/film/chapters/Verify";

/**
 * "The Marwari": the whole academy told as one film, chapter by chapter.
 * Each chapter is pinned and scroll-scrubbed (components/film/Chapter.tsx).
 * Separate routes come later and will reuse these chapters.
 */
export default function Home() {
  return (
    <>
      <FilmNav />
      <ChapterRail />
      <Atmosphere />
      <main id="main">
        <Prologue />
        <Legend />
        <Crucible />
        <Ranks />
        <Fleet />
        <Campus />
        <Verify />
        <Tournaments />
        <Contact />
      </main>
    </>
  );
}
