import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ContactForm } from '@/components/contact/ContactForm';
import { PageHeader } from '@/components/layout/PageHeader';
import { Container } from '@/components/ui/Container';
import { accessibilityStatement } from '@/data/accessibility';
import { isLocale, localePath, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/getDictionary';
import { CONTACT_TOPICS, contactConfigured, type ContactTopic } from '@/lib/contact/contact';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return { title: dict.contactPage.title, description: dict.contactPage.intro };
}

// Whether the form can send is read from the environment on each request.
export const dynamic = 'force-dynamic';

export default async function ContactPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const dict = getDictionary(locale);
  const copy = dict.contactPage;
  const email = accessibilityStatement.contact.email ?? '';
  const query = await searchParams;
  const asked = typeof query.topic === 'string' ? query.topic : '';
  const initialTopic: ContactTopic = CONTACT_TOPICS.includes(asked as ContactTopic) ? (asked as ContactTopic) : 'general';
  // The demo deployment (and the test suites) show the form so it can be
  // checked; without a key a message is answered "not available yet", never
  // "sent".
  const showForm = contactConfigured() || process.env.DEMO_CATALOGUE === 'true';

  return (
    <>
      <PageHeader title={copy.title} intro={copy.intro} narrow />
      <Container className="max-w-[76ch] py-12">
        {showForm ? (
          <ContactForm
            locale={locale}
            copy={copy}
            email={email}
            privacyHref={localePath(locale, '/privacy')}
            initialTopic={initialTopic}
          />
        ) : (
          <div className="rounded-[20px] border border-line bg-surface p-6">
            <h2 className="font-head text-xl font-semibold">{copy.notYetTitle}</h2>
            <p className="mt-2 text-ink-2">
              {copy.notYetBody}{' '}
              <a href={`mailto:${email}`} className="font-semibold text-brand underline" dir="ltr">
                {email}
              </a>
            </p>
          </div>
        )}
        <p className="mt-8 text-sm text-ink-2">
          {copy.directTemplate.split('{email}')[0]}
          <a href={`mailto:${email}`} className="underline" dir="ltr">
            {email}
          </a>
          {copy.directTemplate.split('{email}')[1] ?? ''}
        </p>
      </Container>
    </>
  );
}
