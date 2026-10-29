import { avifSrcSet } from "@/lib/content/media";

/**
 * A plain still (not a filled, graded FilmImage) that offers the sized AVIF versions first and keeps the WebP as the <img>: for the few
 * places that need a real <img> element (a slide's background, the poster under a WebGL canvas).
 */
export function Still({ src, sizes = "100vw", ...img }: { src?: string; sizes?: string } & React.ImgHTMLAttributes<HTMLImageElement>) {
  // No src yet (a slide that has not been armed): nothing may load, so no <source> either.
  const set = src ? avifSrcSet(src) : null;
  const image = (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} sizes={set ? sizes : undefined} alt={img.alt ?? ""} {...img} />
  );
  return set ? (
    <picture className="contents">
      <source srcSet={set} sizes={sizes} type="image/avif" />
      {image}
    </picture>
  ) : image;
}
