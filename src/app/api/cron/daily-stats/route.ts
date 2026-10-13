import { accessibilityStatement } from '@/data/accessibility';
import { getCatalogue } from '@/lib/catalogue/getCatalogue';
import { sendEmail } from '@/lib/contact/contact';
import { siteUrl } from '@/lib/site';
import { ALERT_RULES, alertsFor, notYetSent } from '@/lib/stats/alerts';
import { alertEmail, weeklyEmail } from '@/lib/stats/report';
import { lastDays, statsStoreFromEnv } from '@/lib/stats/store';
import { periodOf } from '@/lib/stats/summary';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const pause = (ms: number) => new Promise((done) => setTimeout(done, ms));

/** Sunday in Israel. */
const isSunday = (now: Date) => new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Jerusalem', weekday: 'short' }).format(now) === 'Sun';

/**
 * The dashboard's morning job, called once a day by Vercel Cron (vercel.json):
 * any alert that holds and was not sent in the last few days goes out by
 * email, and on Sundays the week's summary (the owner, 13 October 2026).
 * With CRON_SECRET set in Vercel, only Vercel's own call is accepted; without
 * it, a second call sends nothing new — each alert and each Sunday's summary
 * is marked as sent in the day's counters.
 *
 * Without RESEND_API_KEY nothing is sent, and the answer says what would
 * have been.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (secret && request.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ ok: false, error: 'unauthorised' }, { status: 401 });
  }
  const store = statsStoreFromEnv();
  if (!store) {
    return Response.json({ ok: false, error: 'no stats store connected (neither KV_REST_API_URL nor UPSTASH_REDIS_REST_URL is set)' }, { status: 503 });
  }

  const now = new Date();
  const days = lastDays(22, now);
  const today = days.at(-1)!;
  const data = await store.read(days);

  // A source on its first read is not down; give it the time the price job does.
  let catalogue = await getCatalogue();
  for (let attempt = 0; attempt < 4 && catalogue.sources.some((source) => !source.ok); attempt += 1) {
    await pause(5000);
    catalogue = await getCatalogue();
  }
  const listed = [...new Set(catalogue.plans.map((plan) => plan.providerId))];

  const fullDays = days.slice(0, -1);
  const alerts = alertsFor({ data, days: fullDays, sources: catalogue.sources, listedProviders: listed });
  const fresh = notYetSent(alerts, data, days.slice(-ALERT_RULES.repeatAfterDays));
  const weeklyDue = isSunday(now) && !data[today]?.['email:weekly'];

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const to = process.env.CONTACT_TO?.trim() || accessibilityStatement.contact.email;
  const from = process.env.CONTACT_FROM?.trim() || undefined;
  const dashboardUrl = `${siteUrl}/admin`;
  const sent: string[] = [];

  if (apiKey && to) {
    if (fresh.length > 0) {
      const result = await sendEmail({ apiKey, to, from, ...alertEmail({ alerts: fresh, dashboardUrl }) }).catch(() => ({ ok: false }));
      if (result.ok) {
        for (const alert of fresh) await store.claim(today, `alert:${alert.key}`);
        sent.push('alerts');
      }
    }
    if (weeklyDue) {
      const email = weeklyEmail({ week: periodOf(data, fullDays.slice(-7)), before: periodOf(data, fullDays.slice(-14, -7)), alerts, dashboardUrl });
      const result = await sendEmail({ apiKey, to, from, ...email }).catch(() => ({ ok: false }));
      if (result.ok) {
        await store.claim(today, 'email:weekly');
        sent.push('weekly');
      }
    }
  }

  return Response.json(
    {
      ok: true,
      day: today,
      alerts: alerts.map((alert) => alert.key),
      due: { alerts: fresh.map((alert) => alert.key), weekly: weeklyDue },
      sent,
      ...(apiKey && to ? {} : { note: 'RESEND_API_KEY is not set, so nothing was sent' }),
    },
    { headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } },
  );
}
