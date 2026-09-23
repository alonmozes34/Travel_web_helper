import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Ltr } from '@/components/ui/Bdi';
import { Container } from '@/components/ui/Container';
import { accessibilityStatement } from '@/data/accessibility';
import { privacyReviewedOn } from '@/data/privacy';
import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/getDictionary';
import { interpolate } from '@/i18n/interpolate';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return { title: dict.termsPage.title, description: dict.termsPage.intro };
}

/**
 * Terms of use.
 *
 * The one section that matters more than the rest is the one about prices:
 * a comparison site that shows a figure someone relies on, and is wrong, is
 * the realistic complaint against a site like this one — far likelier than
 * anything about data, since the site holds none. So the page says plainly
 * where every price comes from, that each carries the date it was checked,
 * and that the provider's own site is the authority at the moment of paying.
 *
 * Nothing here is boilerplate about a company that does not exist. The
 * operator is an individual, there is no registered entity, and the page says
 * so rather than borrowing a template that assumes one.
 */
export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const dict = getDictionary(locale);
  const page = dict.termsPage;
  const email = accessibilityStatement.contact.email;

  return (
    <Container className="py-12">
      <h1 className="font-head text-3xl font-bold tracking-tight sm:text-4xl">{page.title}</h1>
      <p className="mt-4 max-w-[70ch] text-lg text-ink-2">{page.intro}</p>
      <p className="mt-3 text-sm text-ink-3">
        {interpolate(page.updatedTemplate, { date: privacyReviewedOn })}
      </p>

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

        <section className="max-w-[70ch]">
          <h2 className="font-head text-xl font-semibold">{page.contactHeading}</h2>
          <p className="mt-2 text-ink-2">{page.contactBody}</p>
          <p className="mt-1">
            <a
              href={`mailto:${email}`}
              className="inline-flex min-h-11 items-center text-brand underline"
            >
              <Ltr>{email}</Ltr>
            </a>
          </p>
        </section>
      </div>
    </Container>
  );
}
