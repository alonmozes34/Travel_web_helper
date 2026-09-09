import { countries } from './countries';
import { getRegion } from './regions';

/**
 * MOCK DATA — the destination lists the invented providers claim to cover.
 *
 * A real provider publishes its own list, and the adapter will read it from
 * the provider's API. Until then a demo plan that says "130 destinations"
 * has to actually cover 130 destinations, or the site will tell a traveller
 * that Brazil is not covered by a global plan that plainly is. Sizing the
 * list to the claim keeps the two halves of the prototype consistent.
 *
 * Nothing here should survive the first real provider integration.
 */

/**
 * The order providers tend to add destinations in: the places most travellers
 * go first, then everything else alphabetically. Only used to decide which
 * countries land inside a demo plan's destination count.
 */
const addedFirst = [
  'US', 'GB', 'FR', 'IT', 'ES', 'DE', 'GR', 'TH', 'JP', 'TR',
  'NL', 'PT', 'CZ', 'AT', 'CH', 'BE', 'PL', 'HU', 'IE', 'HR',
  'AE', 'GE', 'CY', 'IL', 'JO', 'EG', 'MA', 'ZA', 'KE', 'TZ',
  'IN', 'VN', 'ID', 'SG', 'MY', 'PH', 'KR', 'CN', 'HK', 'TW',
  'CA', 'MX', 'BR', 'AR', 'CL', 'PE', 'CO', 'CR', 'DO', 'PA',
  'AU', 'NZ', 'FJ', 'LK', 'NP', 'KH', 'LA', 'MV', 'MU', 'SC',
  'DK', 'SE', 'NO', 'FI', 'IS', 'EE', 'LV', 'LT', 'RO', 'BG',
  'RS', 'SI', 'SK', 'AL', 'ME', 'BA', 'MK', 'MT', 'LU', 'UA',
];

const priority = new Map(addedFirst.map((code, index) => [code, index]));

function catalogueOrder(codes: string[]): string[] {
  return [...codes].sort((a, b) => {
    const pa = priority.get(a) ?? Number.MAX_SAFE_INTEGER;
    const pb = priority.get(b) ?? Number.MAX_SAFE_INTEGER;
    return pa - pb || a.localeCompare(b);
  });
}

const sellable = countries
  .filter((country) => country.continent !== 'antarctic')
  .map((country) => country.code);

/**
 * The destination list for a demo plan, sized to the count it advertises.
 * With no count, the whole region is covered.
 */
export function mockCoverageList(regionId: string, claimedDestinations: number | null): string[] {
  const pool = regionId === 'global' ? sellable : (getRegion(regionId)?.countries ?? []);
  const ordered = catalogueOrder(pool);
  if (claimedDestinations === null) return ordered;
  return ordered.slice(0, Math.min(claimedDestinations, ordered.length));
}
