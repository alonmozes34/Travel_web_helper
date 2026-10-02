'use client';

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { useParams } from 'next/navigation';
import { isLocale } from '@/i18n/config';
import { interpolate } from '@/i18n/interpolate';
import { loadingCopy } from '@/i18n/loadingCopy';
import { destinationLabel } from '@/lib/loadingDestination';
import { estimatedProgress, noteLoadingProgress } from '@/lib/loadingProgress';
import { Container } from './Container';
import { FlightProgress } from './FlightProgress';

const noSubscription = () => () => {};

/** How often the plane moves. Slower under reduced motion: fewer, larger steps. */
const TICK_MS = 150;
const TICK_MS_REDUCED = 600;

/**
 * Shown the moment a results page is asked for, while its prices load.
 *
 * The first visitor on a fresh server waits a couple of seconds for the
 * providers' catalogues; a blank screen for that long reads as a broken site.
 * The sentence is a live status, so a screen reader announces it once. The
 * flight below it (`FlightProgress`) and its percentage are an estimate by
 * time (see `estimatedProgress`), and hidden from screen readers: a number
 * changing several times a second would be read out over and over.
 *
 * The destination is read from the address once the screen is up, so the
 * plane flies to Japan when Japan was asked for.
 */
export function PageLoading() {
  const params = useParams();
  const locale = typeof params?.locale === 'string' && isLocale(params.locale) ? params.locale : 'he';
  const copy = loadingCopy[locale];
  const [percent, setPercent] = useState(0);
  // The address, read in the browser only; on the server there is none.
  const address = useSyncExternalStore(
    noSubscription,
    () => window.location.pathname + window.location.search,
    () => '',
  );
  const destination = useMemo(() => {
    if (!address) return null;
    const url = new URL(address, 'https://x.invalid');
    try {
      return destinationLabel(url.pathname, url.search, locale);
    } catch {
      return null;
    }
  }, [address, locale]);

  useEffect(() => {
    const started = performance.now();
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const tick = () => {
      const next = estimatedProgress(performance.now() - started);
      noteLoadingProgress(next);
      setPercent(next);
    };
    noteLoadingProgress(0);
    const timer = window.setInterval(tick, reduced ? TICK_MS_REDUCED : TICK_MS);
    // Where the plane stopped is handed to the page that replaces this one,
    // which flies it on to 100 (`LoadingComplete`).
    return () => {
      window.clearInterval(timer);
      noteLoadingProgress(estimatedProgress(performance.now() - started));
    };
  }, []);

  return (
    <Container className="py-10">
      <div role="status" aria-live="polite" className="max-w-[60ch]">
        <p className="font-head text-xl font-semibold text-ink">
          {destination ? interpolate(copy.titleToTemplate, { to: destination.names }) : copy.title}
        </p>
        <p className="mt-1 text-base text-ink-2">{copy.body}</p>
      </div>

      <div className="mt-6">
        <FlightProgress percent={percent} rtl={locale === 'he'} from={copy.from} to={destination?.label ?? copy.anywhere} />
      </div>

      <div aria-hidden="true" className="mt-8 grid gap-4">
        {[0, 1, 2].map((card) => (
          <div key={card} className="h-36 rounded-md border border-line bg-surface-2" />
        ))}
      </div>
    </Container>
  );
}
