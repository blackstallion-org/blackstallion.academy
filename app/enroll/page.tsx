import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { AddChildForm, ApplicationForm, Steps } from "@/components/registration/ApplyForms";
import { Panel, RegistrationFrame } from "@/components/registration/Frame";
import { ageOn, CADET_STEPS, isEditable, type ApplicationStatus } from "@/lib/registration/model";
import { requireAccount } from "@/lib/registration/server";

export const metadata: Metadata = { title: "Enrol a cadet" };

type Child = { id: string; first_name: string; last_name: string; date_of_birth: string; cadet_id: string | null };

/**
 * Enrolment, step 1 and 2: the guardian adds the child (a record on the guardian's account; children never log in) and fills
 * the application. A draft is saved, then documents, consent and submission happen on the application's own page.
 */
export default async function EnrollPage({ searchParams }: PageProps<"/enroll">) {
  await connection();
  const { supabase } = await requireAccount("/enroll");
  const sp = await searchParams;
  const editId = typeof sp.application === "string" ? sp.application : undefined;
  const [childrenRes, programsRes, hubsRes, editRes] = await Promise.all([
    supabase.from("guardian_children").select("id, first_name, last_name, date_of_birth, cadet_id").order("created_at"),
    supabase.from("programs").select("id, name, min_age, max_age").eq("active", true).order("name"),
    supabase.from("school_hubs").select("id, school_name").order("school_name").limit(200),
    editId ? supabase.from("applications").select("id, status, child_id, program_id, hub_id, payload").eq("id", editId).eq("kind", "cadet").maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const children = (childrenRes.data ?? []) as Child[];
  const programs = (programsRes.data ?? []).map((p) => ({ id: p.id as string, label: `${p.name} (ages ${p.min_age} to ${p.max_age})` }));
  const hubs = (hubsRes.data ?? []).map((h) => ({ id: h.id as string, label: String(h.school_name) }));
  const edit = editRes.data && isEditable(editRes.data.status as ApplicationStatus) ? editRes.data : null;
  const initial = edit ? { child_id: edit.child_id, program_id: edit.program_id, hub_id: edit.hub_id ?? "", ...Object.fromEntries(Object.entries(edit.payload ?? {}).map(([k, v]) => [k, String(v)])) } : undefined;
  const open = children.filter((c) => !c.cadet_id);

  return (
    <RegistrationFrame eyebrow="Parents and guardians" title="Enrol" voice="a cadet."
      lead={<p>Add your child, choose a programme and a campus, then upload a proof of age and submit. You can save and come back at any time; nothing is sent to the academy until you submit.</p>}>
      <Steps steps={CADET_STEPS} current={children.length ? 1 : 0} />

      <div className="mt-12 flex flex-col gap-14">
        <Panel title="1 · Your children" id="children-h">
          {children.length ? (
            <ul className="mb-8 divide-y divide-line border-y border-line">
              {children.map((c) => (
                <li key={c.id} className="flex flex-wrap items-baseline justify-between gap-3 py-3">
                  <span className="t-ui text-bone">{c.first_name} {c.last_name}</span>
                  <span className="t-ui text-sm text-dust">{ageOn(c.date_of_birth)} years{c.cadet_id ? " · enrolled" : ""}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="t-ui mb-6 text-sm text-dust">No children on your account yet. Add the first one below.</p>
          )}
          <details open={!children.length} className="group">
            <summary className="label cursor-pointer text-gold hover:text-bone">{children.length ? "Add another child" : "Add a child"}</summary>
            <div className="mt-6"><AddChildForm /></div>
          </details>
        </Panel>

        <Panel title="2 · Programme and details" id="details-h">
          {!open.length ? (
            <p className="t-ui text-sm text-dust">Add a child first.</p>
          ) : !programs.length ? (
            <p className="t-ui text-sm text-dust">No programme is open for enrolment at the moment. Please check back soon.</p>
          ) : (
            <ApplicationForm kind="cadet" childOptions={open.map((c) => ({ id: c.id, label: `${c.first_name} ${c.last_name}` }))} programs={programs} hubs={hubs} initial={initial as Record<string, string> | undefined} applicationId={edit?.id} />
          )}
        </Panel>
      </div>
      <p className="t-ui mt-14 text-sm text-dust"><Link href="/enroll/status" className="text-gold underline underline-offset-4">Your applications</Link> · <Link href="/sovereign" className="text-gold underline underline-offset-4">Your dashboard</Link></p>
    </RegistrationFrame>
  );
}
