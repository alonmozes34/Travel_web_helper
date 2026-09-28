'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { isLocale } from '@/i18n/config';
import { loadingCopy } from '@/i18n/loadingCopy';
import { estimatedProgress } from '@/lib/loadingProgress';
import { Container } from './Container';

/** How often the bar moves. Slower under reduced motion: fewer, larger steps. */
const TICK_MS = 150;
const TICK_MS_REDUCED = 600;

/**
 * Shown the moment a results page is asked for, while its prices load.
 *
 * The first visitor on a fresh server waits a couple of seconds for the
 * provider's catalogue; a blank screen for that long reads as a broken site.
 * The sentence is a live status, so a screen reader announces it once. The
 * bar and its percentage are an estimate by time (see `estimatedProgress`),
 * and hidden from screen readers: a number changing several times a second
 * would be read out, or beeped, over and over.
 *
 * The bar fills from the start of the line — the right in Hebrew — because
 * the fill is a plain block in the page's own direction. An earlier version
 * mirrored the track for RTL on top of that, and its sweep began in the
 * middle (28 September 2026).
 */
export function PageLoading() {
  const params = useParams();
  const locale = typeof params?.locale === 'string' && isLocale(params.locale) ? params.locale : 'he';
  const copy = loadingCopy[locale];
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    const started = performance.now();
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const timer = window.setInterval(
      () => setPercent(estimatedProgress(performance.now() - started)),
      reduced ? TICK_MS_REDUCED : TICK_MS,
    );
    return () => window.clearInterval(timer);
  }, []);

  return (
    <Container className="py-10">
      <div role="status" aria-live="polite" className="max-w-[60ch]">
        <p className="font-head text-xl font-semibold text-ink">{copy.title}</p>
        <p className="mt-1 text-base text-ink-2">{copy.body}</p>
      </div>

      <div aria-hidden="true" className="mt-5 flex max-w-md items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-line">
          <div
            data-loading-fill
            className="h-full rounded-full bg-brand motion-safe:transition-[width] motion-safe:duration-150 motion-safe:ease-linear"
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className="min-w-[4ch] text-end text-sm font-semibold tabular-nums text-ink-2">{percent}%</span>
      </div>

      <div aria-hidden="true" className="mt-8 grid gap-4">
        {[0, 1, 2].map((card) => (
          <div key={card} className="h-36 rounded-md border border-line bg-surface-2" />
        ))}
      </div>
    </Container>
  );
}
