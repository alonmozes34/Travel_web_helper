import type { Metadata } from 'next';
import { Assistant, Rubik } from 'next/font/google';
import { notFound } from 'next/navigation';
import '../globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CurrencyProvider } from '@/components/providers/CurrencyProvider';
import { isLocale, localeConfig, localePath, locales } from '@/i18n/config';
import { getDictionary } from '@/i18n/getDictionary';
import { allowIndexing, siteUrl } from '@/lib/site';

// Rubik carries headings, numbers and buttons; Assistant carries body text.
// Both ship a real Hebrew design rather than a Latin face with Hebrew bolted on.
const rubik = Rubik({
  subsets: ['latin', 'hebrew'],
  variable: '--font-rubik',
  display: 'swap',
});

const assistant = Assistant({
  subsets: ['latin', 'hebrew'],
  variable: '--font-assistant',
  display: 'swap',
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: `${dict.meta.siteName} — ${dict.meta.tagline}`,
      template: `%s | ${dict.meta.siteName}`,
    },
    description: dict.meta.defaultDescription,
    alternates: {
      canonical: localePath(locale, '/'),
      languages: Object.fromEntries(
        locales.map((code) => [localeConfig[code].htmlLang, localePath(code, '/')]),
      ),
    },
    openGraph: {
      type: 'website',
      siteName: dict.meta.siteName,
      locale: localeConfig[locale].intlLocale.replace('-', '_'),
      title: `${dict.meta.siteName} — ${dict.meta.tagline}`,
      description: dict.meta.defaultDescription,
    },
    // Mock prices must never reach a search result.
    robots: allowIndexing ? undefined : { index: false, follow: false },
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps<'/[locale]'>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = getDictionary(locale);
  const { htmlLang, dir, defaultCurrency } = localeConfig[locale];

  return (
    <html
      lang={htmlLang}
      dir={dir}
      className={`${rubik.variable} ${assistant.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <CurrencyProvider defaultCurrency={defaultCurrency}>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-3 focus:rounded-sm focus:bg-brand focus:px-4 focus:py-2 focus:text-on-brand"
          >
            {dict.header.skipToContent}
          </a>
          <Header locale={locale} dict={dict} />
          <main id="main" className="flex-1">
            {children}
          </main>
          <Footer locale={locale} dict={dict} />
        </CurrencyProvider>
      </body>
    </html>
  );
}
