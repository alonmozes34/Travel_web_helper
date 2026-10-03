import Image from 'next/image';
import { destinationImages } from '@/data/destinationImages.generated';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/getDictionary';
import { PhotoCredit } from './PhotoCredit';

/**
 * The top of a country page: the destination's photograph across the width
 * of the page, with the page's heading written on it (the owner, 3 October
 * 2026: a look that makes people want to explore).
 *
 * The heading sits on the darkest part of a black gradient laid over the
 * photograph, so white text holds its contrast whatever the photograph
 * behind it is. The banner has a minimum height, not a fixed one: at 200%
 * text the heading makes it taller instead of being cut off. Without a
 * photograph the heading stands on its own, as before.
 */
export function CountryHero({
  countryCode,
  flag,
  title,
  locale,
  dict,
}: {
  countryCode: string;
  flag: string;
  title: string;
  locale: Locale;
  dict: Dictionary;
}) {
  const image = destinationImages[countryCode];
  const heading = (
    <>
      <span aria-hidden="true">{flag}</span>
      {title}
    </>
  );

  if (!image) {
    return <h1 className="flex flex-wrap items-center gap-3 text-3xl font-bold tracking-tight md:text-4xl">{heading}</h1>;
  }

  const subject = image.subject[locale];
  return (
    <div>
      <div className="relative isolate flex min-h-[240px] items-end overflow-hidden rounded-[24px] bg-night sm:min-h-[300px] md:min-h-[380px]">
        <Image
          src={image.src}
          alt=""
          fill
          sizes="(min-width: 1200px) 1160px, 100vw"
          className="-z-10 object-cover"
          fetchPriority="high"
        />
        <span aria-hidden="true" className="absolute inset-0 -z-10 bg-linear-to-t from-black/90 via-black/50 to-black/0" />
        <div className="min-w-0 p-5 text-white md:p-8">
          {subject ? (
            <p className="mb-3 inline-block rounded-full bg-black/55 px-3 py-0.5 text-sm font-semibold text-white">{subject}</p>
          ) : null}
          <h1 className="flex flex-wrap items-center gap-3 text-4xl font-bold tracking-tight text-white [overflow-wrap:anywhere] md:text-5xl">
            {heading}
          </h1>
        </div>
      </div>
      <p className="mt-1 text-xs leading-6 text-ink-3">
        <PhotoCredit image={image} label={subject ?? title} dict={dict} />
      </p>
    </div>
  );
}
