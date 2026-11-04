import type { Metadata } from "next";
import { EndCard } from "@/components/film/EndCard";
import { Headline } from "@/components/film/Headline";
import { Label } from "@/components/film/Marks";
import { Chain, Privacy, VerifyTitle } from "@/components/sections/verify/VerifyScenes";
import { Verifier } from "@/components/sections/verify/Verifier";

export const metadata: Metadata = {
  alternates: { canonical: "/verify" },
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

      <Privacy />

      <EndCard current={12} />
    </>
  );
}
