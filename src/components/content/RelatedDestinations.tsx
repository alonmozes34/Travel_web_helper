import Link from 'next/link';
import { localePath, type Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/getDictionary';
import type { RelatedDestination } from '@/lib/comparison/relatedDestinations';

/**
 * Other destinations, from a destination page.
 *
 * Sits below the comparison and below the practical notes, because somebody
 * who arrived searching for "eSIM Greece" wants Greek prices, not a menu. Its
 * value is to the reader with a second stop and to a crawler that would
 * otherwise find every country page an island.
 *
 * A destination with nothing behind it is still listed and still labelled.
 * Hiding it would make the list look fuller than the catalogue is.
 */
export function RelatedDestinations({
  destinations,
  locale,
  dict,
}: {
  destinations: RelatedDestination[];
  locale: Locale;
  dict: Dictionary;
}) {
  if (destinations.length === 0) return null;

  return (
    <section className="border-t border-line-soft bg-surface-2 py-12">
      <div className="mx-auto w-full max-w-[1200px] px-5">
        <h2 className="font-head text-2xl font-semibold">{dict.relatedDestinations.title}</h2>
        <p className="mt-1 max-w-[70ch] text-ink-2">{dict.relatedDestinations.body}</p>

        <ul className="mt-5 flex flex-wrap gap-2">
          {destinations.map(({ country, covered }) => (
            <li key={country.code}>
              <Link
                href={localePath(locale, `/esim/${country.slug}`)}
                className="inline-flex min-h-11 items-center gap-2 rounded-md border border-line bg-surface px-4 text-base hover:border-brand hover:text-brand"
              >
                <span aria-hidden="true">{country.flag}</span>
                <span className="font-semibold">{country.names[locale]}</span>
                <span className={covered ? 'text-sm text-teal-ink' : 'text-sm text-ink-3'}>
                  {covered
                    ? dict.destinationIndex.coveredLabel
                    : dict.destinationIndex.notCoveredLabel}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
