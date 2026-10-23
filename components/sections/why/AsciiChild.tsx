import { Headline } from "@/components/film/Headline";
import { Label } from "@/components/film/Marks";
import { AsciiRipple } from "@/components/motion/fx/AsciiRipple";
import { asciiChild } from "@/lib/content/fx-scenes";

/**
 * §1b · S67 ASCII ripple (frost, the digital-crisis side). The crisis photograph re-set as characters;
 * the pointer drops ripples that pass through and fade. Signature: the child keeps the same hunched shape
 * however much the surface is disturbed.
 */
export function AsciiChild() {
  return (
    <section aria-labelledby="ascii-h" className="tone-dark relative overflow-hidden bg-night py-[clamp(6rem,14vh,12rem)]">
      <div className="gutter grid gap-10 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] lg:items-center">
        <div>
          <Label>{asciiChild.label}</Label>
          <Headline id="ascii-h" className="mt-4" inscription={asciiChild.inscription} voice={asciiChild.voice} voiceColor="sand" />
          <p className="t-story mt-6 max-w-md text-sand">{asciiChild.body}</p>
          <p className="t-ui mt-6 text-xs text-dust">{asciiChild.caption}</p>
        </div>
        <AsciiRipple image="whyCrisis" dimVar="--color-dust" hotVar="--color-frost" className="aspect-[16/10] w-full border border-line" />
      </div>
    </section>
  );
}
