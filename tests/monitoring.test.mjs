import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { loadTs } from "./helpers/load-ts.mjs";

let m;
const logs = [];
const origError = console.error;
beforeEach(async () => {
  m = await loadTs("lib/monitoring/report.ts");
  m.resetErrorAlertThrottle();
  logs.length = 0;
  console.error = (line) => logs.push(line);
  delete process.env.ERROR_ALERT_EMAIL;
  delete process.env.RESEND_API_KEY;
});
process.on("exit", () => { console.error = origError; });

test("redact removes e-mail addresses, numbers and key-like tokens", () => {
  const out = m.redact("insert failed for parent@example.com phone +91 98765 43210 key sk_live_abcdefghijklmnop123");
  assert.doesNotMatch(out, /example\.com|98765|abcdefghijklmnop/);
  assert.match(out, /\[email\]/);
  assert.match(out, /\[number\]/);
  assert.match(out, /\[key\]/);
});

test("a server error is logged as one redacted JSON line without the query string", async () => {
  const r = await m.reportServerError(new Error("boom for a@b.co"), { path: "/verify/X?name=Aarav", method: "GET" }, { routePath: "/verify/[code]", routeType: "render" });
  assert.deepEqual(r, { logged: true, alerted: false });
  assert.equal(logs.length, 1);
  const line = JSON.parse(logs[0]);
  assert.equal(line.event, "server.error");
  assert.equal(line.path, "/verify/X");
  assert.equal(line.route, "/verify/[code]");
  assert.doesNotMatch(logs[0], /a@b\.co|Aarav/);
});

test("alert e-mail only when ERROR_ALERT_EMAIL and Resend are configured, throttled per route and digest", async () => {
  process.env.ERROR_ALERT_EMAIL = "ops@example.test";
  process.env.RESEND_API_KEY = "test-key";
  const sent = [];
  const fakeFetch = async (_url, init) => { sent.push({ headers: init.headers, body: JSON.parse(init.body) }); return new Response(JSON.stringify({ id: "1" }), { status: 200 }); };
  const err = Object.assign(new Error("x"), { digest: "123" });
  const t0 = 1_800_000_000_000;
  assert.equal((await m.reportServerError(err, { path: "/a", method: "GET" }, { routePath: "/a" }, t0, fakeFetch)).alerted, true);
  assert.equal((await m.reportServerError(err, { path: "/a", method: "GET" }, { routePath: "/a" }, t0 + 60_000, fakeFetch)).alerted, false, "second alert inside 15 minutes is suppressed");
  assert.equal((await m.reportServerError(err, { path: "/b", method: "GET" }, { routePath: "/b" }, t0 + 60_000, fakeFetch)).alerted, true, "another route alerts separately");
  assert.equal((await m.reportServerError(err, { path: "/a", method: "GET" }, { routePath: "/a" }, t0 + 16 * 60_000, fakeFetch)).alerted, true, "alerts again after the window");
  assert.equal(sent.length, 3);
  assert.deepEqual(sent[0].body.to, ["ops@example.test"]);
  assert.match(sent[0].headers["idempotency-key"], /^error-alert\//);
  assert.doesNotMatch(JSON.stringify(sent.map((s) => s.body)), /test-key/, "the key is only in the authorization header");
});
