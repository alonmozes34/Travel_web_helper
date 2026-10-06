'use server';

import { headers } from 'next/headers';
import { accessibilityStatement } from '@/data/accessibility';
import {
  contactConfigured,
  looksAutomated,
  rateLimiter,
  sendContactEmail,
  validateContact,
  type ContactErrors,
} from '@/lib/contact/contact';

export type ContactState =
  | { status: 'idle' }
  | { status: 'sent' }
  | { status: 'invalid'; errors: ContactErrors; values: Record<string, string> }
  | { status: 'unavailable' | 'rateLimited' | 'failed'; values: Record<string, string> };

const allow = rateLimiter();

export async function submitContact(locale: string, _previous: ContactState, formData: FormData): Promise<ContactState> {
  const raw = Object.fromEntries([...formData.entries()].filter(([key]) => !key.startsWith('$ACTION')));
  const values = Object.fromEntries(
    ['topic', 'name', 'email', 'message'].map((key) => [key, typeof raw[key] === 'string' ? (raw[key] as string) : '']),
  );
  const now = Date.now();

  // Fields first: a person who presses "send" on a half-filled form a second
  // after the page loaded must see what is missing — answered by the
  // too-fast trap, they were told "sent" for a message that went nowhere.
  const checked = validateContact(raw);
  if (!checked.ok) return { status: 'invalid', errors: checked.errors, values };

  if (looksAutomated(raw, now)) return { status: 'sent' };

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const to = process.env.CONTACT_TO?.trim() || accessibilityStatement.contact.email;
  if (!contactConfigured() || !apiKey || !to) return { status: 'unavailable', values };

  const forwarded = (await headers()).get('x-forwarded-for') ?? '';
  if (!allow(forwarded.split(',')[0].trim() || 'unknown', now)) return { status: 'rateLimited', values };

  try {
    const result = await sendContactEmail(checked.data, {
      apiKey,
      to,
      from: process.env.CONTACT_FROM?.trim() || undefined,
      locale,
    });
    return result.ok ? { status: 'sent' } : { status: 'failed', values };
  } catch {
    return { status: 'failed', values };
  }
}
