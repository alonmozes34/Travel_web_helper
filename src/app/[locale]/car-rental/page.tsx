import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { RentalResults } from '@/components/carRental/RentalResults';
import { RentalSearchForm } from '@/components/carRental/RentalSearchForm';
import { Container } from '@/components/ui/Container';
import { getCountryByCode } from '@/data/countries';
import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/getDictionary';
import { interpolate } from '@/i18n/interpolate';
import { searchRentals } from '@/lib/carRental/registry';
import { isSearchable, rentalQueryFromParams } from '@/lib/carRental/query';
import { getCatalogue } from '@/lib/catalogue/getCatalogue';
import { getDisplayCurrency } from '@/lib/currencyServer';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return {
    title: dict.carRentalPage.title,
    description: dict.carRentalPage.intro,
    // A search result page is not an index target, and this one currently
    // renders demo offers. It stays out of search regardless of the site-wide
    // switch.
    robots: { index: false, follow: true },
  };
}

/**
 * Car rental — the first "trip extra".
 *
 * It opens in its own tab, from the offer that appears once a traveller has
 * clicked through to an eSIM provider. That is deliberate and is the whole
 * design constraint: the eSIM comparison must still be sitting untouched in
 * the tab behind this one, because the eSIM click is the conversion that pays
 * for the site and nothing here may delay or undo it.
 *
 * The country arrives from the eSIM search. Nothing else can: the trip
 * profile stores a country and a number of days, so the city, the dates and
 * the driver's age are the traveller's to give, and the page asks rather than
 * guessing a city on their behalf.
 */
export default async function CarRentalPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const dict = getDictionary(locale);
  const page = dict.carRentalPage;

  const query = rentalQueryFromParams(await searchParams);
  const searchable = isSearchable(query);
  const summary = searchable ? await searchRentals(query) : null;

  const country = query.countryCode ? getCountryByCode(query.countryCode) : undefined;
  const currency = await getDisplayCurrency(locale);
  const { rates } = await getCatalogue();

  return (
    <Container className="py-12">
      <h1 className="font-head text-3xl font-bold tracking-tight sm:text-4xl">{page.title}</h1>
      <p className="mt-4 max-w-[70ch] text-lg text-ink-2">{page.intro}</p>

      {summary?.allDemo ? (
        <div className="mt-6 max-w-[70ch] rounded-sm bg-warn-50 px-4 py-3 text-warn-ink">
          <p className="font-head font-semibold">
            <span aria-hidden="true">⚠︎ </span>
            {page.demo.title}
          </p>
          <p className="mt-1 text-sm">{page.demo.body}</p>
        </div>
      ) : null}

      {country ? (
        <p className="mt-4 text-ink-2">
          {interpolate(page.countryKnownTemplate, { country: country.names[locale] })}
        </p>
      ) : null}
      {country && !query.pickupLocation ? (
        <p className="mt-2 max-w-[70ch] text-ink-2">{page.needPickup}</p>
      ) : null}

      <RentalSearchForm query={query} locale={locale} dict={dict} />

      {summary ? (
        <RentalResults
          offers={summary.offers}
          locale={locale}
          dict={dict}
          currency={currency}
          rates={rates}
          markDemoRows={summary.mixed}
          searchedLocation={query.pickupLocation}
        />
      ) : (
        <p className="mt-6 text-ink-2">{page.results.notSearched}</p>
      )}
    </Container>
  );
}
