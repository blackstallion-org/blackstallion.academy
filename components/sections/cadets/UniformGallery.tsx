import Image from "next/image";
import { Headline } from "@/components/film/Headline";
import { asset } from "@/lib/content/asset";

/** Five photographs of the navy ceremonial uniform (AI-generated from the academy's reference, 4 Nov 2026). */
const portraits = [
  { file: "navy-standing", title: "At attention", alt: "A cadet standing at attention in the navy and gold tunic, cream breeches and tall black boots in a sandstone courtyard" },
  { file: "navy-detail", title: "Braid, brass and crest", alt: "Close view of the navy tunic: gold braided collar, brass buttons, embroidered chest crest and sleeve chevron" },
  { file: "navy-rear-saddle", title: "The line from behind", alt: "A cadet in the navy tunic seen from behind, leading a black Marwari with a navy and gold saddle cloth" },
  { file: "navy-mounted", title: "Mounted, helmet fastened", alt: "A helmeted cadet in the navy tunic riding a black Marwari through golden dust" },
] as const;

export function UniformGallery() {
  return (
    <section id="uniform-gallery" aria-labelledby="uniform-gallery-h" className="bg-night py-20 md:py-28">
      <div className="gutter">
        <Headline id="uniform-gallery-h" inscription="THE NAVY CEREMONIAL" voice="worn the same by every cadet." size="3" />
        <p className="mt-6 max-w-2xl text-lede leading-relaxed text-sand">
          A midnight navy tunic with a gold braided collar and brass buttons. Cream breeches, tall black boots, white gloves. One standard, from the first lesson to the parade.
        </p>

        <div className="mt-12 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {portraits.map((photo) => (
            <figure key={photo.file}>
              <div className="relative aspect-[3/4] overflow-hidden">
                <Image src={asset(`/images/academy-uniforms/${photo.file}.webp`)} alt={photo.alt} fill sizes="(min-width: 1024px) 23vw, (min-width: 640px) 46vw, 100vw" className="object-cover" />
              </div>
              <figcaption className="t-voice mt-4 text-xl text-bone">{photo.title}</figcaption>
            </figure>
          ))}
        </div>

        <figure className="mx-auto mt-14 max-w-5xl">
          <div className="relative aspect-[3/2] overflow-hidden">
            <Image
              src={asset("/images/academy-uniforms/navy-cohort-three.webp")}
              alt="Three cadets standing shoulder to shoulder in identical navy and gold uniforms under a sandstone colonnade"
              fill
              sizes="(min-width: 1024px) 64rem, 100vw"
              className="object-cover object-[50%_45%]"
            />
          </div>
          <figcaption className="t-voice mt-4 text-xl text-bone">Shoulder to shoulder</figcaption>
        </figure>

        <p className="mt-10 text-sm text-dust">AI-generated illustrations based on the academy’s visual references.</p>
      </div>
    </section>
  );
}
