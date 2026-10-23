import type { Metadata } from "next";
import { CommandExperience } from "@/components/sections/command/CommandExperience";

export const metadata: Metadata = {
  alternates: { canonical: "/command" },
  title: "Information desk",
  description: "Published information about enrolment, programmes, campus partnerships, safety and curriculum.",
};

export default function CommandPage() {
  return <CommandExperience />;
}
