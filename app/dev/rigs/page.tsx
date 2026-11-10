import { Suspense } from "react";
import type { Metadata } from "next";
import { RigBench } from "@/components/history-scroll/puppet/RigBench";

export const metadata: Metadata = { title: "Rig bench", robots: { index: false, follow: false } };

async function Bench({ searchParams }: { searchParams: Promise<{ only?: string }> }) {
  const { only } = await searchParams;
  return <RigBench only={only ?? null} />;
}

/** Development page: every history puppet, live, with its bones drawn over it. Not linked from the site. */
export default function RigsPage({ searchParams }: { searchParams: Promise<{ only?: string }> }) {
  return (
    <Suspense>
      <Bench searchParams={searchParams} />
    </Suspense>
  );
}
