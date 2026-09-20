import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { buttonClasses } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { DeviceList } from '@/components/devices/DeviceList';
import { devicesCheckedOn } from '@/data/devices';
import { isLocale, localePath, type Locale } from '@/i18n/config';
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
  return { title: dict.devicesPage.title, description: dict.devicesPage.intro };
}

/**
 * Device compatibility.
 *
 * "Will this work on my phone" is the question that stops a purchase before
 * it starts, and it is one this site can answer without a single price — so
 * it is useful today, while the catalogue is still demo data.
 *
 * The order of the page is the argument: the on-device check comes first and
 * the model lists come second. Every manufacturer here except Apple states
 * that a listed model may still lack eSIM depending on where it was bought,
 * so a list presented as the answer would be confidently wrong for exactly
 * the readers it fails. The menu on the reader's own device cannot be.
 */
export default async function DevicesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const dict = getDictionary(locale);
  const page = dict.devicesPage;

  return (
    <Container className="py-12">
      <h1 className="font-head text-3xl font-bold tracking-tight sm:text-4xl">{page.title}</h1>
      <p className="mt-4 max-w-[70ch] text-lg text-ink-2">{page.intro}</p>
      <p className="mt-3 max-w-[70ch] text-sm text-ink-3">
        {interpolate(page.updatedTemplate, { date: devicesCheckedOn() })} {page.staleNote}
      </p>

      <section className="mt-12 border-t border-line-soft pt-10">
        <h2 className="font-head text-2xl font-semibold">{page.check.title}</h2>
        <p className="mt-3 max-w-[70ch] text-ink-2">{page.check.intro}</p>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {page.check.guides.map((guide) => (
            <section key={guide.id} className="rounded-md border border-line bg-surface p-5">
              <h3 className="font-head text-lg font-semibold">{guide.title}</h3>

              <h4 className="mt-4 text-sm font-semibold text-ink-2">{page.check.supportTitle}</h4>
              <ol className="mt-2 grid list-decimal gap-2 ps-5 text-ink-2">
                {guide.supportSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>

              <h4 className="mt-5 text-sm font-semibold text-ink-2">{page.check.installTitle}</h4>
              <ol className="mt-2 grid list-decimal gap-2 ps-5 text-ink-2">
                {guide.installSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      </section>

      <section className="mt-12 border-t border-line-soft pt-10">
        <h2 className="font-head text-2xl font-semibold">{page.other.title}</h2>
        <div className="mt-3 grid gap-2">
          {page.other.body.map((paragraph) => (
            <p key={paragraph} className="max-w-[70ch] text-ink-2">
              {paragraph}
            </p>
          ))}
        </div>
      </section>

      <section className="mt-12 border-t border-line-soft pt-10">
        <h2 className="font-head text-2xl font-semibold">{page.lock.title}</h2>
        <div className="mt-3 grid gap-2">
          {page.lock.body.map((paragraph) => (
            <p key={paragraph} className="max-w-[70ch] text-ink-2">
              {paragraph}
            </p>
          ))}
        </div>
      </section>

      <section className="mt-12 border-t border-line-soft pt-10">
        <h2 className="font-head text-2xl font-semibold">{page.list.title}</h2>
        <p className="mt-3 max-w-[70ch] text-ink-2">{page.list.intro}</p>
        <DeviceList dict={dict} />
      </section>

      <section className="mt-12 rounded-md border border-line bg-surface-2 p-6">
        <h2 className="font-head text-xl font-semibold">{page.cta.title}</h2>
        <p className="mt-2 max-w-[60ch] text-ink-2">{page.cta.body}</p>
        <Link
          href={localePath(locale, '/search')}
          className={buttonClasses('primary', 'md', 'mt-4')}
        >
          {page.cta.link}
        </Link>
      </section>
    </Container>
  );
}
