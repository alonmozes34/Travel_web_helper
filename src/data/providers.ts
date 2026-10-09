import type { Provider } from '@/lib/types/provider';
import { mockProviders } from './mockProviders';

/**
 * Providers whose plans reach the site from a real source.
 *
 * `activation` is null for all: no source says whether a plan
 * installs by QR code, by app, or both, and the page says "not stated" rather
 * than repeating what their marketing suggests.
 */
export const providers: Provider[] = [
  {
    id: 'alosim',
    name: 'aloSIM',
    slug: 'alosim',
    brandColor: '#1C3FAA',
    activation: null,
    // Their store showed the same US-dollar prices as their API when fifteen
    // were checked by hand on 25 September 2026.
    billingCurrency: 'as-listed',
    // "aloSIM logo (black)" from their affiliate creatives in Everflow,
    // trimmed and scaled to four times the size it is shown at.
    logo: { src: '/providers/alosim.png', width: 205, height: 96 },
  },
  {
    id: 'yesim',
    name: 'Yesim',
    slug: 'yesim',
    // Their wordmark's orange darkened until white on it reads at 5.2:1 — the
    // brand orange itself is 3:1. Used only where no logo is shown.
    brandColor: '#C2410C',
    // The logo in their own site's header (yesim.app, read 6 October 2026, at
    // the owner's request). To be swapped for the file in their affiliate
    // creatives if it differs.
    logo: { src: '/providers/yesim.svg', width: 582, height: 194 },
    activation: null,
    // Their API prices everything in euros. What an Israeli card is charged
    // in has not been confirmed, and on 28 September 2026 the owner saw a
    // Yesim price in pounds.
    billingCurrency: 'not-confirmed',
  },
  {
    id: 'zensim',
    name: 'ZenSim',
    slug: 'zensim',
    // Their site is lime and lilac, neither of which carries white text; this
    // is the lilac darkened until white on it reads above 7:1. Used only where
    // no logo is shown.
    brandColor: '#6B21A8',
    // The dark version of the logo in their own site's header (zensim.com,
    // read 6 October 2026, at the owner's request).
    logo: { src: '/providers/zensim.svg', width: 936, height: 269 },
    activation: null,
    // Their pages price in US dollars. What an Israeli card is charged in has
    // not been confirmed.
    billingCurrency: 'not-confirmed',
  },
  {
    id: 'saily',
    name: 'Saily',
    slug: 'saily',
    // Their wordmark is black; this is the near-black of their site's text.
    // Used only where no logo is shown.
    brandColor: '#141414',
    // The logo in their own site's header (saily.com, read 9 October 2026),
    // without its moving wave: black on the white logo tile, where the owner
    // asked for it to be seen clearly.
    logo: { src: '/providers/saily.svg', width: 1000, height: 421 },
    activation: null,
    // Their API prices in US dollars. What an Israeli card is charged in has
    // not been confirmed.
    billingCurrency: 'not-confirmed',
  },
];

/** A real provider first; the demo ones exist only for the demo catalogue. */
export function getProvider(id: string): Provider | undefined {
  return providers.find((provider) => provider.id === id) ?? mockProviders.find((provider) => provider.id === id);
}
