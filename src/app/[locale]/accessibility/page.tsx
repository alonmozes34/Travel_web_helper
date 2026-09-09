import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import { Badge } from '@/components/ui/Badge';
import { Ltr } from '@/components/ui/Bdi';
import {
  accessibilityStandard,
  accessibilityStatement,
  isAccessibilityStatementComplete,
} from '@/data/accessibility';
import { isLocale } from '@/i18n/config';
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
  return { title: dict.accessibility.title, description: dict.accessibility.intro };
}

/** A value that has not been supplied is marked, never filled in with a guess. */
function Field({ label, value, fallback }: { label: string; value: string | null; fallback: string }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-line-soft py-3 last:border-b-0">
      <dt className="w-40 shrink-0 text-sm font-semibold text-ink-2">{label}</dt>
      <dd className={value ? 'font-medium' : 'text-warn-ink'}>
        {value ?? <Badge tone="warn">{fallback}</Badge>}
      </dd>
    </div>
  );
}

/**
 * Accessibility statement.
 *
 * Israeli law requires a public-facing site to publish one, together with a
 * route for reporting accessibility problems. Every detail here comes from
 * `src/data/accessibility.ts`; nothing is invented, and while fields are
 * missing the page says so at the top rather than reading like a finished
 * legal document.
 */
export default async function AccessibilityPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = getDictionary(locale);
  const copy = dict.accessibility;
  const { contact } = accessibilityStatement;
  const complete = isAccessibilityStatementComplete();

  return (
    <Container className="max-w-[76ch] py-12">
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{copy.title}</h1>

      {!complete ? (
        <div className="mt-5 rounded-sm border-s-[3px] border-s-warn-ink bg-warn-50 px-4 py-3">
          <p className="font-semibold text-warn-ink">{copy.pendingBadge}</p>
          <p className="mt-1 text-base text-warn-ink">{copy.pendingNotice}</p>
        </div>
      ) : null}

      <p className="mt-6 text-lg text-ink-2">{copy.intro}</p>

      <section className="mt-10">
        <h2 className="font-head text-xl font-semibold">{copy.standardTitle}</h2>
        <p className="mt-2 text-ink-2">
          {interpolate(copy.standardTemplate, {
            standard: accessibilityStandard.name,
            basis: accessibilityStandard.basis,
            level: accessibilityStandard.level,
          })}
        </p>
        <p className="mt-2 text-sm text-ink-3">{copy.standardNote}</p>

        <dl className="mt-5">
          <Field
            label={copy.entityTitle}
            value={accessibilityStatement.legalEntityName}
            fallback={copy.notSet}
          />
          <Field
            label={copy.reviewedTitle}
            value={accessibilityStatement.lastReviewedAt}
            fallback={copy.notSet}
          />
          <Field
            label={copy.auditorTitle}
            value={
              accessibilityStatement.auditedBy
                ? interpolate(copy.auditorTemplate, {
                    name: accessibilityStatement.auditedBy.name,
                    licence: accessibilityStatement.auditedBy.licenceNumber,
                  })
                : null
            }
            fallback={copy.notSet}
          />
        </dl>
      </section>

      <section className="mt-10">
        <h2 className="font-head text-xl font-semibold">{copy.doneTitle}</h2>
        <ul className="mt-3 grid gap-2 text-ink-2">
          {copy.done.map((item) => (
            <li key={item} className="flex gap-2.5">
              <span aria-hidden="true" className="text-teal-ink">
                ✓
              </span>
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="font-head text-xl font-semibold">{copy.limitationsTitle}</h2>
        <ul className="mt-3 grid gap-2 text-ink-2">
          {copy.limitations.map((item) => (
            <li key={item} className="flex gap-2.5">
              <span aria-hidden="true" className="text-warn-ink">
                —
              </span>
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="font-head text-xl font-semibold">{copy.contactTitle}</h2>
        <p className="mt-2 text-ink-2">{copy.contactIntro}</p>
        <dl className="mt-4">
          <Field label={copy.coordinatorLabel} value={contact.coordinatorName} fallback={copy.notSet} />
          <Field label={copy.phoneLabel} value={contact.phone} fallback={copy.notSet} />
          <Field label={copy.emailLabel} value={contact.email} fallback={copy.notSet} />
          <Field label={copy.addressLabel} value={contact.postalAddress} fallback={copy.notSet} />
          <Field
            label={copy.responseLabel}
            value={
              contact.responseWindowDays
                ? interpolate(copy.responseTemplate, { days: contact.responseWindowDays })
                : null
            }
            fallback={copy.notSet}
          />
        </dl>
      </section>

      {accessibilityStatement.lastReviewedAt ? (
        <p className="mt-10 text-sm text-ink-3">
          <Ltr className="tnum">
            {interpolate(copy.updatedTemplate, { date: accessibilityStatement.lastReviewedAt })}
          </Ltr>
        </p>
      ) : null}
    </Container>
  );
}
