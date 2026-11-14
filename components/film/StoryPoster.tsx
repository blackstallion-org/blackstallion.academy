import Image from "next/image";
import { Headline } from "./Headline";

type StoryPosterProps = {
  /** The key art: one painting that tells the whole story. */
  src: string;
  alt: string;
  width: number;
  height: number;
  /** object-position of the subject, kept in frame on narrow screens (for example "64% 50%"). */
  focal?: string;
  label: string;
  inscription: string;
  voice: string;
  /** id of the element "Begin" scrolls to. */
  beginId: string;
  beginLabel?: string;
  /** id of the h1, so the page can point aria-labelledby at it. */
  headingId?: string;
};

/*
 * Ken Burns push-in and the text fade. React 19 hoists and dedupes a <style> with href + precedence, so the component
 * stays self-contained. Reduced motion: the image is still and only the text fades (the headline's rise is already off).
 */
const css = `
@keyframes story-poster-push { from { transform: scale(1.0); } to { transform: scale(1.09); } }
@keyframes story-poster-fade { from { opacity: 0; } to { opacity: 1; } }
.story-poster-img { animation: story-poster-push 32s cubic-bezier(0.22, 0.61, 0.36, 1) both; will-change: transform; }
.story-poster-fade { animation: story-poster-fade 1.6s cubic-bezier(0.16, 1, 0.3, 1) var(--fade-delay, 0s) both; }
@media (prefers-reduced-motion: reduce) {
  .story-poster-img { animation: none; will-change: auto; }
}
`;

/**
 * A full-screen film-poster opening: the story's key art fills the viewport with a slow push-in, and the label and
 * two-voice title sit bottom-left on a charcoal gradient. Always dark (`tone-photo`), role tokens only. The top 120 px
 * stay clear for the fixed nav.
 */
export function StoryPoster({
  src,
  alt,
  width,
  height,
  focal = "50% 50%",
  label,
  inscription,
  voice,
  beginId,
  beginLabel = "Begin",
  headingId = "story-poster-title",
}: StoryPosterProps) {
  return (
    <section
      aria-labelledby={headingId}
      className="tone-photo relative isolate flex min-h-[100svh] flex-col justify-end overflow-hidden bg-night text-bone"
    >
      <style href="story-poster" precedence="medium">
        {css}
      </style>

      <div className="absolute inset-0 -z-10 overflow-hidden">
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          // object-cover on a tall screen needs the image as wide as 16/9 of the viewport height, not just 100vw
          sizes="(max-aspect-ratio: 16/9) 178vh, 100vw"
          priority
          quality={80}
          draggable={false}
          className="story-poster-img h-full w-full object-cover"
          style={{ objectPosition: focal, transformOrigin: focal }}
        />
        {/* Gradients hold the text: the house shades plus a deeper wash of the canvas token at the foot and left edge. */}
        <div aria-hidden className="shade-b absolute inset-0" />
        <div aria-hidden className="shade-l absolute inset-0" />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background: [
              "linear-gradient(0deg, color-mix(in srgb, var(--color-night) 92%, transparent) 0%, color-mix(in srgb, var(--color-night) 62%, transparent) 26%, transparent 58%)",
              "linear-gradient(90deg, color-mix(in srgb, var(--color-night) 72%, transparent) 0%, color-mix(in srgb, var(--color-night) 40%, transparent) 30%, transparent 55%)",
              "linear-gradient(180deg, color-mix(in srgb, var(--color-night) 45%, transparent) 0%, transparent 18%)",
            ].join(", "),
          }}
        />
      </div>

      <div className="gutter relative pb-[clamp(2.5rem,9vh,5.5rem)] pt-[max(120px,clamp(7.5rem,14vh,10rem))]">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-[40rem]">
            <p className="story-poster-fade label text-sand" style={{ ["--fade-delay" as string]: "0.1s" }}>
              {label}
            </p>
            <Headline
              as="h1"
              id={headingId}
              size="2"
              animate="mount"
              delay={0.2}
              inscription={inscription}
              voice={voice}
              className="mt-5"
            />
            <a
              href={`#${beginId}`}
              className="story-poster-fade label mt-9 inline-flex min-h-11 items-center gap-3 border border-[var(--color-line)] px-5 text-bone transition-colors duration-500 hover:border-[var(--color-gold)] hover:text-gold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-gold)]"
              style={{ ["--fade-delay" as string]: "0.9s" }}
            >
              {beginLabel}
              <span aria-hidden>↓</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
