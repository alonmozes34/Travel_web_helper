import type { Provider } from '@/lib/types/provider';
import { mockProviders } from './mockProviders';

/**
 * Providers whose plans reach the site from a real source.
 *
 * `activation` is null for both: neither API says whether a plan
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
    // No logo until one is taken from their affiliate marketing assets; the
    // tile shows the initial on this colour. Their wordmark's orange darkened
    // until white on it reads at 5.2:1 — the brand orange itself is 3:1.
    brandColor: '#C2410C',
    activation: null,
    // Their API prices everything in euros. What an Israeli card is charged
    // in has not been confirmed, and on 28 September 2026 the owner saw a
    // Yesim price in pounds.
    billingCurrency: 'not-confirmed',
  },
];

/** A real provider first; the demo ones exist only for the demo catalogue. */
export function getProvider(id: string): Provider | undefined {
  return providers.find((provider) => provider.id === id) ?? mockProviders.find((provider) => provider.id === id);
}
