import { CurtainChapters } from "@/components/motion/fx/CurtainChapters";
import { curtains, type CurtainKey } from "@/lib/content/curtains";

/**
 * One full-screen scroll curtain per page: four photographs that draw up over one another as the reader scrolls (the /parents
 * "morning" curtain). Copy and images live in lib/content/curtains.ts.
 */
export function PageCurtain({ page }: { page: CurtainKey }) {
  const set = curtains[page];
  return <CurtainChapters id={`curtain-${page}`} label={set.label} chapters={[...set.chapters]} />;
}
