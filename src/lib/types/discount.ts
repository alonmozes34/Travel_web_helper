/**
 * `'mock'` discounts exist only for design work. The UI refuses to present
 * them as real offers — see `isPresentableDiscount`.
 */
export type DiscountSource = 'mock' | 'affiliate';

export type Discount = {
  code: string;
  /** Percentage off the original price, 1–100. */
  percent: number;
  source: DiscountSource;
};

/**
 * A mock coupon may only be shown while the prototype's demo-data flag is on,
 * and always alongside the demo-data notice.
 */
export function isPresentableDiscount(discount: Discount | null, demoDataEnabled: boolean): boolean {
  if (!discount) return false;
  return discount.source === 'affiliate' || demoDataEnabled;
}
