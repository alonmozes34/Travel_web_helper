import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { HeroSearch } from "@/components/search/HeroSearch";
import { AffiliateDisclosure } from "@/components/content/AffiliateDisclosure";
import { MockDataNotice } from "@/components/content/MockDataNotice";
import { countries, getCountryBySlug } from "@/data/countries";
import { isLocale, localeConfig, localePath, locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/getDictionary";
import { interpolate } from "@/i18n/interpolate";
import { siteUrl } from "@/lib/site";
import { tripProfileFromParams } from "@/lib/types/trip";
import { buildComparison } from "@/lib/comparison/buildComparison";
import { getDisplayCurrency } from "@/lib/currencyServer";
import { ResultsView } from "@/components/results/ResultsView";
import { CountryFacts } from "@/components/content/CountryFacts";
import { CoverageNotice } from "@/components/content/CoverageNotice";
import { Faq } from "@/components/content/Faq";
import { buildCountryFacts } from "@/lib/comparison/countryFacts";
import type { RecommendationKey } from "@/lib/comparison/recommend";
import { filtersFromParams } from "@/lib/comparison/filter";
import { isCountryCovered } from "@/lib/comparison/catalogueCoverage";
import { isSortKey } from "@/lib/comparison/sort";

/**
 * Every country on the globe has a page, but only the ones the catalogue can
 * answer for are worth pre-rendering. The rest render on demand — they are
 * rare, and their page is mostly a short "we have nothing here yet".
 */
export function generateStaticParams() {
  const worthPrerendering = countries.filter(
    (country) => country.popular || isCountryCovered(country.code),
  );
  return locales.flatMap((locale) =>
    worthPrerendering.map((country) => ({ locale, country: country.slug })),
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
    description: interpolate(dict.country.metaDescriptionTemplate, {
      country: name,
    }),
    metadataBase: new URL(siteUrl),
    alternates: {
      canonical: localePath(locale, path),
      languages: Object.fromEntries(
        locales.map((code) => [
          localeConfig[code].htmlLang,
          localePath(code, path),
        ]),
      ),
    },
  };
}

export default async function CountryPage({
  params,
  searchParams,
}: PageProps<"/[locale]/esim/[country]">) {
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
    if (typeof value === "string") queryParams.set(key, value);
    else if (Array.isArray(value) && value[0]) queryParams.set(key, value[0]);
  }
  const initialFilters = filtersFromParams(queryParams);
  const sortParam = queryParams.get("sort");
  const initialSort =
    sortParam && isSortKey(sortParam) ? sortParam : "recommended";
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

  // Three states, and the page must not look the same in all of them: plans
  // sold for this country, only regional or global plans that include it, or
  // nothing at all.
  const hasCountryPlan = comparison.rows.some(
    (row) => row.plan.coverage.kind === "country",
  );
  const coverageKind =
    comparison.rows.length === 0
      ? "none"
      : hasCountryPlan
        ? "full"
        : "broad-only";

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

          {/* The whole product is named after a word a first-time traveller
              does not know. One sentence, before anything else, so nobody has
              to guess what they are looking at. */}
          <p className="mt-3 max-w-[62ch] text-base text-ink-2">
            {dict.search.whatIsEsim}
          </p>

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
              variant="compact"
            />
          </div>
        </Container>
      </section>

      <Container className="py-10">
        <MockDataNotice dict={dict} className="max-w-[80ch]" />

        {coverageKind !== "full" && (
          <CoverageNotice
            kind={coverageKind}
            countryName={name}
            locale={locale}
            dict={dict}
          />
        )}

        {coverageKind !== "none" && (
          <>
            <p className="mt-6 text-base text-ink-2">
              <strong className="font-semibold text-ink">
                {interpolate(dict.results.summaryTemplate, {
                  plans: comparison.planCount,
                  providers: comparison.providerCount,
                })}
              </strong>
            </p>
            <p className="mt-1 mb-6 text-sm text-ink-2">
              {estimate.isDefault ? (
                dict.results.defaultEstimate
              ) : (
                <span className="font-semibold text-brand">
                  {/* A figure the traveller gave is reported back as theirs, not
                      re-described as our estimate of their usage. */}
                  {estimate.isStatedByTraveller
                    ? interpolate(dict.results.tailoredStatedTemplate, {
                        days: estimate.days,
                        gb: Math.round(estimate.requiredGb),
                      })
                    : interpolate(dict.results.tailoredTemplate, {
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
              availableRecommendations={
                Object.keys(comparison.recommendations) as RecommendationKey[]
              }
              initialFilters={initialFilters}
              initialSort={initialSort}
            />
          </>
        )}

        <AffiliateDisclosure dict={dict} className="mt-8 max-w-[80ch]" />
      </Container>

      {coverageKind !== "none" && <CountryFacts facts={facts} dict={dict} />}
      <Faq dict={dict} structuredData={false} />
    </>
  );
}
