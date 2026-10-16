import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { ProviderLogo } from '@/components/plans/ProviderCell';
import { Container } from '@/components/ui/Container';
import { providers } from '@/data/providers';
import { isLocale, localePath, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/getDictionary';
import { interpolate } from '@/i18n/interpolate';
import { getCatalogue } from '@/lib/catalogue/getCatalogue';
import { providerSummary } from '@/lib/comparison/providerSummary';
import { getDisplayCurrency } from '@/lib/currencyServer';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const copy = getDictionary(locale).providerPage;
  return { title: copy.indexTitle, description: copy.indexIntro };
}

export const dynamic = 'force-dynamic';

/** The providers on the site, each linking to its page; in a fixed order, never by commission. */
export default async function ProvidersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const dict = getDictionary(locale);
  const copy = dict.providerPage;
  const [{ plans, rates }, currency] = await Promise.all([getCatalogue(), getDisplayCurrency(locale)]);
  const ordered = [...providers].sort((a, b) => a.name.localeCompare(b.name, 'en'));

  return (
    <>
      <PageHeader title={copy.indexTitle} intro={copy.indexIntro} note={copy.disclaimer} narrow />
      <Container className="max-w-[76ch] py-10">
        <ul className="grid gap-3">
          {ordered.map((provider) => {
            const summary = providerSummary(plans, provider.id, currency, rates);
            return (
              <li key={provider.id}>
                <Link
                  href={localePath(locale, `/providers/${provider.slug}`)}
                  className="flex min-h-11 flex-wrap items-center gap-x-4 gap-y-2 rounded-[16px] border border-line bg-surface px-4 py-3 hover:border-brand"
                >
                  <ProviderLogo provider={provider} />
                  <span className="min-w-0">
                    <span className="block font-head text-lg font-semibold text-brand underline underline-offset-4">
                      {interpolate(copy.profileLinkTemplate, { provider: provider.name })}
                    </span>
                    <span className="block text-ink-2">
                      {summary.planCount === 0
                        ? copy.noPlans
                        : interpolate(copy.plansTemplate, { count: summary.planCount, destinations: summary.destinationCount })}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </Container>
    </>
  );
}
