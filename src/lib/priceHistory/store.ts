import { get, list, put } from '@vercel/blob';
import { cached } from '@/lib/catalogue/cache';
import { HISTORY_DAYS, summarise, type PriceSnapshot, type PriceSummary } from './summary';

/**
 * Where the price history lives: a private Vercel Blob store, connected to
 * the project in Vercel (Storage → Blob). Connecting sets either
 * BLOB_READ_WRITE_TOKEN or, for stores that authenticate with Vercel's OIDC
 * token, BLOB_STORE_ID; the Blob SDK reads whichever is there. Without
 * either there is no history: nothing is written, and the pages say nothing
 * about price changes.
 *
 *   price-history/snapshots/YYYY-MM-DD.json   one a day, never rewritten
 *   price-history/summary.json                rewritten after each snapshot
 */
const SNAPSHOTS = 'price-history/snapshots/';
const SUMMARY = 'price-history/summary.json';

export function priceHistoryEnabled(env: Record<string, string | undefined> = process.env): boolean {
  return Boolean(env.BLOB_READ_WRITE_TOKEN?.trim() || env.BLOB_STORE_ID?.trim());
}

async function readJson<T>(pathname: string): Promise<T | null> {
  const result = await get(pathname, { access: 'private', useCache: false });
  if (!result || result.statusCode !== 200 || !result.stream) return null;
  return (await new Response(result.stream).json()) as T;
}

async function writeJson(pathname: string, value: unknown, overwrite: boolean): Promise<void> {
  await put(pathname, JSON.stringify(value), {
    access: 'private',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: overwrite,
  });
}

/**
 * Records today's prices once, then rewrites the summary from the last
 * HISTORY_DAYS snapshots. Safe to call more than once a day: the day's
 * snapshot is written the first time only.
 */
export async function recordSnapshot(snapshot: PriceSnapshot): Promise<{ written: boolean; summary: PriceSummary | null }> {
  const { blobs } = await list({ prefix: SNAPSHOTS, limit: 1000 });
  const existing = new Set(blobs.map((blob) => blob.pathname));
  const path = `${SNAPSHOTS}${snapshot.date}.json`;
  const written = !existing.has(path);
  if (written) await writeJson(path, snapshot, false);

  const recent = [...existing, path]
    .filter((name, index, all) => all.indexOf(name) === index)
    .sort()
    .slice(-HISTORY_DAYS);
  const snapshots = (await Promise.all(recent.map((name) => (name === path ? snapshot : readJson<PriceSnapshot>(name))))).filter(
    (s): s is PriceSnapshot => s !== null,
  );
  const summary = summarise(snapshots);
  if (summary) await writeJson(SUMMARY, summary, true);
  return { written, summary };
}

const summaryCache = cached({
  load: () => readJson<PriceSummary>(SUMMARY),
  ttlMs: 60 * 60 * 1000,
  staleWhileRevalidate: true,
});

/** The summary for the pages, or null when there is no store or no history yet. */
export async function getPriceSummary(): Promise<PriceSummary | null> {
  if (!priceHistoryEnabled()) return null;
  try {
    return (await summaryCache.get()).value;
  } catch {
    return null;
  }
}
