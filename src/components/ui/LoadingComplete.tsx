'use client';

import { useEffect, useState } from 'react';
import { takeLoadingProgress } from '@/lib/loadingProgress';

/** How long the bar takes to run from where it stopped to 100, and how long 100 stays up. */
const FINISH_MS = 350;
const HOLD_MS = 450;

/**
 * The end of the loading bar, on the page that replaced the loading screen:
 * from where the bar stopped, on to 100%, then gone. Without it the bar
 * simply vanished part-way when the results arrived, which read as a page
 * that had given up (the owner, 29 September 2026).
 *
 * A thin strip across the top of the window, so it covers nothing on the
 * page. Hidden from screen readers like the bar itself — the results
 * arriving is the announcement. Under reduced motion it shows 100% without
 * moving, briefly.
 */
export function LoadingComplete() {
  const [percent, setPercent] = useState<number | null>(null);

  useEffect(() => {
    const from = takeLoadingProgress();
    if (from === null) return;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const timers: number[] = [];
    const frame = window.requestAnimationFrame(() => {
      if (reduced) {
        setPercent(100);
      } else {
        setPercent(from);
        const started = performance.now();
        const step = () => {
          const t = Math.min(1, (performance.now() - started) / FINISH_MS);
          setPercent(Math.round(from + (100 - from) * t));
          if (t < 1) timers.push(window.setTimeout(step, 30));
        };
        timers.push(window.setTimeout(step, 30));
      }
      timers.push(window.setTimeout(() => setPercent(null), (reduced ? 0 : FINISH_MS) + HOLD_MS));
    });
    return () => {
      window.cancelAnimationFrame(frame);
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  if (percent === null) return null;
  return (
    <div aria-hidden="true" data-loading-complete className="pointer-events-none fixed inset-x-0 top-0 z-50">
      <div className="h-1 bg-line/60">
        <div className="h-full bg-brand" style={{ width: `${percent}%` }} />
      </div>
      <span className="absolute end-2 top-1.5 rounded-full bg-surface px-2 text-xs font-semibold tabular-nums text-ink-2 shadow-sm">
        {percent}%
      </span>
    </div>
  );
}
