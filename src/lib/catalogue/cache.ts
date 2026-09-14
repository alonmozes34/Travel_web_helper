/**
 * A value that is refreshed on a schedule and survives a failed refresh.
 *
 * Two behaviours, and the second is the one that matters:
 *
 *  - **Fresh within the TTL.** A results page does not re-fetch a provider's
 *    whole catalogue per request.
 *  - **Stale beats nothing.** When a refresh throws, the last good value keeps
 *    being served and the failure is recorded, rather than the page losing its
 *    catalogue because a provider had a bad minute. A price an hour old is a
 *    comparison; no prices is a broken site.
 *
 * Deliberately in-process: it lives for as long as the server instance does,
 * which on a serverless host is one warm instance rather than the whole fleet.
 * That is enough to stop per-request fetching and is honest about what it is —
 * a shared store is the next step, and it belongs with the first real
 * provider, not before it.
 *
 * The clock is injected so the expiry can be tested without waiting.
 */
export type CacheState<T> = {
  value: T;
  /** When the value was produced, epoch ms. */
  storedAt: number;
  /** Whether the last refresh attempt failed and this is being served stale. */
  stale: boolean;
  /** The reason the last refresh failed, when it did. */
  error: string | null;
};

export type Cached<T> = {
  get(): Promise<CacheState<T>>;
  /** Drops the value, so the next get refetches. For tests and for a manual refresh. */
  clear(): void;
};

export function cached<T>({
  load,
  ttlMs,
  now = () => Date.now(),
}: {
  load: () => Promise<T>;
  ttlMs: number;
  now?: () => number;
}): Cached<T> {
  let state: CacheState<T> | null = null;
  // Concurrent requests during a refresh share one fetch rather than starting
  // one each — otherwise the first traffic after an expiry is a thundering herd.
  let inFlight: Promise<void> | null = null;

  async function refresh(): Promise<void> {
    try {
      const value = await load();
      state = { value, storedAt: now(), stale: false, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (state) {
        // Keep the value, mark it. The caller decides what to say about it.
        state = { ...state, stale: true, error: message };
      } else {
        // Nothing to fall back to: the first load failing is a real failure.
        throw error;
      }
    }
  }

  return {
    async get(): Promise<CacheState<T>> {
      const expired = !state || now() - state.storedAt >= ttlMs;
      if (expired) {
        inFlight ??= refresh().finally(() => {
          inFlight = null;
        });
        await inFlight;
      }
      return state!;
    },
    clear() {
      state = null;
    },
  };
}
