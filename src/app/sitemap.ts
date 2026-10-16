import type { MetadataRoute } from 'next';
import { countries } from '@/data/countries';
import { getCatalogue } from '@/lib/catalogue/getCatalogue';
import { coverageOf } from '@/lib/comparison/catalogueCoverage';
import { pageFamilies } from '@/lib/comparison/regionOffers';
import { regionPages } from '@/data/regionPages';
import { providers } from '@/data/providers';
import { localeConfig, localePath, locales } from '@/i18n/config';
import { siteUrl } from '@/lib/site';

/**
 * One entry per page per locale, each carrying the alternates for the other
 * locales so the Hebrew and English versions are understood as the same page
 * rather than as competitors.
 */
/** Pages that exist for trust and law rather than for search traffic. */
const LOW_PRIORITY = ['/about', '/accessibility', '/disclosure', '/privacy', '/terms'];

// Which destinations are listed depends on the live catalogue, so the sitemap
// is built on request rather than frozen at build time.
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { plans } = await getCatalogue();
  const { isCovered: isCountryCovered } = coverageOf(plans);
  const paths = [
    '/',
    '/about',
    '/guides',
    '/guides/choose',
    '/guides/how-much-data',
    '/guides/install',
    '/accessibility',
    '/disclosure',
    '/privacy',
    '/terms',
    '/devices',
    '/codes',
    '/reviews',
    '/providers',
    // The hub every destination page hangs off.
    '/esim',
    ...providers.map((provider) => `/providers/${provider.slug}`),
    // A region's page only while some plan covers two of its countries.
    ...regionPages
      .filter((region) => pageFamilies(plans, region).length > 0)
      .map((region) => `/esim/region/${region.id}`),
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
      priority: path === '/' ? 1 : LOW_PRIORITY.includes(path) ? 0.3 : 0.8,
      alternates: {
        languages: Object.fromEntries(
          locales.map((code) => [localeConfig[code].htmlLang, `${siteUrl}${localePath(code, path)}`]),
        ),
      },
    })),
  );
}
