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
import { siteUrl } from '@/lib/site';
import { tripProfileFromParams } from '@/lib/types/trip';

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

        {/*
          Results land here in Phase 4. The route, its metadata and the trip
          profile plumbing are already real, so nothing about this page moves
          when the plan list arrives.
        */}
        <div className="mt-6 rounded-lg border border-dashed border-line bg-surface p-8 text-center text-ink-2">
          <p className="font-head font-semibold text-ink">Phase 4</p>
          <p className="mt-1 text-[0.9375rem]">
            {profile.days ? `${dict.personalization.summaryPrefix}${profile.days} ` : ''}
            {profile.usage ? dict.personalization.usages[profile.usage] : ''}
          </p>
        </div>

        <AffiliateDisclosure dict={dict} className="mt-8 max-w-[80ch]" />
      </Container>
    </>
  );
}
