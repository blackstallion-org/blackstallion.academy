import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FilmImage } from "@/components/film/FilmImage";
import { Headline } from "@/components/film/Headline";
import { Label, StatusDot } from "@/components/film/Marks";
import { LeadForm } from "@/components/sections/shared/LeadForm";
import { fleet, statusLabel } from "@/lib/content/fleet";
import { hubBySlug, hubStatusLabel, hubs, tierById } from "@/lib/content/schools";

export function generateStaticParams() {
  return hubs.map((h) => ({ slug: h.slug }));
}

export async function generateMetadata({ params }: PageProps<"/schools/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const hub = hubBySlug(slug);
  return hub ? { title: hub.name, description: `${hub.name}: batches, stallions and enrolment at the BSAH hub on your campus.` } : {};
}

/** Hub landing: the page a parent reaches by scanning the flyer at their school. */
export default async function HubPage({ params }: PageProps<"/schools/[slug]">) {
  const { slug } = await params;
  const hub = hubBySlug(slug);
  if (!hub) notFound();
  const tier = tierById(hub.tier);
  const horses = fleet.filter((s) => s.hub === hub.slug);
  const [first, ...rest] = hub.name.split(" ");

  return (
    <>
      <section aria-labelledby="hub-h" className="relative min-h-[88svh] overflow-hidden">
        <FilmImage name={hub.image} priority />
        <div aria-hidden className="absolute inset-0 shade-b" />
        <div className="gutter relative flex min-h-[88svh] flex-col justify-end pb-14">
          <Link href="/schools#hubs" className="label text-sand hover:text-gold">
            ← All hubs
          </Link>
          <p className="label mt-8 text-brass">
            BSAH hub · {hub.area} · {tier.name}
          </p>
          <Headline id="hub-h" as="h1" size="1" animate="mount" className="mt-4" inscription={first} voice={rest.join(" ")} />
          <p className="t-story mt-6 max-w-xl text-sand">{hub.note}</p>
        </div>
      </section>

      <section aria-label="At this hub" className="gutter relative py-16">
        <dl className="grid grid-cols-2 gap-px bg-line md:grid-cols-5">
          {[
            ["Status", hubStatusLabel[hub.status]],
            ["Tier", tier.name],
            ["Stallions", String(hub.stallions)],
            ["Cadets", `${hub.cadets} (sample)`],
            ["Faculty", "Ex-cavalry instructor + vet"],
          ].map(([k, v]) => (
            <div key={k} className="bg-night p-6">
              <dt className="label text-dust">{k}</dt>
              <dd className="t-voice mt-2 text-2xl text-bone">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="hub-batches" className="gutter relative py-16">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <Label>Batches at this hub</Label>
            <h2 id="hub-batches" className="t-voice mt-3 text-display-3 text-bone">
              When cadets ride
            </h2>
            <ul className="mt-8 border-t border-line">
              {hub.batches.map((b) => (
                <li key={b.name} className="grid grid-cols-[1fr_auto] gap-4 border-b border-line py-4">
                  <span>
                    <span className="t-voice block text-xl text-bone">{b.name}</span>
                    <span className="t-ui text-sm text-dust">{b.days}</span>
                  </span>
                  <span className="font-mono text-gold">{b.time}</span>
                </li>
              ))}
            </ul>
            <p className="t-ui mt-3 text-xs text-dust">Proposed timings (sample); they may differ from the standard academy schedule and are confirmed at the hub visit.</p>
          </div>
          <div>
            <Label>Stabled here</Label>
            <h2 className="t-voice mt-3 text-display-3 text-bone">The stallions</h2>
            <ul className="mt-8 grid grid-cols-2 gap-4">
              {horses.map((s) => (
                <li key={s.id}>
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <FilmImage name={s.image} sizes="(min-width: 1024px) 20vw, 45vw" />
                    <div aria-hidden className="absolute inset-0 shade-b" />
                    <p className="t-voice absolute bottom-3 left-3 text-xl text-bone">{s.name}</p>
                  </div>
                  <p className="label mt-2 flex items-center gap-2 text-sand">
                    <StatusDot status={s.status} />
                    {statusLabel[s.status]}
                  </p>
                </li>
              ))}
            </ul>
            <Link href="/fleet" className="label mt-6 inline-block text-gold hover:text-bone">
              The full studbook →
            </Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="hub-enquire" className="relative bg-umber/40 py-[clamp(5rem,12vh,10rem)]">
        <div className="gutter grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <div>
            <Label>Enrol at {hub.short}</Label>
            <Headline id="hub-enquire" className="mt-4" inscription="Book a" voice="hub visit." />
            <p className="mt-6 max-w-sm text-sand">Meet the instructor and the stallions, then a twenty-minute assessment ride places your child in the right batch.</p>
          </div>
          <LeadForm
            gate="hub"
            fallbackEmail="parents@blackstallion.academy"
            hidden={{ organisation: hub.name }}
            submitLabel="Request a visit"
            fields={[
              { name: "name", label: "Parent's name", required: true, autoComplete: "name" },
              { name: "child", label: "Child's name" },
              { name: "class", label: "Class", type: "select", options: ["Class 3–5", "Class 6–8", "Class 9–10", "Class 11–12"] },
              { name: "batch", label: "Preferred batch", type: "select", options: hub.batches.map((b) => b.name) },
              { name: "phone", label: "Phone", type: "tel", required: true, autoComplete: "tel" },
              { name: "email", label: "Email", type: "email", autoComplete: "email" },
            ]}
          />
        </div>
      </section>
    </>
  );
}
