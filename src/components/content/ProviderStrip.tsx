'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Container } from '@/components/ui/Container';
import type { ProviderOnSite } from '@/lib/catalogue/providersOnSite';

type Copy = {
  title: string;
  subtitle: string;
  /** "{plans} plans · {destinations} destinations" */
  statsTemplate: string;
  pause: string;
  play: string;
};

function stats(copy: Copy, entry: ProviderOnSite, numberLocale: string) {
  const fmt = (n: number) => n.toLocaleString(numberLocale);
  return copy.statsTemplate.replace('{plans}', fmt(entry.plans)).replace('{destinations}', fmt(entry.destinations));
}

function Tile({ entry, line, moving }: { entry: ProviderOnSite; line: string; moving: boolean }) {
  return (
    <li
      className={
        'flex items-center gap-3 rounded-[18px] border border-line bg-surface px-4 py-3.5 ' +
        // In the band a tile keeps its width; standing still it may wrap, so
        // large text or wide spacing grows it instead of cutting it off.
        (moving ? 'w-[250px] shrink-0' : 'min-w-0 sm:min-w-[250px]')
      }
    >
      {entry.logo ? (
        <span className="flex h-[40px] w-[84px] shrink-0 items-center justify-center rounded-[10px] border border-line bg-white px-[8px]">
          <Image src={entry.logo.src} alt="" width={entry.logo.width} height={entry.logo.height} unoptimized className="h-auto max-h-[24px] w-auto max-w-full" />
        </span>
      ) : (
        <span
          className="grid size-10 shrink-0 place-items-center rounded-[10px] font-head text-base font-semibold text-white"
          style={{ backgroundColor: entry.brandColor }}
        >
          {entry.name.charAt(0)}
        </span>
      )}
      <span className="min-w-0 [overflow-wrap:anywhere]">
        <span lang="en" className="block font-head font-semibold text-ink">{entry.name}</span>
        <span className="block text-sm text-ink-2">{line}</span>
      </span>
    </li>
  );
}

/**
 * The providers whose plans the site compares, drifting past in a band (the
 * owner, 6 October 2026: a carousel that updates itself as providers join).
 *
 * Built from the live catalogue, so it cannot name a provider the site does
 * not actually list. For assistive technology the providers are a plain list;
 * the moving band is decoration and hidden from it. The movement stops on
 * hover and keyboard focus, and its button (WCAG 2.2.2) replaces the band
 * with that same list, each provider once and nothing cut off — which is also
 * all that anyone who asked their system for less motion ever sees.
 */
export function ProviderStrip({
  entries,
  copy,
  numberLocale,
}: {
  entries: ProviderOnSite[];
  copy: Copy;
  numberLocale: string;
}) {
  const [paused, setPaused] = useState(false);
  if (entries.length === 0) return null;
  // Enough tiles in one pass to be wider than a wide screen, so the band
  // never shows its end; two passes side by side make the loop seamless.
  const repeat = Math.max(1, Math.ceil(6 / entries.length));
  const pass = Array.from({ length: repeat }, () => entries).flat();

  return (
    <section aria-labelledby="providers-title" className="border-b border-line-soft bg-canvas py-10">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <div className="min-w-0">
            <h2 id="providers-title" className="font-head text-2xl font-bold md:text-3xl">
              {copy.title}
            </h2>
            <p className="mt-1 max-w-[60ch] text-base text-ink-2">{copy.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-surface px-4 text-sm font-semibold text-ink-2 hover:border-brand motion-reduce:hidden"
          >
            <span aria-hidden="true">{paused ? '▶' : '❚❚'}</span>
            {paused ? copy.play : copy.pause}
          </button>
        </div>
        <ul
          className={
            paused
              ? 'mt-6 flex flex-wrap gap-4'
              : 'sr-only motion-reduce:not-sr-only motion-reduce:mt-6 motion-reduce:flex motion-reduce:flex-wrap motion-reduce:gap-4'
          }
        >
          {entries.map((entry) => (
            <Tile key={entry.id} entry={entry} line={stats(copy, entry, numberLocale)} moving={false} />
          ))}
        </ul>
      </Container>

      <div
        aria-hidden="true"
        data-marquee=""
        className={paused ? 'hidden' : 'provider-marquee mt-6 overflow-hidden motion-reduce:hidden'}
      >
        <div className="provider-marquee-track flex w-max gap-4 px-2">
          {[0, 1].map((copyIndex) => (
            <ul key={copyIndex} className="flex shrink-0 gap-4">
              {pass.map((entry, index) => (
                <Tile key={`${copyIndex}-${entry.id}-${index}`} entry={entry} line={stats(copy, entry, numberLocale)} moving />
              ))}
            </ul>
          ))}
        </div>
      </div>
    </section>
  );
}
