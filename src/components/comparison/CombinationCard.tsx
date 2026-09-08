import { Ltr } from '@/components/ui/Bdi';
import { Badge } from '@/components/ui/Badge';
import { countries } from '@/data/countries';
import { getProvider } from '@/data/mockProviders';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/getDictionary';
import { interpolate } from '@/i18n/interpolate';
import type { Combination } from '@/lib/comparison/buildCombination';
import { formatData } from '@/lib/formatters/data';
import { formatPrice } from '@/lib/formatters/price';

const byCode = new Map(countries.map((country) => [country.code, country]));

/**
 * Two or more plans presented as one option, with a total.
 *
 * This is the answer for a trip no single plan serves well — a night in
 * Germany then two weeks in the States. No provider will ever suggest buying
 * from a competitor to save money, which is precisely why a comparison site
 * should. The trade-off is stated rather than buried: it is two purchases and
 * two installations.
 */
export function CombinationCard({
  combination,
  cheapestSingleMinor,
  locale,
  dict,
}: {
  combination: Combination;
  /** The cheapest single plan covering the whole trip, when one exists. */
  cheapestSingleMinor: number | null;
  locale: Locale;
  dict: Dictionary;
}) {
  const difference = cheapestSingleMinor === null ? null : cheapestSingleMinor - combination.totalMinor;

  return (
    <article className="rounded-lg border border-teal bg-teal-50/40 p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <Badge tone="value">
          <span aria-hidden="true">🧩</span>
          {dict.combination.badge}
        </Badge>
        <h3 className="font-head text-lg font-semibold">
          {interpolate(dict.combination.titleTemplate, { count: combination.legs.length })}
        </h3>
      </div>

      <ul className="mt-4 grid gap-2.5">
        {combination.legs.map((leg) => {
          const provider = getProvider(leg.plan.providerId);
          const names = leg.countryCodes
            .map((code) => byCode.get(code)?.names[locale] ?? code)
            .join(', ');

          return (
            <li
              key={leg.plan.id}
              className="flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-sm bg-surface px-3 py-2.5"
            >
              <span className="font-head font-semibold">{provider?.name ?? leg.plan.providerId}</span>
              <span className="text-[0.9375rem] text-ink-2">{leg.plan.planName}</span>
              <span className="text-[0.8125rem] text-ink-3">
                {interpolate(dict.combination.legTemplate, { countries: names })}
                {' · '}
                {leg.plan.isUnlimited ? dict.units.unlimited : formatData(leg.plan.dataAmountMb, locale)}
              </span>
              <Ltr className="tnum ms-auto font-head font-semibold">
                {formatPrice(leg.sourcePriceMinor, leg.sourceCurrency, locale)}
              </Ltr>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-t border-teal/40 pt-3">
        <span className="font-head font-semibold">{dict.combination.total}</span>
        <Ltr className="tnum font-head text-2xl font-bold tracking-tight">
          {formatPrice(combination.totalMinor, combination.currency, locale)}
        </Ltr>
        <span className="text-[0.8125rem] text-ink-2">
          {difference === null
            ? dict.combination.onlyOption
            : interpolate(
                difference > 0 ? dict.combination.cheaperTemplate : dict.combination.dearerTemplate,
                { amount: formatPrice(Math.abs(difference), combination.currency, locale) },
              )}
        </span>
      </div>

      <p className="mt-2 text-[0.8125rem] text-ink-3">{dict.combination.note}</p>
    </article>
  );
}
