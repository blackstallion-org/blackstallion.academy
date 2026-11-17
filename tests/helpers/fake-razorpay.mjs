// Test stand-in for lib/registration/razorpay.ts: always configured; createRazorpayOrder is recorded and scripted by the test.
export const razorpayConfigured = () => true;
export async function createRazorpayOrder(input) {
  const t = globalThis.__bsahTest;
  t.orders.push(input);
  return t.orderResult ?? { ok: true, order: { id: `order_NEW${t.orders.length}`, amount: input.amountPaise, currency: "INR" } };
}
export function readWebhook() { return null; }
