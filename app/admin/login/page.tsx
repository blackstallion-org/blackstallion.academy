import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SignUpForm } from "@/app/account/forms";
import Image from "next/image";
import { FilmImage } from "@/components/film/FilmImage";
import { KINDS, MEMBER_KINDS, type MemberKind } from "@/lib/accounts/kinds";
import { asset } from "@/lib/content/asset";
import type { MediaKey } from "@/lib/content/media";
import { safeNext } from "@/lib/registration/model";
import { GoogleButton, SignInForm } from "../forms";
import { EntryHeader } from "../EntryHeader";

const reasons: Record<string, string> = {
  forbidden: "That account does not have staff access.",
  unconfigured: "Sign-in is not configured on this deployment yet.",
  link: "That link has expired or was already used. Request a new one.",
  oauth: "Google sign-in could not be completed. Please try again, or use your e-mail.",
  profile: "That account is not set up yet. Please contact the academy.",
  rate: "Too many attempts. Please wait fifteen minutes.",
};

/** One still per kind of member: the four doors into the academy. */
const stills: Record<MemberKind, MediaKey> = {
  student: "cadetRohan",
  parent: "parentsRail",
  teacher: "safetyInstructor",
  school: "schoolAerial",
};

export const metadata: Metadata = { title: "Join or sign in", alternates: { canonical: null } };

type Search = { e?: string; mode?: string; kind?: string; next?: string; method?: string };

/**
 * One page, two doors, one at a time (4 Nov 2026: a split screen, the form on the left and a clear photograph on the right, with
 * no wash over the picture). "Sign in" and "Join now" are plain links, so the page works without JavaScript; both forms post to
 * the same server actions as before. Joining first asks who is joining (the four doors), then shows the form for that kind.
 */
export default function LoginPage({ searchParams }: { searchParams: Promise<Search> }) {
  return (
    <div className="grid min-h-[100svh] lg:grid-cols-2">
      <div className="gutter flex flex-col pb-16 lg:pr-[clamp(2rem,5vw,5rem)]">
        <EntryHeader />
        <div className="mx-auto w-full max-w-md flex-1">
          <Suspense fallback={null}><Reason searchParams={searchParams} /></Suspense>
          <Suspense fallback={null}><Doors searchParams={searchParams} /></Suspense>
        </div>
        <p className="label mt-12 text-center text-dust">Black Stallion Academy of Horsemanship</p>
      </div>
      <aside aria-hidden="true" className="relative hidden p-4 lg:block">
        {/* A clear photograph: no gradient, no card, no text over it. */}
        <div className="relative h-full min-h-[calc(100svh-2rem)] overflow-hidden bg-umber">
          <Image src={asset("/images/academy-uniforms/ceremonial-reference.webp")} alt="" fill preload sizes="50vw" className="object-cover object-top" />
        </div>
        <p className="label absolute bottom-6 right-8 text-dust">Sample cadet · AI placeholder</p>
      </aside>
    </div>
  );
}

async function Reason({ searchParams }: { searchParams: Promise<Search> }) {
  const { e } = await searchParams;
  return e && reasons[e] ? <p role="alert" className="t-ui mb-8 text-center text-sm text-blood">{reasons[e]}</p> : null;
}

async function Doors({ searchParams }: { searchParams: Promise<Search> }) {
  const { mode, kind, next } = await searchParams;
  const create = mode === "create";
  const safe = safeNext(next, "") || undefined;
  const chosen = MEMBER_KINDS.find((k) => k === kind);
  const nextQ = safe ? `&next=${encodeURIComponent(safe)}` : "";
  const tab = (active: boolean) => `label flex-1 border-b-2 py-3 text-center ${active ? "border-gold text-gold" : "border-line text-sand hover:text-bone"}`;
  return (
    <>
      <nav aria-label="Join or sign in" className="mb-10 flex">
        <Link href={safe ? `/admin/login?next=${encodeURIComponent(safe)}` : "/admin/login"} aria-current={create ? undefined : "page"} className={tab(!create)}>Sign in</Link>
        <Link href={`/admin/login?mode=create${nextQ}`} aria-current={create ? "page" : undefined} className={tab(create)}>Join now</Link>
      </nav>

      {create ? (
        <section aria-labelledby="join-title">
          {chosen ? (
            <>
              <h1 id="join-title" className="t-inscribe text-center text-[clamp(1.1rem,2vw,1.5rem)] uppercase tracking-[0.2em] text-bone">Create your account</h1>
              <p className="t-ui mx-auto mt-4 max-w-sm text-center text-sm text-sand">Tell us who you are and we only ask what applies.</p>
              <div className="mx-auto mt-8 flex w-full max-w-sm flex-col items-stretch gap-3">
                <GoogleButton next={safe} label="Sign up with Google" />
                <p className="label my-3 flex items-center gap-4 text-dust before:h-px before:flex-1 before:bg-line after:h-px after:flex-1 after:bg-line">or with e-mail</p>
              </div>
              <div className="w-full"><SignUpForm key={chosen} initialKind={chosen} /></div>
              <p className="t-ui mt-8 text-center text-sm text-dust"><Link href={`/admin/login?mode=create${nextQ}`} className="text-gold underline underline-offset-4 hover:text-bone">Back</Link></p>
            </>
          ) : (
            <>
              <h1 id="join-title" className="t-inscribe text-center text-[clamp(1.1rem,2vw,1.5rem)] uppercase tracking-[0.2em] text-bone">Who is joining?</h1>
              <ul className="mt-8 grid grid-cols-2 gap-x-5 gap-y-8">
                {MEMBER_KINDS.map((k) => (
                  <li key={k}>
                    <Link href={`/admin/login?mode=create&kind=${k}${nextQ}`} className="group block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold">
                      <span className="relative block aspect-[2/1] overflow-hidden bg-umber">
                        <FilmImage name={stills[k]} sizes="(min-width: 1024px) 14rem, 45vw" className="transition-transform duration-[1200ms] group-hover:scale-[1.05]" />
                      </span>
                      <span className="label mt-3 block text-bone group-hover:text-gold">{KINDS[k].label}</span>
                      <span className="t-ui mt-1 block text-xs leading-snug text-dust">{KINDS[k].blurb}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      ) : (
        <section aria-labelledby="signin-title">
          <h1 id="signin-title" className="t-inscribe text-center text-[clamp(1.1rem,2vw,1.5rem)] uppercase tracking-[0.2em] text-bone">Welcome back</h1>
          <p className="t-ui mx-auto mt-4 max-w-sm text-center text-sm text-sand">Students, parents, teachers, schools and academy staff sign in here.</p>
          <div className="mx-auto mt-6 w-full max-w-sm"><SignInForm next={safe} /></div>
          <div className="mx-auto mt-6 flex w-full max-w-sm flex-col gap-6">
            <p className="label flex items-center gap-4 text-dust before:h-px before:flex-1 before:bg-line after:h-px after:flex-1 after:bg-line">or</p>
            <GoogleButton next={safe} />
          </div>
          <p className="mt-8 text-center"><Link href="/admin/reset" className="label inline-block border-b border-line pb-1 text-gold hover:border-gold hover:text-bone">Forgot your password?</Link></p>
          <p className="t-ui mt-8 text-center text-sm text-dust">New to the academy? <Link href={`/admin/login?mode=create${nextQ}`} className="text-gold underline underline-offset-4 hover:text-bone">Join now</Link></p>
          <p className="t-ui mx-auto mt-6 max-w-sm text-center text-xs leading-relaxed text-dust">By continuing you agree that the academy may store your details to run your account, as described in the <Link href="/privacy" className="text-gold underline underline-offset-2 hover:text-bone">privacy notice</Link>.</p>
        </section>
      )}
    </>
  );
}
