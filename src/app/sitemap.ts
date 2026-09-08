import type { MetadataRoute } from 'next';
import { countries } from '@/data/countries';
import { localeConfig, localePath, locales } from '@/i18n/config';
import { siteUrl } from '@/lib/site';

/**
 * One entry per page per locale, each carrying the alternates for the other
 * locales so the Hebrew and English versions are understood as the same page
 * rather than as competitors.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ['/', ...countries.map((country) => `/esim/${country.slug}`)];

  return paths.flatMap((path) =>
    locales.map((locale) => ({
      url: `${siteUrl}${localePath(locale, path)}`,
      changeFrequency: 'weekly' as const,
      priority: path === '/' ? 1 : 0.8,
      alternates: {
        languages: Object.fromEntries(
          locales.map((code) => [localeConfig[code].htmlLang, `${siteUrl}${localePath(code, path)}`]),
        ),
      },
    })),
  );
}
