import type { Metadata } from "next";
import { MorningCurtain } from "@/components/sections/parents/MorningCurtain";
import { EndCard } from "@/components/film/EndCard";
import { Headline } from "@/components/film/Headline";
import { Cta } from "@/components/film/Marks";
import { HoofPath, ParentsTitle, ParentVantageGallery, PinnedPhone, Receipt, StandingOrders } from "@/components/sections/parents/ParentScenes";
import { CadetAdmissionPortal } from "@/components/sections/parents/CadetAdmissionPortal";
import { HorizontalChapter } from "@/components/motion/HorizontalChapter";
import { ReplayHeadline } from "@/components/motion/ReplayHeadline";

export const metadata: Metadata = {
  alternates: { canonical: "/parents" },
  title: "The Guardian",
  description: "For parents: admissions in five steps, fees and answers, and the planned parent app (stall-cam, gate alerts, milestone reels).",
};

export default function ParentsPage() {
  return (
    <>
      <ParentsTitle />
      <PinnedPhone />
      <ParentVantageGallery />
      <MorningCurtain />
      <HorizontalChapter typeface="elegant" chapter="A parent's view" text="Watch who they are becoming." />
      <HoofPath />
      <Receipt />
      <StandingOrders />
      <CadetAdmissionPortal />

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
      <ReplayHeadline typeface="brush" id="parents-replay" label="The guardian vow" text="You watch them discover who they are." tone="dark" defaultMode="lines" />
      <EndCard current={9} />
    </>
  );
}
