import type { Plan } from '@/lib/types/plan';
import {
  sourceResult,
  type ProviderSource,
  type SkippedRecord,
  type SourceResult,
} from '../ProviderSource';
import { mapImpactItem } from './mapItem';
import type {
  ImpactCatalogConfig,
  ImpactCatalogResponse,
  ImpactCredentials,
} from './types';

/**
 * An impact.com product catalogue as a plan source.
 *
 * One publisher account covers several advertisers — Airalo, Nomad, Ubigi and
 * Holafly all run their programmes there — so this one adapter is the path to
 * most of the catalogue, and each advertiser is a `ImpactCatalogConfig`.
 *
 * Written against the published API reference rather than against a live
 * account: the endpoint shape, HTTP Basic auth with the account SID and auth
 * token, and the item fields all come from their documentation. Until real
 * credentials exist it is exercised through `fetchJson`, which the tests
 * replace with a fixture. When the credentials arrive, nothing here changes.
 *
 * What is NOT yet verified, and must be checked against a real account before
 * this is trusted in production: whether these advertisers publish a product
 * catalogue at all. impact.com supports catalogues; populating one is the
 * advertiser's choice, and a link-only programme has none. If a catalogue
 * comes back empty, that is the answer — not a bug here.
 */
export function impactSource({
  credentials,
  catalogues,
  fetchJson = defaultFetchJson,
  now = () => new Date().toISOString(),
}: {
  credentials: ImpactCredentials;
  catalogues: ImpactCatalogConfig[];
  /** Injected so tests and a dry run can supply a fixture. */
  fetchJson?: (url: string, credentials: ImpactCredentials) => Promise<ImpactCatalogResponse>;
  now?: () => string;
}): ProviderSource {
  return {
    id: 'impact',
    label: 'impact.com catalogue',
    async fetch(): Promise<SourceResult> {
      const fetchedAt = now();
      const plans: Plan[] = [];
      const skipped: SkippedRecord[] = [];

      for (const catalogue of catalogues) {
        // Paged: impact.com returns 100 items by default and a next-page URI.
        let url = catalogueUrl(credentials, catalogue.catalogId);
        const seen = new Set<string>();

        while (url && !seen.has(url)) {
          seen.add(url);
          const response = await fetchJson(url, credentials);

          for (const item of response.Items ?? []) {
            const mapped = mapImpactItem(item, catalogue, fetchedAt);
            if ('plan' in mapped) plans.push(mapped.plan);
            else skipped.push(mapped.skipped);
          }

          const next = response['@nextpageuri'];
          url = next ? absolute(credentials, next) : '';
        }
      }

      return sourceResult('impact', plans, skipped, fetchedAt);
    },
  };
}

const DEFAULT_BASE = 'https://api.impact.com';

function catalogueUrl(credentials: ImpactCredentials, catalogId: string): string {
  const base = credentials.baseUrl ?? DEFAULT_BASE;
  return `${base}/Mediapartners/${credentials.accountSid}/Catalogs/${catalogId}/Items`;
}

function absolute(credentials: ImpactCredentials, uri: string): string {
  if (uri.startsWith('http://') || uri.startsWith('https://')) return uri;
  return `${credentials.baseUrl ?? DEFAULT_BASE}${uri.startsWith('/') ? '' : '/'}${uri}`;
}

/**
 * HTTP Basic with the account SID as the username and the auth token as the
 * password, which is what the API reference specifies.
 */
async function defaultFetchJson(
  url: string,
  credentials: ImpactCredentials,
): Promise<ImpactCatalogResponse> {
  const auth = Buffer.from(`${credentials.accountSid}:${credentials.authToken}`).toString('base64');
  const response = await fetch(url, {
    headers: { Authorization: `Basic ${auth}`, Accept: 'application/json' },
  });

  if (!response.ok) {
    // The status matters more than the body: 401 means the credentials are
    // wrong, 404 means the catalogue id is, and both are worth saying plainly.
    throw new Error(`impact.com responded ${response.status} for ${url}`);
  }

  return (await response.json()) as ImpactCatalogResponse;
}
