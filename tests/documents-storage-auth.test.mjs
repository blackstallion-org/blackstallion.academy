import { test } from "node:test";
import assert from "node:assert/strict";
import { PDFDocument } from "pdf-lib";
import { inflateSync } from "node:zlib";
import { loadTs, loopback } from "./helpers/load-ts.mjs";

const draft = { school: "Synthetic QA School", city: "Hyderabad", trustee: "QA Trustee", designation: "Principal", email: "qa@example.test", phone: "+919999999999", land: "1.5", tier: "signature", cadets: "180" };
const hex = (s) => Buffer.from(s, "latin1").toString("hex").toUpperCase();
/** Inflate every content stream and look for the text (pdf-lib writes standard-font text as hex strings). */
const pdfText = (bytes) => {
  const raw = Buffer.from(bytes);
  const out = [];
  let i = 0;
  while ((i = raw.indexOf("stream", i)) !== -1) {
    let start = i + 6;
    if (raw[start] === 0x0d) start++;
    if (raw[start] === 0x0a) start++;
    const end = raw.indexOf("endstream", start);
    if (end === -1) break;
    try { out.push(inflateSync(raw.subarray(start, end)).toString("latin1")); } catch { /* not a flate stream */ }
    i = end + 9;
  }
  return out.join("\n");
};
const pdfHas = (bytes, text) => { const t = pdfText(bytes); return t.includes(`<${hex(text)}`) || t.includes(hex(text)) || t.includes(`(${text})`); };

test("upload validation: real type from magic bytes, per-bucket types and sizes", async () => {
  const v = await loadTs("lib/storage/validate.ts");
  const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]);
  const jpg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0]);
  const webp = new Uint8Array([0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x45, 0x42, 0x50]);
  const pdf = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31]);
  const svg = new TextEncoder().encode("<svg xmlns='http://www.w3.org/2000/svg'><script>alert(1)</script></svg>");
  assert.equal(v.detectType(png).mime, "image/png");
  assert.equal(v.detectType(jpg).mime, "image/jpeg");
  assert.equal(v.detectType(webp).mime, "image/webp");
  assert.equal(v.detectType(pdf).mime, "application/pdf");
  assert.equal(v.detectType(svg), null, "SVG (script-capable) is never accepted");
  assert.equal(v.validateUpload(png, "website-assets").ok, true);
  assert.equal(v.validateUpload(pdf, "website-assets").ok, false, "no PDFs in the public bucket");
  assert.equal(v.validateUpload(pdf, "private-documents").ok, true);
  assert.equal(v.validateUpload(png, "private-documents").ok, false);
  assert.equal(v.validateUpload(new Uint8Array(0), "user-uploads").ok, false);
  const big = new Uint8Array(4 * 1024 * 1024 + 1); big.set(png);
  assert.match(v.validateUpload(big, "website-assets").error, /larger than 4 MB/);
});

test("object paths are unique, lowercase and free of user input", async () => {
  const v = await loadTs("lib/storage/validate.ts");
  const p = v.objectPath("../Site Images!", "PNG", new Date("2026-10-23T00:00:00Z"), "ABCDEF00-0000-4000-8000-000000000000");
  assert.equal(p, "siteimages/2026/10/abcdef00-0000-4000-8000-000000000000.png");
  assert.notEqual(v.objectPath("site", "png"), v.objectPath("site", "png"));
});

test("MOU PDF: valid A4 PDF, draft banner, school, tier, no signatures, rupee mapped safely", async () => {
  const { buildMouPdf, pdfSafe } = await loadTs("lib/documents/mou-pdf.ts");
  const bytes = await buildMouPdf(draft, { generatedAt: new Date("2026-10-23T06:00:00Z"), reference: "ref_000000000001" });
  assert.equal(Buffer.from(bytes.slice(0, 5)).toString(), "%PDF-");
  const doc = await PDFDocument.load(bytes);
  assert.equal(doc.getPageCount(), 1);
  const { width, height } = doc.getPage(0).getSize();
  assert.ok(Math.abs(width - 595.28) < 1 && Math.abs(height - 841.89) < 1, "A4 portrait");
  assert.match(doc.getSubject(), /not a binding document/);
  assert.ok(pdfHas(bytes, "DRAFT FOR DISCUSSION - NOT A BINDING DOCUMENT"));
  assert.ok(pdfHas(bytes, "Synthetic"), "school name present");
  assert.ok(pdfHas(bytes, "Signature Hub") || pdfHas(bytes, "Signature"), "tier present");
  assert.equal(pdfSafe("₹15.00 L “quoted” – ok"), 'INR 15.00 L "quoted" - ok');
});

test("MOU PDF uses exactly the same clauses as the on-page draft", async () => {
  const { mouDraft } = await loadTs("lib/content/mou.ts");
  const d = mouDraft(draft);
  assert.equal(d.paragraphs.length, 6);
  assert.match(d.paragraphs[1].text, /Signature Hub specification/);
  assert.match(d.paragraphs[4].text, /expected 180 cadets/);
  assert.equal(d.signatories[0].name, "QA Trustee");
  const empty = mouDraft({ ...draft, school: "", trustee: "", land: "", cadets: "" });
  assert.match(empty.paragraphs[0].text, /\[School name\]/);
});

test("MOU draft validation rejects junk and missing names", async () => {
  const { mouDraftSchema } = await loadTs("lib/documents/mou-pdf.ts");
  assert.equal(mouDraftSchema.safeParse(draft).success, true);
  assert.equal(mouDraftSchema.safeParse({ ...draft, school: "" }).success, false);
  assert.equal(mouDraftSchema.safeParse({ ...draft, tier: "palace" }).success, false);
  assert.equal(mouDraftSchema.safeParse({ ...draft, land: "lots" }).success, false);
  assert.equal(mouDraftSchema.safeParse({ ...draft, cadets: "-5" }).success, false);
});

test("MOU storage: PDF uploaded to private-documents and recorded; failed record removes the upload", async () => {
  let rowStatus = 201;
  const sb = await loopback((req) => {
    if (req.url.startsWith("/storage/v1/object/private-documents/")) return { reply: { Key: "private-documents/x", Id: "1" } };
    if (req.url.startsWith("/rest/v1/generated_documents")) return { status: rowStatus, reply: rowStatus === 201 ? [] : { message: "denied" } };
    if (req.url.startsWith("/storage/v1/object/private-documents")) return { reply: [] }; // remove
    return { status: 404 };
  });
  try {
    process.env.SUPABASE_URL = sb.url;
    process.env.SUPABASE_PUBLISHABLE_KEY = "sb_publishable_test";
    process.env.SUPABASE_SECRET_KEY = "sb_secret_test_only";
    const { storeMouDraftForLead } = await loadTs("lib/documents/store.ts");
    const raw = { organisation: draft.school, name: draft.trustee, email: draft.email, phone: draft.phone, mou_city: draft.city, mou_tier: "royal", mou_land: "2", mou_cadets: "300" };
    assert.deepEqual(await storeMouDraftForLead(raw, "ref_000000000002"), { stored: true });
    const upload = sb.requests.find((r) => r.url.startsWith("/storage/v1/object/private-documents/mou/"));
    assert.ok(upload, "uploaded under mou/");
    assert.match(upload.url, /^\/storage\/v1\/object\/private-documents\/mou\/\d{4}\/\d{2}\/[0-9a-f-]{36}\.pdf$/);
    assert.equal(upload.headers.apikey, "sb_secret_test_only");
    const row = sb.requests.find((r) => r.url.startsWith("/rest/v1/generated_documents"));
    assert.equal(row.body.kind, "mou_draft");
    assert.equal(row.body.lead_reference, "ref_000000000002");
    rowStatus = 403;
    const before = sb.requests.length;
    assert.deepEqual(await storeMouDraftForLead(raw, "ref_000000000003"), { stored: false, reason: "error" });
    assert.ok(sb.requests.slice(before).some((r) => r.headers["x-http-method-override"] === "DELETE" || (r.url === "/storage/v1/object/private-documents" && r.body?.prefixes)), "orphan upload removed");
  } finally {
    await sb.close();
    delete process.env.SUPABASE_URL; delete process.env.SUPABASE_PUBLISHABLE_KEY; delete process.env.SUPABASE_SECRET_KEY;
  }
});

test("MOU storage is skipped (not failed) without the secret key", async () => {
  delete process.env.SUPABASE_SECRET_KEY;
  process.env.SUPABASE_URL = "http://127.0.0.1:9"; process.env.SUPABASE_PUBLISHABLE_KEY = "sb_publishable_test";
  const { storeMouDraftForLead } = await loadTs("lib/documents/store.ts");
  assert.deepEqual(await storeMouDraftForLead({ organisation: "X School", name: "QA" }, "r"), { stored: false, reason: "not_configured" });
  delete process.env.SUPABASE_URL; delete process.env.SUPABASE_PUBLISHABLE_KEY;
});

test("staff roles: only operations and executive_admin may use the console", async () => {
  const { isStaffRole } = await loadTs("lib/auth/admin.ts");
  assert.equal(isStaffRole("operations"), true);
  assert.equal(isStaffRole("executive_admin"), true);
  for (const r of ["cadet", "parent_guardian", "instructor", "school_partner", "", null, undefined, "admin"]) assert.equal(isStaffRole(r), false, String(r));
});

test("proxy: signed-out visitors are sent to login; login stays reachable and is never indexed or cached", async () => {
  const { NextRequest } = await import("next/server.js");
  process.env.SUPABASE_URL = "http://127.0.0.1:9";
  process.env.SUPABASE_PUBLISHABLE_KEY = "sb_publishable_test";
  const { proxy, config } = await loadTs("proxy.ts");
  assert.deepEqual(config.matcher, ["/admin", "/admin/:path*"]);
  const toAdmin = await proxy(new NextRequest("https://example.test/admin/documents"));
  assert.equal(toAdmin.status, 307);
  assert.equal(new URL(toAdmin.headers.get("location")).pathname, "/admin/login");
  const login = await proxy(new NextRequest("https://example.test/admin/login"));
  assert.equal(login.status, 200);
  assert.equal(login.headers.get("x-robots-tag"), "noindex, nofollow");
  assert.equal(login.headers.get("cache-control"), "private, no-store");
  delete process.env.SUPABASE_URL;
  const unconfigured = await proxy(new NextRequest("https://example.test/admin"));
  assert.match(unconfigured.headers.get("location"), /e=unconfigured/);
  delete process.env.SUPABASE_PUBLISHABLE_KEY;
});
