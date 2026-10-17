import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MockDataNotice } from '@/components/content/MockDataNotice';
import { PageHeader } from '@/components/layout/PageHeader';
import { RegionPicker, type RegionCard, type RegionCountry } from '@/components/region/RegionPicker';
import { WorldPicker } from '@/components/region/WorldPicker';
import { Container } from '@/components/ui/Container';
import { getCountryByCode } from '@/data/countries';
import { getProvider } from '@/data/providers';
import { getRegionPage, regionPages } from '@/data/regionPages';
import { getRegionName } from '@/data/regions';
import { isLocale, localeConfig, localePath, locales, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/getDictionary';
import { interpolate } from '@/i18n/interpolate';
import { getCatalogue } from '@/lib/catalogue/getCatalogue';
import { coverageOf } from '@/lib/comparison/catalogueCoverage';
import { continentCounts, orderFamilies, pageFamilies, priceFamilies, type PricedFamily } from '@/lib/comparison/regionOffers';
import { getDisplayCurrency } from '@/lib/currencyServer';
import { formatData } from '@/lib/formatters/data';
import { formatPrice } from '@/lib/formatters/price';
import { siteUrl } from '@/lib/site';

export function generateStaticParams() {
  return locales.flatMap((locale) => regionPages.map((region) => ({ locale, region: region.id })));
}

// Prices follow the visitor's currency and the live catalogue, so this is
// rendered on request, like a country page.
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string; region: string }> }): Promise<Metadata> {
  const { locale, region: id } = await params;
  if (!isLocale(locale)) return {};
  const region = getRegionPage(id);
  if (!region) return {};
  const copy = getDictionary(locale).regionPage.regions[region.id];
  const path = `/esim/region/${region.id}`;
  return {
    title: copy.title,
    description: copy.description,
    metadataBase: new URL(siteUrl),
    alternates: {
      canonical: localePath(locale, path),
      languages: Object.fromEntries(locales.map((code) => [localeConfig[code].htmlLang, localePath(code, path)])),
    },
  };
}

/**
 * A region's page (the owner, 15 October 2026): the plans that cover several
 * of its countries, how many of them each one covers and which it leaves out,
 * and a way into the search with the countries of the trip.
 *
 * No buy button here. Which size fits depends on the days and the use, and
 * the search is where those are asked; a card that sent the visitor to buy
 * its cheapest size would be choosing for them.
 */
export default async function RegionPageView({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; region: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale: raw, region: id } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const region = getRegionPage(id);
  if (!region) notFound();
  const dict = getDictionary(locale);
  const copy = dict.regionPage;
  const words = copy.regions[region.id];

  const [{ plans, rates }, currency] = await Promise.all([getCatalogue(), getDisplayCurrency(locale)]);
  const families = orderFamilies(priceFamilies(pageFamilies(plans, region), currency, rates));
  const { isCovered } = coverageOf(plans);
  const mock = families.flatMap((family) => family.plans).filter((plan) => plan.source === 'mock').length;
  const allMock = mock > 0 && families.every((family) => family.plans.every((plan) => plan.source === 'mock'));

  const countryList: RegionCountry[] = region.countries.map((code) => {
    const country = getCountryByCode(code)!;
    return { code, name: country.names[locale], flag: country.flag, href: localePath(locale, `/esim/${country.slug}`), hasPlans: isCovered(code) };
  });
  const nameOf = new Map(countryList.map((country) => [country.code, country.name]));
  const cards = families.map((family) => card(family, locale, dict, nameOf, Boolean(region.world)));
  // Countries chosen in the search before the region was (`?to=HR,ME`), ticked.
  const asked = (await searchParams).to;
  const carried = (Array.isArray(asked) ? asked.join(',') : (asked ?? '')).split(',').map((code) => code.split(':')[0]);
  const initialTicked = region.countries.filter((code) => carried.includes(code));

  return (
    <>
      <PageHeader title={words.title} intro={words.intro} note={words.basisNote} />
      <Container className="py-10">
        {mock > 0 ? <MockDataNotice dict={dict} mixed={!allMock} className="mb-6 max-w-[80ch]" /> : null}
        {/* Across continents there is no short list to tick, so the trip's
            countries are typed, in the home page's search, and the plans below
            narrow to them as ticks narrow them on the other region pages (the
            owner, 17 October 2026: a page of plans with nothing to do on it). */}
        {region.world ? (
          <WorldPicker
            locale={locale}
            dict={dict}
            inRegion={words.inRegion}
            countries={countryList}
            cards={cards}
            initialChosen={initialTicked}
            searchPath={localePath(locale, '/search')}
          />
        ) : (
          <RegionPicker
            inRegion={words.inRegion}
            countries={countryList}
            cards={cards}
            initialTicked={initialTicked}
            copy={copy}
            searchPath={localePath(locale, '/search')}
          />
        )}

        {region.world ? null : (
        <section aria-labelledby="region-countries" className="mt-12 border-t border-line-soft pt-8">
          <h2 id="region-countries" className="font-head text-xl font-semibold">
            {interpolate(copy.countriesTitleTemplate, { inRegion: words.inRegion })}
          </h2>
          <ul className="mt-3 grid gap-x-4 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
            {countryList.map((country) => (
              <li key={country.code}>
                <Link href={country.href} className="flex min-h-11 items-center gap-2 rounded-sm px-1 text-base text-ink-2 hover:text-brand">
                  <span aria-hidden="true">{country.flag}</span>
                  <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">{country.name}</span>
                  {country.hasPlans ? null : <span className="shrink-0 text-sm text-ink-3">{copy.noPlansYet}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </section>
        )}
      </Container>
    </>
  );
}

function card(family: PricedFamily, locale: Locale, dict: ReturnType<typeof getDictionary>, nameOf: Map<string, string>, world: boolean): RegionCard {
  const provider = getProvider(family.providerId);
  const { coverage } = family;
  const label =
    coverage.kind === 'global'
      ? dict.search.coverageGlobal
      : (coverage.regionName ?? (coverage.regionId ? getRegionName(coverage.regionId, locale) : undefined) ?? null);
  const size = (plan: PricedFamily['cheapest']['plan']) => (plan.isUnlimited ? dict.regionPage.unlimitedSize : formatData(plan.dataAmountMb, locale));
  const period = (days: number) => (days === 1 ? dict.regionPage.forOneDay : interpolate(dict.regionPage.forDaysTemplate, { days }));
  return {
    key: family.key,
    providerId: family.providerId,
    providerName: provider?.name ?? family.providerId,
    label,
    covered: family.coveredCodes,
    coveredNames: family.coveredCodes.map((code) => nameOf.get(code) ?? code),
    missing: family.missingCodes.map((code) => nameOf.get(code) ?? code),
    outside: family.outsideCount,
    sizes: family.plans.length,
    cheapest: {
      price: formatPrice(family.cheapest.price.amountMinor, family.cheapest.price.currency, locale),
      size: size(family.cheapest.plan),
      period: period(family.cheapest.plan.validityDays),
    },
    bestPerGb: family.bestPerGb
      ? {
          perGb: formatPrice(family.bestPerGb.perGbMinor, family.bestPerGb.price.currency, locale),
          size: size(family.bestPerGb.plan),
          period: period(family.bestPerGb.plan.validityDays),
        }
      : null,
    hasUnlimited: family.hasUnlimited,
    // Across continents: how many countries on each, not which are missing.
    ...(world
      ? {
          continents: continentCounts(family.coveredCodes)
            .map(({ continent, count }) => `${getRegionName(continent, locale) ?? continent} ${count}`)
            .join(' · '),
        }
      : {}),
  };
}
