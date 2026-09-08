import type { FxRate } from '@/lib/pricing/convert';

/**
 * MOCK exchange rates.
 *
 * Every rate carries `source: 'mock'` and an `asOf` date, so a converted price
 * can never be presented as a live figure. A real rate feed replaces this file
 * without touching the conversion layer.
 */
export const MOCK_FX_AS_OF = '2026-09-01';

export const mockFxRates: FxRate[] = [
  { from: 'USD', to: 'ILS', rate: 3.24, asOf: MOCK_FX_AS_OF, source: 'mock' },
  { from: 'EUR', to: 'ILS', rate: 3.77, asOf: MOCK_FX_AS_OF, source: 'mock' },
  { from: 'GBP', to: 'ILS', rate: 4.35, asOf: MOCK_FX_AS_OF, source: 'mock' },
  { from: 'ILS', to: 'USD', rate: 0.309, asOf: MOCK_FX_AS_OF, source: 'mock' },
  { from: 'EUR', to: 'USD', rate: 1.164, asOf: MOCK_FX_AS_OF, source: 'mock' },
  { from: 'GBP', to: 'USD', rate: 1.343, asOf: MOCK_FX_AS_OF, source: 'mock' },
  { from: 'ILS', to: 'EUR', rate: 0.265, asOf: MOCK_FX_AS_OF, source: 'mock' },
  { from: 'USD', to: 'EUR', rate: 0.859, asOf: MOCK_FX_AS_OF, source: 'mock' },
  { from: 'GBP', to: 'EUR', rate: 1.154, asOf: MOCK_FX_AS_OF, source: 'mock' },
  { from: 'ILS', to: 'GBP', rate: 0.23, asOf: MOCK_FX_AS_OF, source: 'mock' },
  { from: 'USD', to: 'GBP', rate: 0.745, asOf: MOCK_FX_AS_OF, source: 'mock' },
  { from: 'EUR', to: 'GBP', rate: 0.867, asOf: MOCK_FX_AS_OF, source: 'mock' },
];
