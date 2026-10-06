import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  CONTACT_LIMITS,
  contactConfigured,
  contactEmail,
  looksAutomated,
  MIN_FILL_MS,
  rateLimiter,
  sendContactEmail,
  validateContact,
} from '@/lib/contact/contact';

const good = { topic: 'accessibility', name: 'דנה', email: 'dana@example.com', message: 'הכפתור לא נקרא' };

describe('contact form', () => {
  test('a complete message passes, trimmed', () => {
    const r = validateContact({ ...good, email: '  dana@example.com ' });
    assert.ok(r.ok);
    assert.equal(r.ok && r.data.email, 'dana@example.com');
  });

  test('email and message are required; the name is not', () => {
    const r = validateContact({ topic: 'general', name: '', email: '', message: '   ' });
    assert.ok(!r.ok);
    assert.deepEqual(!r.ok && r.errors, { email: 'required', message: 'required' });
  });

  test('a malformed address, an unknown topic and an overlong message are refused', () => {
    const r = validateContact({ topic: 'spam', email: 'not-an-address', message: 'x'.repeat(CONTACT_LIMITS.message + 1) });
    assert.ok(!r.ok);
    assert.deepEqual(!r.ok && r.errors, { topic: 'required', email: 'invalid', message: 'tooLong' });
  });

  test('a filled honeypot or a too-fast send looks automated; a person does not', () => {
    const now = 1_000_000;
    assert.equal(looksAutomated({ website: 'x', started: String(now - 60_000) }, now), true);
    assert.equal(looksAutomated({ website: '', started: String(now - 500) }, now), true);
    // Script did not run: no start time is no evidence, and a person must get through.
    assert.equal(looksAutomated({ website: '', started: '' }, now), false);
    assert.equal(looksAutomated({ website: '', started: 'garbage' }, now), true);
    assert.equal(looksAutomated({ website: '', started: String(now - MIN_FILL_MS - 1) }, now), false);
  });

  test('the form only sends with a key', () => {
    assert.equal(contactConfigured({}), false);
    assert.equal(contactConfigured({ RESEND_API_KEY: '  ' }), false);
    assert.equal(contactConfigured({ RESEND_API_KEY: 're_123' }), true);
  });

  test('five messages per window from one address, then a pause', () => {
    const allow = rateLimiter({ count: 5, windowMs: 1000 });
    const results = Array.from({ length: 6 }, (_, i) => allow('1.2.3.4', i));
    assert.deepEqual(results, [true, true, true, true, true, false]);
    assert.equal(allow('5.6.7.8', 6), true, 'another address is not affected');
    assert.equal(allow('1.2.3.4', 2000), true, 'and the window passes');
  });

  test('the email names the topic and the sender, and Reply goes to the visitor', async () => {
    const r = validateContact(good);
    assert.ok(r.ok);
    if (!r.ok) return;
    const { subject, text } = contactEmail(r.data, { locale: 'he', sentAt: new Date('2026-10-06T10:00:00Z') });
    assert.match(subject, /בעיית נגישות/);
    assert.match(text, /dana@example\.com/);
    assert.match(text, /הכפתור לא נקרא/);

    let sent: { url: string; body: Record<string, unknown>; auth: string } | null = null;
    const fetchImpl = (async (url: string, init: RequestInit) => {
      sent = { url, body: JSON.parse(String(init.body)), auth: String((init.headers as Record<string, string>).Authorization) };
      return new Response('{}', { status: 200 });
    }) as unknown as typeof fetch;
    const result = await sendContactEmail(r.data, { apiKey: 're_test', to: 'site@example.com', locale: 'he', fetchImpl });
    assert.deepEqual(result, { ok: true });
    assert.equal(sent!.url, 'https://api.resend.com/emails');
    assert.equal(sent!.auth, 'Bearer re_test');
    assert.deepEqual(sent!.body.to, ['site@example.com']);
    assert.equal(sent!.body.reply_to, 'dana@example.com');
  });

  test('a refusal from the email service is reported as not sent', async () => {
    const r = validateContact(good);
    if (!r.ok) return assert.fail();
    const fetchImpl = (async () => new Response('{}', { status: 401 })) as unknown as typeof fetch;
    assert.deepEqual(await sendContactEmail(r.data, { apiKey: 'bad', to: 'x@example.com', locale: 'he', fetchImpl }), { ok: false, status: 401 });
  });
});
