/**
 * Single source of truth for fees (Master Refinement §9.1). Every page, form, receipt and
 * Terminal answer reads from here. Amounts are before GST.
 * 16 Nov 2026 (owner): one plan only. "Core Cadets" is ₹12,000 + 18% GST a month (₹14,160); the onboarding kit is a
 * one-time ₹5,000 + GST (₹5,900), not a tier. The former ₹8,500 plan and the "Sovereign Elite" name are retired.
 * STATUS: supplied by the Chairman's directive; mark "pending business confirmation" if terms change.
 */
export const GST_RATE = 0.18;
export const price = { core: 12000, kit: 5000 } as const;

export const inr = (n: number) => `₹${new Intl.NumberFormat("en-IN").format(n)}`;
export const withGst = (n: number) => Math.round(n * (1 + GST_RATE));

/** What a family pays, GST included: ₹14,160 each month, ₹5,900 for the kit once, ₹20,060 for the first month. */
export const total = {
  monthly: withGst(price.core),
  kit: withGst(price.kit),
  firstMonth: withGst(price.core + price.kit),
} as const;

export const priceLabel = {
  core: `${inr(price.core)} + GST`,
  kit: `${inr(price.kit)} + GST`,
} as const;
