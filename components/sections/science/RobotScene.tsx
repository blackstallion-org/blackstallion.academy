import { Headline } from "@/components/film/Headline";
import { Label } from "@/components/film/Marks";
import { SplineScene } from "@/components/ui/splite";
import { Spotlight } from "@/components/ui/spotlight";

/**
 * Title scene · the measuring machine. A 3D robot (Spline, streamed at runtime) sits in the middle of a dark stage under a
 * raking light, and the line beside it sets up the page: a machine can measure what the saddle does; only the horse teaches it.
 * The scene itself is Spline's, used as supplied; see docs/ADDED-SCENES.md.
 */
export function RobotScene() {
  return (
    <section
      aria-labelledby="science-machine-h"
      className="tone-dark relative overflow-hidden bg-night pb-[clamp(3rem,8vh,6rem)] pt-[clamp(5.5rem,9vh,7.5rem)]"
    >
      <Spotlight className="-top-40 left-0 md:-top-20 md:left-60" />

      <div className="gutter relative z-10 max-w-3xl">
        <Label>Before the evidence</Label>
        <Headline
          id="science-machine-h"
          as="h2"
          animate="mount"
          className="mt-4"
          inscription="Machines measure."
          voice="Horses teach."
        />
        <p className="t-story mt-6 max-w-xl text-sand">
          Twenty minutes in the saddle asks something of a child&rsquo;s brain, spine, muscles and heart at the same moment. Every
          part of it can be counted. What follows is what we can count, and how sure we are of each number.
        </p>
      </div>

      {/*
        The robot sits in the middle of the page, under the light. The scene is framed by Spline for a wide stage, so on a
        narrow screen the canvas is held at a minimum width and centred (the section clips the overflow) — otherwise the
        robot falls outside the view.
      */}
      <div className="relative z-0 mt-[clamp(1rem,3vh,2.5rem)] h-[clamp(320px,52vh,520px)] w-full">
        <div aria-hidden className="absolute left-1/2 h-full w-[max(100%,44rem)] -translate-x-1/2">
          <SplineScene scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode" className="h-full w-full" />
        </div>
      </div>
    </section>
  );
}
