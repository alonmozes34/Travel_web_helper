/**
 * Analytics contract.
 *
 * No analytics provider is installed. This module exists so that the important
 * actions already have stable names and typed payloads — wiring a provider
 * later means implementing `track` once, not hunting for call sites.
 */

export type AnalyticsEvent =
  | { name: 'destination_search'; query: string; resultCount: number }
  | { name: 'search_submitted'; countryCode: string; days?: number; usage?: string }
  | { name: 'filter_used'; filter: string; value: string }
  | { name: 'plan_viewed'; planId: string; providerId: string }
  | { name: 'compare_selected'; planId: string; selectionCount: number }
  | { name: 'provider_clicked'; planId: string; providerId: string }
  /**
   * Trip extras. These exist to answer one question — does the car-rental
   * cross-sell earn its place, or does it cost eSIM clicks — and that
   * question is only answerable if the offer and the eSIM that triggered it
   * are recorded together. `planId` therefore rides along on the offer
   * events.
   *
   * Still routed through the same no-op `track` as everything else: naming an
   * event is not installing analytics, and nothing below leaves the browser.
   */
  | { name: 'car_rental_offer_shown'; countryCode: string; planId: string }
  | { name: 'car_rental_offer_yes'; countryCode: string; planId: string }
  | { name: 'car_rental_offer_no'; countryCode: string; planId: string }
  | { name: 'car_rental_search_started'; countryCode: string; pickupKind: string }
  | { name: 'car_rental_results_viewed'; countryCode: string; resultCount: number }
  | { name: 'car_rental_deal_clicked'; offerId: string; sourceId: string };

export type AnalyticsEventName = AnalyticsEvent['name'];

/** Intentionally a no-op until a provider is chosen. */
export function track(_event: AnalyticsEvent): void {
  if (process.env.NODE_ENV === 'development') {
    console.debug('[analytics]', _event.name, _event);
  }
}
