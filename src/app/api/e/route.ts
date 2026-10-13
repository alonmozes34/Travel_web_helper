import { countersFor, deviceOf, isRobot, optedOut } from '@/lib/stats/events';
import { israelDay, statsStoreFromEnv } from '@/lib/stats/store';

export const dynamic = 'force-dynamic';

/** A page view or a click is a few hundred bytes; anything larger is not ours. */
const MAX_BODY = 2_000;

/**
 * Where the site's own pages report what happened (`navigator.sendBeacon`),
 * to be added to the day's totals. See `src/lib/stats/events.ts` for what is
 * counted and what never is.
 *
 * Always answers 204, counted or not: the page does not wait for it and has
 * nothing to do with the answer. Not counted: another site's request, a
 * browser that asked not to be followed, a robot, anything not on the list,
 * and every request while no store is connected.
 */
export async function POST(request: Request) {
  const done = new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
  const store = statsStoreFromEnv();
  if (!store) return done;

  const ownHost = new URL(request.url).host;
  const origin = request.headers.get('origin');
  if (origin && new URL(origin).host !== ownHost) return done;
  if (optedOut(request.headers)) return done;
  const userAgent = request.headers.get('user-agent') ?? '';
  if (isRobot(userAgent)) return done;

  const text = await request.text().catch(() => '');
  if (!text || text.length > MAX_BODY) return done;
  let event: unknown;
  try {
    event = JSON.parse(text);
  } catch {
    return done;
  }

  const counters = countersFor(event, {
    // The host's header names the country; the visitor's address is never read here.
    country: request.headers.get('x-vercel-ip-country'),
    device: deviceOf(userAgent),
    ownHost,
  });
  if (counters) await store.increment(israelDay(), counters).catch(() => {});
  return done;
}
