import Link from "next/link";
import { Suspense } from "react";
import { SignInForm } from "../forms";

const reasons: Record<string, string> = {
  forbidden: "That account does not have staff access.",
  unconfigured: "Staff sign-in is not configured on this deployment yet.",
  link: "That link has expired or was already used. Request a new one.",
};

export default function LoginPage({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  return (
    <div className="max-w-xl">
      <p className="label text-brass">Staff console</p>
      <h1 className="t-voice mt-4 text-[clamp(2rem,5vw,3.5rem)] leading-tight text-bone">Sign in</h1>
      <p className="t-ui mt-4 text-sm text-sand">For academy staff only. Parents and schools do not need an account to enquire.</p>
      <Suspense fallback={null}><Reason searchParams={searchParams} /></Suspense>
      <div className="mt-10"><SignInForm /></div>
      <Link href="/admin/reset" className="label mt-8 inline-block text-gold hover:text-bone">Forgot your password?</Link>
    </div>
  );
}

async function Reason({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  const { e } = await searchParams;
  return e && reasons[e] ? <p role="alert" className="t-ui mt-6 text-sm text-blood">{reasons[e]}</p> : null;
}
