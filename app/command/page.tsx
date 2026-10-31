import type { Metadata } from "next";
import { CommandExperience } from "@/components/sections/command/CommandExperience";
import { CommandHero } from "@/components/sections/command/CommandHero";

export const metadata: Metadata = {
  alternates: { canonical: "/command" },
  title: "The Command",
  description: "Published information about enrolment, programmes, campus partnerships, safety and curriculum.",
};

export default function CommandPage() {
  return (
    <>
      <CommandHero />
      <CommandExperience />
    </>
  );
}
