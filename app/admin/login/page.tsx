import type { Metadata } from "next";
import { CrestMark } from "@/components/brand/CrestMark";
import Link from "next/link";
import { Suspense } from "react";
import { SignUpForm } from "@/app/account/forms";
import { SignInForm } from "../forms";

const reasons: Record<string, string> = {
  forbidden: "That account does not have staff access.",
  unconfigured: "Sign-in is not configured on this deployment yet.",
  link: "That link has expired or was already used. Request a new one.",
};

export const metadata: Metadata = { title: "Sign in or create an account", alternates: { canonical: null } };

type Search = { e?: string; mode?: string };

export default function LoginPage({ searchParams }: { searchParams: Promise<Search> }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center border-t border-line pt-12 text-center md:pt-16">
      <CrestMark className="h-20 w-20 text-gold" decorative />
      <p className="label mt-8 text-brass">Academy accounts</p>
      <h1 className="t-voice mt-4 text-[clamp(2.2rem,5vw,3.4rem)] leading-tight text-bone">Welcome to the academy</h1>
      <p className="t-story mt-4 max-w-sm text-sand">Students, parents, teachers and schools can create an account. Academy staff sign in here too.</p>
      <Suspense fallback={null}><Reason searchParams={searchParams} /></Suspense>
      <Suspense fallback={null}><Panel searchParams={searchParams} /></Suspense>
    </div>
  );
}

async function Reason({ searchParams }: { searchParams: Promise<Search> }) {
  const { e } = await searchParams;
  return e && reasons[e] ? <p role="alert" className="t-ui mt-6 text-sm text-blood">{reasons[e]}</p> : null;
}

/** Two views of one page: "Sign in" (default) and "Create an account" (?mode=create). Plain links, so both work without JavaScript. */
async function Panel({ searchParams }: { searchParams: Promise<Search> }) {
  const { mode } = await searchParams;
  const create = mode === "create";
  const tab = (active: boolean) => `label inline-block border-b py-2 ${active ? "border-gold text-gold" : "border-transparent text-sand hover:text-bone"}`;
  return (
    <>
      <nav aria-label="Sign in or create an account" className="mt-10 flex gap-8">
        <Link href="/admin/login" aria-current={create ? undefined : "page"} className={tab(!create)}>Sign in</Link>
        <Link href="/admin/login?mode=create" aria-current={create ? "page" : undefined} className={tab(create)}>Create an account</Link>
      </nav>
      {create ? (
        <div className="mt-8 w-full text-left"><SignUpForm /></div>
      ) : (
        <>
          <div className="mt-8 w-full max-w-sm text-left"><SignInForm /></div>
          <Link href="/admin/reset" className="label mt-8 inline-block border-b border-line pb-1 text-gold hover:border-gold hover:text-bone">Forgot your password?</Link>
          <p className="t-ui mt-8 text-sm text-dust">New here? <Link href="/admin/login?mode=create" className="text-gold underline underline-offset-4 hover:text-bone">Create an account</Link></p>
        </>
      )}
    </>
  );
}
