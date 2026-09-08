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
  | { name: 'provider_clicked'; planId: string; providerId: string };

export type AnalyticsEventName = AnalyticsEvent['name'];

/** Intentionally a no-op until a provider is chosen. */
export function track(_event: AnalyticsEvent): void {
  if (process.env.NODE_ENV === 'development') {
    console.debug('[analytics]', _event.name, _event);
  }
}
