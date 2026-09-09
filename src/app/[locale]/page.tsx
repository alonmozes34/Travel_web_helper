import { notFound } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import { BrandName } from '@/components/layout/Brand';
import { HeroSearch } from '@/components/search/HeroSearch';
import { HowItWorks } from '@/components/content/HowItWorks';
import { TrustSection } from '@/components/content/TrustSection';
import { Faq } from '@/components/content/Faq';
import { AffiliateDisclosure } from '@/components/content/AffiliateDisclosure';
import { isLocale, localeConfig, localePath } from '@/i18n/config';
import { getDictionary } from '@/i18n/getDictionary';
import { siteUrl } from '@/lib/site';

export default async function HomePage({ params }: PageProps<'/[locale]'>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);

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
      {/* The first screen asks for a destination and nothing else. */}
      <section className="bg-surface pt-12 pb-10 sm:pt-16 md:pt-20 md:pb-12">
        <Container>
          {/* One H1, two lines. The brand carries the page and the descriptor
              sits inside the same heading, so the accessible name of the
              document's main heading is "יש קליטה? השוואת חבילות eSIM לחו״ל"
              — the brand and what it does, in one breath. Splitting the
              descriptor into an H2 would have made the site's own purpose a
              subsection of its name. */}
          <h1 className="tracking-tight">
            {/* The wordmark never breaks. A `ch`-based cap measures the digit
                zero, which in a display face is far narrower than Hebrew
                letters at 48px, and it split the brand across two lines. */}
            <BrandName
              name={dict.home.heroTitle}
              className="block text-4xl font-bold whitespace-nowrap md:text-5xl"
            />
            <span className="mt-2 block max-w-[24ch] text-2xl font-semibold text-balance text-ink-2 md:text-3xl">
              {dict.home.heroDescriptor}
            </span>
          </h1>
          <p className="mt-4 max-w-[50ch] text-lg text-ink-2">{dict.home.heroSubtitle}</p>

          <div className="mt-7">
            <HeroSearch locale={locale} dict={dict} />
          </div>

          <ul className="mt-9 flex flex-wrap gap-x-7 gap-y-2 border-t border-line-soft pt-5 text-sm text-ink-2">
            {dict.home.trustStrip.map((item) => (
              <li key={item.strong}>
                <strong className="font-semibold text-ink">{item.strong}</strong> {item.rest}
              </li>
            ))}
            <li>
              <strong className="font-semibold text-ink">{dict.disclosure.short}</strong>
            </li>
          </ul>
        </Container>
      </section>

      <HowItWorks dict={dict} />
      <TrustSection dict={dict} />
      <Faq dict={dict} />

      <Container className="py-10">
        <AffiliateDisclosure dict={dict} className="max-w-[80ch]" />
      </Container>
    </>
  );
}
