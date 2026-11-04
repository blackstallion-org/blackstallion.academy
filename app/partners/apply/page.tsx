import type { Metadata } from "next";
import { ApplyPage } from "@/lib/registration/apply-page";

export const metadata: Metadata = { title: "Partners and sponsors · apply" };

export default async function Page({ searchParams }: PageProps<"/partners/apply">) {
  const sp = await searchParams;
  return (
    <ApplyPage kind="partner" eyebrow="Partners and sponsors" title="Stand behind" voice="the circuit." application={typeof sp.application === "string" ? sp.application : undefined}
      lead="Tell us about your organisation and what you propose. Every enquiry is read by the Office of the Executive Chairman." />
  );
}
