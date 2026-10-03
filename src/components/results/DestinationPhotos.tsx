import Image from 'next/image';
import { cn } from '@/components/ui/cn';
import { getCountryByCode } from '@/data/countries';
import { destinationImages } from '@/data/destinationImages.generated';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/getDictionary';
import { PhotoCredit } from './PhotoCredit';

const MAX_TILES = 4;

/**
 * A photograph of the destination at the top of its results — for one country
 * one photograph, named for what it shows; for a trip through several the
 * first four side by side, each named for its country. The owner asked for
 * warmth, "a famous picture from there" — the landmark everyone knows, or the
 * capital (29 September 2026).
 *
 * Each is from Wikimedia Commons under a
 * free licence, kept on our own site (`scripts/fetch-destination-images.ts`,
 * public/destinations/) so a visitor's browser contacts nobody else; credited below it as
 * the licence asks: photographer, licence, and a link to the file's page. The
 * pictures are decoration — the page says where the trip goes in its heading
 * — so they carry no alternative text; the credits are ordinary links.
 */
export function DestinationPhotos({
  countryCodes,
  locale,
  dict,
  className,
}: {
  countryCodes: string[];
  locale: Locale;
  dict: Dictionary;
  className?: string;
}) {
  const tiles = [...new Set(countryCodes)]
    .map((code) => ({ code, image: destinationImages[code], country: getCountryByCode(code) }))
    .filter((tile): tile is typeof tile & { image: NonNullable<typeof tile.image> } => Boolean(tile.image))
    .slice(0, MAX_TILES);
  if (tiles.length === 0) return null;
  const single = tiles.length === 1;

  return (
    <figure className={cn('m-0', className)}>
      <div
        className={cn(
          'grid gap-1 overflow-hidden rounded-lg',
          single && 'md:max-w-xl',
          tiles.length === 2 && 'grid-cols-2',
          tiles.length === 3 && 'grid-cols-3',
          tiles.length === 4 && 'grid-cols-2 md:grid-cols-4',
        )}
      >
        {tiles.map((tile, index) => (
          <div
            key={tile.code}
            className={cn('relative bg-surface-2', single ? 'aspect-video' : 'aspect-[4/3] md:aspect-auto md:h-48')}
          >
            <Image
              src={tile.image.src}
              alt=""
              fill
              sizes={single ? '(min-width: 768px) 576px, 100vw' : `(min-width: 768px) ${Math.round(100 / tiles.length)}vw, 50vw`}
              className="object-cover"
              fetchPriority={index === 0 ? 'high' : undefined}
            />
            {single && !tile.image.subject[locale] ? null : (
              <span className="absolute start-2 bottom-2 rounded-full bg-surface/95 px-2.5 py-0.5 text-sm font-semibold text-ink shadow-sm">
                {single ? tile.image.subject[locale] : (tile.country?.names[locale] ?? tile.code)}
              </span>
            )}
          </div>
        ))}
      </div>
      <figcaption className="mt-1 text-xs leading-6 text-ink-3">
        {tiles.map((tile, index) => (
          <span key={tile.code}>
            {index > 0 ? ' · ' : null}
            <PhotoCredit
              image={tile.image}
              label={tile.image.subject[locale] ?? tile.country?.names[locale] ?? tile.code}
              multi={!single}
              dict={dict}
            />
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
