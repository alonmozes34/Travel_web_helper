import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { CopyCodeButton } from '@/components/plans/CopyCodeButton';
import { ProviderLogo } from '@/components/plans/ProviderCell';
import { Ltr } from '@/components/ui/Bdi';
import { Container } from '@/components/ui/Container';
import { promotions } from '@/data/promotions';
import { getProvider } from '@/data/providers';
import { isLocale, localeConfig, localePath, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/getDictionary';
import { interpolate } from '@/i18n/interpolate';
import { isPromotionActive } from '@/lib/pricing/promotions';
import { israelDay } from '@/lib/stats/store';

// A code leaves the page the day after it expires, so the page is built per request.
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const page = getDictionary(locale).codesPage;
  return { title: page.title, description: page.intro };
}

/**
 * Every discount code a provider has issued for this site's visitors (the
 * owner, 15 October 2026), from `src/data/promotions.ts` — which holds only
 * codes whose terms the provider confirmed in writing. A code we were given
 * without its terms (Saily's, until they say how much it takes off) is not
 * here, and an expired one disappears by itself.
 */
export default async function CodesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const dict = getDictionary(locale);
  const page = dict.codesPage;
  const today = israelDay();
  const dates = new Intl.DateTimeFormat(localeConfig[locale].intlLocale, { day: 'numeric', month: 'numeric', year: 'numeric', timeZone: 'UTC' });
  const date = (day: string) => dates.format(new Date(`${day}T00:00:00Z`));
  const active = promotions
    .filter((promotion) => isPromotionActive(promotion, today))
    .map((promotion) => ({ promotion, provider: getProvider(promotion.providerId) }))
    .filter((entry): entry is typeof entry & { provider: NonNullable<typeof entry.provider> } => Boolean(entry.provider))
    .sort((a, b) => b.promotion.percent - a.promotion.percent);

  return (
    <>
      <PageHeader title={page.title} intro={page.intro} />
      <Container className="py-12">
        {active.length === 0 ? (
          <p className="text-ink-2">{page.none}</p>
        ) : (
          <ul className="grid max-w-[80ch] gap-4">
            {active.map(({ promotion, provider }) => (
              <li key={promotion.providerId} className="rounded-[20px] border border-line bg-surface p-5 md:p-6">
                <div className="flex flex-wrap items-center gap-3">
                  <ProviderLogo provider={provider} />
                  <h2 lang="en" className="font-head text-xl font-semibold">
                    {provider.name}
                  </h2>
                </div>
                {/* The provider's Latin name and a Hebrew "15% off" on one line read in the wrong order. */}
                <p className="mt-3 font-head text-2xl font-bold text-teal-ink">
                  {interpolate(page.percentTemplate, { percent: promotion.percent })}
                </p>
                <p className="mt-1 font-semibold text-ink">{page.audience[promotion.audience]}</p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <p className="rounded-sm border border-dashed border-teal-ink bg-teal-50 px-3 py-1.5 font-head text-lg font-semibold text-teal-ink">
                    <span className="sr-only">{page.codeLabel}: </span>
                    <Ltr>{promotion.code}</Ltr>
                  </p>
                  {promotion.appliedByLink ? null : (
                    <CopyCodeButton code={promotion.code} provider={provider.id} label={dict.plan.copyCode} copiedLabel={dict.plan.codeCopied} />
                  )}
                </div>
                <p className="mt-3 max-w-[65ch] text-ink-2">{promotion.appliedByLink ? page.byLink : page.typeIt}</p>
                <p className="mt-2 text-sm text-ink-3">
                  {promotion.validUntil ? interpolate(page.untilTemplate, { date: date(promotion.validUntil) }) : page.noEnd}
                  {' · '}
                  {interpolate(page.confirmedTemplate, { date: date(promotion.confirmedOn) })}
                </p>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-8 max-w-[70ch] text-ink-2">{page.inPrices}</p>
        <p className="mt-4">
          <Link href={localePath(locale, '/esim')} className="font-semibold text-brand underline underline-offset-4">
            {page.toPlans}
          </Link>
        </p>
        <p className="mt-8 max-w-[70ch] text-sm text-ink-2">{dict.disclosure.short}</p>
      </Container>
    </>
  );
}
