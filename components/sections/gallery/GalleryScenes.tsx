import { Headline } from "@/components/film/Headline";
import { Label } from "@/components/film/Marks";
import type { LibraryItem } from "@/lib/storage/library";
import { GalleryModel } from "./GalleryModel";

const mb = (bytes: number) => (bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

/** Title card. The nav is fixed at the top of the screen, so the first line starts well below it. */
export function GalleryTitle({ count }: { count: number }) {
  return (
    <section aria-labelledby="gallery-h" className="gutter relative pb-[clamp(3rem,8vh,6rem)] pt-[clamp(7.5rem,16vh,11rem)]">
      <Label>Gallery</Label>
      <Headline id="gallery-h" className="mt-4" inscription="The academy" voice="in pictures." />
      <p className="mt-6 max-w-xl text-sand leading-relaxed">
        {count > 0
          ? "Photographs, films and 3D studies added by the academy. Each file is checked by its contents before it appears here."
          : "Nothing has been added yet. Photographs, films and 3D studies will appear here as the academy publishes them."}
      </p>
    </section>
  );
}

function Group({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="gutter relative pb-[clamp(4rem,10vh,8rem)]">
      <h2 id={id} className="label text-brass">{title}</h2>
      <ul className="mt-6 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">{children}</ul>
    </section>
  );
}

function Caption({ item }: { item: LibraryItem }) {
  return (
    <figcaption className="mt-3">
      <p className="t-ui text-sm text-sand">{item.alt}</p>
      <p className="mt-1 font-mono text-[0.65rem] uppercase tracking-wider text-dust">{mb(item.bytes)}</p>
    </figcaption>
  );
}

/** Everything the academy has published to the media library, grouped by kind. Each file is shown by its public address. */
export function GalleryItems({ items }: { items: LibraryItem[] }) {
  const photos = items.filter((i) => i.kind === "image");
  const films = items.filter((i) => i.kind === "video");
  const models = items.filter((i) => i.kind === "model");
  return (
    <>
      {photos.length > 0 && (
        <Group id="gallery-photos-h" title="Photographs">
          {photos.map((item) => (
            <li key={item.id}>
              <figure>
                {/* eslint-disable-next-line @next/next/no-img-element -- files from the media library bucket, shown at the size they were uploaded */}
                <img src={item.url} alt={item.alt} loading="lazy" decoding="async" className="aspect-[4/3] w-full bg-umber object-cover" />
                <Caption item={item} />
              </figure>
            </li>
          ))}
        </Group>
      )}
      {films.length > 0 && (
        <Group id="gallery-films-h" title="Films">
          {films.map((item) => (
            <li key={item.id}>
              <figure>
                <video controls preload="metadata" playsInline aria-label={item.alt} className="aspect-video w-full bg-night object-contain">
                  <source src={item.url} type={item.mime} />
                </video>
                <Caption item={item} />
              </figure>
            </li>
          ))}
        </Group>
      )}
      {models.length > 0 && (
        <Group id="gallery-models-h" title="3D studies">
          {models.map((item) => (
            <li key={item.id}>
              <figure>
                <GalleryModel url={item.url} label={item.alt} />
                <Caption item={item} />
              </figure>
            </li>
          ))}
        </Group>
      )}
    </>
  );
}
