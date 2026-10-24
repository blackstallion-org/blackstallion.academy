import { CampusPlan } from "./CampusPlan";
import { LeadForm } from "@/components/sections/shared/LeadForm";



// Imported only by the authorized server branch; never embed confidential assets in public/.
export function TrusteeProposal({ institution }: { institution: string }) {
  return <div className="mt-12 space-y-12">
    <div className="max-w-3xl border-l border-gold pl-6"><h2 className="t-voice text-3xl text-gold">A campus partnership</h2><p className="mt-4 text-sand">Discussion proposal for {institution}: BSAH funds, builds and operates the equestrian hub; the school provides suitable land, access and utilities. Proposed school revenue share: 25–30% of gross cadet tuition, subject to due diligence and a signed agreement.</p><p className="mt-3 text-sm text-dust">Planning material for discussion. Site survey, safety review, final commercial terms and approvals are required before any commitment.</p></div>
    <section aria-labelledby="private-plan-h"><h2 id="private-plan-h" className="t-voice text-3xl text-bone">Campus arena · concept plan</h2><p className="mt-3 text-sm text-sand">Signature Hub · 1 acre · 8 stables. Illustrative plan, not an approved engineering drawing. Site-specific 3D blueprints will be supplied after the campus survey.</p><CampusPlan /></section>
    <section aria-labelledby="private-mou-h" className="max-w-3xl"><h2 id="private-mou-h" className="t-voice mb-8 text-3xl text-bone">Request your MoU discussion</h2><LeadForm gate="mou" hidden={{ organisation: institution }} submitLabel="Request MoU discussion" fallbackEmail="boards@blackstallion.academy" fields={[{ name: "name", label: "Trustee or principal name", required: true, autoComplete: "name" }, { name: "email", label: "Institutional email", type: "email", required: true }, { name: "phone", label: "Phone", type: "tel" }, { name: "message", label: "Preferred dates and campus requirements", type: "textarea", required: true }]} /></section>
  </div>;
}
