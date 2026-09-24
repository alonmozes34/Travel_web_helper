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

/**
 * Empty on purpose.
 *
 * aloSIM offered a 15% code for this site's visitors on 24 September 2026. We
 * have asked for its terms: which plans, which customers, whether it expires,
 * and whether the link applies it. It is added here once they answer.
 */
export const promotions: readonly Promotion[] = [];
