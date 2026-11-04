import type { Metadata } from "next";
import { ApplyPage } from "@/lib/registration/apply-page";

export const metadata: Metadata = { title: "Instructors and staff · apply" };

export default async function Page({ searchParams }: PageProps<"/careers/apply">) {
  const sp = await searchParams;
  return (
    <ApplyPage kind="staff" eyebrow="Instructors and staff" title="Ride with" voice="the academy." application={typeof sp.application === "string" ? sp.application : undefined}
      lead="Tell us about your experience and upload your CV. Shortlisted applicants are interviewed and checked; access to the field apps is given only after you are appointed." />
  );
}
