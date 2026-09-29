/**
 * How full the loading bar is after `elapsedMs`, as a whole percentage.
 *
 * The server does not report its progress, so this is an estimate by time,
 * not a measurement: it starts at 0, climbs quickly, and slows as it nears
 * `LOADING_CEILING` — never reaching 100 by itself, because only the page
 * arriving says the wait is over. When it does arrive, the bar is run to 100
 * (`LoadingComplete`).
 *
 * Paced to the live site: searches took 0.3–1.5 seconds (29 September 2026).
 * At the earlier pace — 31% after a second — results arrived with the bar at
 * a third, and the owner saw it vanish half-way. Now about 50% at half a
 * second, 77% at one, 90% at two.
 */
export const LOADING_CEILING = 95;
const TIME_CONSTANT_MS = 650;

export function estimatedProgress(elapsedMs: number): number {
  if (!(elapsedMs > 0)) return 0;
  return Math.floor(LOADING_CEILING * (1 - Math.exp(-elapsedMs / TIME_CONSTANT_MS)));
}

/**
 * The loading screen and the page that replaces it are different components;
 * this carries where the bar stopped from one to the other, in the browser.
 * Only a hand-off from the last couple of seconds counts, so a page reached
 * without a loading screen does not play a stale finish.
 */
const HANDOFF_MS = 2000;
let lastProgress: { percent: number; at: number } | null = null;

export function noteLoadingProgress(percent: number, at = Date.now()) {
  lastProgress = { percent, at };
}

export function takeLoadingProgress(now = Date.now()): number | null {
  const taken = lastProgress && now - lastProgress.at <= HANDOFF_MS ? lastProgress.percent : null;
  lastProgress = null;
  return taken;
}
