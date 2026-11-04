import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { signOut } from "@/app/admin/actions";
import { Panel, RegistrationFrame } from "@/components/registration/Frame";
import { formatDateTimeIST } from "@/lib/admin/present";
import { encodeQr, qrPath } from "@/lib/qr";
import { ageOn, KIND_INFO, STATUS_INFO, rupees, type ApplicationKind, type ApplicationStatus } from "@/lib/registration/model";
import { requireAccount } from "@/lib/registration/server";

export const metadata: Metadata = { title: "Sovereign dashboard" };

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://blackstallion.academy";

/** The cadet's digital ID: the passport code and a QR that opens the public verification page (minimal disclosure there). */
function CadetId({ name, code, rank }: { name: string; code: string; rank: string }) {
  const { d, size } = qrPath(encodeQr(`${SITE}/verify/${code}`));
  return (
    <figure className="flex items-center gap-5 border border-line p-5">
      <svg viewBox={`0 0 ${size} ${size}`} width={112} height={112} role="img" aria-label={`QR code that opens the verification page for ${code}`} className="shrink-0 bg-[#F3EDE2] p-1">
        <path d={d} fill="#171513" />
      </svg>
      <figcaption>
        <span className="label block text-gold">Cadet passport</span>
        <span className="t-voice mt-1 block text-2xl text-bone">{name}</span>
        <span className="font-mono mt-1 block text-sm text-sand">{code}</span>
        <span className="label mt-2 block text-dust">{rank.replace(/_/g, " ").toLowerCase()}</span>
        <Link href={`/verify/${code}`} className="label mt-3 inline-block text-gold hover:text-bone">Verification page →</Link>
      </figcaption>
    </figure>
  );
}

/**
 * The parent's dashboard ("Sovereign"): children, applications, enrolled cadets with their passport, payments and training
 * sessions. Every query runs as the signed-in parent, so the operations policies decide what exists (own cadets, own
 * payments, sessions of own cadets); nothing here widens access.
 */
export default async function SovereignPage() {
  await connection();
  const { supabase, account } = await requireAccount("/sovereign");
  const [childrenRes, appsRes, cadetsRes, paymentsRes, sessionsRes, enrolRes] = await Promise.all([
    supabase.from("guardian_children").select("id, first_name, last_name, date_of_birth, cadet_id").order("created_at"),
    supabase.from("applications").select("id, reference, kind, status, created_at").order("created_at", { ascending: false }).limit(20),
    supabase.from("cadets").select("id, first_name, last_name, passport_code, current_rank").eq("parent_id", account.id),
    supabase.from("payment_records").select("id, gateway_order_id, invoice_number, amount_paise, amount_paid, status, paid_at, created_at").eq("parent_id", account.id).order("created_at", { ascending: false }).limit(20),
    supabase.from("training_sessions").select("id, cadet_id, session_date, riding_score, ground_score, stable_score").order("session_date", { ascending: false }).limit(10),
    supabase.from("enrollments").select("cadet_id, status, enrolled_at, programs(name), school_hubs(school_name)"),
  ]);
  const children = childrenRes.data ?? [];
  const apps = (appsRes.data ?? []) as { id: string; reference: string; kind: ApplicationKind; status: ApplicationStatus; created_at: string }[];
  const cadets = cadetsRes.data ?? [];
  const payments = paymentsRes.data ?? [];
  const sessions = sessionsRes.data ?? [];
  const enrolments = new Map((enrolRes.data ?? []).map((e) => [e.cadet_id as string, e as unknown as { status: string; enrolled_at: string; programs: { name: string } | null; school_hubs: { school_name: string } | null }]));
  const cadetName = new Map(cadets.map((c) => [c.id as string, `${c.first_name}`]));
  const isParent = account.role === "PARENT";

  return (
    <RegistrationFrame eyebrow="Sovereign dashboard" title="Welcome," voice={account.full_name.split(" ")[0] || "member"}
      lead={<p>Your family&rsquo;s applications, cadets, payments and training in one place.{!account.email_confirmed && " Confirm your e-mail address (we sent you a link) before submitting an application."}</p>}>
      <div className="flex flex-wrap gap-3">
        <Link href="/enroll" className="label bg-gold px-6 py-3 text-night hover:bg-bone">Enrol a cadet</Link>
        <Link href="/register" className="label border border-line px-6 py-3 text-bone hover:border-gold">Other applications</Link>
        <form action={signOut}><button className="label border border-line px-6 py-3 text-dust hover:text-bone">Sign out</button></form>
      </div>

      <div className="mt-14 flex flex-col gap-14">
        {cadets.length > 0 && (
          <Panel title="Your cadets" id="cadets-h">
            <div className="grid gap-4 md:grid-cols-2">
              {cadets.map((c) => {
                const e = enrolments.get(c.id as string);
                return (
                  <div key={c.id as string}>
                    <CadetId name={`${c.first_name} ${c.last_name}`} code={String(c.passport_code)} rank={String(c.current_rank ?? "")} />
                    {e && <p className="t-ui mt-2 text-xs text-dust">{e.programs?.name ?? "Programme"}{e.school_hubs ? ` · ${e.school_hubs.school_name}` : ""} · {e.status} since {formatDateTimeIST(e.enrolled_at)}</p>}
                  </div>
                );
              })}
            </div>
          </Panel>
        )}

        <Panel title="Applications" id="apps-h">
          {apps.length ? (
            <ul className="divide-y divide-line border-y border-line">
              {apps.map((a) => (
                <li key={a.id}>
                  <Link href={`/enroll/status/${a.id}`} className="flex flex-wrap items-center justify-between gap-3 py-4 hover:bg-umber/20">
                    <span className="t-ui text-bone">{KIND_INFO[a.kind].label} <span className="font-mono text-xs text-dust">{a.reference}</span></span>
                    <span className="label text-gold">{STATUS_INFO[a.status].label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : <p className="t-ui text-sm text-dust">No applications yet.</p>}
        </Panel>

        {isParent && (
          <Panel title="Children on your account" id="children-h">
            {children.length ? (
              <ul className="grid gap-3 sm:grid-cols-2">
                {children.map((c) => (
                  <li key={c.id as string} className="border border-line p-4">
                    <span className="t-ui block text-bone">{c.first_name} {c.last_name}</span>
                    <span className="t-ui text-xs text-dust">{ageOn(String(c.date_of_birth))} years · {c.cadet_id ? "enrolled" : "not enrolled yet"}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="t-ui text-sm text-dust">None yet. <Link href="/enroll" className="text-gold underline underline-offset-4">Add a child</Link>.</p>}
            <p className="t-ui mt-4 text-xs text-dust">Children do not have their own login: you manage their records and consents.</p>
          </Panel>
        )}

        <Panel title="Payments" id="payments-h">
          {payments.length ? (
            <ul className="divide-y divide-line border-y border-line">
              {payments.map((p) => (
                <li key={p.id as string} className="flex flex-wrap items-center justify-between gap-3 py-3 font-mono text-sm">
                  <span className="text-bone">{p.amount_paise ? rupees(p.amount_paise as number) : `₹${p.amount_paid}`}</span>
                  <span className="text-dust">{p.invoice_number ?? p.gateway_order_id}</span>
                  <span className={p.status === "PAID" ? "text-gold" : "text-dust"}>{String(p.status).toLowerCase()}{p.paid_at ? ` · ${formatDateTimeIST(p.paid_at as string)}` : ""}</span>
                </li>
              ))}
            </ul>
          ) : <p className="t-ui text-sm text-dust">No payments yet.</p>}
        </Panel>

        <Panel title="Training" id="training-h">
          {sessions.length ? (
            <ul className="divide-y divide-line border-y border-line">
              {sessions.map((s) => (
                <li key={s.id as string} className="flex flex-wrap items-center justify-between gap-3 py-3 t-ui text-sm">
                  <span className="text-bone">{cadetName.get(s.cadet_id as string) ?? "Cadet"} · {String(s.session_date)}</span>
                  <span className="font-mono text-dust">riding {s.riding_score ?? "–"} · ground {s.ground_score ?? "–"} · stable {s.stable_score ?? "–"}</span>
                </li>
              ))}
            </ul>
          ) : <p className="t-ui text-sm text-dust">Training sessions appear here once a cadet starts riding. The schedule is shared by the academy after enrolment.</p>}
        </Panel>
      </div>
    </RegistrationFrame>
  );
}
