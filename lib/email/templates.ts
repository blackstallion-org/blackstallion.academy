/**
 * E-mail templates in the BSAH palette (ivory, leather, chestnut), table-free and inline-styled for mail clients.
 * All user input is HTML-escaped. Notifications go to the academy; receipts to the enquirer (when enabled).
 */
const esc = (v: unknown) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const GATE_TITLES: Record<string, string> = {
  parents: "Cadet enrolment enquiry",
  hub: "Hub visit request",
  schools: "Campus partnership enquiry",
  partners: "Network partner enquiry",
  audit: "Board audit request",
  mou: "MOU request",
  generic: "General enquiry",
};

export const gateTitle = (gate: string) => GATE_TITLES[gate] ?? "Website enquiry";

const LABELS: Record<string, string> = {
  name: "Name", email: "Email", phone: "Phone", organisation: "Institution", student: "Student", zone: "Zone", tier: "Tier",
  acreage: "Acreage", capacity: "Capacity", designation: "Designation", date: "Preferred date", slot: "Slot", message: "Message",
  child: "Child", class: "Class", batch: "Batch",
};

function shell(title: string, inner: string) {
  return `<!doctype html><html><body style="margin:0;background:#F3EDE2;padding:24px;font-family:Georgia,'Times New Roman',serif;color:#30251E">
<div style="max-width:560px;margin:0 auto;background:#FBF8F1;border:1px solid #E8DECE;padding:32px">
<p style="margin:0 0 4px;font:600 11px Arial,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:#7B5636">The Black Stallion Academy</p>
<h1 style="margin:0 0 20px;font-weight:400;font-size:26px;line-height:1.2;color:#30251E">${esc(title)}</h1>
${inner}
<p style="margin:28px 0 0;font:12px Arial,sans-serif;color:#6F5B4B">blackstallion.academy</p>
</div></body></html>`;
}

export function leadNotification(gate: string, fields: Record<string, string | undefined>, meta: { reference: string; attribution: Record<string, string> }) {
  const rows = Object.entries(fields)
    .filter(([, v]) => v)
    .map(([k, v]) => `<tr><td style="padding:6px 12px 6px 0;font:600 12px Arial,sans-serif;color:#7B5636;vertical-align:top;white-space:nowrap">${esc(LABELS[k] ?? k)}</td><td style="padding:6px 0;font-size:15px;white-space:pre-wrap">${esc(v)}</td></tr>`)
    .join("");
  const source = Object.entries(meta.attribution).map(([k, v]) => `${esc(k)}: ${esc(v)}`).join(" · ") || "direct";
  const title = gateTitle(gate);
  const html = shell(`New: ${title}`, `<table style="border-collapse:collapse;width:100%">${rows}</table>
<p style="margin:20px 0 0;font:12px Arial,sans-serif;color:#6F5B4B">Source: ${source}<br>Reference: ${esc(meta.reference)} · consent recorded</p>`);
  const text = `New ${title}\n\n${Object.entries(fields).filter(([, v]) => v).map(([k, v]) => `${LABELS[k] ?? k}: ${v}`).join("\n")}\n\nSource: ${Object.entries(meta.attribution).map(([k, v]) => `${k}: ${v}`).join(", ") || "direct"}\nReference: ${meta.reference}`;
  return { subject: `New ${title}: ${fields.organisation || fields.name || "website"}`.slice(0, 140), html, text };
}

export function leadReceipt(gate: string, name: string | undefined) {
  const title = gateTitle(gate);
  const greeting = name ? `Dear ${esc(name)},` : "Hello,";
  const html = shell("We have received your enquiry", `<p style="font-size:16px;line-height:1.6;margin:0 0 14px">${greeting}</p>
<p style="font-size:16px;line-height:1.6;margin:0 0 14px">Thank you for your ${esc(title.toLowerCase())}. The Office of the Executive Chairman will reply within two working days.</p>
<p style="font-size:14px;line-height:1.6;margin:0;color:#4D3C30">This is a receipt, not a confirmation of admission, partnership or appointment. If you did not send this enquiry, please ignore this message.</p>`);
  const text = `${name ? `Dear ${name},` : "Hello,"}\n\nThank you for your ${title.toLowerCase()}. The Office of the Executive Chairman will reply within two working days.\n\nThis is a receipt, not a confirmation of admission, partnership or appointment.`;
  return { subject: "We have received your enquiry · Black Stallion Academy", html, text };
}
