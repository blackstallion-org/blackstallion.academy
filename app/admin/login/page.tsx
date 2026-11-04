import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SignUpForm } from "@/app/account/forms";
import { FilmImage } from "@/components/film/FilmImage";
import { KINDS, MEMBER_KINDS, type MemberKind } from "@/lib/accounts/kinds";
import type { MediaKey } from "@/lib/content/media";
import { SignInForm } from "../forms";

const reasons: Record<string, string> = {
  forbidden: "That account does not have staff access.",
  unconfigured: "Sign-in is not configured on this deployment yet.",
  link: "That link has expired or was already used. Request a new one.",
};

/** One still per kind of member: the four doors into the academy. */
const stills: Record<MemberKind, MediaKey> = {
  student: "cadetRohan",
  parent: "parentsRail",
  teacher: "safetyInstructor",
  school: "schoolAerial",
};

export const metadata: Metadata = { title: "Join or sign in", alternates: { canonical: null } };

type Search = { e?: string; mode?: string; kind?: string };

/**
 * One page, two doors (the pattern of a members' club: "Not a member? Join now" beside "Already a member? Sign in").
 * Wide screens show both side by side; a phone shows one at a time behind a two-way switch. Every switch is a plain link,
 * so the page works without JavaScript, and both forms post to the same server actions as before.
 */
export default function LoginPage({ searchParams }: { searchParams: Promise<Search> }) {
  return (
    <div className="mx-auto w-full max-w-[1100px]">
      <Suspense fallback={null}><Reason searchParams={searchParams} /></Suspense>
      <Suspense fallback={null}><Doors searchParams={searchParams} /></Suspense>
      <p className="label mt-16 text-center text-dust">Black Stallion Academy of Horsemanship</p>
    </div>
  );
}

async function Reason({ searchParams }: { searchParams: Promise<Search> }) {
  const { e } = await searchParams;
  return e && reasons[e] ? <p role="alert" className="t-ui mb-8 text-center text-sm text-blood">{reasons[e]}</p> : null;
}

async function Doors({ searchParams }: { searchParams: Promise<Search> }) {
  const { mode, kind } = await searchParams;
  const create = mode === "create";
  const initial = MEMBER_KINDS.find((k) => k === kind) ?? "student";
  const tab = (active: boolean) =>
    `label flex-1 border-b-2 py-3 text-center ${active ? "border-gold text-gold" : "border-line text-sand hover:text-bone"}`;
  return (
    <>
      {/* Phones: one door at a time. */}
      <nav aria-label="Join or sign in" className="mb-10 flex lg:hidden">
        <Link href="/admin/login" aria-current={create ? undefined : "page"} className={tab(!create)}>Sign in</Link>
        <Link href="/admin/login?mode=create" aria-current={create ? "page" : undefined} className={tab(create)}>Join now</Link>
      </nav>

      <div className="grid gap-14 lg:grid-cols-[1fr_1px_1fr] lg:gap-16">
        <section aria-labelledby="join-title" className={create ? "block" : "hidden lg:block"}>
          {create ? (
            <>
              <h1 id="join-title" className="t-inscribe text-center text-[clamp(1.1rem,2vw,1.5rem)] uppercase tracking-[0.2em] text-bone">Create your account</h1>
              <p className="t-ui mx-auto mt-4 max-w-sm text-center text-sm text-sand">Tell us who you are and we only ask what applies.</p>
              <div className="mt-8 w-full"><SignUpForm key={initial} initialKind={initial} /></div>
              <p className="t-ui mt-8 text-center text-sm text-dust"><Link href="/admin/login" className="text-gold underline underline-offset-4 hover:text-bone">Back</Link></p>
            </>
          ) : (
            <>
              <h1 id="join-title" className="t-inscribe text-center text-[clamp(1.1rem,2vw,1.5rem)] uppercase tracking-[0.2em] text-bone">Not a member? Join now</h1>
              <p className="label mt-8 text-center text-brass">Who is joining</p>
              <ul className="mt-6 grid grid-cols-2 gap-x-5 gap-y-8">
                {MEMBER_KINDS.map((k) => (
                  <li key={k}>
                    <Link href={`/admin/login?mode=create&kind=${k}`} className="group block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold">
                      <span className="relative block aspect-[2/1] overflow-hidden bg-umber">
                        <FilmImage name={stills[k]} sizes="(min-width: 1024px) 20rem, 45vw" className="transition-transform duration-[1200ms] group-hover:scale-[1.05]" />
                      </span>
                      <span className="label mt-3 block text-bone group-hover:text-gold">{KINDS[k].label}</span>
                      <span className="t-ui mt-1 block text-xs leading-snug text-dust">{KINDS[k].blurb}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-10 text-center">
                <Link href="/admin/login?mode=create" className="label inline-block bg-gold px-12 py-4 text-night hover:bg-bone">Join now</Link>
              </div>
            </>
          )}
        </section>

        <div aria-hidden="true" className="hidden bg-line lg:block" />

        <section aria-labelledby="signin-title" className={`${create ? "hidden lg:block" : ""} lg:sticky lg:top-32 lg:self-start`}>
          <h2 id="signin-title" className="t-inscribe text-center text-[clamp(1.1rem,2vw,1.5rem)] uppercase tracking-[0.2em] text-bone">Already a member? Sign in</h2>
          <p className="t-ui mx-auto mt-4 max-w-sm text-center text-sm text-sand">Students, parents, teachers, schools and academy staff sign in here.</p>
          <div className="mx-auto mt-10 w-full max-w-sm"><SignInForm /></div>
          <p className="mt-8 text-center"><Link href="/admin/reset" className="label inline-block border-b border-line pb-1 text-gold hover:border-gold hover:text-bone">Forgot your password?</Link></p>
        </section>
      </div>
    </>
  );
}
