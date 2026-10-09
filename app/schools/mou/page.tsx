import type { Metadata } from "next";
import Link from "next/link";
import { Headline } from "@/components/film/Headline";
import { Label } from "@/components/film/Marks";
import { MouGenerator } from "@/components/sections/schools/MouGenerator";

export const metadata: Metadata = {
  title: "Draft MOU",
  description: "Generate a draft memorandum of understanding for a BSAH hub on your campus.",
};

export default function MouPage() {
  return (
    <section aria-labelledby="mou-h" className="gutter relative pb-[clamp(6rem,14vh,12rem)] pt-28 md:pt-32">
      <Link href="/schools" className="label no-print text-sand hover:text-gold">
        ← The Citadel
      </Link>
      <div className="no-print mt-8">
        <Label reel={10}>For trustees</Label>
        <Headline id="mou-h" as="h1" size="1" animate="mount" className="mt-4" inscription="Draft the" voice="memorandum." />
        <p className="t-story mt-6 max-w-2xl text-sand">Type on the left; the draft writes itself on the right. Print it for your board, or send it to us and we&rsquo;ll prepare the full model.</p>
      </div>
      <div className="mt-14">
        <MouGenerator />
      </div>
    </section>
  );
}
