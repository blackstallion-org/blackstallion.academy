import Image from "next/image";
import { asset } from "@/lib/content/asset";

const photographs = [
  { file: "ceremonial-girl", title: "Ceremonial dress", alt: "A girl cadet in a navy and gold bandhgala with cream breeches beside a black Marwari" },
  { file: "ceremonial-cohort", title: "The ceremonial cohort", alt: "Cadets in matching navy and gold ceremonial uniforms leading Marwari horses" },
  { file: "training-red", title: "The first lesson", alt: "An instructor teaching a helmeted cadet in the red and gold training polo beside a Marwari" },
  { file: "stable-care", title: "Care before the saddle", alt: "Cadets in forest green and gold training polos grooming a black Marwari under supervision" },
  { file: "mounted-practice", title: "Quiet hands, steady seat", alt: "Helmeted cadets in red and green training polos walking their horses with an instructor" },
  { file: "uniform-detail", title: "Every detail, considered", alt: "Gold embroidered collar, brass buttons, shoulder cord and white gloves on the navy ceremonial uniform" },
];

export function UniformCollection() {
  return (
    <section id="uniform-collection" aria-labelledby="uniform-collection-h" className="bg-parch py-20 md:py-28">
      <div className="gutter">
        <h2 id="uniform-collection-h" className="t-voice text-[clamp(2rem,4vw,4rem)] leading-tight text-ink">One academy. A shared standard.</h2>
        <p className="mt-5 max-w-2xl text-ink/80">Navy and gold for ceremony. Red and forest green for training. The same attention to dress, care and discipline throughout.</p>
        <div className="mt-10 grid gap-x-8 gap-y-12 md:grid-cols-2">
          {photographs.map((photo) => (
            <figure key={photo.file}>
              <div className="relative aspect-[3/2] overflow-hidden">
                <Image src={asset(`/images/academy-uniforms/${photo.file}.webp`)} alt={photo.alt} fill sizes="(min-width: 768px) 46vw, 100vw" className="object-cover" />
              </div>
              <figcaption className="t-voice mt-4 text-2xl text-ink">{photo.title}</figcaption>
            </figure>
          ))}
        </div>
        <p className="mt-8 text-sm text-ink/70">AI-generated uniform and training illustrations based on the academy’s visual references.</p>
      </div>
    </section>
  );
}
