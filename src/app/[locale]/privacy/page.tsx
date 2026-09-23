import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/Badge';
import { Ltr } from '@/components/ui/Bdi';
import { Container } from '@/components/ui/Container';
import { accessibilityStatement } from '@/data/accessibility';
import { privacyReviewedOn, storedItems } from '@/data/privacy';
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
  return { title: dict.privacyPage.title, description: dict.privacyPage.intro };
}

/**
 * Privacy notice.
 *
 * The footer linked here from every page and the route did not exist, because
 * a privacy notice has to name who is responsible and nobody had said. That
 * is now answered — a private individual, reachable by email — and the rest
 * of the page is not drafted on anyone's behalf either: it describes what the
 * software does.
 *
 * The list of stored items comes from `src/data/privacy.ts`, which imports
 * the actual constants the code writes with. A notice that says "we store
 * these four things" is a claim about software, and this one cannot drift
 * from it without a test failing.
 */
export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const dict = getDictionary(locale);
  const page = dict.privacyPage;
  const email = accessibilityStatement.contact.email;

  return (
    <Container className="py-12">
      <h1 className="font-head text-3xl font-bold tracking-tight sm:text-4xl">{page.title}</h1>
      <p className="mt-4 max-w-[70ch] text-lg text-ink-2">{page.intro}</p>
      <p className="mt-3 text-sm text-ink-3">
        {interpolate(page.reviewedTemplate, { date: privacyReviewedOn })}
      </p>

      <section className="mt-10 max-w-[70ch]">
        <h2 className="font-head text-xl font-semibold">{page.operator.heading}</h2>
        {page.operator.body.map((paragraph) => (
          <p key={paragraph} className="mt-2 text-ink-2">
            {paragraph}
          </p>
        ))}
      </section>

      <section className="mt-10 max-w-[70ch]">
        <h2 className="font-head text-xl font-semibold">{page.notCollected.heading}</h2>
        <p className="mt-2 text-ink-2">{page.notCollected.intro}</p>
        <ul className="mt-3 grid list-disc gap-1.5 ps-5 text-ink-2">
          {page.notCollected.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="font-head text-xl font-semibold">{page.storage.heading}</h2>
        <p className="mt-2 max-w-[70ch] text-ink-2">{page.storage.intro}</p>

        {/* Cards rather than a table: four items each with a sentence is not
            tabular data, and a three-column table is the thing that overflows
            at 320px. */}
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {storedItems.map((item) => (
            <li key={item.key} className="rounded-md border border-line bg-surface p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Ltr className="font-head text-sm font-semibold">{item.key}</Ltr>
                <Badge>{page.storage.kinds[item.kind]}</Badge>
                {item.conditional ? (
                  <span className="text-xs text-ink-3">{page.storage.conditionalNote}</span>
                ) : null}
              </div>
              <p className="mt-2 text-sm text-ink-2">{page.storage.purposes[item.purpose]}</p>
            </li>
          ))}
        </ul>

        <p className="mt-4 max-w-[70ch] text-ink-2">{page.storage.clearing}</p>
      </section>

      {[page.logs, page.outbound, page.rights, page.changes].map((section) => (
        <section key={section.heading} className="mt-10 max-w-[70ch]">
          <h2 className="font-head text-xl font-semibold">{section.heading}</h2>
          {section.body.map((paragraph) => (
            <p key={paragraph} className="mt-2 text-ink-2">
              {paragraph}
            </p>
          ))}
        </section>
      ))}

      <section className="mt-10 max-w-[70ch]">
        <h2 className="font-head text-xl font-semibold">{page.contactHeading}</h2>
        <p className="mt-2">
          <a
            href={`mailto:${email}`}
            className="inline-flex min-h-11 items-center text-brand underline"
          >
            <Ltr>{email}</Ltr>
          </a>
        </p>
      </section>
    </Container>
  );
}
