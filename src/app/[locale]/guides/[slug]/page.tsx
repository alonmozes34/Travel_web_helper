import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { buttonClasses } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { getGuide, guides } from '@/content/guides';
import { isLocale, localePath, locales, type Locale } from '@/i18n/config';
import { getDictionary, type Dictionary } from '@/i18n/getDictionary';
import { dailyDataMbByUsage } from '@/lib/comparison/estimateDataNeed';
import { formatData } from '@/lib/formatters/data';
import { usageLevels } from '@/lib/types/trip';

export function generateStaticParams() {
  return locales.flatMap((locale) => guides[locale].map((guide) => ({ locale, slug: guide.slug })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const guide = getGuide(locale, slug);
  return guide ? { title: guide.title, description: guide.description } : {};
}

/** The same daily figures the search estimates with, so the guide and the results cannot disagree. */
function DataTable({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const copy = dict.guidesPage.dataTable;
  return (
    <div className="mt-4 max-w-[70ch] overflow-x-auto">
      <table className="w-full border-collapse text-start text-sm">
        <caption className="mb-2 text-start font-semibold text-ink">{copy.caption}</caption>
        <thead>
          <tr className="border-b border-line text-ink-2">
            <th scope="col" className="py-2 pe-3 text-start font-semibold">{copy.usage}</th>
            <th scope="col" className="px-3 py-2 text-start font-semibold">{copy.perDay}</th>
            <th scope="col" className="px-3 py-2 text-start font-semibold">{copy.perWeek}</th>
          </tr>
        </thead>
        <tbody>
          {usageLevels.map((usage) => (
            <tr key={usage} className="border-b border-line-soft align-top">
              <th scope="row" className="py-2 pe-3 text-start font-normal">
                <span className="font-semibold text-ink">{dict.personalization.usages[usage]}</span>
                <span className="block text-ink-2">{dict.personalization.usageHints[usage]}</span>
              </th>
              <td className="whitespace-nowrap px-3 py-2 tabular-nums">{formatData(dailyDataMbByUsage[usage], locale)}</td>
              <td className="whitespace-nowrap px-3 py-2 tabular-nums">{formatData(dailyDataMbByUsage[usage] * 7, locale)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function GuidePage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale: raw, slug } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const guide = getGuide(locale, slug);
  if (!guide) notFound();
  const dict = getDictionary(locale);

  return (
    <Container className="py-12">
      <p className="text-sm">
        <Link href={localePath(locale, '/guides')} className="inline-flex min-h-6 items-center text-brand underline">
          {dict.guidesPage.allGuides}
        </Link>
      </p>
      <h1 className="mt-2 font-head text-3xl font-bold tracking-tight sm:text-4xl">{guide.title}</h1>
      <p className="mt-4 max-w-[70ch] text-lg text-ink-2">{guide.description}</p>
      <div className="mt-10 grid gap-8">
        {guide.sections.map((section, index) => (
          <section key={section.heading} className="max-w-[70ch]">
            <h2 className="font-head text-xl font-semibold">{section.heading}</h2>
            {section.body.map((paragraph) => (
              <p key={paragraph} className="mt-2 text-ink-2">
                {paragraph}
              </p>
            ))}
            {guide.dataTableAfter === index + 1 ? <DataTable locale={locale} dict={dict} /> : null}
          </section>
        ))}
      </div>
      <p className="mt-10">
        <Link href={localePath(locale, '/')} className={buttonClasses('primary', 'md')}>
          {dict.guidesPage.toCompare}
        </Link>
      </p>
    </Container>
  );
}
