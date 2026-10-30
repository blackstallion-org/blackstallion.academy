import Link from "next/link";
import { connection } from "next/server";
import { signOut } from "@/app/admin/actions";
import { ENQUIRY_KIND_LABEL, KINDS, STATUS_LABEL, type MemberKind } from "@/lib/accounts/kinds";
import { requireMember } from "@/lib/accounts/server";
import { formatDateTimeIST } from "@/lib/admin/present";
import { logAdminError } from "@/lib/admin/server";
import { ProfileForm } from "./forms";

type Enquiry = { id: string; lead_type: string; gate: string | null; progress: string; created_at: string };

/** What each kind sees first: a short, honest list of next steps and where to read more. No promises about outcomes. */
const NEXT_STEPS: Record<MemberKind, { title: string; steps: readonly { text: string; href?: string; link?: string }[] }> = {
  student: {
    title: "Your riding journey",
    steps: [
      { text: "Read how a first lesson works and what a cadet wears.", href: "/cadets", link: "Cadets" },
      { text: "See how safety is taught before speed.", href: "/safety", link: "Safety" },
      { text: "Ask a parent or guardian to send an enquiry so a place can be planned.", href: "/contact", link: "Enquire" },
    ],
  },
  parent: {
    title: "For your family",
    steps: [
      { text: "Read what parents are told before the first ride.", href: "/parents", link: "Parents" },
      { text: "See how the horses and the arena are checked.", href: "/safety", link: "Safety" },
      { text: "Send an enquiry for a visit; its progress appears below.", href: "/contact", link: "Enquire" },
    ],
  },
  teacher: {
    title: "For your classroom",
    steps: [
      { text: "Read how the programme fits a school week.", href: "/curriculum", link: "Curriculum" },
      { text: "Learn how a school partnership works.", href: "/schools", link: "Schools" },
      { text: "Tell your head of school; they can request the agreement.", href: "/schools/mou", link: "School agreement" },
    ],
  },
  school: {
    title: "For your school",
    steps: [
      { text: "Read how the partnership works for a school.", href: "/schools", link: "Schools" },
      { text: "Request the school agreement draft.", href: "/schools/mou", link: "School agreement" },
      { text: "Book a conversation with the academy team.", href: "/contact", link: "Contact" },
    ],
  },
};

const STATUS_NOTE: Record<string, string> = {
  pending: "The academy team is checking your details. You can sign in and edit them while you wait; some pages open once you are active.",
  suspended: "Your account is on hold. Please contact the academy to find out why and how to restore it.",
};

export default async function AccountPage() {
  await connection();
  const { supabase, user, member } = await requireMember();
  if (!member) {
    return (
      <div className="max-w-xl">
        <p className="label text-brass">Your account</p>
        <h1 className="t-voice mt-4 text-[clamp(2rem,5vw,3.5rem)] leading-tight text-bone">No member details yet</h1>
        <p className="t-story mt-4 text-sand">This sign-in ({user.email}) is not linked to a student, parent, teacher or school profile. Create an account from the sign-in page, or contact the academy.</p>
        <form action={signOut} className="mt-8"><button className="label border border-line px-6 py-4 text-bone hover:border-gold hover:text-gold">Sign out</button></form>
      </div>
    );
  }
  const info = KINDS[member.kind];
  const next = NEXT_STEPS[member.kind];
  const { data, error } = await supabase.rpc("my_enquiries");
  if (error) logAdminError("account.enquiries_failed", error);
  const enquiries = (error || !Array.isArray(data) ? [] : data) as Enquiry[];

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-start justify-between gap-6 border-b border-line pb-6">
        <div>
          <p className="label text-brass">{info.label} account</p>
          <h1 className="t-voice mt-3 text-[clamp(2rem,5vw,3.5rem)] leading-tight text-bone">Welcome, {member.full_name.split(" ")[0]}</h1>
          <p className="t-ui mt-2 text-sm text-dust">{member.email ?? user.email}{member.organisation ? ` · ${member.organisation}` : ""}{member.city ? ` · ${member.city}` : ""}</p>
        </div>
        <div className="flex flex-col items-start gap-3 sm:items-end">
          <span className="label inline-block border border-line px-3 py-1 text-gold" aria-label={`Status: ${STATUS_LABEL[member.status]}`}>{STATUS_LABEL[member.status]}</span>
          <form action={signOut}><button className="label border-b border-line pb-1 text-sand hover:border-gold hover:text-gold">Sign out</button></form>
        </div>
      </div>

      {STATUS_NOTE[member.status] && <p role="status" className="t-story mt-6 border-l border-gold pl-4 text-sand">{STATUS_NOTE[member.status]}</p>}

      <div className="mt-10 grid gap-12 lg:grid-cols-[1.1fr_1fr]">
        <section aria-labelledby="next-h">
          <h2 id="next-h" className="label text-gold">{next.title}</h2>
          <ol className="mt-5 flex flex-col">
            {next.steps.map((s, i) => (
              <li key={s.text} className="flex gap-4 border-t border-line py-4">
                <span className="font-mono text-xs text-brass" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                <span className="t-story text-sand">
                  {s.text}{" "}
                  {s.href && <Link href={s.href} className="label whitespace-nowrap text-gold underline underline-offset-4 hover:text-bone">{s.link}</Link>}
                </span>
              </li>
            ))}
          </ol>

          <h2 className="label mt-12 text-gold">Your enquiries</h2>
          {enquiries.length ? (
            <ul className="mt-5 flex flex-col">
              {enquiries.map((e) => (
                <li key={e.id} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-t border-line py-4">
                  <span className="t-story text-bone">{ENQUIRY_KIND_LABEL[e.lead_type] ?? "Enquiry"}</span>
                  <span className="label text-gold">{e.progress}</span>
                  <span className="t-ui text-xs text-dust"><time dateTime={e.created_at}>{formatDateTimeIST(e.created_at)}</time></span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="t-ui mt-5 border-t border-line pt-4 text-sm text-dust">
              Enquiries sent with {user.email} appear here once the address is confirmed. None yet. <Link href="/contact" className="text-gold underline underline-offset-4 hover:text-bone">Send one</Link>.
            </p>
          )}
        </section>

        <section aria-labelledby="details-h">
          <h2 id="details-h" className="label text-gold">Your details</h2>
          <div className="mt-5"><ProfileForm kind={member.kind} values={{ full_name: member.full_name, phone: member.phone, organisation: member.organisation, city: member.city, details: member.details }} /></div>
        </section>
      </div>
    </div>
  );
}
