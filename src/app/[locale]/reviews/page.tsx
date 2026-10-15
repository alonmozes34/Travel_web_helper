import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { ReviewForm } from '@/components/reviews/ReviewForm';
import { ReviewList } from '@/components/reviews/ReviewList';
import { Container } from '@/components/ui/Container';
import { countries } from '@/data/countries';
import { providers } from '@/data/providers';
import { isLocale, localeConfig, localePath, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/getDictionary';
import { monthLabel } from '@/lib/reviews/format';
import { newestFirst, tripMonths } from '@/lib/reviews/reviews';
import { reviewStoreFromEnv } from '@/lib/reviews/store';
import { israelDay } from '@/lib/stats/store';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const copy = getDictionary(locale).reviewsPage;
  return { title: copy.title, description: copy.intro };
}

// Published reviews are read from the store on each request.
export const dynamic = 'force-dynamic';

/**
 * Travellers' reviews of the providers (the owner, 15 October 2026): what
 * has been published, and the box to write one. Every review is read by the
 * owner before it appears, and none is ever an input to the comparison.
 */
export default async function ReviewsPage({
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
  const copy = dict.reviewsPage;
  const query = await searchParams;
  const asked = typeof query.provider === 'string' ? query.provider : '';
  const filter = providers.some((provider) => provider.id === asked) ? asked : null;

  const store = reviewStoreFromEnv();
  const published = store ? newestFirst(await store.published().catch(() => [])) : [];
  const shown = filter ? published.filter((review) => review.providerId === filter) : published;

  const collator = new Intl.Collator(localeConfig[locale].intlLocale);
  const countryOptions = countries
    .filter((country) => country.continent !== 'antarctic' && country.code !== 'IL')
    .map((country) => ({ value: country.code, label: country.names[locale] }))
    .sort((a, b) => collator.compare(a.label, b.label));
  const providerOptions = providers.map((provider) => ({ value: provider.id, label: provider.name }));
  const monthOptions = tripMonths(israelDay()).map((month) => ({ value: month, label: monthLabel(month, locale) }));
  const reviewsPath = localePath(locale, '/reviews');

  return (
    <>
      <PageHeader title={copy.title} intro={copy.intro} note={copy.disclaimer} narrow />
      <Container className="max-w-[76ch] py-10">
        <section aria-labelledby="reviews-list">
          <h2 id="reviews-list" className="font-head text-xl font-semibold">
            {copy.listTitle}
          </h2>
          {published.length > 0 ? (
            <nav aria-label={copy.filterLabel} className="mt-3">
              <ul className="flex flex-wrap gap-2">
                {[{ id: null, name: copy.allProviders }, ...providers.map((provider) => ({ id: provider.id, name: provider.name }))].map((item) => {
                  const current = item.id === filter;
                  return (
                    <li key={item.id ?? 'all'}>
                      <Link
                        href={item.id ? `${reviewsPath}?provider=${item.id}` : reviewsPath}
                        aria-current={current ? 'page' : undefined}
                        className={`inline-flex min-h-11 items-center rounded-md border px-4 text-base font-semibold ${current ? 'border-brand bg-brand-50 text-brand' : 'border-line bg-surface text-ink hover:border-brand'}`}
                      >
                        {item.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          ) : null}
          <ReviewList reviews={shown} locale={locale} copy={copy} empty={published.length === 0 ? copy.empty : copy.emptyFiltered} />
        </section>

        <section aria-labelledby="reviews-form" className="mt-12 rounded-[20px] border border-line bg-surface p-5 md:p-6">
          <h2 id="reviews-form" className="font-head text-xl font-semibold">
            {copy.formTitle}
          </h2>
          <p className="mt-1 mb-6 text-ink-2">{copy.formIntro}</p>
          <ReviewForm
            locale={locale}
            copy={copy}
            providers={providerOptions}
            countries={countryOptions}
            months={monthOptions}
            privacyHref={localePath(locale, '/privacy')}
            contactHref={localePath(locale, '/contact')}
          />
        </section>
      </Container>
    </>
  );
}
