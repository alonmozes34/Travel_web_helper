import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/getDictionary';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return { title: dict.disclosurePage.title, description: dict.disclosurePage.intro };
}

/**
 * Affiliate disclosure.
 *
 * The footer linked here from every page on the site and the route did not
 * exist, so "גילוי נאות" was a 404 — on a site whose whole argument is that
 * its ranking is not for sale.
 *
 * Every claim on this page is one the code can be checked against: `Plan` has
 * no commission, payout or manual-rank field, so the scorer cannot see what a
 * provider pays even if someone wanted it to. Nothing here is drafted on the
 * owner's behalf; it describes what the software does.
 */
export default async function DisclosurePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const dict = getDictionary(locale);
  const page = dict.disclosurePage;

  return (
    <Container className="py-12">
      <h1 className="font-head text-3xl font-bold tracking-tight sm:text-4xl">{page.title}</h1>
      <p className="mt-4 max-w-[70ch] text-lg text-ink-2">{page.intro}</p>

      <div className="mt-10 grid gap-8">
        {page.sections.map((section) => (
          <section key={section.heading} className="max-w-[70ch]">
            <h2 className="font-head text-xl font-semibold">{section.heading}</h2>
            {section.body.map((paragraph) => (
              <p key={paragraph} className="mt-2 text-ink-2">
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </div>
    </Container>
  );
}
