import { Headline } from "@/components/film/Headline";
import { Spotlight } from "@/components/ui/spotlight";
import { CowboyGuide } from "./CowboyGuide";

/**
 * Title scene · The Command. The academy's guide, a horseman in a wide-brim hat (CowboyGuide), tips his hat under the raking
 * light: one heading, one line, nothing over the figure. He replaced the Spline robot on 2 Nov 2026 (R21); the same guide waits
 * beside the desk below and follows the questions there.
 */
export function CommandHero() {
  return (
    <section
      aria-labelledby="command-title"
      data-parallax-skip
      className="tone-dark relative overflow-hidden bg-night pt-[clamp(5.5rem,9vh,7.5rem)]"
    >
      <Spotlight className="-top-40 left-0 md:-top-20 md:left-60" fill="var(--color-bone)" />
      <div className="gutter relative grid min-h-[calc(100svh-clamp(5.5rem,9vh,7.5rem))] items-center gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="relative z-10 max-w-xl pt-6 lg:pt-0">
          <p className="label text-brass">Reel 14 · Act III</p>
          <Headline id="command-title" as="h1" animate="mount" className="mt-5" inscription="The Command." voice="Questions, answered." />
          <p className="t-story mt-6 max-w-md text-sand">
            Fees, safety, curriculum and campus partnerships, answered from what the academy has published.
          </p>
          <a href="#desk" className="label mt-10 inline-flex items-center gap-3 border-b border-line pb-2 text-bone transition-colors hover:border-gold hover:text-gold">
            Ask a question <span aria-hidden>↓</span>
          </a>
        </div>

        {/* The guide, full length, greeting; the section clips nothing of him. */}
        <div className="relative mx-auto h-[clamp(360px,58svh,780px)] w-full max-w-[34rem] lg:h-[min(84svh,840px)]">
          <CowboyGuide state="greeting" priority sizes="(min-width: 1024px) 34rem, 80vw" className="absolute inset-x-0 bottom-0 mx-auto h-full w-auto" />
        </div>
      </div>
    </section>
  );
}
