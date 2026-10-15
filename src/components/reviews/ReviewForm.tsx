'use client';

import Link from 'next/link';
import { useActionState, useEffect, useRef, useState } from 'react';
import { submitReview, type ReviewState } from '@/app/[locale]/reviews/actions';
import { Button } from '@/components/ui/Button';
import type { Dictionary } from '@/i18n/getDictionary';
import { REVIEW_LIMITS, type ReviewField } from '@/lib/reviews/reviews';

type Copy = Dictionary['reviewsPage'];
export type Option = { value: string; label: string };

const field =
  'mt-1.5 block w-full rounded-md border border-line bg-surface px-3 py-2.5 text-base text-ink ' +
  'aria-[invalid=true]:border-warn-ink aria-[invalid=true]:border-2';

/**
 * The reviews box (the owner, 15 October 2026). Built like the contact form:
 * every field labelled in words, each error next to its field and listed at
 * the top, where focus goes; success moves focus to the confirmation.
 *
 * No email and no sign-up. What is asked is what is published, and the box
 * says so before it is sent.
 */
export function ReviewForm(props: {
  locale: string;
  copy: Copy;
  providers: Option[];
  countries: Option[];
  months: Option[];
  privacyHref: string;
  contactHref: string;
}) {
  const [round, setRound] = useState(0);
  return <Round key={round} {...props} onAnother={() => setRound((r) => r + 1)} />;
}

function Round({
  locale,
  copy,
  providers,
  countries,
  months,
  privacyHref,
  contactHref,
  onAnother,
}: {
  locale: string;
  copy: Copy;
  providers: Option[];
  countries: Option[];
  months: Option[];
  privacyHref: string;
  contactHref: string;
  onAnother: () => void;
}) {
  const [state, action, pending] = useActionState<ReviewState, FormData>(submitReview.bind(null, locale), { status: 'idle' });
  const summaryRef = useRef<HTMLDivElement>(null);
  const sentRef = useRef<HTMLHeadingElement>(null);
  const startedRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (startedRef.current) startedRef.current.value = String(Date.now());
  }, []);
  useEffect(() => {
    if (state.status === 'sent') sentRef.current?.focus();
    else if (state.status !== 'idle') summaryRef.current?.focus();
  }, [state]);

  if (state.status === 'sent') {
    return (
      <div role="status" className="rounded-[20px] border border-line bg-surface p-6">
        <h3 ref={sentRef} tabIndex={-1} className="font-head text-2xl font-bold">
          <span aria-hidden="true">✓ </span>
          {copy.sentTitle}
        </h3>
        <p className="mt-2 text-ink-2">{copy.sentBody}</p>
        <Button variant="secondary" className="mt-4" onClick={onAnother}>
          {copy.another}
        </Button>
      </div>
    );
  }

  const values = 'values' in state ? state.values : {};
  const errors = state.status === 'invalid' ? state.errors : {};
  const errorOf = (key: ReviewField) => {
    const error = errors[key];
    const texts = copy.errors[key] as Record<string, string>;
    return error ? texts[error] : undefined;
  };
  const order: ReviewField[] = ['provider', 'country', 'month', 'recommends', 'text', 'name', 'consent'];
  const listed = order.map((key) => [key, errorOf(key)] as const).filter((entry): entry is [ReviewField, string] => Boolean(entry[1]));
  const problem =
    state.status === 'unavailable'
      ? copy.unavailable
      : state.status === 'rateLimited'
        ? copy.rateLimited
        : state.status === 'full'
          ? copy.full
          : state.status === 'failed'
            ? copy.failed
            : null;

  const describedBy = (key: ReviewField, hint?: string) =>
    [hint, errorOf(key) ? `review-${key}-error` : ''].filter(Boolean).join(' ') || undefined;
  const errorLine = (name: ReviewField) =>
    errorOf(name) ? (
      <p id={`review-${name}-error`} className="mt-1 text-sm font-semibold text-warn-ink">
        {errorOf(name)}
      </p>
    ) : null;

  const select = (name: 'provider' | 'country' | 'month', label: string, options: Option[]) => (
    <div>
      <label htmlFor={`review-${name}`} className="font-head text-base font-semibold">
        {label} <span className="font-normal text-ink-3">{copy.required}</span>
      </label>
      <select
        id={`review-${name}`}
        name={name}
        required
        defaultValue={values[name] ?? ''}
        aria-invalid={Boolean(errorOf(name)) || undefined}
        aria-describedby={describedBy(name)}
        className={field + ' min-h-12'}
      >
        <option value="">{copy.choose}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {errorLine(name)}
    </div>
  );

  return (
    <form action={action} noValidate className="grid gap-6">
      {problem || listed.length ? (
        <div ref={summaryRef} tabIndex={-1} role="alert" className="rounded-md border-s-4 border-s-warn-ink bg-warn-50 px-4 py-3 text-warn-ink">
          {problem ? (
            <p className="font-semibold">
              {problem}{' '}
              {state.status === 'unavailable' || state.status === 'failed' ? (
                <Link href={contactHref} className="underline">
                  {copy.contactLink}
                </Link>
              ) : null}
            </p>
          ) : (
            <>
              <p className="font-semibold">{copy.fixTitle}</p>
              <ul className="mt-1 list-disc ps-5">
                {listed.map(([key, text]) => (
                  <li key={key}>
                    <a href={`#review-${key}`} className="underline">
                      {text}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      ) : null}

      <div className="grid gap-6 sm:grid-cols-2">
        {select('provider', copy.providerLabel, providers)}
        {select('country', copy.countryLabel, countries)}
        {select('month', copy.monthLabel, months)}
      </div>

      <fieldset className="min-w-0" aria-describedby={describedBy('recommends')}>
        <legend id="review-recommends" tabIndex={-1} className="font-head text-base font-semibold">
          {copy.recommendLegend} <span className="font-normal text-ink-3">{copy.required}</span>
        </legend>
        {errorLine("recommends")}
        <div className="mt-2 flex flex-wrap gap-x-6">
          {(['yes', 'no'] as const).map((answer) => (
            <label key={answer} className="flex min-h-11 cursor-pointer items-center gap-2.5 px-1">
              <input type="radio" name="recommends" value={answer} defaultChecked={values.recommends === answer} className="size-5 accent-brand" />
              <span>{answer === 'yes' ? copy.yes : copy.no}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="review-text" className="font-head text-base font-semibold">
          {copy.textLabel} <span className="font-normal text-ink-3">{copy.required}</span>
        </label>
        <p id="review-text-hint" className="text-sm text-ink-2">
          {copy.textHint}
        </p>
        <textarea
          id="review-text"
          name="text"
          required
          rows={6}
          maxLength={REVIEW_LIMITS.text}
          defaultValue={values.text}
          aria-invalid={Boolean(errorOf('text')) || undefined}
          aria-describedby={describedBy('text', 'review-text-hint')}
          className={field + ' resize-y'}
        />
        {errorLine("text")}
      </div>

      <div>
        <label htmlFor="review-name" className="font-head text-base font-semibold">
          {copy.nameLabel} <span className="font-normal text-ink-3">{copy.optional}</span>
        </label>
        <p id="review-name-hint" className="text-sm text-ink-2">
          {copy.nameHint}
        </p>
        <input
          id="review-name"
          name="name"
          type="text"
          autoComplete="off"
          maxLength={REVIEW_LIMITS.name}
          defaultValue={values.name}
          aria-invalid={Boolean(errorOf('name')) || undefined}
          aria-describedby={describedBy('name', 'review-name-hint')}
          className={field}
        />
        {errorLine("name")}
      </div>

      <div>
        <label className="flex min-h-11 cursor-pointer items-start gap-2.5">
          <input
            id="review-consent"
            type="checkbox"
            name="consent"
            value="yes"
            defaultChecked={values.consent === 'yes'}
            aria-invalid={Boolean(errorOf('consent')) || undefined}
            aria-describedby={describedBy('consent')}
            className="mt-0.5 size-5 shrink-0 accent-brand"
          />
          <span>{copy.consentLabel}</span>
        </label>
        {errorLine("consent")}
      </div>

      {/* For scripts only: hidden from people and from assistive technology. */}
      <div aria-hidden="true" className="absolute -start-[10000px] h-px w-px overflow-hidden">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>
      <input ref={startedRef} type="hidden" name="started" defaultValue="" />

      <p className="text-sm text-ink-2">
        {copy.privacyNote}{' '}
        <Link href={privacyHref} className="underline">
          {copy.privacyLink}
        </Link>
      </p>

      <div>
        <Button type="submit" disabled={pending} aria-disabled={pending || undefined}>
          {pending ? copy.sending : copy.submit}
        </Button>
      </div>
    </form>
  );
}
