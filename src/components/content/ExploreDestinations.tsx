import Image from 'next/image';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { PhotoCredit } from '@/components/results/PhotoCredit';
import { getCountryByCode } from '@/data/countries';
import { destinationImages } from '@/data/destinationImages.generated';
import { localePath, type Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/getDictionary';

/**
 * Eight places Israelis fly to, as photographs to wander into — the owner
 * asked for a site people want to explore (3 October 2026). An editorial
 * choice of destinations, not of providers: each card opens the country's
 * comparison, where the order is the same for everyone.
 */
const EXPLORE = ['GR', 'IT', 'TH', 'JP', 'US', 'GB', 'AE', 'ES'] as const;

export function ExploreDestinations({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const copy = dict.home.explore;
  const tiles = EXPLORE.flatMap((code) => {
    const image = destinationImages[code];
    const country = getCountryByCode(code);
    return image && country ? [{ code, image, country }] : [];
  });
  if (tiles.length === 0) return null;

  return (
    <section aria-labelledby="explore-title" className="py-16 md:py-20">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold tracking-wide text-teal-ink">{copy.eyebrow}</p>
            <h2 id="explore-title" className="mt-1 font-head text-3xl font-bold md:text-4xl">
              {copy.title}
            </h2>
            <p className="mt-2 max-w-[56ch] text-lg text-ink-2">{copy.subtitle}</p>
          </div>
          <Link
            href={localePath(locale, '/esim')}
            className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-brand underline-offset-4 hover:underline"
          >
            {copy.allLink}
            <span aria-hidden="true">{copy.arrow}</span>
          </Link>
        </div>

        <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
          {tiles.map(({ code, image, country }) => (
            <li key={code} className="min-w-0">
              {/* A minimum height rather than an aspect ratio: at 200% text
                  the name has to be able to make the card taller, not be
                  clipped by it. */}
              <Link
                href={localePath(locale, `/esim/${country.slug}`)}
                className="group relative isolate flex min-h-[220px] items-end overflow-hidden rounded-[20px] bg-night shadow-sm transition-shadow duration-300 hover:shadow-lift sm:min-h-[300px]"
              >
                <Image
                  src={image.src}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 25vw, 50vw"
                  className="-z-10 object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <span aria-hidden="true" className="absolute inset-0 -z-10 bg-linear-to-t from-black/85 via-black/35 to-black/0" />
                <span className="block min-w-0 p-3 text-white sm:p-4 [overflow-wrap:anywhere]">
                  <span className="block font-head text-lg font-bold sm:text-xl">
                    <span aria-hidden="true">{country.flag}</span> {country.names[locale]}
                  </span>
                  {image.subject[locale] ? (
                    <span className="mt-0.5 block text-sm text-white/90">{image.subject[locale]}</span>
                  ) : null}
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <details className="mt-4 text-xs text-ink-3">
          <summary className="cursor-pointer">{copy.credits}</summary>
          <ul className="mt-2 grid gap-1 leading-6">
            {tiles.map(({ code, image, country }) => (
              <li key={code}>
                <PhotoCredit image={image} label={image.subject[locale] ?? country.names[locale]} multi dict={dict} />
              </li>
            ))}
          </ul>
        </details>
      </Container>
    </section>
  );
}
