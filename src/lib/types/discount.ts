/**
 * `'mock'` discounts exist only for design work. The UI refuses to present
 * them as real offers — see `isPresentableDiscount`.
 */
export type DiscountSource = 'mock' | 'affiliate';

/**
 * Who can actually use the code.
 *
 * This decides what the page may say. A code every visitor can use changes
 * the price they pay, so the price shown and the ranking both use it. A code
 * only a provider's new customers can use does not: a returning customer
 * following the ranking would be promised a price they cannot get. That code
 * is shown beside the regular price, and the regular price is what ranks.
 */
export type DiscountAudience = 'everyone' | 'newCustomers';

export type Discount = {
  code: string;
  /** Percentage off the original price, 1–100. */
  percent: number;
  source: DiscountSource;
  audience: DiscountAudience;
  /**
   * The tracking link applies the code itself, so the visitor has nothing to
   * type. Only ever true when the provider has said so.
   */
  appliedByLink: boolean;
};

/**
 * A mock coupon may only be shown while the prototype's demo-data flag is on,
 * and always alongside the demo-data notice.
 */
export function isPresentableDiscount(discount: Discount | null, demoDataEnabled: boolean): boolean {
  if (!discount) return false;
  return discount.source === 'affiliate' || demoDataEnabled;
}
