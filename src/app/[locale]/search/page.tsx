import type { Metadata } from "next";
import { LoadingComplete } from '@/components/ui/LoadingComplete';
import { DestinationPhotos } from '@/components/results/DestinationPhotos';
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { HeroSearch } from "@/components/search/HeroSearch";
import { ResultsView } from "@/components/results/ResultsView";
import { CombinationCard } from "@/components/comparison/CombinationCard";
import { TripExtrasProvider } from "@/components/extras/TripExtrasProvider";
import { TripExtrasSlot } from "@/components/extras/TripExtrasSlot";
import { carRentalOfferEnabled } from "@/lib/carRental/registry";
import { AffiliateDisclosure } from "@/components/content/AffiliateDisclosure";
import { MockDataNotice } from "@/components/content/MockDataNotice";
import { countries } from "@/data/countries";
import { isLocale, localePath } from "@/i18n/config";
import { getPriceSummary } from "@/lib/priceHistory/store";
import { trendFor } from "@/lib/priceHistory/summary";
import { ShareSearch } from "@/components/results/ShareSearch";
import { siteUrl } from "@/lib/site";
import { getDictionary } from "@/i18n/getDictionary";
import { interpolate } from "@/i18n/interpolate";
import { buildComparison } from "@/lib/comparison/buildComparison";
import { getCatalogue } from '@/lib/catalogue/getCatalogue';
import { filtersFromParams } from "@/lib/comparison/filter";
import type { RecommendationKey } from "@/lib/comparison/recommend";
import { isSortKey, DEFAULT_SORT } from "@/lib/comparison/sort";
import { shouldOfferCombination } from "@/lib/comparison/buildCombination";
import { getDisplayCurrency } from "@/lib/currencyServer";
import { tripProfileFromParams } from "@/lib/types/trip";
import { coverageOf } from "@/lib/comparison/catalogueCoverage";

const byCode = new Map(countries.map((country) => [country.code, country]));

/**
 * The tab names the trip. Every search once shared the home page's title, so
 * someone with two searches open — or a screen reader announcing the page on
 * arrival — could not tell them apart (WCAG 2.4.2).
 */
export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const { locale } = await params;
  // A search result is a private query, not a page for a search engine.
  const robots = { index: false, follow: false };
  if (!isLocale(locale)) return { robots };
  const dict = getDictionary(locale);
  const names = tripProfileFromParams(await searchParams)
    .destinations.map((d) => byCode.get(d.countryCode)?.names[locale])
    .filter((name): name is string => Boolean(name));
  const title = names.length
    ? interpolate(dict.searchMeta.titleTemplate, {
        countries: new Intl.ListFormat(locale === 'he' ? 'he' : 'en', { type: 'conjunction' }).format(names),
      })
    : dict.searchMeta.emptyTitle;
  return { title, robots };
}

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

  // One place resolves where plans and rates come from; this page asks for a
  // catalogue and knows nothing about who supplied it.
  const [catalogue, priceSummary] = await Promise.all([getCatalogue(), getPriceSummary()]);
  const comparison = buildComparison({
    profile,
    currency: await getDisplayCurrency(locale),
    plans: catalogue.plans,
    rates: catalogue.rates,
  });
  const { estimate, combination } = comparison;
  const { isCovered: isCountryCovered } = coverageOf(catalogue.plans);

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

  // Two purchases and two installations are only worth offering when they
  // cost less than one plan that covers the whole trip.
  const { offer: showCombination, cheapestSingleMinor } = shouldOfferCombination(combination, comparison.rows);

  const empty = profile.destinations.length === 0;

  return (
    <>
      <LoadingComplete />
      {/* With no trip yet, the page is the home page's first screen: the
          question on the night ground and the search in a white card. */}
      <section
        className={
          empty
            ? "on-night bg-hero pt-10 pb-12 text-on-night md:pt-14"
            : "bg-surface pt-6 pb-8 md:pt-8"
        }
      >
        <Container>
          <DestinationPhotos
            countryCodes={profile.destinations.map((destination) => destination.countryCode)}
            locale={locale}
            dict={dict}
            className="mb-6"
          />
          <h1
            className={`text-3xl font-bold tracking-tight md:text-4xl${empty ? " text-on-night" : ""}`}
          >
            {names
              ? interpolate(dict.search.multiTitleTemplate, {
                  destinations: names,
                })
              : dict.search.chooseFirst}
          </h1>
          <div
            className={
              empty
                ? "on-light mt-6 max-w-[720px] rounded-[24px] bg-surface p-3 text-ink shadow-hero sm:p-5"
                : "mt-6"
            }
          >
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
            {/* Only while something on the page is invented. Once every plan comes
                from a real source the warning is not merely unnecessary, it is
                false — and a warning that cries wolf is how a real one stops
                being read. */}
            {comparison.isMockData ? (
              <MockDataNotice
            dict={dict}
            mixed={!comparison.allMockData}
            className="max-w-[80ch]"
          />
            ) : null}

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
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <p className="text-base text-ink-2">
                  <strong className="font-semibold text-ink">
                    {interpolate(comparison.providerCount === 1 ? dict.results.summaryOneProviderTemplate : dict.results.summaryTemplate, {
                      plans: comparison.planCount,
                      providers: comparison.providerCount,
                    })}
                  </strong>
                </p>
                <ShareSearch
                  message={interpolate(estimate.isDefault ? dict.share.messageNoDaysTemplate : dict.share.messageTemplate, {
                    country: names,
                    days: estimate.days,
                  })}
                  label={dict.share.whatsapp}
                  opensInNewTab={dict.share.opensInNewTab}
                  initialUrl={`${siteUrl}${localePath(locale, "/search")}${queryParams.size ? `?${queryParams}` : ""}`}
                />
              </div>
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

            {/* One provider around both selection paths: a leg of the
                combination and a row in the list are the same act, and a
                traveller who clicks both must still see one offer. */}
            <TripExtrasProvider
              locale={locale}
              carRentalOffer={carRentalOfferEnabled()}
              countryCode={comparison.countryCodes[0]}
              tripDays={estimate.days}
            >
              {combination && showCombination ? (
                <div className="mb-8">
                  <CombinationCard
                    combination={combination}
                    cheapestSingleMinor={cheapestSingleMinor}
                    locale={locale}
                    dict={dict}
                  />
                </div>
              ) : null}

              <TripExtrasSlot dict={dict} />

              {comparison.rows.length > 0 ? (
                <ResultsView
                  rows={comparison.rows.map((row) => ({ ...row, trend: trendFor(row.plan, priceSummary) }))}
                  locale={locale}
                  dict={dict}
                  currency={comparison.currency}
                  tripDays={estimate.days}
                  countryCodes={comparison.countryCodes}
                  demoDataEnabled={comparison.isMockData}
                  demoDataMixed={comparison.isMockData && !comparison.allMockData}
                  availableRecommendations={
                    Object.keys(comparison.recommendations) as RecommendationKey[]
                  }
                  initialFilters={filtersFromParams(queryParams)}
                  initialSort={
                    sortParam && isSortKey(sortParam) ? sortParam : DEFAULT_SORT
                  }
                />
              ) : null}
            </TripExtrasProvider>

            <AffiliateDisclosure dict={dict} className="mt-8 max-w-[80ch]" />
          </>
        )}
      </Container>
    </>
  );
}
