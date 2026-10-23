import { Suspense } from "react";
import { connection } from "next/server";
import { requireStaff } from "@/lib/auth/admin";
import { gateTitle } from "@/lib/email/templates";
import { setLeadStatus } from "./actions";
import { AdminNav } from "./AdminNav";

export default function AdminHome() {
  return <Suspense fallback={<p role="status" className="text-sand">Loading enquiries…</p>}><Leads /></Suspense>;
}

const statuses = ["new", "reviewing", "contacted", "qualified", "closed", "rejected"];
type Lead = { id: string; lead_type: string; gate: string | null; status: string; contact_name: string; email: string | null; phone: string | null; payload: Record<string, string>; attribution: Record<string, string> | null; created_at: string };

async function Leads() {
  await connection();
  const { supabase, profile } = await requireStaff();
  const { data, error } = await supabase
    .from("onboarding_leads")
    .select("id, lead_type, gate, status, contact_name, email, phone, payload, attribution, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  const leads = (data ?? []) as Lead[];
  return (
    <div>
      <AdminNav name={profile.display_name} current="leads" />
      <h1 className="t-voice mt-8 text-[clamp(1.8rem,4vw,3rem)] text-bone">Enquiries</h1>
      {error && <p role="alert" className="mt-4 text-blood">Enquiries could not be loaded. Try again shortly.</p>}
      {!error && !leads.length && <p className="t-ui mt-6 text-sand">No enquiries yet.</p>}
      <ul className="mt-8 divide-y divide-line border-y border-line">
        {leads.map((l) => (
          <li key={l.id} className="grid gap-3 py-5 md:grid-cols-[1fr_auto] md:items-start">
            <div className="min-w-0">
              <p className="label text-brass">{gateTitle(l.gate ?? "generic")} · <time dateTime={l.created_at}>{new Date(l.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" })}</time></p>
              <p className="t-ui mt-1 text-bone">{l.contact_name}{l.payload?.organisation ? ` · ${l.payload.organisation}` : ""}</p>
              <p className="t-ui text-sm text-sand">{[l.email, l.phone].filter(Boolean).join(" · ")}</p>
              {l.payload?.message && <p className="t-ui mt-2 max-w-3xl whitespace-pre-wrap text-sm text-sand">{l.payload.message}</p>}
              {l.attribution && Object.keys(l.attribution).length > 0 && <p className="font-mono mt-2 text-[0.7rem] text-dust">{Object.entries(l.attribution).map(([k, v]) => `${k}=${v}`).join(" · ")}</p>}
            </div>
            <form action={setLeadStatus} className="flex items-center gap-2">
              <input type="hidden" name="id" value={l.id} />
              <label className="sr-only" htmlFor={`s-${l.id}`}>Status</label>
              <select id={`s-${l.id}`} name="status" defaultValue={l.status} className="field py-2 text-sm">{statuses.map((s) => <option key={s}>{s}</option>)}</select>
              <button className="label border border-line px-3 py-2 text-bone hover:border-gold">Save</button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
