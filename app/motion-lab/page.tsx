import Link from "next/link";
import { Headline } from "@/components/film/Headline";
import { Label } from "@/components/film/Marks";
import { MotionLab } from "@/components/sections/motion-lab/MotionLab";

/** A working tool, not a reel: one page, one job. Everything on it comes from the camera or the uploaded video. */
export default function MotionLabPage() {
  return (
    <main id="main" data-parallax-skip className="gutter relative pb-[clamp(4rem,10vh,8rem)] pt-[clamp(7rem,14vh,9rem)]">
      <header className="mb-[clamp(2rem,5vh,3.5rem)] max-w-3xl">
        <Label>Motion lab · experimental</Label>
        <Headline id="motion-h" className="mt-4" inscription="The horse," voice="read in motion." animate="none" />
        <p className="t-story mt-6 max-w-2xl text-lede text-sand">
          Point a camera at a horse, or upload a video. An AI model that runs on your own device finds the horse, draws its skeleton over the picture and measures how it moves. Nothing leaves your device unless you choose to save a session to your account.
        </p>
        <p className="t-ui mt-4 max-w-2xl border-l-2 border-gold pl-3 text-sm text-sand">
          Gait and joint-angle readings are estimates from a general animal model. They are a coaching curiosity, not a veterinary diagnosis, and say nothing reliable about lameness or fitness.
        </p>
      </header>

      <MotionLab />

      <section aria-labelledby="how-h" className="mt-[clamp(3rem,8vh,6rem)] grid gap-8 border-t border-line pt-8 md:grid-cols-3">
        <div>
          <h2 id="how-h" className="label text-gold">How it works</h2>
          <p className="t-ui mt-3 text-sm leading-relaxed text-sand">A small detector (YOLOX-Nano, trained on everyday photographs) finds horses in each frame. A pose model (RTMPose-m, trained on the AP-10K animal data set) then places 17 points inside the box: eyes, nose, neck, root of tail, and for each leg the shoulder or hip, elbow or knee and paw. Both run in your browser with LiteRT.js.</p>
        </div>
        <div>
          <h2 className="label text-gold">What it can and cannot do</h2>
          <p className="t-ui mt-3 text-sm leading-relaxed text-sand">Gait is read from how each paw moves along the body over about four seconds, so it needs a steady side or three-quarter view. A horse seen head-on, far away, or hidden by a rider or rail will track badly or not at all, and the page says so rather than guessing. The points are generic animal landmarks, not hoof, fetlock and hock markers.</p>
        </div>
        <div>
          <h2 className="label text-gold">Your recordings</h2>
          <p className="t-ui mt-3 text-sm leading-relaxed text-sand">Sessions are kept in this browser. Export them as CSV, JSON or a PDF report, or sign in and save them to your private account space. Only record people and horses you have permission to record. <Link href="/privacy" className="text-gold underline underline-offset-2 hover:text-bone">Privacy notice</Link>.</p>
        </div>
      </section>
    </main>
  );
}
