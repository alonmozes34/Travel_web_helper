'use client';

import { useRouter } from 'next/navigation';
import { currencies, currencyConfig, type CurrencyCode } from '@/i18n/config';
import { useCurrency } from '@/components/providers/CurrencyProvider';

/**
 * Sets the display currency. Prices keep their source currency in the data
 * model; this only controls what the traveller is shown.
 */
export function CurrencySwitcher({ label }: { label: string }) {
  const { currency, setCurrency } = useCurrency();
  const router = useRouter();

  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">{label}</span>
      <select
        value={currency}
        onChange={(event) => {
          setCurrency(event.target.value as CurrencyCode);
          // Prices are rendered on the server from the cookie, so the route has
          // to be re-rendered for the change to reach them.
          router.refresh();
        }}
        className="min-h-11 cursor-pointer appearance-none rounded-full border border-line bg-surface ps-3 pe-7 text-sm font-semibold text-ink-2 hover:text-brand md:min-h-9"
      >
        {currencies.map((code) => (
          <option key={code} value={code}>
            {currencyConfig[code].symbol} {currencyConfig[code].label}
          </option>
        ))}
      </select>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute end-2.5 text-xs text-ink-3"
      >
        ▼
      </span>
    </label>
  );
}
