'use client';

import type { ReactNode } from 'react';
import { buttonClasses, Button } from '@/components/ui/Button';

/**
 * The shell every trip extra is offered in.
 *
 * Deliberately a card in the page, not a modal or a popup. The traveller has
 * just clicked through to a provider, which opened in a new tab and took the
 * focus with it; this is what they find when they come back. A dialog would
 * steal focus from whatever they were doing and would have to be dismissed
 * before the comparison could be read again — which is precisely the harm the
 * brief is trying to avoid, since the eSIM click is the conversion that
 * matters and this must never stand in front of it.
 *
 * Generic on purpose. Insurance, transfers and attractions are meant to reuse
 * this exact component, so nothing about cars appears below.
 */
export function TripExtraOffer({
  eyebrow,
  heading,
  question,
  body,
  acceptLabel,
  acceptHref,
  acceptNote,
  declineLabel,
  dismissLabel,
  icon,
  onAccept,
  onDecline,
}: {
  eyebrow: string;
  heading: string;
  question: string;
  body: string;
  acceptLabel: string;
  /** Opened in a new tab, so the page behind it is never navigated away. */
  acceptHref: string;
  /** Said out loud, because a new tab with no warning is a surprise. */
  acceptNote: string;
  declineLabel: string;
  dismissLabel: string;
  icon: ReactNode;
  onAccept: () => void;
  onDecline: () => void;
}) {
  return (
    <section
      aria-label={heading}
      className="relative mb-6 rounded-md border border-line bg-surface-2 p-5"
    >
      <button
        type="button"
        onClick={onDecline}
        className="absolute end-2 top-2 inline-flex size-11 items-center justify-center rounded-sm text-ink-3 hover:bg-surface"
      >
        <span aria-hidden="true" className="text-lg leading-none">
          ✕
        </span>
        <span className="sr-only">{dismissLabel}</span>
      </button>

      <p className="text-sm font-semibold text-teal-ink">
        <span aria-hidden="true">✓ </span>
        {eyebrow}
      </p>
      <h2 className="mt-1 font-head text-lg font-semibold">{heading}</h2>

      <div className="mt-3 flex flex-wrap items-start gap-x-6 gap-y-4 md:flex-nowrap md:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span aria-hidden="true" className="text-2xl leading-none">
            {icon}
          </span>
          <div className="min-w-0">
            <p className="font-head font-semibold">{question}</p>
            <p className="mt-1 max-w-[60ch] text-ink-2">{body}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
        <a
          href={acceptHref}
          target="_blank"
          rel="noopener"
          onClick={onAccept}
          className={buttonClasses('primary', 'md')}
        >
          {acceptLabel}
          <span className="sr-only"> {acceptNote}</span>
        </a>
          <Button variant="quiet" size="md" onClick={onDecline}>
            {declineLabel}
          </Button>
        </div>
      </div>
      <p className="mt-3 text-sm text-ink-3">{acceptNote}</p>
    </section>
  );
}
