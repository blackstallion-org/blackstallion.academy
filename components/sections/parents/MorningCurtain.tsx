import { CurtainChapters } from "@/components/motion/fx/CurtainChapters";
import { morningCurtain } from "@/lib/content/fx-scenes";
import { academyDay } from "@/lib/content/peg";

/**
 * §1b · S68 Curtain day. Four moments of a morning session; each scroll step draws the next frame up over the last
 * like a curtain and its title rises letter by letter. Times are SAMPLE.
 */
export function MorningCurtain() {
  return (
    <>
      <CurtainChapters id="morning" label={morningCurtain.label} chapters={academyDay} />
      <p className="gutter t-ui pt-4 text-xs text-dust">{morningCurtain.note} (SAMPLE)</p>
    </>
  );
}
