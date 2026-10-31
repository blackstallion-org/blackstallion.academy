import { Headline } from "@/components/film/Headline";
import { SplineScene } from "@/components/ui/splite";
import { Spotlight } from "@/components/ui/spotlight";

/**
 * Title scene · The Command. The supplied Spline robot, used as supplied (its eyes, its black shell, its own motion), stands on a
 * full-screen dark band under the raking light, as in the reference: one heading, one line, nothing over the figure.
 * Moved here from /science on 31 Oct 2026 (owner's request). The scene streams from Spline's CDN; see docs/ADDED-SCENES.md.
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

        {/* The robot: a wide stage centred on narrow screens (held at a minimum width, the section clips the rest). */}
        <div className="relative h-[clamp(380px,62svh,820px)] w-full lg:h-[min(86svh,860px)]">
          <div aria-hidden className="absolute left-1/2 h-full w-[max(100%,40rem)] -translate-x-1/2">
            <SplineScene scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode" className="h-full w-full" />
          </div>
        </div>
      </div>
    </section>
  );
}
