import Image from "next/image";
import { Headline } from "@/components/film/Headline";
import { CAMPAIGN_NOTE, parentVisit, RING_BACKGROUND, schoolRing, trainer, type CampaignImage } from "@/lib/content/campaign";

/** A captioned campaign illustration at its own proportions (no crop of heads, ears or the ring). */
function Plate({ img, sizes, className, eager }: { img: CampaignImage; sizes: string; className?: string; eager?: boolean }) {
  return (
    <figure className={className}>
      <div className="relative overflow-hidden bg-umber" style={{ aspectRatio: `${img.width} / ${img.height}` }}>
        <Image src={img.src} alt={img.alt} fill sizes={sizes} className="object-cover" style={img.position ? { objectPosition: img.position } : undefined} loading={eager ? "eager" : "lazy"} />
      </div>
      {img.title && <figcaption className="t-voice mt-4 text-xl text-bone">{img.title}</figcaption>}
    </figure>
  );
}

/**
 * /cadets · the instructor's uniform, in the same editorial series as the cadets' UniformGallery: two portraits, then
 * the trainer at work in the riding ring, then a courtyard lesson.
 */
export function TrainerUniformGallery() {
  return (
    <section id="trainer-uniform" aria-labelledby="trainer-uniform-h" className="bg-night py-20 md:py-28">
      <div className="gutter">
        <p className="label text-brass">{trainer.label}</p>
        <Headline id="trainer-uniform-h" inscription={trainer.inscription} voice={trainer.voice} size="3" className="mt-3" />
        <p className="mt-6 max-w-2xl text-lede leading-relaxed text-sand">{trainer.lede}</p>

        <div className="mt-12 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.6fr)] lg:items-end">
          {trainer.portraits.map((p) => (
            <figure key={p.src}>
              <div className="relative aspect-[3/4] overflow-hidden bg-umber">
                <Image src={p.src} alt={p.alt} fill sizes="(min-width: 1024px) 22vw, (min-width: 640px) 46vw, 100vw" className="object-cover" style={{ objectPosition: p.position }} />
              </div>
              <figcaption className="t-voice mt-4 text-xl text-bone">{p.title}</figcaption>
            </figure>
          ))}
          <Plate img={trainer.ring} sizes="(min-width: 1024px) 36vw, 100vw" className="sm:col-span-2 lg:col-span-1" />
        </div>

        <div className="mt-14 grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-center">
          <Plate img={trainer.courtyard} sizes="(min-width: 1024px) 56vw, 100vw" />
          <p className="t-story max-w-md text-sand">
            The same tunic in the courtyard: an instructor leads the horse while a small group of cadets watches how the lead is held.
          </p>
        </div>

        <p className="mt-10 text-sm text-dust">{trainer.note}</p>
      </div>
    </section>
  );
}

/** /parents · parents at the ring fence, then at the stable. */
export function ParentRingVisit() {
  return (
    <section id="ring-visit" aria-labelledby="ring-visit-h" className="bg-night py-20 md:py-28">
      <div className="gutter">
        <p className="label text-brass">{parentVisit.label}</p>
        <Headline id="ring-visit-h" inscription={parentVisit.inscription} voice={parentVisit.voice} size="3" className="mt-3" />
        <p className="mt-6 max-w-2xl text-lede leading-relaxed text-sand">{parentVisit.lede}</p>
        <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:items-end">
          <Plate img={parentVisit.ring} sizes="(min-width: 1024px) 60vw, 100vw" />
          <Plate img={parentVisit.stable} sizes="(min-width: 1024px) 36vw, 100vw" />
        </div>
        <p className="mt-10 text-sm text-dust">{CAMPAIGN_NOTE}</p>
      </div>
    </section>
  );
}

/** /schools · the riding ring as the programme's place: a wide view of the ring, then a lesson and horse care. */
export function SchoolRingProgramme() {
  return (
    <section id="ring-programme" aria-labelledby="ring-programme-h" className="bg-night pb-20 md:pb-28">
      {/* The ring itself, once, as a wide band with nothing written over it */}
      <div className="relative aspect-[2/1] w-full overflow-hidden bg-umber sm:aspect-[21/8]">
        <Image src={RING_BACKGROUND.src} alt={RING_BACKGROUND.alt} fill sizes="100vw" className="object-cover object-[50%_60%]" />
      </div>
      <div className="gutter pt-14 md:pt-20">
        <p className="label text-brass">{schoolRing.label}</p>
        <Headline id="ring-programme-h" inscription={schoolRing.inscription} voice={schoolRing.voice} size="3" className="mt-3" />
        <p className="mt-6 max-w-2xl text-lede leading-relaxed text-sand">{schoolRing.lede}</p>
        <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:items-end">
          <Plate img={schoolRing.lesson} sizes="(min-width: 1024px) 60vw, 100vw" />
          <Plate img={schoolRing.care} sizes="(min-width: 1024px) 36vw, 100vw" />
        </div>
        <p className="mt-10 text-sm text-dust">{CAMPAIGN_NOTE}</p>
      </div>
    </section>
  );
}
