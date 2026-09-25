'use client';

import { useParams } from 'next/navigation';
import { isLocale } from '@/i18n/config';
import { loadingCopy } from '@/i18n/loadingCopy';
import { Container } from './Container';

/**
 * Shown the moment a results page is asked for, while its prices load.
 *
 * The first visitor on a fresh server waits a couple of seconds for the
 * provider's catalogue; a blank screen for that long reads as a broken site.
 * The sentence is a live status, so a screen reader announces it too; the
 * bar and the placeholder cards are decoration and hidden from it.
 */
export function PageLoading() {
  const params = useParams();
  const locale = typeof params?.locale === 'string' && isLocale(params.locale) ? params.locale : 'he';
  const copy = loadingCopy[locale];

  return (
    <Container className="py-10">
      <div role="status" aria-live="polite" className="max-w-[60ch]">
        <p className="font-head text-xl font-semibold text-ink">{copy.title}</p>
        <p className="mt-1 text-base text-ink-2">{copy.body}</p>
      </div>

      {/* Mirrored in RTL so the sweep runs in the reading direction. */}
      <div aria-hidden="true" className="mt-5 h-1.5 w-full max-w-md overflow-hidden rounded-full bg-line rtl:-scale-x-100">
        <div className="h-full w-2/5 rounded-full bg-brand motion-safe:animate-loading-bar" />
      </div>

      <div aria-hidden="true" className="mt-8 grid gap-4">
        {[0, 1, 2].map((card) => (
          <div key={card} className="h-36 rounded-md border border-line bg-surface-2" />
        ))}
      </div>
    </Container>
  );
}
