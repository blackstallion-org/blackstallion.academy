import Link from "next/link";

/** Shown for a malformed id or an enquiry that does not exist (or that RLS does not let this account read). */
export default function LeadNotFound() {
  return (
    <div className="max-w-xl">
      <p className="label text-brass">Staff console</p>
      <h1 className="t-voice mt-4 text-[clamp(1.8rem,4vw,3rem)] leading-tight text-bone">Enquiry not found</h1>
      <p className="t-ui mt-4 text-sm text-sand">No enquiry has this reference. It may have been mistyped, or it is not visible to your account.</p>
      <Link href="/admin/enquiries" className="label mt-8 inline-block py-2 text-gold hover:text-bone">← All enquiries</Link>
    </div>
  );
}
