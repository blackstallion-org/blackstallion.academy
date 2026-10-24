import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { loadTs } from "./helpers/load-ts.mjs";

const p = await loadTs("lib/payments/core.ts");
const fresh = (amount) => ({ status: "created", amount, refunded: 0, processedEventIds: [] });

test("quote: integer paise with 18% GST from the single price source", () => {
  assert.deepEqual(p.quote("core_monthly"), { base: 850000, gst: 153000, total: 1003000, currency: "INR" });
  assert.deepEqual(p.quote("onboarding_kit"), { base: 500000, gst: 90000, total: 590000, currency: "INR" });
  assert.equal(p.quote("elite_monthly", 3).total, 3 * 1475000);
  assert.throws(() => p.quote("free_ride"));
  assert.throws(() => p.quote("core_monthly", 0));
  assert.throws(() => p.quote("core_monthly", 1.5));
});

test("webhook signature: valid accepted; tampered body, wrong secret, missing or malformed signature refused", () => {
  const body = JSON.stringify({ event: "payment.captured", payload: { amount: 1003000 } });
  const sig = createHmac("sha256", "whsec_test").update(body).digest("hex");
  assert.equal(p.verifyWebhookSignature(body, sig, "whsec_test"), true);
  assert.equal(p.verifyWebhookSignature(body.replace("1003000", "1"), sig, "whsec_test"), false);
  assert.equal(p.verifyWebhookSignature(body, sig, "other"), false);
  assert.equal(p.verifyWebhookSignature(body, null, "whsec_test"), false);
  assert.equal(p.verifyWebhookSignature(body, "nothex", "whsec_test"), false);
  assert.equal(p.verifyWebhookSignature(body, sig, undefined), false);
});

test("checkout signature binds order and payment ids", () => {
  const sig = createHmac("sha256", "key_secret").update("order_1|pay_1").digest("hex");
  assert.equal(p.verifyCheckoutSignature("order_1", "pay_1", sig, "key_secret"), true);
  assert.equal(p.verifyCheckoutSignature("order_1", "pay_2", sig, "key_secret"), false);
  assert.equal(p.verifyCheckoutSignature("order_1", "pay_1", sig, undefined), false);
});

test("state machine: only a verified webhook with the exact amount marks paid", () => {
  const amount = p.quote("core_monthly").total;
  let r = fresh(amount);
  assert.equal(p.applyPaymentEvent(r, { type: "captured", source: "client", amount }, "e1").changed, false, "client callback alone never pays");
  assert.equal(p.applyPaymentEvent(r, { type: "captured", source: "webhook", amount: amount - 1 }, "e2").reason, "amount mismatch");
  r = p.applyPaymentEvent(r, { type: "captured", source: "webhook", amount }, "e3").record;
  assert.equal(r.status, "paid");
});

test("state machine: duplicate and out-of-order events do not regress a paid payment", () => {
  const amount = 590000;
  let r = p.applyPaymentEvent(fresh(amount), { type: "captured", source: "webhook", amount }, "evt_a").record;
  const dup = p.applyPaymentEvent(r, { type: "captured", source: "webhook", amount }, "evt_a");
  assert.equal(dup.changed, false);
  assert.equal(dup.reason, "duplicate event");
  r = p.applyPaymentEvent(r, { type: "failed", source: "webhook" }, "evt_b").record; // late failure after capture
  assert.equal(r.status, "paid");
});

test("state machine: declined then retried and captured; cancel only before payment", () => {
  const amount = 590000;
  let r = p.applyPaymentEvent(fresh(amount), { type: "failed", source: "webhook" }, "x1").record;
  assert.equal(r.status, "failed");
  r = p.applyPaymentEvent(r, { type: "captured", source: "webhook", amount }, "x2").record;
  assert.equal(r.status, "paid");
  assert.equal(p.applyPaymentEvent(r, { type: "cancelled", source: "client" }, "x3").changed, false);
  assert.equal(p.applyPaymentEvent(fresh(amount), { type: "cancelled", source: "client" }, "x4").record.status, "cancelled");
});

test("state machine: partial then full refund; over-refund refused", () => {
  const amount = 1000;
  let r = p.applyPaymentEvent(fresh(amount), { type: "captured", source: "webhook", amount }, "r0").record;
  r = p.applyPaymentEvent(r, { type: "refund_requested" }, "r1").record;
  r = p.applyPaymentEvent(r, { type: "refunded", source: "webhook", amount: 400 }, "r2").record;
  assert.equal(r.status, "partially_refunded");
  assert.equal(p.applyPaymentEvent(r, { type: "refunded", source: "webhook", amount: 700 }, "r3").reason, "refund exceeds payment");
  r = p.applyPaymentEvent(r, { type: "refunded", source: "webhook", amount: 600 }, "r4").record;
  assert.equal(r.status, "refunded");
  assert.equal(r.refunded, 1000);
});
