import { emailConfigured, sendEmail } from "@/lib/email/resend";
import { esc, shell } from "@/lib/email/templates";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { KIND_INFO, rupees, type ApplicationKind } from "./model";

/**
 * Transactional e-mails for applications. Each message names the application by its reference and kind only: never a
 * child's name, date of birth, medical note or any document, so a forwarded or misdelivered e-mail exposes nothing about
 * a minor. The account holder's e-mail address was confirmed by Supabase Auth before an application could be submitted
 * (contact verification is the Auth confirmation e-mail itself). Every attempt is written to public.notification_log
 * without the address or the content. SMS and WhatsApp are not sent: no provider is approved yet.
 */
export type Template = "application_received" | "info_requested" | "application_approved" | "application_rejected" | "payment_confirmed" | "enrolment_confirmed";

const SITE = () => process.env.NEXT_PUBLIC_SITE_URL || "https://blackstallion.academy";

export function renderNotification(template: Template, ctx: { name: string; reference: string; kind: ApplicationKind; amountPaise?: number; note?: string }) {
  const kind = KIND_INFO[ctx.kind].label.toLowerCase();
  const link = `${SITE()}/enroll/status`;
  const p = (t: string) => `<p style="font-size:16px;line-height:1.6;margin:0 0 14px">${t}</p>`;
  const body: Record<Template, { subject: string; title: string; lines: string[] }> = {
    application_received: { subject: "Application received", title: "We have your application", lines: [`Your ${kind} application ${ctx.reference} has reached the admissions team. We will write again when its status changes.`] },
    info_requested: { subject: "More information needed", title: "We need a little more", lines: [`The admissions team has a question about application ${ctx.reference}. Sign in to read it, update the application and submit it again.`] },
    application_approved: { subject: "Application approved", title: "Approved", lines: [`Application ${ctx.reference} has been approved.`, ctx.kind === "cadet" ? "Sign in to see the next step." : "The academy will contact you about the next steps."] },
    application_rejected: { subject: "About your application", title: "About your application", lines: [`We are sorry: application ${ctx.reference} was not accepted this time. You may contact the academy if you have questions.`] },
    payment_confirmed: { subject: "Payment received", title: "Payment received", lines: [`We have received ${ctx.amountPaise ? rupees(ctx.amountPaise) : "your payment"} for application ${ctx.reference}. Your receipt and GST invoice are in your dashboard.`] },
    enrolment_confirmed: { subject: "Enrolment confirmed", title: "Welcome to the academy", lines: [`Application ${ctx.reference} is now an enrolment. The cadet's passport and its verification code are in your dashboard.`] },
  };
  const b = body[template];
  const greeting = `Dear ${esc(ctx.name || "member")},`;
  const html = shell(b.title, `${p(greeting)}${b.lines.map((l) => p(esc(l))).join("")}
<p style="margin:20px 0 0"><a href="${esc(link)}" style="font:600 13px Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#78472F">Open your dashboard</a></p>
<p style="font-size:13px;line-height:1.6;margin:20px 0 0;color:#6F5B4B">If you did not apply, please ignore this message.</p>`);
  const text = `${ctx.name ? `Dear ${ctx.name},` : "Hello,"}\n\n${b.lines.join("\n\n")}\n\nYour dashboard: ${link}\n\nIf you did not apply, please ignore this message.`;
  return { subject: `${b.subject} · ${ctx.reference} · Black Stallion Academy`, html, text };
}

/** Sends one notification and logs the outcome. Never throws: a failed e-mail must not undo the status change that caused it. */
export async function notify(template: Template, to: { userId: string; email: string; name: string }, app: { id: string; reference: string; kind: ApplicationKind }, extra: { amountPaise?: number } = {}) {
  let status: "sent" | "failed" | "skipped" = "skipped";
  let detail = "email not configured";
  if (emailConfigured() && to.email) {
    const msg = renderNotification(template, { name: to.name, reference: app.reference, kind: app.kind, amountPaise: extra.amountPaise });
    const res = await sendEmail({ to: [to.email], ...msg, tag: template, idempotencyKey: `${template}:${app.id}:${extra.amountPaise ?? ""}` });
    status = res.ok ? "sent" : "failed";
    detail = res.ok ? "" : res.reason;
  }
  const admin = createSupabaseAdminClient();
  if (admin) {
    const { error } = await admin.from("notification_log").insert({ recipient_user_id: to.userId, application_id: app.id, template, channel: "email", status, detail: detail || null });
    if (error) console.error(JSON.stringify({ event: "notification.log_failed", code: error.code }));
  }
  return status;
}
