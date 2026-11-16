import type { Metadata } from "next";
import { CrestMark } from "@/components/brand/CrestMark";
import { Headline } from "@/components/film/Headline";
import { Cta, Label } from "@/components/film/Marks";
import { Reveal } from "@/components/film/Reveal";
import { letter, truths } from "@/lib/content/academy";
import { director } from "@/lib/content/director";

export const metadata: Metadata = {
  alternates: { canonical: "/director" },
  title: "Director · Saef Ullah Khan",
  description: "Saef Ullah Khan, Founder & Executive Chairman of the Black Stallion Academy of Horsemanship and Vicarius Infinitum Holdings: his role, his mandate and his letter to parents.",
};

/**
 * /director (16 Nov 2026, owner's request). Verified facts only (see lib/content/director.ts for the sources). The portrait frame
 * stays empty, with a quiet note, until the owner supplies a photograph; no biography is invented to fill the space.
 */
export default function DirectorPage() {
  return (
    <>
      {/* Title */}
      <section aria-labelledby="director-h" className="gutter relative pb-[clamp(4rem,10vh,7rem)] pt-[clamp(7rem,14vh,10rem)]">
        <div className="grid items-end gap-12 md:grid-cols-12 md:gap-10">
          <div className="md:col-span-7">
            <Label>The Director</Label>
            <Headline id="director-h" as="h1" size="1" animate="mount" className="mt-6" inscription={director.name} voice="founder of the academy." />
            <p className="label mt-8 text-brass">{director.title}</p>
            <p className="t-story mt-5 max-w-xl text-xl leading-relaxed text-sand">{director.intro}</p>
          </div>
          {/* Portrait frame: empty until a photograph is supplied. */}
          <Reveal as="figure" className="md:col-span-4 md:col-start-9">
            <div className="tone-dark surface-leather relative grid aspect-[4/5] place-items-center overflow-hidden border border-brass/40">
              <div aria-hidden className="absolute inset-3 border border-brass/25" />
              <CrestMark size="lg" decorative className="h-24 w-24 opacity-60" />
            </div>
            <figcaption className="mt-3 flex items-baseline justify-between gap-4">
              <span className="t-voice text-lg text-bone">{director.name}</span>
              <span className="label text-dust">{director.portraitNote}</span>
            </figcaption>
          </Reveal>
        </div>
      </section>

      {/* Role */}
      <section aria-labelledby="role-h" className="gutter relative border-t border-line py-[clamp(5rem,12vh,9rem)]">
        <Label>His role</Label>
        <h2 id="role-h" className="sr-only">His role</h2>
        <ol className="mt-10 grid gap-x-16 md:grid-cols-2">
          {director.roles.map((r, i) => (
            <Reveal as="li" key={r.org} delay={i * 0.08} className="border-t border-line pb-10 pt-7">
              <p className="t-voice text-[clamp(1.6rem,2.6vw,2.3rem)] leading-tight text-bone">{r.org}</p>
              <p className="t-story mt-3 text-[0.95rem] uppercase tracking-[0.06em] text-sand">{r.role}</p>
              <p className="t-story mt-4 max-w-md text-lg text-sand">{r.line}</p>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* Leadership */}
      <section aria-labelledby="lead-h" className="tone-dark surface-leather relative py-[clamp(6rem,14vh,11rem)]">
        <div className="gutter">
          <Headline id="lead-h" inscription="Leadership," voice="in three lines." size="2" />
          <ol className="mt-14 grid gap-10 md:grid-cols-3 md:gap-12">
            {director.leadership.map((l, i) => (
              <Reveal as="li" key={l.n} delay={i * 0.1} className="border-t border-brass/40 pt-6">
                <span className="font-mono text-xs text-brass">{l.n}</span>
                <p className="t-voice mt-3 text-2xl text-bone">{l.title}</p>
                <p className="mt-3 leading-relaxed text-sand">{l.line}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* Vision: the founder's letter, shown as the draft it is */}
      <section aria-labelledby="vision-h" className="gutter relative py-[clamp(6rem,14vh,11rem)]">
        <Label>His vision</Label>
        <Reveal className="parchment mx-auto mt-10 max-w-3xl px-8 py-12 md:px-16 md:py-16">
          <p className="label text-[#6b5130]">{letter.note}</p>
          <h2 id="vision-h" className="t-inscribe mt-3 text-2xl text-ink md:text-3xl">
            The Mandate
          </h2>
          <div className="mt-8 flex flex-col gap-5">
            {letter.body.map((p) => (
              <p key={p} className="text-lg leading-[1.75] text-ink/90">
                {p}
              </p>
            ))}
          </div>
          <p className="t-voice mt-10 text-3xl text-ink">{letter.sign}</p>
          <p className="label mt-1 text-[#6b5130]">{letter.title}</p>
        </Reveal>
        <ul className="mx-auto mt-16 grid max-w-4xl gap-x-10 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
          {truths.map((t) => (
            <li key={t} className="t-voice border-t border-line pt-4 text-xl text-bone">
              {t}
            </li>
          ))}
        </ul>
        <div className="mt-16 flex flex-wrap justify-center gap-3">
          <Cta href="/about" variant="solid">
            The Mandate
          </Cta>
          <Cta href="/contact">Write to the academy</Cta>
        </div>
      </section>
    </>
  );
}
