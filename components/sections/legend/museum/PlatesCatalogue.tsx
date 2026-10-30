import Image from "next/image";
import { GALLERY, paintings } from "@/lib/content/museum";
import { splitDescription } from "./overlay/PaintingInformation";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * The six plates as a plain catalogue: the accessible, no-JavaScript, no-WebGL version of the museum, and the page
 * the museum's "The six plates" links lead to. Server component. Every label is the same text the 3D hall shows.
 */
export function PlatesCatalogue() {
  const sorted = [...paintings].sort((a, b) => a.order - b.order);
  return (
    <section id="plates" aria-labelledby="plates-h" className="gutter relative py-[clamp(5rem,12vh,10rem)]">
      <p className="label text-brass">{GALLERY.name} · The catalogue</p>
      <h2 id="plates-h" className="t-inscribe mt-4 text-[clamp(1.6rem,3vw,2.6rem)] text-bone">
        The six plates
      </h2>
      <p className="t-story mt-4 max-w-2xl text-sand">
        The same six plates that hang in the hall, in order, with the chapter each belongs to. The images are placeholder illustrations, not archival photographs, and folklore is marked as folklore.
      </p>
      <ol className="mt-12 columns-1 gap-x-10 md:columns-2 lg:columns-3">
        {sorted.map((plate, i) => {
          const { lead, body } = splitDescription(plate.description);
          return (
            <li key={plate.id} className="mb-12 break-inside-avoid">
              <figure>
                <div className="border border-line p-2">
                  <Image
                    src={plate.image.src}
                    alt={plate.image.alt}
                    width={plate.image.width}
                    height={plate.image.height}
                    sizes="(min-width: 1024px) 30vw, (min-width: 768px) 46vw, 92vw"
                    className="h-auto w-full"
                  />
                </div>
                <figcaption className="mt-4">
                  <p className="label text-brass">
                    <span className="font-mono mr-2 text-gold">PLATE {pad(i + 1)}</span>
                    {plate.chapter}
                  </p>
                  <p className="t-voice mt-2 text-2xl text-bone">{plate.title}</p>
                  {lead ? <p className="t-story mt-3 italic text-bone">{lead}</p> : null}
                  {body ? <p className="t-story mt-2 text-sand">{body}</p> : null}
                  <dl className="t-ui mt-4 grid gap-1 text-xs text-dust">
                    {plate.facts
                      .filter(([term]) => term !== "Chapter")
                      .map(([term, value]) => (
                        <div key={term} className="flex flex-wrap gap-x-2">
                          <dt className="label">{term}</dt>
                          <dd>{value}</dd>
                        </div>
                      ))}
                  </dl>
                </figcaption>
              </figure>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
