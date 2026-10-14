import { bookingCities } from '@/data/booking-cities.generated';
import { getCountryByCode } from '@/data/countries';
import type { Locale } from '@/i18n/config';
import { BOOKING_CJ, LANGUAGE, attractionsCityName, bookingLink } from './links';

/**
 * What the Booking.com planner offers for a trip (the owner, 14 October 2026):
 * for each country, its cities, and for each city the links Booking really
 * open — hotels, car rental, attractions — plus the whole country for a
 * traveller who does not know yet. Built on the server for the trip's own
 * countries, so the page carries those and not every city of every country.
 *
 * A city's links exist only where its page opened when checked
 * (scripts/check-booking-cities.ts); a missing one is null and the planner
 * says there is none, rather than linking somewhere else.
 */

export type PlannerLinks = { hotels: string | null; cars: string | null; attractions: string | null };

export type PlannerPlace = {
  /** `IT` for the whole country, `IT/rome` for a city. */
  key: string;
  name: string;
  links: PlannerLinks;
  /** Where the attractions link of the whole country goes: its main city. */
  attractionsCity?: string;
};

export type PlannerCountry = { code: string; name: string; whole: PlannerPlace; cities: PlannerPlace[] };

const through = (page: string) => `${BOOKING_CJ.host}/links/${BOOKING_CJ.site}/type/dlg/${page}`;

/** The three city pages at Booking, by the address Booking gave the city. */
export function bookingCityPage(kind: keyof PlannerLinks, countryCode: string, slug: string, locale: Locale): string {
  const cc = countryCode.toLowerCase();
  const lang = LANGUAGE[locale];
  if (kind === 'hotels') return `https://www.booking.com/city/${cc}/${slug}.${lang}.html`;
  if (kind === 'cars') return `https://www.booking.com/cars/city/${cc}/${slug}.${lang}.html`;
  return `https://www.booking.com/things-to-do/city/${cc}/${slug}.${lang}.html`;
}

export function plannerCountries(countryCodes: readonly string[], locale: Locale): PlannerCountry[] {
  const seen = new Set<string>();
  const out: PlannerCountry[] = [];
  for (const code of countryCodes) {
    const country = getCountryByCode(code);
    const hotels = bookingLink('hotels', code, locale);
    if (!country || !hotels || seen.has(code)) continue;
    seen.add(code);
    const attractionsCity = attractionsCityName(code, locale);
    out.push({
      code,
      name: country.names[locale],
      whole: {
        key: code,
        name: country.names[locale],
        links: { hotels, cars: bookingLink('cars', code, locale), attractions: attractionsCity ? bookingLink('attractions', code, locale) : null },
        ...(attractionsCity ? { attractionsCity } : {}),
      },
      cities: (bookingCities[code] ?? []).map((city) => ({
        key: `${code}/${city.slug}`,
        name: city[locale],
        links: {
          hotels: through(bookingCityPage('hotels', code, city.slug, locale)),
          cars: city.cars ? through(bookingCityPage('cars', code, city.slug, locale)) : null,
          attractions: city.attractions ? through(bookingCityPage('attractions', code, city.slug, locale)) : null,
        },
      })),
    });
  }
  return out;
}
