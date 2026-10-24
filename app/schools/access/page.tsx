import type { Metadata } from "next";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { readTrusteeSession, TRUSTEE_COOKIE } from "@/lib/security/trustee";
import { AccessForm } from "./AccessForm";
import { lockInstitution } from "./actions";
import { TrusteeProposal } from "./proposal";

export const metadata: Metadata = {
  alternates: { canonical: "/schools/access" }, title: "Sovereign Access · Institutional Invitation", robots: { index: false, follow: false } };

export default function AccessPage() {
  return <section className="tone-dark gutter min-h-screen bg-night py-32"><Suspense fallback={<p role="status" className="text-sand">Preparing institutional access…</p>}><InstitutionalAccess /></Suspense></section>;
}

async function InstitutionalAccess() {
  await connection();
  const invite = readTrusteeSession((await cookies()).get(TRUSTEE_COOKIE)?.value);
  if (!invite) return <><p className="label text-brass">For invited trustees & principals</p><h1 className="t-voice mt-5 text-[clamp(2rem,6vw,4.5rem)] leading-tight text-bone">Sovereign Access</h1><AccessForm /></>;
  return <><div className="flex flex-wrap items-start justify-between gap-6"><div><p className="label text-brass">Private institutional proposal</p><h1 className="t-voice mt-4 text-[clamp(2rem,5vw,4rem)] text-bone">{invite.institution}</h1></div><form action={lockInstitution}><button className="label border border-brass px-5 py-3 text-gold">Lock & sign out</button></form></div><TrusteeProposal institution={invite.institution} /></>;
}
