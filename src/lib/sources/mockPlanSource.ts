import { mockPlans } from '@/data/mockPlans';
import { mockFxRates } from '@/data/fxRates';
import { sourceResult, type ProviderSource, type SourceResult } from './ProviderSource';
import type { RateResult, RateSource } from './RateSource';

/**
 * The demo catalogue, behind the same interface a real provider will use.
 *
 * The point is not to add indirection to a static file. It is that the
 * pipeline in front of it — caching, merging several sources, surviving one
 * of them failing, reporting what was skipped — is exercised in production
 * today, against data that cannot surprise us. The day credentials arrive,
 * connecting a real provider is a line in the source list rather than a
 * refactor of everything that reads a plan.
 *
 * Every plan it returns still carries `source: 'mock'`, so the demo banner
 * and `isMockData` keep working off the data rather than off a flag somebody
 * has to remember to change.
 */
export function mockPlanSource(now = () => new Date().toISOString()): ProviderSource {
  return {
    id: 'mock',
    label: 'Demo catalogue',
    async fetch(): Promise<SourceResult> {
      return sourceResult('mock', mockPlans, [], now());
    },
  };
}

/**
 * The fallback rate set, used only when a real feed cannot be reached.
 *
 * Marked `source: 'mock'` on every rate, which the interface surfaces, so a
 * converted price is never presented as being based on a live figure when it
 * is not.
 */
export function mockRateSource(now = () => new Date().toISOString()): RateSource {
  return {
    id: 'mock-rates',
    label: 'Fallback exchange rates',
    async fetch(): Promise<RateResult> {
      return { sourceId: 'mock-rates', rates: mockFxRates, fetchedAt: now() };
    },
  };
}
