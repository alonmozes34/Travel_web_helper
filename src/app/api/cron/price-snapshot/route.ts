import { getCatalogue } from '@/lib/catalogue/getCatalogue';
import { priceHistoryEnabled, recordSnapshot } from '@/lib/priceHistory/store';
import { snapshotOf } from '@/lib/priceHistory/summary';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/** Today's date in Israel, the day the owner and the visitors live in. */
function israelDate(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jerusalem' }).format(now);
}

const pause = (ms: number) => new Promise((done) => setTimeout(done, ms));

/**
 * Records today's prices for the price history. Called once a day by Vercel
 * Cron (vercel.json). Writing is idempotent — the day's snapshot is written
 * once — so a second call does no harm; with CRON_SECRET set in Vercel, only
 * Vercel's own call is accepted.
 *
 * A catalogue with a source that failed or is still loading is not recorded:
 * a provider missing for a day would otherwise look, the next day, like a
 * whole catalogue of new plans.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (secret && request.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ ok: false, error: 'unauthorised' }, { status: 401 });
  }
  if (!priceHistoryEnabled()) {
    return Response.json({ ok: false, error: 'no Blob store connected (BLOB_READ_WRITE_TOKEN)' }, { status: 503 });
  }

  let catalogue = await getCatalogue();
  for (let attempt = 0; attempt < 4 && catalogue.sources.some((source) => !source.ok); attempt += 1) {
    await pause(5000);
    catalogue = await getCatalogue();
  }
  const failed = catalogue.sources.filter((source) => !source.ok);
  if (failed.length) {
    return Response.json({ ok: false, error: 'a source did not load', sources: failed.map((s) => s.id) }, { status: 503 });
  }

  const date = israelDate();
  const { written, summary } = await recordSnapshot(snapshotOf(catalogue.plans, date));
  return Response.json(
    { ok: true, date, written, plans: catalogue.plans.length, days: summary?.days ?? 0, withHistory: summary ? Object.keys(summary.plans).length : 0 },
    { headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } },
  );
}
