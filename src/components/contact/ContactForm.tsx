'use client';

import Link from 'next/link';
import { useActionState, useEffect, useRef, useState } from 'react';
import { submitContact, type ContactState } from '@/app/[locale]/contact/actions';
import { Button } from '@/components/ui/Button';
import { CONTACT_LIMITS, CONTACT_TOPICS, type ContactFieldError, type ContactTopic } from '@/lib/contact/contact';
import type { Dictionary } from '@/i18n/getDictionary';

type Copy = Dictionary['contactPage'];

const field =
  'mt-1.5 block w-full rounded-md border border-line bg-surface px-3 py-2.5 text-base text-ink ' +
  'aria-[invalid=true]:border-warn-ink aria-[invalid=true]:border-2';

/**
 * The form itself. Every field is labelled in words, required ones say so,
 * and each error is written next to its field and listed at the top, where
 * focus goes when the form comes back with something to fix. Success moves
 * focus to the confirmation, so a screen reader hears it.
 */
export function ContactForm({
  locale,
  copy,
  email,
  privacyHref,
  initialTopic,
}: {
  locale: string;
  copy: Copy;
  email: string;
  privacyHref: string;
  initialTopic: ContactTopic;
}) {
  const [round, setRound] = useState(0);
  return (
    <FormRound
      key={round}
      locale={locale}
      copy={copy}
      email={email}
      privacyHref={privacyHref}
      initialTopic={initialTopic}
      onAnother={() => setRound((r) => r + 1)}
    />
  );
}

function FormRound({
  locale,
  copy,
  email,
  privacyHref,
  initialTopic,
  onAnother,
}: {
  locale: string;
  copy: Copy;
  email: string;
  privacyHref: string;
  initialTopic: ContactTopic;
  onAnother: () => void;
}) {
  const [state, action, pending] = useActionState<ContactState, FormData>(submitContact.bind(null, locale), {
    status: 'idle',
  });
  const summaryRef = useRef<HTMLDivElement>(null);
  const sentRef = useRef<HTMLHeadingElement>(null);
  const startedRef = useRef<HTMLInputElement>(null);

  // When the visitor started, for the "faster than a person" trap. Set after
  // the page is in the browser, so a cached page cannot carry an old time.
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
        <h2 ref={sentRef} tabIndex={-1} className="font-head text-2xl font-bold">
          <span aria-hidden="true">✓ </span>
          {copy.sentTitle}
        </h2>
        <p className="mt-2 text-ink-2">{copy.sentBody}</p>
        <Button variant="secondary" className="mt-4" onClick={onAnother}>
          {copy.another}
        </Button>
      </div>
    );
  }

  const values = 'values' in state ? state.values : {};
  const errors = state.status === 'invalid' ? state.errors : {};
  const errorText = (key: 'topic' | 'name' | 'email' | 'message', error: ContactFieldError | undefined) =>
    error ? copy.errors[key][error as keyof (typeof copy.errors)[typeof key]] : undefined;
  const fieldErrors = {
    topic: errorText('topic', errors.topic),
    name: errorText('name', errors.name),
    email: errorText('email', errors.email),
    message: errorText('message', errors.message),
  };
  const listed = Object.entries(fieldErrors).filter((entry): entry is [string, string] => Boolean(entry[1]));
  const problem =
    state.status === 'unavailable'
      ? copy.unavailable
      : state.status === 'rateLimited'
        ? copy.rateLimited
        : state.status === 'failed'
          ? copy.failed
          : null;

  return (
    <form action={action} noValidate className="grid gap-6">
      {problem || listed.length ? (
        <div
          ref={summaryRef}
          tabIndex={-1}
          role="alert"
          className="rounded-md border-s-4 border-s-warn-ink bg-warn-50 px-4 py-3 text-warn-ink"
        >
          {problem ? (
            <p className="font-semibold">
              {problem} <a href={`mailto:${email}`} className="underline">{email}</a>
            </p>
          ) : (
            <>
              <p className="font-semibold">{copy.fixTitle}</p>
              <ul className="mt-1 list-disc ps-5">
                {listed.map(([key, text]) => (
                  <li key={key}>
                    <a href={`#contact-${key}`} className="underline">
                      {text}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      ) : null}

      <fieldset className="min-w-0" aria-describedby={fieldErrors.topic ? 'contact-topic-error' : undefined}>
        <legend id="contact-topic" tabIndex={-1} className="font-head text-base font-semibold">
          {copy.topicLegend}
        </legend>
        {fieldErrors.topic ? (
          <p id="contact-topic-error" className="mt-1 text-sm font-semibold text-warn-ink">
            {fieldErrors.topic}
          </p>
        ) : null}
        <div className="mt-2 grid gap-1 sm:grid-cols-2">
          {CONTACT_TOPICS.map((topic) => (
            <label key={topic} className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-md px-1">
              <input
                type="radio"
                name="topic"
                value={topic}
                defaultChecked={(values.topic || initialTopic) === topic}
                className="size-5 accent-brand"
              />
              <span>{copy.topics[topic]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="contact-name" className="font-head text-base font-semibold">
          {copy.nameLabel} <span className="font-normal text-ink-3">{copy.optional}</span>
        </label>
        <input
          id="contact-name"
          name="name"
          type="text"
          autoComplete="name"
          maxLength={CONTACT_LIMITS.name}
          defaultValue={values.name}
          aria-invalid={Boolean(fieldErrors.name) || undefined}
          aria-describedby={fieldErrors.name ? 'contact-name-error' : undefined}
          className={field}
        />
        {fieldErrors.name ? (
          <p id="contact-name-error" className="mt-1 text-sm font-semibold text-warn-ink">{fieldErrors.name}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="contact-email" className="font-head text-base font-semibold">
          {copy.emailLabel} <span className="font-normal text-ink-3">{copy.required}</span>
        </label>
        <p id="contact-email-hint" className="text-sm text-ink-2">{copy.emailHint}</p>
        <input
          id="contact-email"
          name="email"
          type="email"
          dir="ltr"
          autoComplete="email"
          required
          maxLength={CONTACT_LIMITS.email}
          defaultValue={values.email}
          aria-invalid={Boolean(fieldErrors.email) || undefined}
          aria-describedby={['contact-email-hint', fieldErrors.email ? 'contact-email-error' : ''].filter(Boolean).join(' ')}
          className={field + ' text-start'}
        />
        {fieldErrors.email ? (
          <p id="contact-email-error" className="mt-1 text-sm font-semibold text-warn-ink">{fieldErrors.email}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="contact-message" className="font-head text-base font-semibold">
          {copy.messageLabel} <span className="font-normal text-ink-3">{copy.required}</span>
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          rows={7}
          maxLength={CONTACT_LIMITS.message}
          defaultValue={values.message}
          aria-invalid={Boolean(fieldErrors.message) || undefined}
          aria-describedby={fieldErrors.message ? 'contact-message-error' : undefined}
          className={field + ' resize-y'}
        />
        {fieldErrors.message ? (
          <p id="contact-message-error" className="mt-1 text-sm font-semibold text-warn-ink">{fieldErrors.message}</p>
        ) : null}
      </div>

      {/* For scripts only: hidden from people and from assistive technology,
          and out of the tab order. A person never fills it in. */}
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
