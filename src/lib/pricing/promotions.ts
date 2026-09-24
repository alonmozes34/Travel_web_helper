import type { Promotion } from '@/data/promotions';
import type { Plan } from '@/lib/types/plan';

/**
 * Whether a promotion still works on `today` (`YYYY-MM-DD`).
 *
 * The comparison is on the date strings themselves: ISO dates sort as text, and
 * a code valid "until 30 September" means through the end of that day.
 */
export function isPromotionActive(promotion: Promotion, today: string): boolean {
  return promotion.validUntil === null || today <= promotion.validUntil;
}

/**
 * Attach each provider's promotion to its plans.
 *
 * A code every visitor can use lowers the price that is shown and ranked,
 * because it is what they will pay. A code only for a provider's new customers
 * leaves the price alone and rides along as a note — see `DiscountAudience`.
 *
 * Three cases are left untouched, each on purpose:
 *
 *  - **Demo plans.** A real code applied to an invented price produces a second
 *    invented price that looks more real than the first.
 *  - **Plans already on sale.** Whether the code stacks with the provider's own
 *    discount has not been confirmed, so no stacked price is claimed.
 *  - **Expired codes.** They drop off by date, without anyone remembering to.
 */
export function applyPromotions(plans: Plan[], promotions: readonly Promotion[], today: string): Plan[] {
  const byProvider = new Map<string, Promotion>();
  for (const promotion of promotions) {
    if (isPromotionActive(promotion, today)) byProvider.set(promotion.providerId, promotion);
  }
  if (byProvider.size === 0) return plans;

  return plans.map((plan) => {
    const promotion = byProvider.get(plan.providerId);
    if (!promotion || plan.source !== 'api') return plan;
    if (plan.discount !== null || plan.finalPriceMinor < plan.originalPriceMinor) return plan;

    const discount = {
      code: promotion.code,
      percent: promotion.percent,
      source: 'affiliate' as const,
      audience: promotion.audience,
      appliedByLink: promotion.appliedByLink,
    };

    if (promotion.audience === 'newCustomers') return { ...plan, discount };

    return {
      ...plan,
      originalPriceMinor: plan.finalPriceMinor,
      finalPriceMinor: Math.round((plan.finalPriceMinor * (100 - promotion.percent)) / 100),
      discount,
    };
  });
}
