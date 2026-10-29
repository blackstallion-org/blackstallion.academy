import type { SupabaseClient } from "@supabase/supabase-js";
import { auditActionLabel, auditEntityHref, qrCode, summariseByHub, utmSummary } from "@/lib/admin/present";
import { logAdminError } from "@/lib/admin/server";
import { gateLabel, ROW_CAP, ROW_WINDOW_DAYS, type EnquiryRow, type FeedItem, type HubCount, type LatestEnquiry, type OverviewSnapshot, type Totals } from "@/lib/admin/overview";

/**
 * One round of reads for the staff dashboard, run as the signed-in staff member (their client, their Row Level Security). Each read
 * stands alone: if one table is missing or refuses, that part is reported in `unavailable` and the rest still shows. Only counts and
 * names travel on to the browser: never an e-mail address, a phone number or a message.
 */

type CountResult = PromiseLike<{ count: number | null; error: unknown }>;
const head = (supabase: SupabaseClient, table: string) => supabase.from(table).select("id", { count: "exact", head: true });

async function count(label: string, query: CountResult, unavailable: Set<string>): Promise<number | null> {
  const { count: n, error } = await query;
  if (error) {
    logAdminError(`admin.overview_${label}_failed`, error);
    unavailable.add(label);
    return null;
  }
  return n ?? 0;
}

type LeadRow = { id: string; created_at: string; gate: string | null; status: string; attribution: unknown; assigned_to: string | null };
type NamedLead = { id: string; contact_name: string; gate: string | null; status: string; created_at: string };
type AuditRow = { id: string; action: string; entity_type: string; entity_id: string | null; created_at: string };

export async function loadOverview(supabase: SupabaseClient, now: Date = new Date()): Promise<OverviewSnapshot> {
  const unavailable = new Set<string>();
  const since = new Date(now.getTime() - ROW_WINDOW_DAYS * 86_400_000).toISOString();

  const [rowsRes, latestRes, auditRes, hubsRes, enquiries, newStatus, accountsPending, mouOpen] = await Promise.all([
    supabase
      .from("onboarding_leads")
      .select("id, created_at, gate, status, attribution, assigned_to")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(ROW_CAP + 1),
    supabase.from("onboarding_leads").select("id, contact_name, gate, status, created_at").order("created_at", { ascending: false }).order("id", { ascending: false }).limit(8),
    supabase.from("audit_events").select("id, action, entity_type, entity_id, created_at").order("created_at", { ascending: false }).limit(12),
    supabase.from("qr_lead_captures").select("hub_slug, converted_to_enrollment").order("created_at", { ascending: false }).limit(1000),
    count("enquiries", head(supabase, "onboarding_leads"), unavailable),
    count("new", head(supabase, "onboarding_leads").eq("status", "new"), unavailable),
    count("accounts", head(supabase, "member_accounts").eq("status", "pending"), unavailable),
    count("mou", head(supabase, "mou_requests").in("status", ["PENDING", "REVIEWING"]), unavailable),
  ]);

  let rows: EnquiryRow[] = [];
  let rowsTruncated = false;
  if (rowsRes.error) {
    logAdminError("admin.overview_rows_failed", rowsRes.error);
    unavailable.add("enquiries");
  } else {
    const data = (rowsRes.data ?? []) as LeadRow[];
    rowsTruncated = data.length > ROW_CAP;
    rows = data.slice(0, ROW_CAP).map((r) => ({
      id: r.id,
      at: r.created_at,
      gate: r.gate ?? "generic",
      status: r.status,
      qr: Boolean(qrCode(r.attribution)),
      utm: Boolean(utmSummary(r.attribution)),
      assigned: r.assigned_to !== null,
    }));
  }

  let latest: LatestEnquiry[] = [];
  if (latestRes.error) {
    logAdminError("admin.overview_latest_failed", latestRes.error);
    unavailable.add("latest");
  } else {
    latest = ((latestRes.data ?? []) as NamedLead[]).map((l) => ({ id: l.id, name: l.contact_name, gate: l.gate ?? "generic", status: l.status, at: l.created_at }));
  }

  const activity: FeedItem[] = latest.map((l) => ({
    id: l.id,
    kind: "enquiry",
    at: l.at,
    title: `${l.name} sent a ${gateLabel(l.gate).toLowerCase()} enquiry`,
    href: `/admin/leads/${l.id}`,
  }));
  if (auditRes.error) {
    logAdminError("admin.overview_audit_failed", auditRes.error);
    unavailable.add("audit");
  } else {
    for (const a of (auditRes.data ?? []) as AuditRow[]) {
      if (a.action === "lead.submitted") continue; // the enquiry itself is already in the feed
      activity.push({ id: `audit-${a.id}`, kind: "audit", at: a.created_at, title: auditActionLabel(a.action, a.entity_type), href: auditEntityHref(a.entity_type, a.entity_id) });
    }
  }
  activity.sort((x, y) => Date.parse(y.at) - Date.parse(x.at) || x.id.localeCompare(y.id));

  let hubs: HubCount[] | null = null;
  if (hubsRes.error) {
    logAdminError("admin.overview_hubs_failed", hubsRes.error);
    unavailable.add("hubs");
  } else {
    hubs = summariseByHub((hubsRes.data ?? []) as { hub_slug?: string | null; converted_to_enrollment?: boolean | null }[]).slice(0, 6);
  }

  const totals: Totals = { enquiries, newStatus, accountsPending, mouOpen };
  return { generatedAt: now.toISOString(), rows, rowsTruncated, totals, latest, activity: activity.slice(0, 14), hubs, unavailable: [...unavailable] };
}
