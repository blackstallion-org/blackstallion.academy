import { CrowdCanvas } from "@/components/motion/CrowdCanvas";

/**
 * The foot of /tournaments: the people who came to watch the circuit walk the last band of the page, on the site's ivory,
 * just above the footer (31 Oct 2026, owner's request). Decorative; the canvas stands still under reduced motion.
 */
export function CircuitCrowd() {
  return (
    <div aria-hidden className="tone-light relative h-[clamp(9rem,18vw,14rem)] w-full overflow-hidden border-t border-line bg-night">
      <CrowdCanvas src="/animations/crowd-peeps.png" rows={15} cols={7} scale={0.4} className="absolute bottom-0 h-full w-full" />
    </div>
  );
}
