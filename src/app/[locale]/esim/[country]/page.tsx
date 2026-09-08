import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import { HeroSearch } from '@/components/search/HeroSearch';
import { AffiliateDisclosure } from '@/components/content/AffiliateDisclosure';
import { MockDataNotice } from '@/components/content/MockDataNotice';
import { countries, getCountryBySlug } from '@/data/countries';
import { isLocale, localeConfig, localePath, locales } from '@/i18n/config';
import { getDictionary } from '@/i18n/getDictionary';
import { interpolate } from '@/i18n/interpolate';
import { formatPrice } from '@/lib/formatters/price';
import { siteUrl } from '@/lib/site';
import { tripProfileFromParams } from '@/lib/types/trip';
import { buildComparison } from '@/lib/comparison/buildComparison';
import { localeConfig as localeSettings } from '@/i18n/config';
import { Ltr } from '@/components/ui/Bdi';

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    countries.map((country) => ({ locale, country: country.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}): Promise<Metadata> {
  const { locale, country: slug } = await params;
  if (!isLocale(locale)) return {};

  const country = getCountryBySlug(slug);
  if (!country) return {};

  const dict = getDictionary(locale);
  const name = country.names[locale];
  const path = `/esim/${country.slug}`;

  return {
    title: interpolate(dict.country.seoTitleTemplate, { country: name }),
    description: interpolate(dict.country.metaDescriptionTemplate, { country: name }),
    metadataBase: new URL(siteUrl),
    alternates: {
      canonical: localePath(locale, path),
      languages: Object.fromEntries(
        locales.map((code) => [localeConfig[code].htmlLang, localePath(code, path)]),
      ),
    },
  };
}

export default async function CountryPage({ params, searchParams }: PageProps<'/[locale]/esim/[country]'>) {
  const { locale, country: slug } = await params;
  if (!isLocale(locale)) notFound();

  const country = getCountryBySlug(slug);
  if (!country) notFound();

  const dict = getDictionary(locale);
  const profile = tripProfileFromParams(await searchParams);
  const name = country.names[locale];

  // Currency here is the locale default; the switcher's client-side preference
  // is applied to the rendered rows in Phase 4.
  const comparison = buildComparison({
    countryCode: country.code,
    profile,
    currency: localeSettings[locale].defaultCurrency,
  });
  const { estimate } = comparison;

  return (
    <>
      <section className="bg-surface pt-10 pb-8">
        <Container>
          <h1 className="flex flex-wrap items-center gap-3 text-3xl font-bold tracking-tight md:text-4xl">
            <span aria-hidden="true">{country.flag}</span>
            {interpolate(dict.country.titleTemplate, { country: name })}
          </h1>

          <div className="mt-6">
            <HeroSearch
              locale={locale}
              dict={dict}
              initialCountry={country}
              initialProfile={profile}
              showPopular={false}
            />
          </div>
        </Container>
      </section>

      <Container className="py-10">
        <MockDataNotice dict={dict} className="max-w-[80ch]" />

        {/* Plan rows land here in Phase 4; the numbers below are already real. */}
        <p className="mt-6 text-[0.9375rem] text-ink-2">
          <strong className="font-semibold text-ink">
            {interpolate(dict.results.summaryTemplate, {
              plans: comparison.planCount,
              providers: comparison.providerCount,
            })}
          </strong>
        </p>
        <p className="mt-1 text-[0.8125rem] text-ink-2">
          {estimate.isDefault ? (
            dict.results.defaultEstimate
          ) : (
            <span className="font-semibold text-brand">
              {interpolate(dict.results.tailoredTemplate, {
                days: estimate.days,
                usage: dict.personalization.usages[estimate.usage],
                gb: Math.round(estimate.requiredGb),
              })}
            </span>
          )}
        </p>

        <ul className="mt-6 grid gap-2">
          {comparison.rows.slice(0, 4).map((row) => (
            <li
              key={row.plan.id}
              className="flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-sm border border-line bg-surface px-4 py-3 text-[0.9375rem]"
            >
              <span className="font-head font-semibold">{row.provider.name}</span>
              <span className="text-ink-2">{row.plan.planName}</span>
              <Ltr className="tnum ms-auto font-head font-semibold">
                {formatPrice(row.price.amountMinor, row.price.currency, locale)}
              </Ltr>
              <span className="tnum text-[0.8125rem] text-ink-3">{row.score}</span>
            </li>
          ))}
        </ul>

        <AffiliateDisclosure dict={dict} className="mt-8 max-w-[80ch]" />
      </Container>
    </>
  );
}
