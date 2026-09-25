import type { DiscountAudience } from '@/lib/types/discount';

/**
 * A discount code a provider has issued for this site's visitors.
 *
 * One record covers every plan the provider sells. The price after the code is
 * worked out from the plan's live price, so a code never needs updating when
 * prices change.
 *
 * Every field below comes from the provider in writing. None is guessed.
 * `audience` especially: it decides whether the code changes the price shown
 * and the ranking, or sits beside the regular price as a note. A record whose
 * terms have not been confirmed does not go in this list.
 */
export type Promotion = {
  providerId: string;
  code: string;
  /** Whole percent off, 1–99. */
  percent: number;
  audience: DiscountAudience;
  /** True only when the provider has confirmed the tracking link applies it. */
  appliedByLink: boolean;
  /**
   * Last day the code works, `YYYY-MM-DD`, inclusive. Null when the provider
   * has said it does not expire. After this date it disappears from the site
   * on its own.
   */
  validUntil: string | null;
  /** Who confirmed the terms, and how — e.g. "aloSIM partnerships, email". */
  confirmedBy: string;
  /** When the terms were confirmed, `YYYY-MM-DD`. */
  confirmedOn: string;
};

export const promotions: readonly Promotion[] = [
  {
    // "The code is YESHKLITA15. The code is for new customers only, and it
    // expires Feb 28th, 2027." Whether it covers regional plans too, and
    // whether the tracking link applies it by itself, has been asked; until
    // then the code is shown to type in.
    providerId: 'alosim',
    code: 'YESHKLITA15',
    percent: 15,
    audience: 'newCustomers',
    appliedByLink: false,
    validUntil: '2027-02-28',
    confirmedBy: 'Adam Bednarek, aloSIM partnerships, by email',
    confirmedOn: '2026-09-24',
  },
];
