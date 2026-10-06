/**
 * The contact form (the owner, 6 October 2026: "a page for sending enquiries
 * that arrives by email").
 *
 * Nothing is stored on the site. A message is checked, sent once through
 * Resend's email API to the site's own address, and forgotten; the copy that
 * remains is the email in that inbox. The privacy notice says exactly this,
 * from the constants below.
 *
 * Without RESEND_API_KEY the page says the form is not available yet and gives
 * the address instead — it never says "sent" for a message that went nowhere.
 */

export const CONTACT_TOPICS = ['general', 'plan', 'accessibility', 'partnership', 'other'] as const;
export type ContactTopic = (typeof CONTACT_TOPICS)[number];

export const CONTACT_LIMITS = { name: 100, email: 200, message: 4000 } as const;

/** Faster than this from page to "send" is a script, not a person. */
export const MIN_FILL_MS = 2500;

/** At most this many messages from one address in the window, per server. */
export const RATE_LIMIT = { count: 5, windowMs: 10 * 60 * 1000 } as const;

/** Where the message goes on its way to the inbox — named on the privacy page. */
export const CONTACT_PROCESSOR = { name: 'Resend', url: 'https://resend.com/legal/privacy-policy' } as const;

export type ContactInput = {
  topic: ContactTopic;
  name: string;
  email: string;
  message: string;
};

export type ContactFieldError = 'required' | 'invalid' | 'tooLong';
export type ContactErrors = Partial<Record<keyof ContactInput, ContactFieldError>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateContact(raw: Record<string, unknown>): { ok: true; data: ContactInput } | { ok: false; errors: ContactErrors } {
  const text = (key: string) => (typeof raw[key] === 'string' ? (raw[key] as string).trim() : '');
  const topic = text('topic');
  const name = text('name');
  const email = text('email');
  const message = text('message');
  const errors: ContactErrors = {};

  if (!CONTACT_TOPICS.includes(topic as ContactTopic)) errors.topic = 'required';
  if (name.length > CONTACT_LIMITS.name) errors.name = 'tooLong';
  if (!email) errors.email = 'required';
  else if (email.length > CONTACT_LIMITS.email || !EMAIL.test(email)) errors.email = 'invalid';
  if (!message) errors.message = 'required';
  else if (message.length > CONTACT_LIMITS.message) errors.message = 'tooLong';

  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, data: { topic: topic as ContactTopic, name, email, message } };
}

/**
 * The traps a person never springs: a field hidden from people and from
 * assistive technology that only a script fills in, and a form sent faster
 * than anyone could type into it. A caught script is told "sent", so it has
 * nothing to learn from.
 */
export function looksAutomated(raw: Record<string, unknown>, now: number): boolean {
  const honeypot = typeof raw.website === 'string' ? raw.website.trim() : '';
  if (honeypot !== '') return true;
  // The start time is written by script once the page is in the browser. A
  // person whose script did not run sends it empty, and must not be taken
  // for a bot — so an empty one is no evidence either way.
  const startedText = typeof raw.started === 'string' ? raw.started.trim() : '';
  if (startedText === '') return false;
  const started = Number(startedText);
  return !Number.isFinite(started) || now - started < MIN_FILL_MS;
}

export function contactConfigured(env: Record<string, string | undefined> = process.env): boolean {
  return Boolean(env.RESEND_API_KEY?.trim());
}

/** A small in-memory window per server: enough to stop a loop, not a fortress. */
export function rateLimiter({ count, windowMs } = RATE_LIMIT) {
  const seen = new Map<string, number[]>();
  return (key: string, now: number): boolean => {
    const recent = (seen.get(key) ?? []).filter((t) => now - t < windowMs);
    if (recent.length >= count) {
      seen.set(key, recent);
      return false;
    }
    recent.push(now);
    seen.set(key, recent);
    return true;
  };
}

const TOPIC_LABELS: Record<ContactTopic, string> = {
  general: 'שאלה כללית',
  plan: 'בעיה בחבילה או בקישור',
  accessibility: 'בעיית נגישות',
  partnership: 'שיתוף פעולה',
  other: 'אחר',
};

export function contactEmail(data: ContactInput, { locale, sentAt }: { locale: string; sentAt: Date }) {
  const topic = TOPIC_LABELS[data.topic];
  const subject = `[יש קליטה?] ${topic}${data.name ? ` — ${data.name}` : ''}`;
  const text = [
    `נושא: ${topic}`,
    `שם: ${data.name || '(לא נמסר)'}`,
    `אימייל: ${data.email}`,
    `שפת האתר: ${locale}`,
    `נשלח: ${sentAt.toISOString()}`,
    '',
    data.message,
    '',
    '— נשלח מטופס יצירת הקשר באתר. "השב" עונה ישירות לפונה.',
  ].join('\n');
  return { subject, text };
}

export type SendResult = { ok: true } | { ok: false; status: number };

export async function sendContactEmail(
  data: ContactInput,
  {
    apiKey,
    to,
    from = 'Yesh Klita <onboarding@resend.dev>',
    locale,
    now = new Date(),
    fetchImpl = fetch,
  }: { apiKey: string; to: string; from?: string; locale: string; now?: Date; fetchImpl?: typeof fetch },
): Promise<SendResult> {
  const { subject, text } = contactEmail(data, { locale, sentAt: now });
  const response = await fetchImpl('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [to], reply_to: data.email, subject, text }),
  });
  return response.ok ? { ok: true } : { ok: false, status: response.status };
}
