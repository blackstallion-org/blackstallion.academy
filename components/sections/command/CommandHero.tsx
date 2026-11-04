import { Headline } from "@/components/film/Headline";
import { CursorScrubVideo } from "./CursorScrubVideo";

/**
 * Title scene · The Command. The academy's guide is a cowboy and his horse (the owner's own clip, 3 Nov 2026), and the film is
 * the whole scene: its warm backdrop fills the section edge to edge, with no dark frame around it, and their heads turn to follow
 * the cursor across the section (CursorScrubVideo; touch: horizontal drag). Light scope on purpose, so the type is ink on the
 * film's own cream. Desktop: the whole film sits under the fixed bar, anchored to the bottom and shifted right, its left edge dissolving into the
 * cream that carries the words. Phones: the words first, then the film at its own 16:9.
 */
export function CommandHero() {
  return (
    <section
      aria-labelledby="command-title"
      data-parallax-skip
      className="relative overflow-hidden bg-[#e8c1a5] pt-[clamp(5.5rem,9vh,7.5rem)]"
      style={{ touchAction: "pan-y" }}
    >
      <div className="gutter relative z-10 flex flex-col justify-center pb-4 pt-6 lg:min-h-[calc(100svh-clamp(5.5rem,9vh,7.5rem))] lg:pb-0 lg:pt-0">
        <div className="max-w-xl lg:max-w-[min(34rem,38vw)]">
          <p className="label text-brass">Reel 14 · Act III</p>
          <Headline id="command-title" as="h1" animate="mount" className="mt-5" inscription="The Command." voice="Questions, answered." />
          <p className="t-story mt-6 max-w-md text-sand lg:max-w-[22rem]">
            Fees, safety, curriculum and campus partnerships, answered from what the academy has published.
          </p>
          <a href="#desk" className="label mt-10 inline-flex items-center gap-3 border-b border-line pb-2 text-bone transition-colors hover:border-gold hover:text-gold">
            Ask a question <span aria-hidden>↓</span>
          </a>
        </div>
      </div>

      {/* The film, whole and uncropped, starting below the fixed bar (the bar never sits over the guide's head). Phones: under the
          words at its 16:9. Desktop: the full picture fitted to the space under the bar, anchored to the bottom and shifted right;
          its left edge fades into the same cream that carries the words. */}
      <div className="relative mt-4 aspect-video w-full lg:absolute lg:bottom-0 lg:left-[14%] lg:right-[-2%] lg:top-[clamp(5.5rem,9vh,7.5rem)] lg:mt-0 lg:aspect-auto [mask-image:linear-gradient(to_bottom,transparent,#000_24%)] lg:[mask-image:linear-gradient(to_right,transparent,#000_16%)]">
        <CursorScrubVideo className="absolute inset-0" fit="contain" objectPosition="72% 100%" />
      </div>
    </section>
  );
}
