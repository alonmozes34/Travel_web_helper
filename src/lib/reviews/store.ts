import { parseReview, type Review } from './reviews';

/**
 * Where reviews are kept: the same Upstash Redis the dashboard counts in, in
 * two hashes of their own — waiting for the owner, and published. A review
 * the owner removes is deleted, not hidden. The test suites run an in-memory
 * store (`STATS_STORE=memory`), never the real one.
 */
export type ReviewStore = {
  submit(review: Review): Promise<'saved' | 'full'>;
  pending(): Promise<Review[]>;
  published(): Promise<Review[]>;
  /** Moves a waiting review to the published ones; false when there is no such review. */
  approve(id: string): Promise<boolean>;
  /** Deletes a review, waiting or published. */
  remove(id: string): Promise<void>;
};

/** Past this many waiting, the box says it is full: a loop cannot fill the store. */
export const MAX_PENDING = 300;

const PENDING = 'yk:reviews:pending';
const PUBLISHED = 'yk:reviews:published';

type Env = Record<string, string | undefined>;

export function reviewStoreFromEnv(env: Env = process.env, fetchImpl: typeof fetch = fetch): ReviewStore | null {
  if (env.STATS_STORE === 'memory') return memoryReviewStore();
  const url = (env.KV_REST_API_URL ?? env.UPSTASH_REDIS_REST_URL)?.trim();
  const token = (env.KV_REST_API_TOKEN ?? env.UPSTASH_REDIS_REST_TOKEN)?.trim();
  return url && token ? upstashReviewStore(url, token, fetchImpl) : null;
}

const values = (result: unknown): Review[] => {
  const list: unknown[] = Array.isArray(result)
    ? result.filter((_, i) => i % 2 === 1)
    : result && typeof result === 'object'
      ? Object.values(result)
      : [];
  return list.map(parseReview).filter((review): review is Review => review !== null);
};

export function upstashReviewStore(url: string, token: string, fetchImpl: typeof fetch = fetch): ReviewStore {
  const pipeline = async (commands: Array<Array<string | number>>): Promise<unknown[]> => {
    const response = await fetchImpl(`${url.replace(/\/+$/, '')}/pipeline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(commands),
      cache: 'no-store',
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) throw new Error(`review store → HTTP ${response.status}`);
    const results = (await response.json()) as Array<{ result?: unknown; error?: string }>;
    const failed = results.find((entry) => entry.error);
    if (failed) throw new Error(`review store: ${failed.error}`);
    return results.map((entry) => entry.result);
  };

  return {
    async submit(review) {
      const [count] = await pipeline([['HLEN', PENDING]]);
      if (Number(count) >= MAX_PENDING) return 'full';
      await pipeline([['HSET', PENDING, review.id, JSON.stringify(review)]]);
      return 'saved';
    },
    async pending() {
      const [result] = await pipeline([['HGETALL', PENDING]]);
      return values(result);
    },
    async published() {
      const [result] = await pipeline([['HGETALL', PUBLISHED]]);
      return values(result);
    },
    async approve(id) {
      const [raw] = await pipeline([['HGET', PENDING, id]]);
      const review = parseReview(raw);
      if (!review) return false;
      await pipeline([
        ['HSET', PUBLISHED, id, JSON.stringify(review)],
        ['HDEL', PENDING, id],
      ]);
      return true;
    },
    async remove(id) {
      await pipeline([
        ['HDEL', PENDING, id],
        ['HDEL', PUBLISHED, id],
      ]);
    },
  };
}

const holder = globalThis as typeof globalThis & { __ykReviews?: { pending: Map<string, Review>; published: Map<string, Review> } };
const memory = (holder.__ykReviews ??= { pending: new Map(), published: new Map() });

export function memoryReviewStore(): ReviewStore {
  return {
    async submit(review) {
      if (memory.pending.size >= MAX_PENDING) return 'full';
      memory.pending.set(review.id, review);
      return 'saved';
    },
    async pending() {
      return [...memory.pending.values()];
    },
    async published() {
      return [...memory.published.values()];
    },
    async approve(id) {
      const review = memory.pending.get(id);
      if (!review) return false;
      memory.published.set(id, review);
      memory.pending.delete(id);
      return true;
    },
    async remove(id) {
      memory.pending.delete(id);
      memory.published.delete(id);
    },
  };
}
