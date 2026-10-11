/**
 * Single source of truth for fees (Master Refinement §9.1). Every page, form, receipt and
 * Terminal answer reads from here. Amounts are before GST.
 * STATUS: supplied by the Chairman's directive; mark "pending business confirmation" if terms change.
 */
export const GST_RATE = 0.18;
export const price = { core: 8500, elite: 12500, kit: 5000 } as const;

export const inr = (n: number) => `₹${new Intl.NumberFormat("en-IN").format(n)}`;
export const withGst = (n: number) => Math.round(n * (1 + GST_RATE));

export const priceLabel = {
  core: `${inr(price.core)} + GST`,
  elite: `${inr(price.elite)} + GST`,
  kit: `${inr(price.kit)} + GST`,
} as const;
