import Link from "next/link";
import { connection } from "next/server";
import { ApplicationForm, Steps } from "@/components/registration/ApplyForms";
import { RegistrationFrame } from "@/components/registration/Frame";
import { isEditable, KIND_INFO, OTHER_STEPS, type ApplicationKind, type ApplicationStatus } from "@/lib/registration/model";
import { requireAccount } from "@/lib/registration/server";

/** The school, staff and partner application pages share this body; each route supplies its own words. */
export async function ApplyPage({ kind, eyebrow, title, voice, lead, application }: { kind: Exclude<ApplicationKind, "cadet">; eyebrow: string; title: string; voice: string; lead: string; application?: string }) {
  await connection();
  const { supabase } = await requireAccount(KIND_INFO[kind].route);
  const [{ data: existing }, editRes] = await Promise.all([
    supabase.from("applications").select("id, status").eq("kind", kind).not("status", "in", "(rejected,withdrawn)").maybeSingle(),
    application ? supabase.from("applications").select("id, status, payload").eq("id", application).eq("kind", kind).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const edit = editRes.data && isEditable(editRes.data.status as ApplicationStatus) ? editRes.data : null;
  const initial = edit ? Object.fromEntries(Object.entries(edit.payload ?? {}).map(([k, v]) => [k, String(v)])) : undefined;
  return (
    <RegistrationFrame eyebrow={eyebrow} title={title} voice={voice} lead={<p>{lead}</p>}>
      <Steps steps={OTHER_STEPS} current={0} />
      <div className="mt-12">
        {existing && !edit ? (
          <p className="t-ui text-sand">You already have an open {KIND_INFO[kind].label.toLowerCase()} application. <Link href={`/enroll/status/${existing.id}`} className="text-gold underline underline-offset-4">Continue it</Link>.</p>
        ) : (
          <ApplicationForm kind={kind} initial={initial} applicationId={edit?.id} />
        )}
      </div>
      <p className="t-ui mt-14 text-sm text-dust">Submitting an application gives your account no new access. If you are accepted, the academy activates the right access for you.</p>
    </RegistrationFrame>
  );
}
