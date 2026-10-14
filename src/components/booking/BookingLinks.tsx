import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/getDictionary';
import { interpolate } from '@/i18n/interpolate';
import { attractionsCityName, bookingLink } from '@/lib/booking/links';
import { CountedLink } from '@/components/stats/CountedLink';
import { BookingLogo } from './BookingLogo';

/**
 * Hotels and car rental for the destination, on Booking.com (the owner,
 * 6 October 2026), and attractions in its main city where Booking has a page
 * for it (14 October 2026). Links only — no prices, no comparison: Booking forbid
 * putting their inventory next to anyone else's, and the card says plainly
 * that the site is only linking here.
 */
export function BookingLinks({
  countryCode,
  countryName,
  locale,
  dict,
}: {
  countryCode: string;
  countryName: string;
  locale: Locale;
  dict: Dictionary;
}) {
  const copy = dict.booking;
  // Attractions are a city's page at Booking, and the button names the city.
  const city = attractionsCityName(countryCode, locale);
  const links = [
    { kind: 'hotels' as const, icon: '🏨', label: interpolate(copy.hotelsTemplate, { country: countryName }), href: bookingLink('hotels', countryCode, locale) },
    { kind: 'cars' as const, icon: '🚗', label: interpolate(copy.carsTemplate, { country: countryName }), href: bookingLink('cars', countryCode, locale) },
    { kind: 'attractions' as const, icon: '🎟️', label: interpolate(copy.attractionsTemplate, { city: city ?? '' }), href: city ? bookingLink('attractions', countryCode, locale) : null },
  ].filter((link): link is typeof link & { href: string } => Boolean(link.href));
  const withAttractions = links.some((link) => link.kind === 'attractions');
  if (links.length === 0) return null;

  return (
    <section aria-labelledby="booking-title" className="mt-10 max-w-[80ch] rounded-[20px] border border-line bg-surface p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="booking-title" className="font-head text-xl font-semibold">
          {interpolate(copy.titleTemplate, { country: countryName })}
        </h2>
        <BookingLogo className="border border-line" />
      </div>
      <p className="mt-1 text-ink-2">{interpolate(withAttractions ? copy.introWithAttractionsTemplate : copy.introTemplate, { country: countryName })}</p>
      <ul className={`mt-4 grid gap-3 ${links.length === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
        {links.map((link) => (
          <li key={link.kind} className="min-w-0">
            <CountedLink
              event={{ e: 'booking', step: `page-${link.kind}`, to: countryCode }}
              href={link.href}
              target="_blank"
              rel="sponsored noopener noreferrer"
              className="flex min-h-16 items-center gap-3 rounded-[14px] border border-line bg-canvas px-4 py-3 font-semibold text-ink transition-colors hover:border-brand [overflow-wrap:anywhere]"
            >
              <span aria-hidden="true" className="text-2xl">
                {link.icon}
              </span>
              <span className="min-w-0">
                <span className="block text-brand underline underline-offset-2">
                  {link.label}
                </span>
                <span className="block text-sm font-normal text-ink-2">{copy.onBooking}</span>
              </span>
              <span className="sr-only"> {copy.opensInNewTab}</span>
            </CountedLink>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-sm text-ink-2">{copy.disclosure}</p>
    </section>
  );
}
