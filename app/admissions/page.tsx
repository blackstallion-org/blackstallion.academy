import type { Metadata } from "next";
import { Headline } from "@/components/film/Headline";
import { Cta, Label } from "@/components/film/Marks";
import { Reveal } from "@/components/film/Reveal";
import { admissions, faq, fees, uniform } from "@/lib/content/academy";
import { batches } from "@/lib/content/curriculum";

export const metadata: Metadata = {
  title: "Admissions",
  description: "How enrolment works at The Black Stallion Academy of Horsemanship: steps, fees, batches and what a cadet wears. Draft information, to be confirmed.",
};

/**
 * Admissions (placeholder content). Everything here is read from lib/content so there is one source of truth.
 * Fees, timings and the process are draft until the academy confirms them; the page says so.
 */
export default function AdmissionsPage() {
  return (
    <>
      <section aria-labelledby="adm-h" className="gutter relative flex min-h-[78svh] flex-col justify-end pb-[10vh] pt-32">
        <Label>Admissions</Label>
        <Headline id="adm-h" as="h1" size="1" animate="mount" delay={0.3} className="mt-4" inscription="The path" voice="to the saddle." />
        <p className="t-story mt-6 max-w-xl text-sand">How a family joins the academy. Draft information: fees, timings and the process are being confirmed and may change.</p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Cta href="/contact?gate=parents" variant="solid">Enquire about a place</Cta>
          <Cta href="/parents">The parent&apos;s view</Cta>
        </div>
      </section>

      <section aria-labelledby="steps-h" className="gutter relative py-[clamp(5rem,12vh,10rem)]">
        <Label>The steps</Label>
        <Headline id="steps-h" className="mt-4" inscription="From enquiry" voice="to first session." />
        <ol className="mt-12 grid gap-px bg-brass/15 md:grid-cols-2 lg:grid-cols-5">
          {admissions.map((s, i) => (
            <Reveal as="li" key={s.title} delay={i * 0.06} className="bg-night p-6">
              <p className="font-mono text-xs text-gold">STEP {String(i + 1).padStart(2, "0")}</p>
              <p className="t-voice mt-2 text-2xl text-bone">{s.title}</p>
              <p className="t-story mt-3 text-sand">{s.text}</p>
            </Reveal>
          ))}
        </ol>
      </section>

      <section aria-labelledby="fees-h" className="gutter relative py-[clamp(5rem,12vh,10rem)]">
        <Label>Fees (draft)</Label>
        <Headline id="fees-h" className="mt-4" inscription="Plain" voice="pricing." />
        <ul className="mt-12 border-t border-brass/20">
          {fees.map((f) => (
            <li key={f.item} className="grid gap-2 border-b border-brass/20 py-6 md:grid-cols-[18rem_1fr]">
              <p className="t-voice text-xl text-bone">{f.item}</p>
              <p className="t-story text-sand">{f.detail}</p>
            </li>
          ))}
        </ul>
        <p className="label mt-6 text-dust">Fees before GST unless stated. To be confirmed by the academy before publication.</p>
      </section>

      <section aria-labelledby="batch-h" className="gutter relative py-[clamp(5rem,12vh,10rem)]">
        <Label>Batches (sample timings)</Label>
        <Headline id="batch-h" className="mt-4" inscription="Before school," voice="after school." />
        <div className="mt-12 grid gap-px bg-brass/15 md:grid-cols-2">
          {batches.map((b) => (
            <div key={b.name} className="bg-night p-6">
              <p className="t-voice text-2xl text-bone">{b.name}</p>
              <p className="font-mono mt-2 text-sm text-gold">{b.time} · {b.days}</p>
              <p className="t-story mt-3 text-sand">{b.who}. {b.focus}.</p>
            </div>
          ))}
        </div>
        <p className="label mt-6 text-dust">Timings are samples. Each hub confirms its own schedule.</p>
      </section>

      <section aria-labelledby="kit-h" className="gutter relative py-[clamp(5rem,12vh,10rem)]">
        <Label>The uniform</Label>
        <Headline id="kit-h" className="mt-4" inscription="What a cadet" voice="wears." />
        <dl className="mt-12 grid gap-6 md:grid-cols-2">
          {uniform.map((u) => (
            <div key={u.item} className="border-t border-brass/25 pt-4">
              <dt className="label text-brass">{u.item}</dt>
              <dd className="t-story mt-2 text-sand">{u.spec}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="faq-h" className="gutter relative py-[clamp(5rem,12vh,10rem)]">
        <Label>Questions</Label>
        <Headline id="faq-h" className="mt-4" inscription="Asked by" voice="parents." />
        <dl className="mt-12 max-w-3xl">
          {faq.map((f) => (
            <div key={f.q} className="border-t border-brass/20 py-6">
              <dt className="t-voice text-xl text-bone">{f.q}</dt>
              <dd className="t-story mt-2 text-sand">{f.a}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-12">
          <Cta href="/contact?gate=parents" variant="solid">Enquire about a place</Cta>
        </p>
        <p className="label mt-4 text-dust">Submitting an enquiry is not a confirmed enrolment.</p>
      </section>
    </>
  );
}
