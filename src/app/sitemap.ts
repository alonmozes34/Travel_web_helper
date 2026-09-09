import type { MetadataRoute } from 'next';
import { countries } from '@/data/countries';
import { isCountryCovered } from '@/lib/comparison/catalogueCoverage';
import { localeConfig, localePath, locales } from '@/i18n/config';
import { siteUrl } from '@/lib/site';

/**
 * One entry per page per locale, each carrying the alternates for the other
 * locales so the Hebrew and English versions are understood as the same page
 * rather than as competitors.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    '/',
    '/accessibility',
    // A destination page with no plans behind it still exists and answers
    // honestly, but it is not worth asking a search engine to index.
    ...countries
      .filter((country) => isCountryCovered(country.code))
      .map((country) => `/esim/${country.slug}`),
  ];

  return paths.flatMap((path) =>
    locales.map((locale) => ({
      url: `${siteUrl}${localePath(locale, path)}`,
      changeFrequency: 'weekly' as const,
      priority: path === '/' ? 1 : path === '/accessibility' ? 0.3 : 0.8,
      alternates: {
        languages: Object.fromEntries(
          locales.map((code) => [localeConfig[code].htmlLang, `${siteUrl}${localePath(code, path)}`]),
        ),
      },
    })),
  );
}
