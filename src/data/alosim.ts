import {
  alosimDestinations,
  type AlosimDestination,
  type AlosimOfferId,
} from './alosim.generated';

/**
 * aloSIM — the first real provider to approve us.
 *
 * This file holds their Everflow tracking link for each destination page. The
 * plans themselves — prices, allowances, validity — come live from their
 * Store API (`src/lib/sources/alosim`), which uses these links as the "buy"
 * target, because a sale through them is the one aloSIM confirmed is credited.
 */

export type { AlosimDestination, AlosimOfferId };
export { alosimAffiliateId, alosimOfferIds } from './alosim.generated';

/**
 * Which of the two live offers our links use.
 *
 * The flat-fee one, as aloSIM asked: "Please use the $5 offer links" (Adam
 * Bednarek, September 2026). $5 on a new customer's first purchase, 30-day
 * cookie, paid monthly by PayPal after a 30-day refund hold.
 *
 * Deep-link coverage is identical between the two offers — both register the
 * same 121 countries and 12 regions — so the choice changes what we are paid,
 * never which plans appear or how they rank.
 *
 * Changing it is this one constant. Nothing else knows the number.
 */
export const ALOSIM_OFFER_ID: AlosimOfferId = 9;

const byCountry = new Map<string, AlosimDestination>(
  alosimDestinations
    .filter((destination) => destination.countryCode !== null)
    .map((destination) => [destination.countryCode as string, destination]),
);

/** Every country aloSIM publishes a store page for. */
export const alosimCountryCodes: string[] = [...byCountry.keys()].sort();

/** Their regional bundles, which cover several countries under one page. */
export const alosimRegions: AlosimDestination[] = alosimDestinations.filter(
  (destination) => destination.kind === 'region',
);

export function alosimCoversCountry(code: string): boolean {
  return byCountry.has(code);
}

/**
 * The link to send a traveller to for a destination, or null when aloSIM do
 * not sell for it. Null rather than their homepage: a button that promises a
 * destination and lands on a shop front is worse than no button.
 */
export function alosimLink(
  code: string,
  offer: AlosimOfferId = ALOSIM_OFFER_ID,
): string | null {
  return byCountry.get(code)?.links[offer] ?? null;
}
