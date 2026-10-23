// SUPERSEDED 23 Oct 2026 by tests/lead-action.test.mjs (run with `npm test`). This script predates consent,
// idempotency and rate limiting and the "@/" imports in app/actions.ts; it is kept for history and no longer runs green.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import ts from "typescript";

// Synthetic data is delivered only to a loopback receiver. No production credentials are read.
const output = "output/engineering/actions";
await mkdir(output, { recursive: true });
let responseCode = 200;
const records = [];
const receiver = createServer(async (request, response) => {
  let body = "";
  for await (const part of request) body += part;
  if (responseCode === 200) records.push(JSON.parse(body));
  response.writeHead(responseCode, { "content-type": "application/json" });
  response.end(JSON.stringify({ accepted: responseCode === 200 }));
});
await new Promise((resolve) => receiver.listen(0, "127.0.0.1", resolve));
const url = `http://127.0.0.1:${receiver.address().port}`;
const source = await readFile("app/actions.ts", "utf8");
let compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
compiled = compiled.replace('from "zod"', `from ${JSON.stringify(pathToFileURL(`${process.cwd()}/node_modules/zod/index.js`).href)}`);
const { submitLead } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);
process.env.SUPABASE_URL = "";
process.env.SUPABASE_PUBLISHABLE_KEY = "";
process.env.LEAD_WEBHOOK_URL = "";
process.env.LEAD_WEBHOOK_SECRET = "";
const form = (gate, fields = {}) => { const data = new FormData(); for (const [key, value] of Object.entries({ gate, ...fields })) data.set(key, value); return data; };
const common = { name: "BSAH Synthetic QA", email: "qa@example.test", phone: "+919999999999", organisation: "Synthetic QA Institution", message: "Synthetic campus enquiry; no real appointment requested." };
const fields = {
  parents: { ...common, student: "Synthetic Student, 12", zone: "Hyderabad", tier: "Squire" },
  schools: { ...common, acreage: "1 acre", capacity: "150" },
  audit: { ...common, designation: "Synthetic board representative", date: "2099-12-01", slot: "Morning" },
  partners: { ...common, acreage: "1 acre", capacity: "150" },
  hub: common,
  mou: common,
};
const results = [];
try {
  for (const gate of Object.keys(fields)) {
    const invalid = await submitLead(null, form(gate));
    assert.equal(invalid.status, "invalid");
    assert.ok(Object.keys(invalid.errors).length);
    results.push({ scenario: `${gate}: required server fields`, pass: true });
  }
  assert.equal((await submitLead(null, form("mou", { ...common, email: "invalid" }))).status, "invalid");
  assert.equal((await submitLead(null, form("audit", { ...fields.audit, date: "2020-01-01" }))).status, "invalid");
  assert.equal((await submitLead(null, form("audit", { ...fields.audit, date: "2099-02-31" }))).status, "invalid");
  assert.equal((await submitLead(null, form("mou", { ...common, phone: "--------" }))).status, "invalid");
  assert.equal((await submitLead(null, form("parents", { ...fields.parents, website: "bot" }))).status, "invalid");
  assert.equal((await submitLead(null, form("unknown", common))).status, "invalid");
  assert.equal(records.length, 0);
  const unsent = await submitLead(null, form("mou", common));
  assert.equal(unsent.status, "not_configured"); assert.equal(unsent.ok, false); assert.equal(unsent.values.name, common.name);
  results.push({ scenario: "invalid email/date/gate, honeypot and missing backend never report success", pass: true });
  process.env.LEAD_WEBHOOK_URL = url;
  for (const [gate, data] of Object.entries(fields)) {
    const before = records.length;
    const sent = await submitLead(null, form(gate, data));
    assert.equal(sent.status, "sent", `${gate}: ${JSON.stringify(sent.errors)}`); assert.equal(sent.ok, true);
    assert.equal(records.length, before + 1);
    assert.equal(records.at(-1).gate, gate); assert.equal(records.at(-1).fields.email, common.email);
    results.push({ scenario: `${gate}: acknowledged loopback delivery`, pass: true });
  }
  responseCode = 503;
  const failed = await submitLead(null, form("mou", common));
  assert.equal(failed.status, "failed"); assert.equal(failed.ok, false); assert.equal(failed.values.name, common.name);
  results.push({ scenario: "receiver failure preserves fields and never reports success", pass: true });
  responseCode = 200;
  process.env.SUPABASE_URL = url; process.env.SUPABASE_PUBLISHABLE_KEY = "synthetic-test-only";
  process.env.LEAD_WEBHOOK_URL = "";
  assert.equal((await submitLead(null, form("mou", common))).status, "sent");
  assert.equal(records.at(-1).p_type, "school"); assert.equal(records.at(-1).p_payload.organisation, common.organisation);
  results.push({ scenario: "existing RPC transport contract to loopback receiver", pass: true });
  await writeFile(`${output}/results.json`, JSON.stringify({ results, receivedRequests: records.length, limits: ["Loopback transport only; database RLS/persistence and production delivery are not verified", "Synthetic data only"] }, null, 2));
  console.log(`PASS: ${results.length} action scenarios; ${records.length} acknowledged synthetic deliveries to loopback only.`);
} finally { await new Promise((resolve) => receiver.close(resolve)); }
