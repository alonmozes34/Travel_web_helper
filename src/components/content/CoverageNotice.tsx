import Link from 'next/link';
import type { Locale } from '@/i18n/config';
import { localePath } from '@/i18n/config';
import type { Dictionary } from '@/i18n/getDictionary';
import { interpolate } from '@/i18n/interpolate';
import { popularCountries } from '@/data/countries';
import { coveredCount, destinationCount } from '@/lib/comparison/catalogueCoverage';

/**
 * What a destination page says when the catalogue is thinner than the map.
 *
 * Every country on the globe can be searched, so some of them will have no
 * plans behind them. Rendering an empty result list for those reads as a
 * broken page; saying plainly that we have nothing yet, and how much we do
 * have, reads as an honest one. The same component marks the softer case:
 * plans exist, but only as part of a regional or global bundle.
 */
export function CoverageNotice({
  kind,
  countryName,
  locale,
  dict,
}: {
  kind: 'none' | 'broad-only';
  countryName: string;
  locale: Locale;
  dict: Dictionary;
}) {
  const copy = dict.country.coverage;

  if (kind === 'broad-only') {
    return (
      <section className="mt-6 max-w-[80ch] rounded-md border-s-4 border-s-brand bg-brand-50 px-4 py-3.5">
        <h2 className="text-base font-semibold text-ink">
          {interpolate(copy.broadOnlyTitleTemplate, { country: countryName })}
        </h2>
        <p className="mt-1 text-base text-ink-2">{copy.broadOnlyBody}</p>
      </section>
    );
  }

  return (
    <section className="mt-6 max-w-[80ch] rounded-md border border-line bg-surface px-5 py-5">
      <h2 className="text-lg font-semibold text-ink">
        {interpolate(copy.noneTitleTemplate, { country: countryName })}
      </h2>
      <p className="mt-2 text-base text-ink-2">
        {interpolate(copy.noneBody, { country: countryName })}
      </p>
      <p className="mt-3 text-sm text-ink-3">
        {interpolate(copy.noneStatusTemplate, {
          covered: coveredCount,
          total: destinationCount,
        })}
      </p>

      <h3 className="mt-5 text-base font-semibold text-ink">
        {copy.noneAlternativesTitle}
      </h3>
      <ul className="mt-2 flex flex-wrap gap-2">
        {popularCountries.map((country) => (
          <li key={country.code}>
            <Link
              href={localePath(locale, `/esim/${country.slug}`)}
              className="flex min-h-11 items-center gap-2 rounded-full border border-line bg-white px-4 text-base font-medium text-ink hover:border-brand hover:text-brand"
            >
              <span aria-hidden="true">{country.flag}</span>
              {country.names[locale]}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
