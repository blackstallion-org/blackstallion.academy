import type { Metadata } from "next";
import Link from "next/link";
import { RegistrationFrame } from "@/components/registration/Frame";
import { APPLICATION_KINDS, KIND_INFO } from "@/lib/registration/model";

export const metadata: Metadata = {
  title: "Register",
  description: "Enrol a cadet, apply as a school, an instructor or a partner of the Black Stallion Academy.",
  alternates: { canonical: "/register" },
};

const STEPS = ["Create an account and confirm your e-mail", "Fill in the application", "Upload the documents it asks for", "Give your consent and submit", "Follow the review from your dashboard"];

/** The four ways in. Every one starts with an ordinary account; what you apply for never changes what the account can do. */
export default function RegisterPage() {
  return (
    <section data-parallax-skip className="gutter min-h-[80svh] bg-night pb-24 pt-28 md:pt-32">
      <RegistrationFrame eyebrow="Registration" title="Join the" voice="academy." lead={<p>Choose what you are applying for. You will need an account with a confirmed e-mail address; children never need one of their own, a parent or guardian applies for them.</p>}>
        <ul className="grid gap-px border border-line bg-line sm:grid-cols-2">
          {APPLICATION_KINDS.map((k) => (
            <li key={k} className="bg-night">
              <Link href={KIND_INFO[k].route} className="group flex h-full flex-col gap-3 p-6 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-gold">
                <span className="label text-gold group-hover:text-bone">{KIND_INFO[k].label}</span>
                <span className="t-ui text-sm leading-relaxed text-sand">{KIND_INFO[k].blurb}</span>
                <span className="label mt-auto text-dust group-hover:text-gold">Start →</span>
              </Link>
            </li>
          ))}
        </ul>
        <ol className="mt-14 grid gap-4 sm:grid-cols-5" aria-label="How registration works">
          {STEPS.map((s, i) => (
            <li key={s} className="border-t border-line pt-4">
              <span className="font-mono text-xs text-brass">{String(i + 1).padStart(2, "0")}</span>
              <p className="t-ui mt-2 text-sm text-sand">{s}</p>
            </li>
          ))}
        </ol>
        <p className="t-ui mt-12 text-sm text-dust">Already applied? <Link href="/enroll/status" className="text-gold underline underline-offset-4">See your applications</Link> or <Link href="/login" className="text-gold underline underline-offset-4">sign in</Link>.</p>
      </RegistrationFrame>
    </section>
  );
}
