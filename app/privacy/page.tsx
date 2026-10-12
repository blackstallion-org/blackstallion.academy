import type { Metadata } from "next";
import Link from "next/link";
import { entity } from "@/lib/content/site";

export const metadata: Metadata = {
  title: "Privacy notice",
  description: "How The Black Stallion Academy of Horsemanship handles the details you send through this website.",
  alternates: { canonical: "/privacy" },
};

/** Version stored with every lead (see PRIVACY_NOTICE_VERSION in app/actions.ts). */
const VERSION = "2026-10-draft";

const sections: { h: string; p: string[] }[] = [
  {
    h: "Who we are",
    p: [
      `${entity.operator} ("BSAH", "we") operates this website, a company of ${entity.parent}, ${entity.city}. We are the data fiduciary for the details you send us here.`,
    ],
  },
  {
    h: "What we collect, and why",
    p: [
      "Only what you type into an enquiry form: your name, email and/or phone, and the details the form asks for (for example a student's name and age, a target zone and tier, an institution's name and location, acreage, capacity, a proposed audit date).",
      "We use these details for one purpose: to reply to your enquiry and, if you go ahead, to arrange a visit, an assessment or a board presentation. We do not sell them, rent them, or use them for advertising.",
      "The website has no advertising or tracking cookies. If you switch sound on, that choice is remembered in your own browser only.",
    ],
  },
  {
    h: "Children's details",
    p: [
      "Enquiries about a child must be made by a parent or legal guardian. By submitting the cadet enrolment form you confirm you are the child's parent or guardian and consent to us using the child's name and age to respond to your enquiry. We ask for no other information about a child on this website.",
    ],
  },
  {
    h: "Where it is stored and who can see it",
    p: [
      "Enquiries are stored in a secured database (Supabase, hosted in the Mumbai region). Visitors can only add an enquiry; they can never read one back. Only authorised BSAH operations staff can view enquiries, and every change to a record is logged.",
      "We may use service providers (hosting, e-mail) who process data only on our instructions.",
    ],
  },
  {
    h: "How long we keep it",
    p: [
      "Enquiries that do not lead to an enrolment or partnership are deleted after 12 months (proposed period, to be confirmed). Records of enrolled cadets are kept for as long as the cadet is with BSAH and as required by law.",
    ],
  },
  {
    h: "Your rights",
    p: [
      "You may ask to see, correct or delete the details you sent us, withdraw your consent, or nominate someone to act for you, as provided by India's Digital Personal Data Protection Act, 2023. Write to the address below; we will respond within 30 days.",
    ],
  },
  {
    h: "Contact and grievances",
    p: [
      "Grievance officer (to be appointed): privacy@blackstallion.academy, Office of the Executive Chairman, " + entity.city + ".",
      "If you are not satisfied with our response you may approach the Data Protection Board of India.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <article className="gutter mx-auto max-w-3xl pb-[clamp(6rem,14vh,12rem)] pt-32">
      <p className="label text-brass">Privacy notice · version {VERSION}</p>
      <h1 className="t-voice mt-4 text-display-2 text-bone">How we handle your details.</h1>
      <p role="note" className="mt-6 border border-blood/60 p-4 text-sm text-sand">
        Draft for review by BSAH&apos;s legal counsel before launch. The retention period and grievance officer are placeholders.
      </p>
      {sections.map((s) => (
        <section key={s.h} className="mt-12">
          <h2 className="t-voice text-2xl text-bone">{s.h}</h2>
          {s.p.map((t) => (
            <p key={t} className="mt-4 leading-relaxed text-sand">
              {t}
            </p>
          ))}
        </section>
      ))}
      <p className="mt-16">
        <Link href="/contact" className="label text-gold hover:text-bone">
          ← Back to the gate
        </Link>
      </p>
    </article>
  );
}
