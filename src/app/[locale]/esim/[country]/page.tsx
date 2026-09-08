import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import { HeroSearch } from '@/components/search/HeroSearch';
import { AffiliateDisclosure } from '@/components/content/AffiliateDisclosure';
import { MockDataNotice } from '@/components/content/MockDataNotice';
import { countries, getCountryBySlug } from '@/data/countries';
import { isLocale, localeConfig, localePath, locales } from '@/i18n/config';
import { getDictionary } from '@/i18n/getDictionary';
import { interpolate } from '@/i18n/interpolate';
import { siteUrl } from '@/lib/site';
import { tripProfileFromParams } from '@/lib/types/trip';
import { buildComparison } from '@/lib/comparison/buildComparison';
import { getDisplayCurrency } from '@/lib/currencyServer';
import { ResultsView } from '@/components/results/ResultsView';
import { CountryFacts } from '@/components/content/CountryFacts';
import { Faq } from '@/components/content/Faq';
import { buildCountryFacts } from '@/lib/comparison/countryFacts';
import type { RecommendationKey } from '@/lib/comparison/recommend';
import { filtersFromParams } from '@/lib/comparison/filter';
import { isSortKey } from '@/lib/comparison/sort';

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    countries.map((country) => ({ locale, country: country.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}): Promise<Metadata> {
  const { locale, country: slug } = await params;
  if (!isLocale(locale)) return {};

  const country = getCountryBySlug(slug);
  if (!country) return {};

  const dict = getDictionary(locale);
  const name = country.names[locale];
  const path = `/esim/${country.slug}`;

  return {
    title: interpolate(dict.country.seoTitleTemplate, { country: name }),
    description: interpolate(dict.country.metaDescriptionTemplate, { country: name }),
    metadataBase: new URL(siteUrl),
    alternates: {
      canonical: localePath(locale, path),
      languages: Object.fromEntries(
        locales.map((code) => [localeConfig[code].htmlLang, localePath(code, path)]),
      ),
    },
  };
}

export default async function CountryPage({ params, searchParams }: PageProps<'/[locale]/esim/[country]'>) {
  const { locale, country: slug } = await params;
  if (!isLocale(locale)) notFound();

  const country = getCountryBySlug(slug);
  if (!country) notFound();

  const dict = getDictionary(locale);
  const query = await searchParams;
  const profile = tripProfileFromParams(query);

  // Filters and sort are parsed on the server so a shared filtered link
  // renders correctly before any JavaScript runs.
  const queryParams = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (typeof value === 'string') queryParams.set(key, value);
    else if (Array.isArray(value) && value[0]) queryParams.set(key, value[0]);
  }
  const initialFilters = filtersFromParams(queryParams);
  const sortParam = queryParams.get('sort');
  const initialSort = sortParam && isSortKey(sortParam) ? sortParam : 'recommended';
  const name = country.names[locale];

  // The traveller's chosen currency comes from the cookie, so prices render in
  // it on the first paint rather than changing under them after hydration.
  // A country page is a single-destination search; the multi-stop flow lives
  // on /search, which the hero submits to when more than one stop is chosen.
  const comparison = buildComparison({
    profile: {
      ...profile,
      destinations: profile.destinations.length
        ? profile.destinations
        : [{ countryCode: country.code }],
    },
    currency: await getDisplayCurrency(locale),
  });
  const { estimate } = comparison;
  const facts = buildCountryFacts({
    comparison,
    countryName: name,
    facts: dict.country.facts,
    interpolate,
  });

  return (
    <>
      <section className="bg-surface pt-10 pb-8">
        <Container>
          <h1 className="flex flex-wrap items-center gap-3 text-3xl font-bold tracking-tight md:text-4xl">
            <span aria-hidden="true">{country.flag}</span>
            {interpolate(dict.country.titleTemplate, { country: name })}
          </h1>

          <div className="mt-6">
            <HeroSearch
              locale={locale}
              dict={dict}
              initialProfile={{
                ...profile,
                destinations: profile.destinations.length
                  ? profile.destinations
                  : [{ countryCode: country.code }],
              }}
              showPopular={false}
            />
          </div>
        </Container>
      </section>

      <Container className="py-10">
        <MockDataNotice dict={dict} className="max-w-[80ch]" />

        <p className="mt-6 text-[0.9375rem] text-ink-2">
          <strong className="font-semibold text-ink">
            {interpolate(dict.results.summaryTemplate, {
              plans: comparison.planCount,
              providers: comparison.providerCount,
            })}
          </strong>
        </p>
        <p className="mt-1 mb-6 text-[0.8125rem] text-ink-2">
          {estimate.isDefault ? (
            dict.results.defaultEstimate
          ) : (
            <span className="font-semibold text-brand">
              {interpolate(dict.results.tailoredTemplate, {
                days: estimate.days,
                usage: dict.personalization.usages[estimate.usage],
                gb: Math.round(estimate.requiredGb),
              })}
            </span>
          )}
        </p>

        <ResultsView
          rows={comparison.rows}
          locale={locale}
          dict={dict}
          currency={comparison.currency}
          tripDays={estimate.days}
          countryCodes={comparison.countryCodes}
          demoDataEnabled={comparison.isMockData}
          availableRecommendations={Object.keys(comparison.recommendations) as RecommendationKey[]}
          initialFilters={initialFilters}
          initialSort={initialSort}
        />

        <AffiliateDisclosure dict={dict} className="mt-8 max-w-[80ch]" />
      </Container>

      <CountryFacts facts={facts} dict={dict} />
      <Faq dict={dict} structuredData={false} />
    </>
  );
}
