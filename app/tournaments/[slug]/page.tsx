import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FilmImage } from "@/components/film/FilmImage";
import { Cta, Hoof, Label } from "@/components/film/Marks";
import { tournamentBySlug, tournaments } from "@/lib/content/records";

export function generateStaticParams() {
  return tournaments.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: PageProps<"/tournaments/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const t = tournamentBySlug(slug);
  return t ? { title: t.name, description: `${t.name} · ${t.dateLabel} · ${t.venue}. ${t.format}.` } : {};
}

export default async function TournamentPage({ params }: PageProps<"/tournaments/[slug]">) {
  const { slug } = await params;
  const t = tournamentBySlug(slug);
  if (!t) notFound();
  const words = t.name.split(" ");
  const cut = Math.ceil(words.length / 2);

  return (
    <>
      <section aria-labelledby="t-h" className="relative min-h-[88svh] overflow-hidden">
        <FilmImage name={t.image} priority />
        <div aria-hidden className="absolute inset-0 shade-b" />
        <div className="gutter relative flex min-h-[88svh] flex-col justify-end pb-14">
          <Link href="/tournaments" className="label text-sand hover:text-gold">
            ← The Circuit
          </Link>
          <p className="font-mono mt-8 text-lg text-gold">{t.dateLabel}</p>
          <h1 id="t-h" className="mt-3 text-display-1">
            <span className="t-inscribe block text-[0.5em] text-bone">{words.slice(0, cut).join(" ")}</span>
            <span className="t-voice block text-gold">{words.slice(cut).join(" ")}</span>
          </h1>
          <p className="t-story mt-4 text-sand">
            {t.format} · {t.venue}
          </p>
        </div>
      </section>

      <section aria-label="Details" className="gutter py-16">
        <dl className="grid grid-cols-2 gap-px bg-line md:grid-cols-4">
          {[
            ["Date", t.dateLabel],
            ["Venue", t.venue],
            ["Age groups", t.ages],
            ["Entries", t.status === "open" ? "Open" : "Opening soon"],
          ].map(([k, v]) => (
            <div key={k} className="bg-night p-6">
              <dt className="label text-dust">{k}</dt>
              <dd className="t-voice mt-2 text-xl text-bone">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="t-events" className="gutter grid gap-14 pb-[clamp(6rem,14vh,12rem)] lg:grid-cols-2">
        <div>
          <Label>Events</Label>
          <h2 id="t-events" className="t-voice mt-3 text-display-3 text-bone">
            On the card
          </h2>
          <ul className="mt-8 flex flex-col gap-4">
            {t.events.map((e) => (
              <li key={e} className="flex items-center gap-4 border-b border-line pb-4 text-lg text-sand">
                <Hoof className="text-gold" />
                {e}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <Label>Order of the day</Label>
          <h2 className="t-voice mt-3 text-display-3 text-bone">Schedule</h2>
          <ol className="mt-8 border-l border-line">
            {t.schedule.map((s) => (
              <li key={s.time} className="relative pb-6 pl-6">
                <span aria-hidden className="absolute -left-[5px] top-2 h-2.5 w-2.5 rounded-full bg-gold" />
                <p className="font-mono text-gold">{s.time}</p>
                <p className="mt-1 text-bone">{s.item}</p>
              </li>
            ))}
          </ol>
          <p className="t-ui mt-4 text-xs text-dust">Sample schedule; STPCI publishes the final order of the day.</p>
        </div>
        <div className="lg:col-span-2">
          <p className="max-w-2xl text-sand">Schools enter teams through the School Tent Pegging Council of India. Hubs register cadets by rank; horses are drawn on the morning of the event after vet inspection.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Cta href="/contact?gate=schools" variant="solid">
              Enter your school
            </Cta>
            <Cta href="/tournaments">All fixtures</Cta>
          </div>
        </div>
      </section>
    </>
  );
}
