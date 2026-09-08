import type { Provider } from '@/lib/types/provider';

/**
 * Provider records for the prototype.
 *
 * Names are real companies in this market; `brandColor` is a placeholder used
 * for the logo tile until real marks are licensed, and no capability here is
 * presented to travellers as a verified fact.
 */
export const mockProviders: Provider[] = [
  { id: 'airalo', name: 'Airalo', slug: 'airalo', brandColor: '#E4572E', activation: 'both' },
  { id: 'saily', name: 'Saily', slug: 'saily', brandColor: '#1F6FEB', activation: 'app' },
  { id: 'holafly', name: 'Holafly', slug: 'holafly', brandColor: '#111827', activation: 'qr' },
  { id: 'nomad', name: 'Nomad', slug: 'nomad', brandColor: '#1E7F5C', activation: 'both' },
  { id: 'ubigi', name: 'Ubigi', slug: 'ubigi', brandColor: '#0F172A', activation: 'both' },
  { id: 'yesim', name: 'Yesim', slug: 'yesim', brandColor: '#7A3BE8', activation: 'app' },
  { id: 'alosim', name: 'aloSIM', slug: 'alosim', brandColor: '#0EA5A5', activation: 'both' },
  { id: 'maya', name: 'Maya Mobile', slug: 'maya-mobile', brandColor: '#B4451F', activation: 'qr' },
];

const byId = new Map(mockProviders.map((provider) => [provider.id, provider]));

export function getProvider(id: string): Provider | undefined {
  return byId.get(id);
}
