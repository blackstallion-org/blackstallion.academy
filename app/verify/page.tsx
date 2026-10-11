import type { Metadata } from "next";
import { EndCard } from "@/components/film/EndCard";
import { Headline } from "@/components/film/Headline";
import { Label } from "@/components/film/Marks";
import { Chain, VerifyTitle } from "@/components/sections/verify/VerifyScenes";
import { Verifier } from "@/components/sections/verify/Verifier";

export const metadata: Metadata = {
  title: "The Seal · Verify a passport",
  description: "Verify a BSAH cadet's rank, riding hours, hub and EFI registration from their Sovereign Passport code.",
};

export default function VerifyPage() {
  return (
    <>
      <VerifyTitle />

      <section aria-labelledby="verify-h" className="gutter relative py-[clamp(6rem,14vh,12rem)]">
        <Label>Verify a passport</Label>
        <Headline id="verify-h" className="mt-4" inscription="Enter" voice="the code." />
        <Verifier showSamples className="mt-12" />
      </section>

      <Chain />

      <section aria-labelledby="sees-h" className="gutter relative pb-[clamp(6rem,14vh,12rem)]">
        <Label>Privacy</Label>
        <Headline id="sees-h" className="mt-4" inscription="What a verifier" voice="sees." />
        <div className="mt-12 grid gap-px bg-brass md:grid-cols-2">
          <div className="bg-night p-8">
            <p className="label text-gold">Shown</p>
            <ul className="mt-5 flex flex-col gap-3">
              {["Name", "Rank", "Riding hours", "Hub", "EFI registration", "Milestones"].map((x) => (
                <li key={x} className="t-voice text-xl text-bone">
                  {x}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-night p-8">
            <p className="label text-white">Never shown</p>
            <ul className="mt-5 flex flex-col gap-3">
              {["Contact details", "Address", "Medical notes", "Payments"].map((x) => (
                <li key={x} className="t-voice text-xl text-sand/50 line-through decoration-1">
                  {x}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <EndCard current={11} />
    </>
  );
}
