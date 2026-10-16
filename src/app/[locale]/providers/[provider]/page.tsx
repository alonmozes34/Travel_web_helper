import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { ProviderLogo } from '@/components/plans/ProviderCell';
import { ReviewList } from '@/components/reviews/ReviewList';
import { Container } from '@/components/ui/Container';
import { getProviderProfile, profileFactKeys } from '@/data/providerProfiles';
import { providers } from '@/data/providers';
import { promotions } from '@/data/promotions';
import { isLocale, localeConfig, localePath, locales, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/getDictionary';
import { interpolate } from '@/i18n/interpolate';
import { getCatalogue } from '@/lib/catalogue/getCatalogue';
import { providerSummary } from '@/lib/comparison/providerSummary';
import { getDisplayCurrency } from '@/lib/currencyServer';
import { formatData } from '@/lib/formatters/data';
import { formatPrice } from '@/lib/formatters/price';
import { isPromotionActive } from '@/lib/pricing/promotions';
import { dayLabel } from '@/lib/reviews/format';
import { newestFirst } from '@/lib/reviews/reviews';
import { reviewStoreFromEnv } from '@/lib/reviews/store';
import { siteUrl } from '@/lib/site';
import { israelDay } from '@/lib/stats/store';

const bySlug = (slug: string) => providers.find((provider) => provider.slug === slug);

export function generateStaticParams() {
  return locales.flatMap((locale) => providers.map((provider) => ({ locale, provider: provider.slug })));
}

// The plans, prices and reviews are read on each request.
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string; provider: string }> }): Promise<Metadata> {
  const { locale, provider: slug } = await params;
  if (!isLocale(locale)) return {};
  const provider = bySlug(slug);
  if (!provider) return {};
  const copy = getDictionary(locale).providerPage;
  const path = `/providers/${provider.slug}`;
  return {
    title: interpolate(copy.titleTemplate, { provider: provider.name }),
    description: interpolate(copy.introTemplate, { provider: provider.name }),
    metadataBase: new URL(siteUrl),
    alternates: {
      canonical: localePath(locale, path),
      languages: Object.fromEntries(locales.map((code) => [localeConfig[code].htmlLang, localePath(code, path)])),
    },
  };
}

/**
 * A provider's page (the owner, 15–16 October 2026): what the provider
 * publishes about refunds, installation, support and the rest — each fact
 * with its source page and the day it was read — beside what the comparison
 * holds for it, and what travellers wrote. Nothing here is an input to the
 * ranking.
 */
export default async function ProviderPage({ params }: { params: Promise<{ locale: string; provider: string }> }) {
  const { locale: raw, provider: slug } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const provider = bySlug(slug);
  if (!provider) notFound();
  const dict = getDictionary(locale);
  const copy = dict.providerPage;
  const name = provider.name;

  const [{ plans, rates }, currency] = await Promise.all([getCatalogue(), getDisplayCurrency(locale)]);
  const summary = providerSummary(plans, provider.id, currency, rates);
  const profile = getProviderProfile(provider.id);
  const promotion = promotions.find((entry) => entry.providerId === provider.id && isPromotionActive(entry, israelDay()));
  const store = reviewStoreFromEnv();
  const reviews = store
    ? newestFirst((await store.published().catch(() => [])).filter((review) => review.providerId === provider.id))
    : [];

  return (
    <>
      <PageHeader
        title={interpolate(copy.titleTemplate, { provider: name })}
        intro={interpolate(copy.introTemplate, { provider: name })}
        note={copy.disclaimer}
        narrow
      />
      <Container className="max-w-[76ch] py-10">
        <section aria-labelledby="provider-on-site" className="rounded-[20px] border border-line bg-surface p-5 md:p-6">
          <div className="flex flex-wrap items-center gap-3">
            <ProviderLogo provider={provider} />
            <h2 id="provider-on-site" className="font-head text-xl font-semibold">
              {copy.onSiteTitle}
            </h2>
          </div>
          {summary.planCount === 0 ? (
            <p className="mt-3 text-ink-2">{copy.noPlans}</p>
          ) : (
            <ul className="mt-3 grid list-disc gap-1 ps-5 text-ink">
              <li>
                {interpolate(copy.plansTemplate, { count: summary.planCount, destinations: summary.destinationCount })}
                {summary.multiCountryCount > 0 ? `, ${interpolate(copy.multiTemplate, { count: summary.multiCountryCount })}` : ''}
              </li>
              {summary.hasUnlimited ? <li>{copy.unlimited}</li> : null}
              {summary.cheapest ? (
                <li>
                  {interpolate(copy.cheapestTemplate, {
                    price: formatPrice(summary.cheapest.price.amountMinor, summary.cheapest.price.currency, locale),
                  })}{' '}
                  <span className="text-ink-2">
                    ({summary.cheapest.plan.isUnlimited ? dict.regionPage.unlimitedSize : formatData(summary.cheapest.plan.dataAmountMb, locale)},{' '}
                    {summary.cheapest.plan.validityDays === 1
                      ? dict.regionPage.forOneDay
                      : interpolate(dict.regionPage.forDaysTemplate, { days: summary.cheapest.plan.validityDays })}
                    )
                  </span>
                </li>
              ) : null}
              {summary.landsOn === 'plan' ? <li>{copy.landsOnPlan}</li> : summary.landsOn === 'duration' ? <li>{copy.landsOnDuration}</li> : null}
              {promotion ? (
                <li>
                  {interpolate(copy.codeTemplate, { code: promotion.code })}{' '}
                  <Link href={localePath(locale, '/codes')} className="font-semibold text-brand underline underline-offset-4">
                    {copy.codesLink}
                  </Link>
                </li>
              ) : null}
            </ul>
          )}
        </section>

        <section aria-labelledby="provider-facts" className="mt-10">
          <h2 id="provider-facts" className="font-head text-xl font-semibold">
            {interpolate(copy.factsTitleTemplate, { provider: name })}
          </h2>
          <p className="mt-1 text-ink-2">
            {interpolate(copy.factsIntroTemplate, { provider: name })}
            {profile ? ` ${interpolate(copy.checkedTemplate, { date: dayLabel(profile.checkedOn) })}.` : ''}
          </p>
          <dl className="mt-4 grid gap-3">
            {profileFactKeys.map((key) => {
              const fact = profile?.facts[key];
              return (
                <div key={key} className="min-w-0 rounded-[14px] border border-line bg-surface px-4 py-3">
                  <dt className="font-semibold text-ink">{copy.factLabels[key]}</dt>
                  <dd className="mt-1 text-ink [overflow-wrap:anywhere]">
                    {fact ? (
                      <>
                        <p>{locale === 'he' ? fact.he : fact.en}</p>
                        {/* Each page it was read on, once, in the order read. */}
                        <ul className="mt-1 grid gap-0.5 text-sm text-ink-2">
                          {[...new Set(fact.sources.map((source) => source.url))].map((url) => (
                            <li key={url}>
                              <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-6 items-center underline underline-offset-4 [overflow-wrap:anywhere]">
                                {interpolate(copy.sourceTemplate, { page: pageName(url) })}
                                <span className="sr-only"> {dict.share.opensInNewTab}</span>
                              </a>
                            </li>
                          ))}
                        </ul>
                      </>
                    ) : (
                      <p className="text-ink-2">{copy.notStated}</p>
                    )}
                  </dd>
                </div>
              );
            })}
          </dl>
        </section>

        <section aria-labelledby="provider-reviews" className="mt-10">
          <h2 id="provider-reviews" className="font-head text-xl font-semibold">
            {interpolate(copy.reviewsTitleTemplate, { provider: name })}
          </h2>
          <ReviewList reviews={reviews.slice(0, 5)} locale={locale} copy={dict.reviewsPage} empty={copy.reviewsEmpty} />
          <p className="mt-3">
            <Link href={`${localePath(locale, '/reviews')}?provider=${provider.id}`} className="inline-flex min-h-11 items-center font-semibold text-brand underline underline-offset-4">
              {copy.reviewsLink}
            </Link>
          </p>
        </section>

        <p className="mt-10">
          <Link href={localePath(locale, '/providers')} className="inline-flex min-h-11 items-center font-semibold text-brand underline underline-offset-4">
            {copy.allProviders}
          </Link>
        </p>
      </Container>
    </>
  );
}

/** "saily.com/help/refunds" for a source link: the host and path, no scheme. */
function pageName(url: string): string {
  try {
    const { host, pathname } = new URL(url);
    const path = pathname.replace(/\/$/, '');
    const last = path.split('/').pop() ?? '';
    // A help-centre address is long; its last part names the article.
    const shown = path.length > 40 ? `/…/${last.length > 48 ? `${last.slice(0, 48)}…` : last}` : path;
    return `${host.replace(/^www\./, '')}${shown}`;
  } catch {
    return url;
  }
}
