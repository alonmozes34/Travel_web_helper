import {
  alosimDestinations,
  type AlosimDestination,
  type AlosimOfferId,
} from './alosim.generated';

/**
 * aloSIM — the first real provider to approve us.
 *
 * What this file holds is exactly what aloSIM have given us so far: which
 * destinations they sell for, and the affiliate link to each of those pages.
 * It does NOT hold prices, data allowances or validity, because they have not
 * supplied them. That is the whole reason no aloSIM plan appears on the site
 * yet: a row in a comparison needs a price, and we do not invent one.
 *
 * It is committed ahead of that feed on purpose. When the plan data does
 * arrive it will carry names and sizes, not links, and every plan still needs
 * somewhere to send a traveller — so the mapping from a destination to the
 * right page on their store is groundwork that would otherwise be done by
 * hand 121 times under time pressure.
 */

export type { AlosimDestination, AlosimOfferId };
export { alosimAffiliateId, alosimOfferIds } from './alosim.generated';

/**
 * Which of the two live offers our links use.
 *
 * Provisionally the flat-fee one. The two pay differently — $5 per sale
 * against 10% of the order — and they cross at an order of $50, while
 * aloSIM's own packages start at $4.50 a week. For the orders this site will
 * actually send, the flat fee is worth several times the percentage.
 *
 * "Provisionally" because that arithmetic assumes the two offers are
 * otherwise identical, and the payout terms and cookie window have not been
 * read yet. Deep-link coverage at least is identical: both offers register
 * the same 121 countries and 12 regions.
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
