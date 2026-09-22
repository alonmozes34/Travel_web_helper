/**
 * Turns an Everflow tracking-link export into `src/data/alosim.generated.ts`.
 *
 * Where the input comes from: the aloSIM partner dashboard at
 * affinityclick.everflowclient.io → Tracking & Asset Generator → select the
 * offers, tick "Include additional URLs", Get Tracking Link(s) → Export List.
 * The export is a JSON array of { "Offer Name", "Offer URL Name",
 * "Tracking Link" }.
 *
 *   npx tsx scripts/import-alosim-links.ts <export.json>
 *
 * Nothing here is invented. Every destination, slug and link below is one
 * aloSIM registered with their own affiliate network; the only judgement the
 * script makes is mapping their slug onto an ISO country code, and a slug it
 * cannot map is reported rather than guessed at.
 *
 * Two things worth knowing about the shape of the export:
 *
 *  - The same page is registered several times under the 10% offer (four URL
 *    ids each) and exactly once under the $5 offer. `uid` is Everflow's
 *    identifier for a registered URL; attribution rides on `oid` and `affid`.
 *    We keep the lowest `uid` per destination so the output is deterministic,
 *    and what `uid` actually selects is on the list of questions for aloSIM.
 *  - `affid` is not a secret. It appears in every outbound link a visitor can
 *    see, and a link without it earns nothing.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { countries } from '../src/data/countries';

type ExportRow = {
  'Offer Name': string;
  'Offer URL Name': string;
  'Tracking Link': string;
};

const DEEP_LINK =
  /\/esim-store\/(country|region)\/([^?]+)\?uid=(\d+)&oid=(\d+)&affid=(\d+)/u;

/**
 * Slugs whose spelling differs from ours. Each is a naming difference, not a
 * different place — CLDR says "Czechia" where aloSIM says "czech-republic".
 */
const SLUG_TO_CODE: Record<string, string> = {
  'czech-republic': 'CZ',
  'hong-kong': 'HK',
  macau: 'MO',
  macedonia: 'MK',
  myanmar: 'MM',
  'antigua-and-barbuda': 'AG',
  'saint-kitts-and-nevis': 'KN',
  'saint-lucia': 'LC',
  'saint-vincent': 'VC',
  'turks-and-caicos': 'TC',
};

const normalise = (value: string) =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');

const bySlug = new Map(countries.map((country) => [normalise(country.slug), country.code]));
const byName = new Map(countries.map((country) => [normalise(country.names.en), country.code]));

/**
 * aloSIM writes a few slugs in ways ours are not: percent-encoded accents
 * (`r%C3%A9union`), and a parenthesised abbreviation (`united-kingdom-(uk)`).
 * Both are decoded and stripped before matching — the alternative is a table
 * of special cases that grows every time they add a destination.
 */
function codeForSlug(slug: string): string | null {
  let base = slug;
  try {
    base = decodeURIComponent(slug);
  } catch {
    // A malformed escape is left as it is; it simply will not match.
  }
  base = base.replace(/-esim$/u, '').replace(/-?\([^)]*\)/gu, '');
  return SLUG_TO_CODE[base] ?? bySlug.get(normalise(base)) ?? byName.get(normalise(base)) ?? null;
}

const input = process.argv[2];
if (!input) {
  console.error('usage: tsx scripts/import-alosim-links.ts <everflow-export.json>');
  process.exit(1);
}

const rows: ExportRow[] = JSON.parse(readFileSync(input, 'utf8'));

type Entry = {
  kind: 'country' | 'region';
  slug: string;
  label: string;
  code: string | null;
  /** offer id → { uid, link } for the lowest uid seen. */
  offers: Map<number, { uid: number; link: string }>;
};

const entries = new Map<string, Entry>();
let affiliateId = '';
const unmapped = new Set<string>();

for (const row of rows) {
  const match = DEEP_LINK.exec(row['Tracking Link']);
  if (!match) continue;
  const [, kind, slug, uid, oid, affid] = match;
  affiliateId = affid;

  /**
   * Keyed by the country once it is resolved, not by aloSIM's slug: they have
   * Réunion registered twice, once as `réunion-esim` and once as the
   * percent-encoded `r%C3%A9union-esim`. Two entries for one island would
   * become two rows claiming the same destination.
   */
  const code = kind === 'country' ? codeForSlug(slug) : null;
  const key = code ? `country:${code}` : `${kind}:${slug}`;
  const existing = entries.get(key);
  const entry: Entry = existing ?? {
    kind: kind as 'country' | 'region',
    slug,
    label: row['Offer URL Name'],
    code,
    offers: new Map(),
  };
  if (kind === 'country' && entry.code === null) unmapped.add(slug);
  // Of two spellings of the same page, keep the one a human can read.
  if (existing && existing.slug.includes('%') && !slug.includes('%')) {
    existing.slug = slug;
    existing.label = row['Offer URL Name'];
  }

  const offerId = Number(oid);
  const current = entry.offers.get(offerId);
  if (!current || Number(uid) < current.uid) {
    entry.offers.set(offerId, { uid: Number(uid), link: row['Tracking Link'] });
  }
  entries.set(key, entry);
}

const list = [...entries.values()].sort(
  (a, b) => a.kind.localeCompare(b.kind) || a.slug.localeCompare(b.slug),
);

const offerIds = [...new Set(list.flatMap((entry) => [...entry.offers.keys()]))].sort(
  (a, b) => a - b,
);

const body = list
  .map((entry) => {
    const links = [...entry.offers.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([offer, value]) => `      ${offer}: '${value.link}',`)
      .join('\n');
    return (
      `  {\n` +
      `    kind: '${entry.kind}',\n` +
      `    slug: '${entry.slug}',\n` +
      `    label: ${JSON.stringify(entry.label)},\n` +
      `    countryCode: ${entry.code ? `'${entry.code}'` : 'null'},\n` +
      `    links: {\n${links}\n    },\n` +
      `  },`
    );
  })
  .join('\n');

const countryCount = list.filter((entry) => entry.kind === 'country').length;
const regionCount = list.filter((entry) => entry.kind === 'region').length;

const file = `// Generated by scripts/import-alosim-links.ts — do not edit by hand.
// Source: aloSIM's own Everflow export (Tracking & Asset Generator → Export List).
// Refresh by re-exporting and re-running the script; the diff is reviewable.

/** The two live aloSIM offers. Which one we actually use is set elsewhere. */
export const alosimOfferIds = [${offerIds.join(', ')}] as const;
export type AlosimOfferId = (typeof alosimOfferIds)[number];

export type AlosimDestination = {
  /** A single country, or one of their regional bundles. */
  kind: 'country' | 'region';
  /** aloSIM's own slug, as it appears in their store URL. */
  slug: string;
  /** aloSIM's own label for the page. */
  label: string;
  /** ISO 3166-1 alpha-2, or null for a regional bundle. */
  countryCode: string | null;
  /** The tracking link for each offer, exactly as aloSIM issued it. */
  links: Record<number, string>;
};

/** The affiliate id every link carries. Not a secret — it is in every link. */
export const alosimAffiliateId = '${affiliateId}';

export const alosimDestinations: AlosimDestination[] = [
${body}
];
`;

writeFileSync(resolve('src/data/alosim.generated.ts'), file);

console.log(
  `wrote ${list.length} destinations — ${countryCount} countries, ${regionCount} regions, offers ${offerIds.join('/')}`,
);
if (unmapped.size > 0) {
  console.warn(`unmapped slugs (add them to SLUG_TO_CODE): ${[...unmapped].join(', ')}`);
}
