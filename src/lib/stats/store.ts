/**
 * Where the site's usage counts are kept: totals per day, nothing else.
 *
 * The owner, 13 October 2026: "anonymous, no cookies; country only". So
 * there are no events here to look back through — no visitor, no visit, no
 * timestamp finer than the day. Each day is one hash of counters
 * (`page:/esim/[country]` → 41, `click:saily` → 3), incremented as things
 * happen and read back by the dashboard. What is counted, and the rules for
 * every name, are in `./events.ts`.
 *
 * The store is Upstash Redis, connected through the Vercel Marketplace, which
 * sets `KV_REST_API_URL` and `KV_REST_API_TOKEN` (or, connected directly,
 * `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`). Without either,
 * nothing is counted and the dashboard says so. The test suites run an
 * in-memory store instead (`STATS_STORE=memory`), never a real one.
 */

/** A day's counters keep for a little over a year, then expire by themselves. */
export const DAY_TTL_SECONDS = 400 * 24 * 60 * 60;

export type StatsStore = {
  /** Adds `by` to each named counter of the day. */
  increment(day: string, counters: Record<string, number>): Promise<void>;
  /** Every counter of each day asked for; a day with nothing counted is `{}`. */
  read(days: readonly string[]): Promise<Record<string, Record<string, number>>>;
  /** Sets a counter only if it is not set yet; true when this call set it. For "alert sent today". */
  claim(day: string, name: string): Promise<boolean>;
};

const KEY_PREFIX = 'yk:stats:';
const key = (day: string) => `${KEY_PREFIX}${day}`;

/** Today's date in Israel, the day the owner and the visitors live in. */
export function israelDay(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jerusalem' }).format(now);
}

/** The `count` days ending today (Israel), oldest first. */
export function lastDays(count: number, now = new Date()): string[] {
  const today = israelDay(now);
  const [y, m, d] = today.split('-').map(Number);
  const days: string[] = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    days.push(new Date(Date.UTC(y, m - 1, d - i)).toISOString().slice(0, 10));
  }
  return days;
}

type Env = Record<string, string | undefined>;

/** The store this deployment counts into, or null when none is connected. */
export function statsStoreFromEnv(env: Env = process.env, fetchImpl: typeof fetch = fetch): StatsStore | null {
  if (env.STATS_STORE === 'memory') return memoryStore();
  const url = (env.KV_REST_API_URL ?? env.UPSTASH_REDIS_REST_URL)?.trim();
  const token = (env.KV_REST_API_TOKEN ?? env.UPSTASH_REDIS_REST_TOKEN)?.trim();
  return url && token ? upstashStore(url, token, fetchImpl) : null;
}

/** Whether a store is connected — for the dashboard's empty state and the privacy page. */
export function statsEnabled(env: Env = process.env): boolean {
  return statsStoreFromEnv(env) !== null;
}

/** Upstash's REST interface: one pipeline per call, so a page view is one request. */
export function upstashStore(url: string, token: string, fetchImpl: typeof fetch = fetch): StatsStore {
  const pipeline = async (commands: Array<Array<string | number>>): Promise<unknown[]> => {
    const response = await fetchImpl(`${url.replace(/\/+$/, '')}/pipeline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(commands),
      cache: 'no-store',
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) throw new Error(`stats store → HTTP ${response.status}`);
    const results = (await response.json()) as Array<{ result?: unknown; error?: string }>;
    const failed = results.find((entry) => entry.error);
    if (failed) throw new Error(`stats store: ${failed.error}`);
    return results.map((entry) => entry.result);
  };

  return {
    async increment(day, counters) {
      const names = Object.entries(counters).filter(([, by]) => by > 0);
      if (names.length === 0) return;
      await pipeline([
        ...names.map(([name, by]) => ['HINCRBY', key(day), name, by]),
        ['EXPIRE', key(day), DAY_TTL_SECONDS],
      ]);
    },
    async read(days) {
      if (days.length === 0) return {};
      const results = await pipeline(days.map((day) => ['HGETALL', key(day)]));
      return Object.fromEntries(days.map((day, i) => [day, pairsToCounts(results[i])]));
    },
    async claim(day, name) {
      const [set] = await pipeline([['HSETNX', key(day), name, 1], ['EXPIRE', key(day), DAY_TTL_SECONDS]]);
      return set === 1;
    },
  };
}

/** HGETALL answers a flat list, name then value. */
function pairsToCounts(result: unknown): Record<string, number> {
  const counts: Record<string, number> = {};
  if (Array.isArray(result)) {
    for (let i = 0; i + 1 < result.length; i += 2) counts[String(result[i])] = Number(result[i + 1]) || 0;
  } else if (result && typeof result === 'object') {
    for (const [name, value] of Object.entries(result)) counts[name] = Number(value) || 0;
  }
  return counts;
}

/**
 * Counters held in this process only: the test suites' store. Kept on the
 * global object so the endpoint and the dashboard, bundled as separate
 * routes, share one per server process.
 */
const holder = globalThis as typeof globalThis & { __ykStatsMemory?: Map<string, Record<string, number>> };
const memory = (holder.__ykStatsMemory ??= new Map<string, Record<string, number>>());

export function memoryStore(): StatsStore {
  return {
    async increment(day, counters) {
      const counts = memory.get(day) ?? {};
      for (const [name, by] of Object.entries(counters)) if (by > 0) counts[name] = (counts[name] ?? 0) + by;
      memory.set(day, counts);
    },
    async read(days) {
      return Object.fromEntries(days.map((day) => [day, { ...(memory.get(day) ?? {}) }]));
    },
    async claim(day, name) {
      const counts = memory.get(day) ?? {};
      if (counts[name]) return false;
      counts[name] = 1;
      memory.set(day, counts);
      return true;
    },
  };
}

/** For tests: forget everything the in-memory store holds. */
export function clearMemoryStore() {
  memory.clear();
}
