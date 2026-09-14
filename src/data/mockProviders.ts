import type { Provider } from '@/lib/types/provider';

/**
 * Provider records for the prototype.
 *
 * The names are deliberately not real companies.
 *
 * They used to be — Airalo, Nomad, Saily and five others — and that is what
 * forced the whole site behind a password: a public page stating what Airalo
 * charges, where the number was invented, is a false claim about somebody
 * else's commercial terms, and a demo banner does not cure it.
 *
 * Naming the providers honestly costs the demo nothing. The engine still
 * demonstrates everything it is meant to — ranking, coverage, price per GB,
 * the shekel conversion — and nobody is misrepresented, so the site needs no
 * password to be publishable. The real names come back with real data, from a
 * provider source, and not before.
 *
 * `brandColor` is a placeholder for the logo tile, and no capability here is
 * presented to travellers as a verified fact.
 */
export const mockProviders: Provider[] = [
  { id: 'demo-alpha', name: 'Demo Alpha', slug: 'demo-alpha', brandColor: '#E4572E', activation: 'both' },
  { id: 'demo-beta', name: 'Demo Beta', slug: 'demo-beta', brandColor: '#1F6FEB', activation: 'app' },
  { id: 'demo-gamma', name: 'Demo Gamma', slug: 'demo-gamma', brandColor: '#111827', activation: 'qr' },
  { id: 'demo-delta', name: 'Demo Delta', slug: 'demo-delta', brandColor: '#1E7F5C', activation: 'both' },
  { id: 'demo-epsilon', name: 'Demo Epsilon', slug: 'demo-epsilon', brandColor: '#0F172A', activation: 'both' },
  { id: 'demo-zeta', name: 'Demo Zeta', slug: 'demo-zeta', brandColor: '#7A3BE8', activation: 'app' },
  { id: 'demo-eta', name: 'Demo Eta', slug: 'demo-eta', brandColor: '#0EA5A5', activation: 'both' },
  { id: 'demo-theta', name: 'Demo Theta', slug: 'demo-theta', brandColor: '#B4451F', activation: 'qr' },
];

const byId = new Map(mockProviders.map((provider) => [provider.id, provider]));

export function getProvider(id: string): Provider | undefined {
  return byId.get(id);
}
