import type { Metadata } from "next";
import { EndCard } from "@/components/film/EndCard";
import { Headline } from "@/components/film/Headline";
import { Cta } from "@/components/film/Marks";
import { HoofPath, ParentsTitle, PinnedPhone, Receipt, StandingOrders } from "@/components/sections/parents/ParentScenes";

export const metadata: Metadata = {
  title: "The Guardian",
  description: "For parents: the stall-cam, gate alerts and milestone reels, admissions in five steps, fees and answers.",
};

export default function ParentsPage() {
  return (
    <>
      <ParentsTitle />
      <PinnedPhone />
      <HoofPath />
      <Receipt />
      <StandingOrders />

      {/* §5 · CTA */}
      <section aria-labelledby="enrol-h" className="gutter relative pb-[clamp(6rem,14vh,12rem)] text-center">
        <Headline id="enrol-h" size="1" className="mx-auto" inscription="Enrol" voice="a cadet." />
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Cta href="/contact?gate=parents" variant="solid">
            Start the enquiry
          </Cta>
          <Cta href="/schools#hubs">Find your campus</Cta>
        </div>
      </section>

      <EndCard current={8} />
    </>
  );
}
