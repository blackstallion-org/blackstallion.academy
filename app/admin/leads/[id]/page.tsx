import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { connection } from "next/server";
import { requireStaff } from "@/lib/auth/admin";
import { gateTitle } from "@/lib/email/templates";
import { LEAD_ENTITY_TYPES } from "@/lib/admin/constants";
import { uuidSchema } from "@/lib/admin/filters";
import {
  attributionFields, auditActionLabel, auditDetails, formatDateTimeIST, mailHref, organisationOf, payloadFields, qrCode, staffLabel, statusLabel, telHref,
} from "@/lib/admin/present";
import { logAdminError, signDocumentPaths, staffNames } from "@/lib/admin/server";
import { AdminNav } from "../../AdminNav";
import { AssignToMeForm, LeadStatusForm } from "../../forms";
import { Fields, LoadError, QrBadge, Tag, type FieldItem } from "../../ui";

/*
 * Rendered whole per request (see app/admin/layout.tsx). An unknown or malformed id calls notFound(): the not-found
 * UI with noindex. Next answers it with status 200 here, because a dynamic segment is resumed from its partial
 * prerender shell (the same as /journal/[slug] on the public site); see docs/ADMIN_CONSOLE.md.
 */

type LeadRow = {
  id: string; lead_type: string; gate: string | null; status: string; contact_name: string; email: string | null; phone: string | null;
  payload: unknown; attribution: unknown; privacy_notice_version: string | null; consent_at: string | null; idempotency_key: string;
  assigned_to: string | null; created_at: string; updated_at: string | null;
};
type DocRow = { id: string; kind: string; title: string; storage_path: string; created_at: string };
type AuditRow = { id: number; actor_user_id: string | null; action: string; entity_type: string; entity_id: string | null; metadata: unknown; created_at: string };

const LEAD_COLUMNS =
  "id, lead_type, gate, status, contact_name, email, phone, payload, attribution, privacy_notice_version, consent_at, idempotency_key, assigned_to, created_at, updated_at";
const AUDIT_COLUMNS = "id, actor_user_id, action, entity_type, entity_id, metadata, created_at";
const EVENT_LIMIT = 100;

function Frame({ name, children }: { name: string; children: ReactNode }) {
  return (
    <div>
      <AdminNav name={name} current="leads" inside />
      <Link href="/admin" className="label mt-8 inline-block py-2 text-sand hover:text-gold">← All enquiries</Link>
      {children}
    </div>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="mt-12">
      <h2 id={id} className="label text-brass">{title}</h2>
      {children}
    </section>
  );
}

export default async function LeadPage({ params }: PageProps<"/admin/leads/[id]">) {
  await connection();
  const { supabase, profile, user } = await requireStaff();
  const parsed = uuidSchema.safeParse((await params).id);
  if (!parsed.success) notFound();
  const id = parsed.data;

  const { data: lead, error } = await supabase.from("onboarding_leads").select(LEAD_COLUMNS).eq("id", id).maybeSingle<LeadRow>();
  if (error) {
    logAdminError("admin.lead_load_failed", error);
    return <Frame name={profile.display_name}><LoadError>This enquiry could not be loaded. Try again shortly.</LoadError></Frame>;
  }
  if (!lead) notFound();

  // Documents are linked by the enquiry's reference (idempotency key); the trail covers the enquiry and its documents.
  const [docsRes, leadEventsRes] = await Promise.all([
    supabase.from("generated_documents").select("id, kind, title, storage_path, created_at").eq("lead_reference", lead.idempotency_key).order("created_at", { ascending: false }).limit(20),
    supabase.from("audit_events").select(AUDIT_COLUMNS).in("entity_type", LEAD_ENTITY_TYPES).eq("entity_id", lead.id).order("created_at", { ascending: false }).order("id", { ascending: false }).limit(EVENT_LIMIT),
  ]);
  if (docsRes.error) logAdminError("admin.lead_documents_failed", docsRes.error);
  if (leadEventsRes.error) logAdminError("admin.lead_audit_failed", leadEventsRes.error);
  const docs = (docsRes.data ?? []) as DocRow[];
  const docEventsRes = docs.length
    ? await supabase.from("audit_events").select(AUDIT_COLUMNS).eq("entity_type", "generated_documents").in("entity_id", docs.map((d) => d.id)).order("created_at", { ascending: false }).limit(EVENT_LIMIT)
    : { data: [] as AuditRow[], error: null };
  if (docEventsRes.error) logAdminError("admin.lead_document_audit_failed", docEventsRes.error);

  const events = [...((leadEventsRes.data ?? []) as AuditRow[]), ...((docEventsRes.data ?? []) as AuditRow[])].sort(
    (a, b) => b.created_at.localeCompare(a.created_at) || b.id - a.id,
  );
  const [{ urls, failed: signingFailed }, names] = await Promise.all([
    signDocumentPaths(supabase, docs.map((d) => d.storage_path)),
    staffNames(supabase, [lead.assigned_to, ...events.map((e) => e.actor_user_id)]),
  ]);

  const organisation = organisationOf(lead.payload);
  const qr = qrCode(lead.attribution);
  const docTitle = new Map(docs.map((d) => [d.id, d.title]));
  const mail = mailHref(lead.email);
  const tel = telHref(lead.phone);
  const contact: FieldItem[] = [
    ...(lead.email ? [{ key: "email", label: "E-mail", value: mail ? <a href={mail} className="underline decoration-line underline-offset-4 hover:text-gold">{lead.email}</a> : lead.email }] : []),
    ...(lead.phone ? [{ key: "phone", label: "Phone", value: tel ? <a href={tel} className="underline decoration-line underline-offset-4 hover:text-gold">{lead.phone}</a> : lead.phone }] : []),
  ];
  const record: FieldItem[] = [
    { key: "ref", label: "Reference", value: lead.idempotency_key, mono: true },
    { key: "id", label: "Enquiry id", value: lead.id, mono: true },
    { key: "type", label: "Enquiry type", value: lead.lead_type },
    { key: "received", label: "Received", value: formatDateTimeIST(lead.created_at) },
    { key: "consent", label: "Consent given", value: formatDateTimeIST(lead.consent_at) },
    { key: "privacy", label: "Privacy notice", value: lead.privacy_notice_version ?? "—", mono: true },
    { key: "updated", label: "Last changed", value: formatDateTimeIST(lead.updated_at) },
  ];
  const assignee = lead.assigned_to ? staffLabel(lead.assigned_to, user.id, names) : "Nobody yet";

  return (
    <Frame name={profile.display_name}>
      <header className="mt-6">
        <p className="label flex flex-wrap items-center gap-x-3 gap-y-2 text-brass">
          <span>{gateTitle(lead.gate ?? "generic")}</span>
          <time dateTime={lead.created_at} className="text-dust">{formatDateTimeIST(lead.created_at)}</time>
        </p>
        <h1 className="t-voice mt-3 break-words text-[clamp(1.8rem,4vw,3rem)] leading-tight text-bone">{lead.contact_name}</h1>
        {organisation && <p className="t-ui mt-1 break-words text-sand">{organisation}</p>}
        <p className="mt-4 flex flex-wrap items-center gap-3">
          <Tag>{statusLabel(lead.status)}</Tag>
          {qr && <QrBadge code={qr} />}
        </p>
      </header>

      <div className="plate mt-8 grid gap-8 p-5 sm:grid-cols-2 md:p-6">
        <LeadStatusForm id={lead.id} status={lead.status} contactName={lead.contact_name} />
        <div className="flex flex-col gap-3">
          <p className="label text-dust">Assigned to</p>
          <p className="t-ui text-sm text-bone" aria-live="polite">{assignee}</p>
          {lead.assigned_to !== user.id && <AssignToMeForm id={lead.id} label={lead.assigned_to ? "Assign to me instead" : "Assign to me"} />}
        </div>
      </div>

      <div className="grid gap-x-12 lg:grid-cols-2">
        <div>
          <Section id="lead-contact" title="Contact">
            <Fields items={contact} empty="No contact details." />
          </Section>
          <Section id="lead-details" title="Submitted details">
            <Fields items={payloadFields(lead.payload).map((f) => ({ key: f.key, label: f.label, value: f.value, mono: f.json }))} empty="No other fields were submitted." />
          </Section>
        </div>
        <div>
          <Section id="lead-record" title="Record">
            <Fields items={record} />
          </Section>
          <Section id="lead-attribution" title="How they found us">
            <Fields items={attributionFields(lead.attribution).map((f) => ({ key: f.key, label: f.label, value: f.value, mono: true }))} empty="No attribution recorded (a direct visit, or tracking was not available)." />
          </Section>
        </div>
      </div>

      <Section id="lead-documents" title="Documents">
        {docsRes.error ? (
          <LoadError>Documents could not be loaded.</LoadError>
        ) : !docs.length ? (
          <p className="t-ui mt-3 text-sm text-dust">No documents were generated for this enquiry.</p>
        ) : (
          <>
            <ul className="mt-3 divide-y divide-line border-y border-line">
              {docs.map((d) => {
                const url = urls.get(d.storage_path);
                return (
                  <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                    <div className="min-w-0">
                      <p className="t-ui break-words text-bone">{d.title}</p>
                      <p className="font-mono text-[0.7rem] text-dust">{d.kind} · {formatDateTimeIST(d.created_at)}</p>
                    </div>
                    {url ? <a href={url} className="label py-2 text-gold hover:text-bone">Download PDF<span className="sr-only">: {d.title}</span></a> : <span className="label text-dust">Download unavailable</span>}
                  </li>
                );
              })}
            </ul>
            <p className="t-ui mt-2 text-xs text-dust">
              {signingFailed ? "Some download links could not be created. Reload the page to try again." : "Download links expire after five minutes. Reload the page for new ones."}
            </p>
          </>
        )}
      </Section>

      <Section id="lead-activity" title="Activity">
        {leadEventsRes.error || docEventsRes.error ? <LoadError>Part of the activity log could not be loaded.</LoadError> : null}
        {!events.length ? (
          <p className="t-ui mt-3 text-sm text-dust">No recorded activity.</p>
        ) : (
          <ol className="mt-3 divide-y divide-line border-y border-line">
            {events.map((e) => {
              const details = auditDetails(e.metadata);
              const doc = e.entity_type === "generated_documents" && e.entity_id ? docTitle.get(e.entity_id) : undefined;
              return (
                <li key={e.id} className="grid gap-1 py-3 sm:grid-cols-[13rem_minmax(0,1fr)] sm:gap-4">
                  <time dateTime={e.created_at} className="font-mono text-xs text-dust">{formatDateTimeIST(e.created_at)}</time>
                  <div className="min-w-0">
                    <p className="t-ui text-sm text-bone">{auditActionLabel(e.action, e.entity_type)} <span className="text-dust">· {staffLabel(e.actor_user_id, user.id, names)}</span></p>
                    {doc && <p className="t-ui break-words text-xs text-sand">{doc}</p>}
                    {details && <p className="font-mono break-words text-[0.7rem] text-dust">{details}</p>}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
        {(leadEventsRes.data?.length ?? 0) >= EVENT_LIMIT && <p className="t-ui mt-2 text-xs text-dust">Showing the latest {EVENT_LIMIT} events. Older ones are in the audit log.</p>}
      </Section>
    </Frame>
  );
}
