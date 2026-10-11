import type { Metadata } from "next";
import Link from "next/link";
import { GateTitle, Gates } from "@/components/sections/contact/Gates";
import { entity } from "@/lib/content/site";

export const metadata: Metadata = {
  title: "The Gate · Contact",
  description: "Enrol a cadet, partner your campus or schedule a board audit with The Black Stallion Academy of Horsemanship.",
};

export default function ContactPage() {
  return (
    <>
      <GateTitle />
      <Gates />

      {/* §2 · Coordinates */}
      <section aria-label="Coordinates" className="gutter relative pb-[clamp(6rem,14vh,12rem)]">
        <dl className="grid gap-px bg-brass md:grid-cols-3">
          {[
            ["Headquarters", entity.city],
            ["Office", "Office of the Executive Chairman"],
            ["Hours", "Mon–Sat · 09:00–18:00 IST (sample)"],
          ].map(([k, v]) => (
            <div key={k} className="bg-night p-6">
              <dt className="label text-dust">{k}</dt>
              <dd className="t-voice mt-2 text-xl text-bone">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-10 text-center">
          <Link href="/legend" className="label text-gold hover:text-bone">
            The film begins again at reel one →
          </Link>
        </p>
      </section>
    </>
  );
}
