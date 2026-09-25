import type { Provider } from '@/lib/types/provider';
import { mockProviders } from './mockProviders';

/**
 * Providers whose plans reach the site from a real source.
 *
 * `activation` is null for aloSIM: their API does not say whether a plan
 * installs by QR code, by app, or both, and the page says "not stated" rather
 * than repeating what their marketing suggests.
 */
export const providers: Provider[] = [
  { id: 'alosim', name: 'aloSIM', slug: 'alosim', brandColor: '#1C3FAA', activation: null },
];

/** A real provider first; the demo ones exist only for the demo catalogue. */
export function getProvider(id: string): Provider | undefined {
  return providers.find((provider) => provider.id === id) ?? mockProviders.find((provider) => provider.id === id);
}
