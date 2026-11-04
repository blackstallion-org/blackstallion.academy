import Link from "next/link";
import type { ReactNode } from "react";

/** The frame every registration page shares: the eyebrow, a two-voice title, an optional lead and the content. */
export function RegistrationFrame({ eyebrow, title, voice, lead, children, back }: { eyebrow: string; title: string; voice?: string; lead?: ReactNode; children: ReactNode; back?: { href: string; label: string } }) {
  return (
    <div className="mx-auto w-full max-w-4xl">
      {back && <p className="mb-8"><Link href={back.href} className="label text-gold hover:text-bone">← {back.label}</Link></p>}
      <p className="label text-brass">{eyebrow}</p>
      <h1 className="mt-4 text-balance">
        <span className="t-inscribe block text-[clamp(1.6rem,3.6vw,2.6rem)] uppercase tracking-[0.08em] text-bone">{title}</span>
        {voice && <span className="t-voice mt-1 block text-[clamp(2rem,5vw,3.6rem)] leading-[1.05] text-gold">{voice}</span>}
      </h1>
      {lead && <div className="t-story mt-6 max-w-2xl text-sand">{lead}</div>}
      <div className="mt-12">{children}</div>
    </div>
  );
}

export function Panel({ title, children, id }: { title: string; children: ReactNode; id?: string }) {
  return (
    <section aria-labelledby={id} className="border-t border-line pt-8">
      <h2 id={id} className="label text-bone">{title}</h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}
