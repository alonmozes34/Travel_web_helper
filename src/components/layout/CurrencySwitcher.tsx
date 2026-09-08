'use client';

import { currencies, currencyConfig, type CurrencyCode } from '@/i18n/config';
import { useCurrency } from '@/components/providers/CurrencyProvider';

/**
 * Sets the display currency. Prices keep their source currency in the data
 * model; this only controls what the traveller is shown.
 */
export function CurrencySwitcher({ label }: { label: string }) {
  const { currency, setCurrency } = useCurrency();

  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">{label}</span>
      <select
        value={currency}
        onChange={(event) => setCurrency(event.target.value as CurrencyCode)}
        className="min-h-9 cursor-pointer appearance-none rounded-full border border-line bg-surface ps-3 pe-7 text-[0.8125rem] font-semibold text-ink-2 hover:text-brand"
      >
        {currencies.map((code) => (
          <option key={code} value={code}>
            {currencyConfig[code].symbol} {currencyConfig[code].label}
          </option>
        ))}
      </select>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute end-2.5 text-[0.6rem] text-ink-3"
      >
        ▼
      </span>
    </label>
  );
}
