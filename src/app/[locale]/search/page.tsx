import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { HeroSearch } from "@/components/search/HeroSearch";
import { ResultsView } from "@/components/results/ResultsView";
import { CombinationCard } from "@/components/comparison/CombinationCard";
import { AffiliateDisclosure } from "@/components/content/AffiliateDisclosure";
import { MockDataNotice } from "@/components/content/MockDataNotice";
import { countries } from "@/data/countries";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/getDictionary";
import { interpolate } from "@/i18n/interpolate";
import { buildComparison } from "@/lib/comparison/buildComparison";
import { filtersFromParams } from "@/lib/comparison/filter";
import type { RecommendationKey } from "@/lib/comparison/recommend";
import { isSortKey } from "@/lib/comparison/sort";
import { getDisplayCurrency } from "@/lib/currencyServer";
import { tripProfileFromParams } from "@/lib/types/trip";
import { isCountryCovered } from "@/lib/comparison/catalogueCoverage";

export const metadata: Metadata = {
  // A search result is a private query, not a page for a search engine.
  robots: { index: false, follow: false },
};

const byCode = new Map(countries.map((country) => [country.code, country]));

/**
 * Multi-stop search.
 *
 * Single-destination searches keep their own indexable country URL; this page
 * exists for trips with more than one stop, which no country page can answer.
 */
export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = getDictionary(locale);
  const query = await searchParams;
  const profile = tripProfileFromParams(query);

  const queryParams = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (typeof value === "string") queryParams.set(key, value);
    else if (Array.isArray(value) && value[0]) queryParams.set(key, value[0]);
  }
  const sortParam = queryParams.get("sort");

  const comparison = buildComparison({
    profile,
    currency: await getDisplayCurrency(locale),
  });
  const { estimate, combination } = comparison;

  const names = profile.destinations
    .map(
      (destination) =>
        byCode.get(destination.countryCode)?.names[locale] ??
        destination.countryCode,
    )
    .join(" + ");

  // A stop nothing covers is why a trip has no answer, and naming it is more
  // use than reporting zero results for the trip as a whole.
  const uncovered = profile.destinations
    .filter((destination) => !isCountryCovered(destination.countryCode))
    .map(
      (destination) =>
        byCode.get(destination.countryCode)?.names[locale] ??
        destination.countryCode,
    );

  const cheapestSingleMinor = comparison.rows.length
    ? Math.min(...comparison.rows.map((row) => row.price.amountMinor))
    : null;

  return (
    <>
      <section className="bg-surface pt-10 pb-8">
        <Container>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            {names
              ? interpolate(dict.search.multiTitleTemplate, {
                  destinations: names,
                })
              : dict.search.chooseFirst}
          </h1>
          <div className="mt-6">
            <HeroSearch
              locale={locale}
              dict={dict}
              initialProfile={profile}
              showPopular={false}
            />
          </div>
        </Container>
      </section>

      <Container className="py-10">
        {profile.destinations.length === 0 ? (
          <div className="rounded-lg border border-dashed border-line bg-surface p-8 text-center">
            <p className="font-head text-lg font-semibold">
              {dict.search.emptyTitle}
            </p>
            <p className="mx-auto mt-2 max-w-[52ch] text-base text-ink-2">
              {dict.search.emptyBody}
            </p>
          </div>
        ) : (
          <>
            <MockDataNotice dict={dict} className="max-w-[80ch]" />

            {uncovered.length > 0 ? (
              <section className="mt-6 max-w-[80ch] rounded-md border border-line bg-surface px-5 py-4">
                <h2 className="text-lg font-semibold text-ink">
                  {interpolate(dict.search.uncoveredTitleTemplate, {
                    destinations: uncovered.join(", "),
                  })}
                </h2>
                <p className="mt-2 text-base text-ink-2">
                  {uncovered.length === profile.destinations.length
                    ? dict.search.uncoveredBodyAll
                    : dict.search.uncoveredBodyPartial}
                </p>
              </section>
            ) : null}

            {comparison.rows.length > 0 || combination ? (
              <p className="mt-6 text-base text-ink-2">
                <strong className="font-semibold text-ink">
                  {interpolate(dict.results.summaryTemplate, {
                    plans: comparison.planCount,
                    providers: comparison.providerCount,
                  })}
                </strong>
              </p>
            ) : null}
            <p className="mt-1 text-sm text-ink-2">
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

            {/* On a multi-stop trip the total is not what a traveller can act on;
            what each stop needs is. */}
            {estimate.legs.length > 1 ? (
              <ul className="mt-1 mb-6 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-3">
                {estimate.legs.map((leg) => (
                  <li key={leg.countryCode}>
                    {interpolate(dict.results.legEstimateTemplate, {
                      country:
                        byCode.get(leg.countryCode)?.names[locale] ??
                        leg.countryCode,
                      days: leg.days,
                      // "1 ימים" is wrong in Hebrew; the unit follows the number.
                      unit: leg.days === 1 ? dict.units.day : dict.units.days,
                      gb: Math.max(1, Math.round(leg.requiredGb)),
                    })}
                    {leg.isAssumedLength ? " *" : ""}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mb-6" />
            )}

            {comparison.rows.length === 0 && combination ? (
              <p className="mb-4 rounded-sm border-s-[3px] border-s-warn-ink bg-warn-50 px-3 py-2 text-sm text-warn-ink">
                {dict.search.noFullCoverage}
              </p>
            ) : null}

            {combination ? (
              <div className="mb-8">
                <CombinationCard
                  combination={combination}
                  cheapestSingleMinor={cheapestSingleMinor}
                  locale={locale}
                  dict={dict}
                />
              </div>
            ) : null}

            {comparison.rows.length > 0 ? (
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
                initialFilters={filtersFromParams(queryParams)}
                initialSort={
                  sortParam && isSortKey(sortParam) ? sortParam : "recommended"
                }
              />
            ) : null}

            <AffiliateDisclosure dict={dict} className="mt-8 max-w-[80ch]" />
          </>
        )}
      </Container>
    </>
  );
}
