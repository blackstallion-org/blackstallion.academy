import { TextAnimate } from "@/components/motion/TextAnimate";
import { bloodlines } from "@/lib/content/fleet";

/**
 * The eight foundation bloodlines as a plain index: numbered rows, a hairline between each, the name large in the display serif and
 * the coat in small capitals. It replaced the bento studbook (pinned GSAP gallery, cards on photographs), which broke on scroll.
 * On the page's own ivory, no images, no cards: the names carry it. Each name arrives once (blur-in-up, by character).
 */
export function BloodlineIndex() {
  return (
    <section aria-labelledby="bloodlines-title" className="bg-night px-5 py-24 sm:px-8 md:py-36">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-6 border-b border-line pb-10 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="label text-brass">Chapter VI · The bloodlines</p>
            <h2 id="bloodlines-title" className="mt-5 font-display text-bone">
              <TextAnimate as="span" animation="slideUp" className="t-inscribe block text-display-2">
                Eight bloodlines.
              </TextAnimate>
              <TextAnimate as="span" animation="blurIn" delay={0.35} className="t-voice block text-display-2 text-gold">
                One ledger.
              </TextAnimate>
            </h2>
          </div>
          <p className="t-story max-w-sm text-lg italic text-sand">The lines every horse in the studbook descends from. They never left the field.</p>
        </div>

        <ol className="divide-y divide-line">
          {bloodlines.map((b, i) => (
            <li key={b.name} className="group grid grid-cols-[2.5rem_1fr] items-baseline gap-x-4 gap-y-1 py-6 md:grid-cols-[4rem_1fr_16rem_14rem] md:py-8">
              <span className="font-mono text-xs text-dust">{String(i + 1).padStart(2, "0")}</span>
              <TextAnimate
                as="h3"
                animation="blurInUp"
                className="font-display text-[clamp(2rem,6vw,4.5rem)] font-normal leading-[0.95] tracking-[-0.01em] text-bone transition-colors duration-500 group-hover:text-gold"
              >
                {b.name}
              </TextAnimate>
              <p className="t-voice col-start-2 text-lg text-gold md:col-start-auto">{b.trait}</p>
              <p className="label col-start-2 text-dust md:col-start-auto md:text-right">
                {b.breed} · {b.coat}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
