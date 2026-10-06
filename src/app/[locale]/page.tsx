import { notFound } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import { BrandName } from '@/components/layout/Brand';
import { HeroSearch } from '@/components/search/HeroSearch';
import { HowItWorks } from '@/components/content/HowItWorks';
import { ExploreDestinations } from '@/components/content/ExploreDestinations';
import { HeroRoute } from '@/components/content/HeroRoute';
import { ProviderStrip } from '@/components/content/ProviderStrip';
import { getCatalogue } from '@/lib/catalogue/getCatalogue';
import { providersOnSite } from '@/lib/catalogue/providersOnSite';
import { TrustSection } from '@/components/content/TrustSection';
import { Faq } from '@/components/content/Faq';
import { AffiliateDisclosure } from '@/components/content/AffiliateDisclosure';
import { isLocale, localeConfig, localePath } from '@/i18n/config';
import { getDictionary } from '@/i18n/getDictionary';
import { siteUrl } from '@/lib/site';

/** The providers' band reads the live catalogue (cached in memory), so it is current. */
export const dynamic = 'force-dynamic';

export default async function HomePage({ params }: PageProps<'/[locale]'>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const onSite = providersOnSite((await getCatalogue()).plans);

  /**
   * WebSite structured data, so the brand is understood as a name rather than
   * as three Hebrew words in a heading.
   *
   * Deliberately thin: a name, a URL, a language and a description. No
   * Organization node, because there is no registered legal entity behind the
   * site yet and the accessibility statement says so; no SearchAction, because
   * that would advertise a query endpoint whose parameter shape we have not
   * committed to. Claiming either would be inventing a fact about ourselves.
   */
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: dict.meta.siteName,
    alternateName: 'Yesh Klita',
    url: `${siteUrl}${localePath(locale, '/')}`,
    inLanguage: localeConfig[locale].htmlLang,
    description: dict.meta.defaultDescription,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* The first screen asks for a destination and nothing else. The night
          ground is there to make the white search card the brightest thing on
          the screen; everything that a traveller has to read or operate is
          inside that card, in the same colours as the rest of the site. */}
      <section className="on-night bg-hero relative pt-12 pb-14 text-on-night sm:pt-16 md:pt-20 md:pb-20">
        <HeroRoute rtl={localeConfig[locale].dir === 'rtl'} />
        <Container className="relative">
          {/* One H1, two lines. The brand carries the page and the descriptor
              sits inside the same heading, so the accessible name of the
              document's main heading is "יש קליטה? השוואת חבילות eSIM לחו״ל"
              — the brand and what it does, in one breath. Splitting the
              descriptor into an H2 would have made the site's own purpose a
              subsection of its name. */}
          <h1 className="tracking-tight">
            {/* No width cap on the wordmark: a `ch`-based cap measures the
                digit zero, which in a display face is far narrower than Hebrew
                letters at 48px, and it split the brand across two lines. It is
                not held on one line either — at 200% text on a phone it does
                not fit, and wrapping between its two words is better than a
                page that scrolls sideways. At normal sizes it fits whole. */}
            <BrandName
              name={dict.home.heroTitle}
              className="block text-5xl font-bold text-on-night md:text-6xl"
              markClassName="text-sky"
            />
            <span className="mt-3 block max-w-[24ch] text-2xl font-semibold text-balance text-on-night-2 md:text-3xl">
              {dict.home.heroDescriptor}
            </span>
          </h1>
          <p className="mt-4 max-w-[50ch] text-lg text-on-night-2">{dict.home.heroSubtitle}</p>

          <div className="on-light mt-8 max-w-[720px] rounded-[24px] bg-surface p-3 text-ink shadow-hero sm:p-5">
            <HeroSearch locale={locale} dict={dict} />
          </div>

          <ul className="mt-9 flex flex-wrap gap-x-8 gap-y-3 text-sm text-on-night-2">
            {dict.home.trustStrip.map((item) => (
              <li key={item.strong} className="flex items-start gap-2">
                <span aria-hidden="true" className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-teal/20 text-xs text-teal">
                  ✓
                </span>
                <span>
                  <strong className="font-semibold text-on-night">{item.strong}</strong> {item.rest}
                </span>
              </li>
            ))}
            <li className="flex items-start gap-2">
              <span aria-hidden="true" className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-teal/20 text-xs text-teal">
                ✓
              </span>
              <strong className="font-semibold text-on-night">{dict.disclosure.short}</strong>
            </li>
          </ul>
        </Container>
      </section>

      <ProviderStrip
        entries={onSite}
        copy={dict.home.providers}
        numberLocale={localeConfig[locale].intlLocale}
      />

      <ExploreDestinations locale={locale} dict={dict} />
      <HowItWorks dict={dict} />
      <TrustSection dict={dict} />
      <Faq dict={dict} />

      <Container className="py-10">
        <AffiliateDisclosure dict={dict} className="max-w-[80ch]" />
      </Container>
    </>
  );
}
