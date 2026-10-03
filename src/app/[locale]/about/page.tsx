import { PageHeader } from '@/components/layout/PageHeader';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import { accessibilityStatement } from '@/data/accessibility';
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
  return { title: dict.aboutPage.title, description: dict.aboutPage.intro };
}

/**
 * Who runs the site, what it does, where its prices come from and how it is
 * paid for — in one place, in Hebrew and English.
 *
 * Written on 30 September 2026 after two affiliate programmes declined, one
 * citing the "quality of the media property": a reviewer opening the site
 * could not find who was behind it. Every sentence restates something the
 * site already says or the code already does; the operator is described as
 * the terms of use describe them, and the owner's name is not on it. The
 * contact address is the one the accessibility statement publishes.
 */
export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const dict = getDictionary(locale);
  const page = dict.aboutPage;
  const email = accessibilityStatement.contact.email;

  return (
    <>
      <PageHeader title={page.title} intro={page.intro} />
    <Container className="py-12">

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
        {email ? (
          <section className="max-w-[70ch]">
            <h2 className="font-head text-xl font-semibold">{page.contactHeading}</h2>
            <p className="mt-2 text-ink-2">
              {page.contactBody}{' '}
              <a href={`mailto:${email}`} className="font-semibold text-brand underline" dir="ltr">
                {email}
              </a>
            </p>
          </section>
        ) : null}
      </div>
    </Container>
    </>
  );
}
