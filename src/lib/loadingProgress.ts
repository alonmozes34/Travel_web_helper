/**
 * How full the loading bar is after `elapsedMs`, as a whole percentage.
 *
 * The server does not report its progress, so this is an estimate by time,
 * not a measurement: it starts at 0, climbs quickly through the usual couple
 * of seconds, and slows as it nears `CEILING` — never reaching 100, because
 * only the page arriving says the wait is over. At 1s about 30%, at 3s about
 * 66%, at 5s about 82%, and after 10s it creeps in the low 90s.
 */
export const LOADING_CEILING = 95;
const TIME_CONSTANT_MS = 2500;

export function estimatedProgress(elapsedMs: number): number {
  if (!(elapsedMs > 0)) return 0;
  return Math.floor(LOADING_CEILING * (1 - Math.exp(-elapsedMs / TIME_CONSTANT_MS)));
}
