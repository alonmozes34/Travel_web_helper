import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import { destinationContinents } from '@/data/regions';
import { getRegionName } from '@/data/regions';
import { isLocale, localePath, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/getDictionary';
import { interpolate } from '@/i18n/interpolate';
import {
  coveredCount,
  destinationCount,
  isCountryCovered,
} from '@/lib/comparison/catalogueCoverage';
import { destinationsByContinent, popularDestinations } from '@/lib/comparison/relatedDestinations';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return { title: dict.destinationIndex.title, description: dict.destinationIndex.intro };
}

export const dynamic = 'force-static';

/**
 * The destination index.
 *
 * Until now `/esim/thailand` existed and `/esim` was a 404, which meant every
 * one of the 250 destination pages was reachable only from the sitemap or
 * from a search somebody had already run. A crawler following links found
 * none of them, and a reader who wanted to browse rather than search had
 * nowhere to go.
 *
 * Nothing on this page is written per country. The names are CLDR, the
 * continent grouping is CLDR, and whether a destination has anything behind
 * it is asked of the catalogue rather than assumed — a destination we cannot
 * sell for is listed and labelled, not quietly dropped, because "we have
 * nothing for Mongolia yet" is a real answer and an empty list is not.
 */
export default async function DestinationIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const dict = getDictionary(locale);
  const page = dict.destinationIndex;
  const popular = popularDestinations(locale);

  return (
    <Container className="py-12">
      <h1 className="font-head text-3xl font-bold tracking-tight sm:text-4xl">{page.title}</h1>
      <p className="mt-4 max-w-[70ch] text-lg text-ink-2">{page.intro}</p>
      <p className="mt-3 max-w-[70ch] text-sm text-ink-3">
        {interpolate(page.statusTemplate, { covered: coveredCount, total: destinationCount })}{' '}
        {page.demoNote}
      </p>

      <section className="mt-10">
        <h2 className="font-head text-xl font-semibold">{page.popularTitle}</h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {popular.map((country) => (
            <li key={country.code}>
              <Link
                href={localePath(locale, `/esim/${country.slug}`)}
                className="inline-flex min-h-11 items-center gap-2 rounded-md border border-line bg-surface px-4 text-base font-semibold hover:border-brand hover:text-brand"
              >
                <span aria-hidden="true">{country.flag}</span>
                {country.names[locale]}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12 border-t border-line-soft pt-10">
        <h2 className="font-head text-2xl font-semibold">{page.allTitle}</h2>

        <div className="mt-6 grid gap-10">
          {destinationContinents.map((continent) => {
            const list = destinationsByContinent(continent, locale);
            if (list.length === 0) return null;
            return (
              <section key={continent}>
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <h3 className="font-head text-lg font-semibold">
                    {getRegionName(continent, locale)}
                  </h3>
                  <p className="text-sm text-ink-3">
                    {interpolate(page.countTemplate, { count: list.length })}
                  </p>
                </div>
                <ul className="mt-3 grid gap-x-4 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
                  {list.map((country) => {
                    const covered = isCountryCovered(country.code);
                    return (
                      <li key={country.code}>
                        <Link
                          href={localePath(locale, `/esim/${country.slug}`)}
                          className="flex min-h-9 items-center gap-2 rounded-sm px-1 py-1 text-base text-ink-2 hover:text-brand"
                        >
                          <span aria-hidden="true">{country.flag}</span>
                          <span className="min-w-0 flex-1 truncate">{country.names[locale]}</span>
                          {/* Said in words, not in colour alone. */}
                          <span
                            className={covered ? 'text-sm text-teal-ink' : 'text-sm text-ink-3'}
                          >
                            {covered ? page.coveredLabel : page.notCoveredLabel}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      </section>
    </Container>
  );
}
