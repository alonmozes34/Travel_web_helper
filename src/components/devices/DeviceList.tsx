'use client';

import { useMemo, useState } from 'react';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { Ltr } from '@/components/ui/Bdi';
import { cn } from '@/components/ui/cn';
import { deviceSources, type DeviceSupport } from '@/data/devices';
import { countMatchedModels, findDevices } from '@/lib/devices';
import type { Dictionary } from '@/i18n/getDictionary';
import { interpolate } from '@/i18n/interpolate';

/**
 * The searchable model list.
 *
 * It filters rather than paginates: the reader arrives with one model in mind
 * and wants a yes or a no about that model, so typing it is the shortest
 * route. When nothing matches, the answer is explicitly *not* "unsupported" —
 * these lists cover three manufacturers, and letting an empty result imply a
 * verdict about a Xiaomi would be a claim we have no basis for.
 *
 * Colour never carries the verdict on its own (WCAG 1.4.1): every group
 * states its support in words, in the badge and again in the sentence under
 * the heading.
 */

const tones: Record<DeviceSupport, BadgeTone> = {
  yes: 'brand',
  regional: 'warn',
  no: 'neutral',
};

export function DeviceList({ dict }: { dict: Dictionary }) {
  const page = dict.devicesPage;
  const [query, setQuery] = useState('');
  const matches = useMemo(() => findDevices(query), [query]);
  const total = countMatchedModels(matches);

  return (
    <div>
      <div className="mt-6 flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1">
          <label htmlFor="device-search" className="block text-sm font-semibold text-ink-2">
            {page.list.searchLabel}
          </label>
          <input
            id="device-search"
            type="search"
            value={query}
            autoComplete="off"
            onChange={(event) => setQuery(event.target.value)}
            placeholder={page.list.searchPlaceholder}
            className="mt-2 h-12 w-full rounded-md border border-line bg-surface px-4 text-base text-ink focus-visible:border-brand"
          />
        </div>
        {query ? (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="inline-flex h-12 min-h-11 items-center rounded-md border border-line px-4 text-base font-semibold text-ink-2 hover:text-brand"
          >
            {page.list.clear}
          </button>
        ) : null}
      </div>

      <p role="status" className="mt-3 text-sm text-ink-3">
        {total === 1
          ? page.list.oneResult
          : interpolate(page.list.resultsTemplate, { count: total })}
      </p>

      {matches.length === 0 ? (
        <div className="mt-6 rounded-md border border-line bg-surface-2 p-5">
          <p className="font-head font-semibold">{page.list.noResults}</p>
          <p className="mt-2 max-w-[60ch] text-ink-2">{page.list.noResultsHint}</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-6">
          {matches.map(({ group, models }) => (
            <section
              key={group.id}
              className={cn(
                'rounded-md border p-5',
                group.support === 'no' ? 'border-line bg-surface-2' : 'border-line bg-surface',
              )}
            >
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="font-head text-lg font-semibold">{page.groupTitles[group.id as keyof typeof page.groupTitles]}</h3>
                <Badge tone={tones[group.support]}>{page.support[group.support]}</Badge>
                <span className="text-sm text-ink-3">{page.kinds[group.kind]}</span>
              </div>

              <p className="mt-2 max-w-[70ch] text-ink-2">{page.supportHint[group.support]}</p>

              <ul className="mt-4 flex flex-wrap gap-2">
                {models.map((model) => (
                  <li
                    key={model}
                    className="rounded-sm border border-line-soft bg-surface-2 px-2.5 py-1 text-sm text-ink-2"
                  >
                    <Ltr>{model}</Ltr>
                  </li>
                ))}
              </ul>

              {group.notes.length > 0 ? (
                <ul className="mt-4 grid gap-2">
                  {group.notes.map((note) => (
                    <li key={note} className="max-w-[70ch] text-sm text-ink-2">
                      {page.notes[note]}
                    </li>
                  ))}
                </ul>
              ) : null}

              <p className="mt-4 text-sm text-ink-3">
                {group.sources.map((sourceId, index) => (
                  <span key={sourceId}>
                    {index > 0 ? ' · ' : null}
                    <a
                      href={deviceSources[sourceId].url}
                      rel="nofollow noopener"
                      target="_blank"
                      className="underline hover:text-brand"
                    >
                      {interpolate(page.list.sourceTemplate, {
                        source: page.list.sourceLabels[sourceId],
                        date: deviceSources[sourceId].checkedOn,
                      })}
                      <span className="sr-only"> {page.list.opensInNewTab}</span>
                    </a>
                  </span>
                ))}
              </p>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
