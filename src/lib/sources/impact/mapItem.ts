import { countries, getCountryByCode } from '@/data/countries';
import { getRegion } from '@/data/regions';
import { isCurrency } from '@/i18n/config';
import type { Plan } from '@/lib/types/plan';
import type { SkippedRecord } from '../ProviderSource';
import {
  destinationCandidates,
  isUnlimited,
  parseAllowanceMb,
  parseMinorAmount,
  parseValidityDays,
} from '../parsePlanText';
import type { ImpactCatalogConfig, ImpactCatalogItem } from './types';

/**
 * One catalogue item to one `Plan`, or an explanation of why not.
 *
 * The mapper is deliberately unforgiving. Every eSIM attribute this comparison
 * ranks on has to be recovered from a product name written for shoppers, and
 * an item that does not yield a confident answer is skipped rather than filled
 * in with a default. A plan on the page saying "10GB, 30 days, Japan" must be
 * one the provider described that way.
 *
 * What is knowingly missing from an affiliate catalogue, and therefore from
 * every plan this produces: the local network operators, hotspot, calls, SMS,
 * top-up and fair-usage terms. Those are set to the conservative value — false
 * or null — rather than the flattering one, and the interface already renders
 * "the provider has not published this" for them. A feature we cannot verify
 * is not a feature we advertise.
 */
export function mapImpactItem(
  item: ImpactCatalogItem,
  config: ImpactCatalogConfig,
  fetchedAt: string,
): { plan: Plan } | { skipped: SkippedRecord } {
  const externalId = String(item.CatalogItemId ?? '').trim() || 'unknown';
  const label = String(item.Name ?? '').trim();

  const skip = (reason: SkippedRecord['reason'], detail: string) => ({
    skipped: { externalId, label: label || externalId, reason, detail },
  });

  if (!label) return skip('unparsable-allowance', 'the item has no Name to read');

  // Out of stock is not a plan a traveller can buy today.
  if (item.StockAvailability === 'OutOfStock') {
    return skip('out-of-stock', 'StockAvailability is OutOfStock');
  }

  const currency = String(item.Currency ?? '').toUpperCase();
  if (!isCurrency(currency)) {
    return skip('unsupported-currency', `Currency "${item.Currency ?? ''}" is not one we display`);
  }

  const finalPriceMinor = parseMinorAmount(item.CurrentPrice);
  if (finalPriceMinor === null || finalPriceMinor <= 0) {
    return skip('missing-price', `CurrentPrice "${item.CurrentPrice ?? ''}" is not a usable price`);
  }
  // An OriginalPrice below the current one is a feed error, not a markup.
  const originalCandidate = parseMinorAmount(item.OriginalPrice);
  const originalPriceMinor =
    originalCandidate !== null && originalCandidate > finalPriceMinor
      ? originalCandidate
      : finalPriceMinor;

  const text = `${label} ${String(item.Description ?? '')}`;

  const unlimited = readBoolean(item, config.fields?.unlimited) ?? isUnlimited(text);
  const allowanceMb = unlimited
    ? 0
    : (readNumber(item, config.fields?.allowanceMb) ?? parseAllowanceMb(text));
  if (allowanceMb === null) {
    return skip('unparsable-allowance', `no allowance could be read from "${label}"`);
  }

  const validityDays = readNumber(item, config.fields?.validityDays) ?? parseValidityDays(text);
  if (validityDays === null) {
    return skip('unparsable-validity', `no validity could be read from "${label}"`);
  }

  const coverage = resolveCoverage(item, config, text);
  if (coverage === null) {
    return skip('unknown-destination', `no destination could be resolved from "${label}"`);
  }

  return {
    plan: {
      // Namespaced so two sources cannot collide, and so a plan's origin is
      // legible in a URL or a bug report.
      id: `impact-${config.providerId}-${externalId}`,
      providerId: config.providerId,
      planName: label,
      coverage,
      dataAmountMb: allowanceMb,
      isUnlimited: unlimited,
      // Not in an affiliate catalogue. Absent, not assumed generous.
      fairUsage: null,
      validityDays,
      sourceCurrency: currency,
      originalPriceMinor,
      finalPriceMinor,
      discount: null,
      networks: [],
      hotspot: false,
      calls: false,
      sms: false,
      topUp: false,
      // Filled in by the source, which is what holds the tracking template.
      affiliateUrl: typeof item.Url === 'string' ? item.Url : null,
      source: 'api',
      lastUpdatedAt: fetchedAt,
    },
  };
}

function readNumber(item: ImpactCatalogItem, field?: string): number | null {
  if (!field) return null;
  const raw = item[field];
  const value = typeof raw === 'number' ? raw : Number.parseFloat(String(raw ?? ''));
  return Number.isFinite(value) && value > 0 ? Math.round(value) : null;
}

function readBoolean(item: ImpactCatalogItem, field?: string): boolean | null {
  if (!field) return null;
  const raw = item[field];
  if (typeof raw === 'boolean') return raw;
  if (typeof raw === 'string') {
    const value = raw.trim().toLowerCase();
    if (['true', 'yes', '1'].includes(value)) return true;
    if (['false', 'no', '0'].includes(value)) return false;
  }
  return null;
}

/**
 * Which destinations the plan covers.
 *
 * A declared country code is trusted. Otherwise the name is searched for a
 * country or a region we know — and a name matching neither is rejected, so a
 * plan never lands on a destination page by accident. Matching runs on the
 * resolved country list, never on the label, as everywhere else.
 */
function resolveCoverage(
  item: ImpactCatalogItem,
  config: ImpactCatalogConfig,
  text: string,
): Plan['coverage'] | null {
  const declared = config.fields?.countryCode
    ? String(item[config.fields.countryCode] ?? '').toUpperCase()
    : '';
  if (/^[A-Z]{2}$/.test(declared) && getCountryByCode(declared)) {
    return { kind: 'country', countries: [declared], regionId: null, publishedDestinationCount: null };
  }

  const candidates = destinationCandidates(text);

  for (const candidate of candidates) {
    const region = matchRegion(candidate);
    if (region) {
      return {
        kind: region.id === 'global' ? 'global' : 'region',
        countries: region.countries,
        regionId: region.id,
        publishedDestinationCount: region.countries.length,
      };
    }
  }

  for (const candidate of candidates) {
    const country = matchCountry(candidate);
    if (country) {
      return {
        kind: 'country',
        countries: [country],
        regionId: null,
        publishedDestinationCount: null,
      };
    }
  }

  return null;
}

const REGION_WORDS: Record<string, string> = {
  europe: 'europe',
  'european union': 'europe',
  asia: 'asia',
  'asia pacific': 'asia',
  africa: 'africa',
  oceania: 'oceania',
  caribbean: 'caribbean',
  'north america': 'north-america',
  'south america': 'south-america',
  'latin america': 'south-america',
  'middle east': 'middle-east',
  global: 'global',
  worldwide: 'global',
  world: 'global',
};

function matchRegion(candidate: string) {
  const id = REGION_WORDS[candidate.toLowerCase()];
  return id ? getRegion(id) : undefined;
}

/** Exact name match only — a substring match would put Guinea inside Papua. */
function matchCountry(candidate: string): string | null {
  const needle = candidate.trim().toLowerCase();
  if (needle.length < 3) return null;
  const hit = countries.find(
    (country) =>
      country.names.en.toLowerCase() === needle ||
      country.names.he.toLowerCase() === needle ||
      country.aliases.some((alias) => alias.toLowerCase() === needle),
  );
  return hit?.code ?? null;
}
