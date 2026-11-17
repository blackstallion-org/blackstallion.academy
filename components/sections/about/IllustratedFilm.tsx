import { Headline } from "@/components/film/Headline";
import { Label } from "@/components/film/Marks";
import { illustratedFilm as film } from "@/lib/content/intro-film";

/**
 * /about: the illustrated film "From Marwar to the black stallion, in ink" (the website's first opening film, moved here on 17 Nov 2026
 * when "The Lineage" became the opening). A 16:9 frame with the browser's own controls; it never plays by itself, so sound is allowed
 * and reduced motion is respected. Phones get the 720p file.
 */
export function IllustratedFilm() {
  return (
    <section aria-labelledby="illustrated-film-h" className="gutter relative py-[clamp(5rem,12vh,10rem)]">
      <div className="mx-auto max-w-5xl">
        <Label>{film.note}</Label>
        <Headline id="illustrated-film-h" className="mt-4" inscription="From Marwar," voice="to the black stallion." />
        <div className="relative mt-10 aspect-video w-full overflow-hidden border border-gold/25 bg-umber">
          <video
            className="absolute inset-0 h-full w-full object-cover"
            controls
            playsInline
            preload="metadata"
            poster={film.poster}
            aria-label={`${film.label}. ${film.description}`}
          >
            <source media="(max-width: 767px)" src={film.mobile} type="video/mp4" />
            <source src={film.desktop} type="video/mp4" />
          </video>
        </div>
        <p className="mt-4 font-mono text-xs uppercase tracking-[0.14em] text-dust">
          {film.note} · {Math.round(film.length)} s · Music: “{film.music.title}”, {film.music.credit}
        </p>
      </div>
    </section>
  );
}
