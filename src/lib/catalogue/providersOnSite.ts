import { getProvider } from '@/data/providers';
import type { Plan } from '@/lib/types/plan';
import type { Provider } from '@/lib/types/provider';

export type ProviderOnSite = {
  id: string;
  name: string;
  brandColor: string;
  logo: Provider['logo'];
  /** Plans of theirs the site lists right now. */
  plans: number;
  /** Countries those plans cover. */
  destinations: number;
};

/**
 * Every provider with at least one plan on the site, from the catalogue the
 * pages are built from — so a provider that joins appears by itself, and one
 * whose plans all drop out (no plan-level link, a failed feed) disappears by
 * itself. Ordered by name: this list is not a ranking, and must not look like
 * one.
 */
export function providersOnSite(plans: readonly Plan[]): ProviderOnSite[] {
  const byProvider = new Map<string, { plans: number; countries: Set<string> }>();
  for (const plan of plans) {
    const entry = byProvider.get(plan.providerId) ?? { plans: 0, countries: new Set<string>() };
    entry.plans += 1;
    for (const code of plan.coverage.countries) entry.countries.add(code);
    byProvider.set(plan.providerId, entry);
  }
  return [...byProvider.entries()]
    .flatMap(([id, entry]) => {
      const provider = getProvider(id);
      if (!provider) return [];
      return [{
        id,
        name: provider.name,
        brandColor: provider.brandColor,
        logo: provider.logo,
        plans: entry.plans,
        destinations: entry.countries.size,
      }];
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));
}
