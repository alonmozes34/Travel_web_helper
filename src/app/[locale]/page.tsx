import { notFound } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import { HeroSearch } from '@/components/search/HeroSearch';
import { HowItWorks } from '@/components/content/HowItWorks';
import { TrustSection } from '@/components/content/TrustSection';
import { Faq } from '@/components/content/Faq';
import { AffiliateDisclosure } from '@/components/content/AffiliateDisclosure';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/getDictionary';

export default async function HomePage({ params }: PageProps<'/[locale]'>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);

  return (
    <>
      {/* The first screen asks for a destination and nothing else. */}
      <section className="bg-surface pt-12 pb-10 sm:pt-16 md:pt-20 md:pb-12">
        <Container>
          <h1 className="max-w-[15ch] text-4xl font-bold tracking-tight md:text-5xl">
            {dict.home.heroTitle}
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
