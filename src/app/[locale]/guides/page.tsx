import { PageHeader } from '@/components/layout/PageHeader';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import { guides } from '@/content/guides';
import { isLocale, localePath, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/getDictionary';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return { title: dict.guidesPage.title, description: dict.guidesPage.intro };
}

/** The guides, one line each. See `src/content/guides.ts` for what they are and are not. */
export default async function GuidesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const dict = getDictionary(locale);

  return (
    <>
      <PageHeader title={dict.guidesPage.title} intro={dict.guidesPage.intro} />
    <Container className="py-12">
      <ul className="mt-8 grid max-w-3xl gap-4">
        {guides[locale].map((guide) => (
          <li key={guide.slug} className="rounded-lg border border-line bg-surface p-5">
            <h2 className="font-head text-xl font-semibold">
              <Link href={localePath(locale, `/guides/${guide.slug}`)} className="hover:text-brand">
                {guide.title}
              </Link>
            </h2>
            <p className="mt-1 text-ink-2">{guide.description}</p>
          </li>
        ))}
      </ul>
    </Container>
    </>
  );
}
