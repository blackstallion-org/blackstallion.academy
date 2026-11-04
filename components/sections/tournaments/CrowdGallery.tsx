import { CrowdCanvas } from "@/components/motion/CrowdCanvas";
import { Headline } from "@/components/film/Headline";
import { Label } from "@/components/film/Marks";

/**
 * Scene · the gallery. Between the run and the podium, the people who came to watch walk the length of the page.
 * The crowd is drawn on a canvas from one sprite sheet (components/motion/CrowdCanvas.tsx); it stands still under reduced motion.
 */
export function CrowdGallery() {
  return (
    <section aria-labelledby="crowd-h" className="relative overflow-hidden bg-night pt-[clamp(4rem,10vh,8rem)]">
      <div className="gutter relative z-10">
        <Label>The gallery</Label>
        <Headline id="crowd-h" className="mt-4" inscription="The village" voice="walks to the field." />
        <p className="t-story mt-6 max-w-xl text-sand">
          A fixture is a public day. Families, classmates and neighbours line the rope while the lances come down — which is why a
          cadet is taught to ride the run the same way whether anyone is watching or not.
        </p>
      </div>

      <div className="relative mt-[clamp(1rem,4vh,3rem)] h-[clamp(260px,42vh,400px)] w-full">
        <CrowdCanvas src="/animations/crowd-peeps.png" rows={15} cols={7} scale={0.52} className="absolute bottom-0 h-full w-full" />
      </div>
    </section>
  );
}
