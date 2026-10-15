'use client';

import { useState } from 'react';
import { Checkbox } from '@/components/ui/Checkbox';
import type { Dictionary } from '@/i18n/getDictionary';
import { interpolate } from '@/i18n/interpolate';
import type { ChecklistItem } from '@/lib/travel/checklist';

/**
 * "Before you fly" as a list to tick (the owner, 15 October 2026): the eSIM
 * steps from the install guide, then what the country's own facts call for —
 * an adapter, the voltage, the side of the road, the emergency numbers. Built
 * on the server from the same facts the page shows (`TravelFacts`); nothing
 * here is said about a country that the facts do not say.
 *
 * The ticks live in this page only, and are gone on reload: nothing is kept
 * in the browser. To keep the list, it goes to WhatsApp or to the printer —
 * and printing prints the list alone.
 */
export function TripChecklist({
  title,
  items,
  copy,
  shareUrl,
}: {
  title: string;
  items: ChecklistItem[];
  copy: Dictionary['tripChecklist'];
  shareUrl: string;
}) {
  const [done, setDone] = useState<string[]>([]);
  const message = [title + ':', ...items.map((item) => `☐ ${item.text}`), '', shareUrl].join('\n');

  const print = () => {
    document.documentElement.dataset.print = 'checklist';
    const clear = () => {
      delete document.documentElement.dataset.print;
      window.removeEventListener('afterprint', clear);
    };
    window.addEventListener('afterprint', clear);
    window.print();
  };

  return (
    <section id="trip-checklist" aria-labelledby="trip-checklist-title" className="mt-10 max-w-[80ch] scroll-mt-24 rounded-[20px] border border-line bg-surface p-5 md:p-6">
      <h2 id="trip-checklist-title" className="font-head text-xl font-semibold">
        {title}
      </h2>
      <p className="mt-1 text-ink-2">{copy.intro}</p>
      <p aria-live="polite" className="mt-3 text-sm font-semibold text-teal-ink">
        {interpolate(copy.progressTemplate, { done: done.length, total: items.length })}
      </p>
      <ul className="mt-2 grid gap-1">
        {items.map((item) => (
          <li key={item.id} className="border-b border-line-soft py-1 last:border-b-0">
            <Checkbox
              checked={done.includes(item.id)}
              onChange={(event) => {
                const on = event.currentTarget.checked;
                setDone((current) => (on ? [...current, item.id] : current.filter((id) => id !== item.id)));
              }}
              label={<span className="text-base text-ink">{item.text}</span>}
            />
            {item.href ? (
              <a
                href={item.href}
                {...(item.external ? { target: '_blank', rel: 'noopener' } : {})}
                className="ms-7 inline-flex min-h-11 items-center text-sm font-semibold text-brand underline underline-offset-4 print:hidden"
              >
                {item.linkText}
                {item.external ? <span className="sr-only"> {copy.opensInNewTab}</span> : null}
              </a>
            ) : null}
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap gap-3 print:hidden">
        <a
          href={`https://wa.me/?text=${encodeURIComponent(message)}`}
          target="_blank"
          rel="noopener"
          className="inline-flex min-h-11 items-center gap-2 rounded-md bg-[#25D366] px-4 font-semibold text-[#0b2e17] hover:bg-[#1fb857]"
        >
          {copy.share}
          <span className="sr-only"> {copy.opensInNewTab}</span>
        </a>
        <button type="button" onClick={print} className="inline-flex min-h-11 items-center rounded-md border border-line bg-surface px-4 font-semibold text-ink hover:border-brand">
          {copy.print}
        </button>
      </div>
    </section>
  );
}
