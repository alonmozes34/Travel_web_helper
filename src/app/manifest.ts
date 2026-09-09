import type { MetadataRoute } from 'next';
import { getDictionary } from '@/i18n/getDictionary';
import { defaultLocale, localeConfig } from '@/i18n/config';

/**
 * Web app manifest.
 *
 * There is no service worker and no offline story — this is not a PWA. It
 * exists so that a traveller who adds the site to their home screen (which is
 * exactly what someone does with a tool they will open at an airport) gets the
 * brand and the right icon instead of a screenshot of the page and a truncated
 * URL.
 *
 * `start_url` is `/` rather than `/he`: Hebrew is served from unprefixed URLs
 * and `/he` redirects, so starting there would cost every launch a redirect.
 */
export default function manifest(): MetadataRoute.Manifest {
  const dict = getDictionary(defaultLocale);

  return {
    name: `${dict.meta.siteName} | ${dict.meta.tagline}`,
    // Home screens truncate hard, and the wordmark is the part worth keeping.
    short_name: dict.meta.siteName,
    description: dict.meta.defaultDescription,
    lang: localeConfig[defaultLocale].htmlLang,
    dir: localeConfig[defaultLocale].dir,
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0b6bd3',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
  };
}
