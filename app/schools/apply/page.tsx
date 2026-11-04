import type { Metadata } from "next";
import { ApplyPage } from "@/lib/registration/apply-page";

export const metadata: Metadata = { title: "Schools and institutions · apply" };

export default async function Page({ searchParams }: PageProps<"/schools/apply">) {
  const sp = await searchParams;
  return (
    <ApplyPage kind="school" eyebrow="Schools and institutions" title="Partner as" voice="a campus hub." application={typeof sp.application === "string" ? sp.application : undefined}
      lead="Applications must come from a person authorised by the school. We confirm the school through its official e-mail address before any agreement is discussed." />
  );
}
