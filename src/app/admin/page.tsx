import { headers } from 'next/headers';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { getCatalogue } from '@/lib/catalogue/getCatalogue';
import { alertsFor } from '@/lib/stats/alerts';
import { dashboardAccess } from '@/lib/stats/dashboardAccess';
import { bookingSteps } from '@/lib/stats/events';
import {
  bookingStepLabels,
  contactLabels,
  continentLabels,
  countryLabel,
  daysLabels,
  deviceLabels,
  languageLabels,
  pageLabels,
  positionLabels,
  providerLabel,
  shortDay,
  sourceLabels,
  stopsLabels,
  tripLabel,
  usageLabel,
  activityLabel,
} from '@/lib/stats/labels';
import { lastDays, statsStoreFromEnv } from '@/lib/stats/store';
import { reviewStoreFromEnv } from '@/lib/reviews/store';
import { breakdown, bookingOut, percent, periodOf, total, type Period } from '@/lib/stats/summary';
import { buildCommit, releasedOn, siteVersion } from '@/lib/version';

export const dynamic = 'force-dynamic';

const PERIODS = [7, 30, 90] as const;
const number = new Intl.NumberFormat('he-IL');

/**
 * The owner's dashboard (13 October 2026): how the site is used — visits,
 * where they come from, what is searched, which providers are clicked, what
 * Booking gets — from the day totals the site counts for itself. Nothing on
 * it can tell one visitor from another; see `src/lib/stats/events.ts`.
 *
 * The password is checked before this page is reached (`src/proxy.ts`), and
 * again here, so the page is never served by a route the proxy missed.
 */
export default async function DashboardPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if (dashboardAccess((await headers()).get('authorization')) !== 'ok') notFound();

  const asked = Number((await searchParams).days);
  const length = (PERIODS as readonly number[]).includes(asked) ? asked : 30;

  const store = statsStoreFromEnv();
  const days = lastDays(length * 2);
  const [data, catalogue] = await Promise.all([
    store ? store.read(days).catch(() => null) : Promise.resolve(null),
    getCatalogue(),
  ]);

  const reviewsWaiting = await (reviewStoreFromEnv()?.pending().then((list) => list.length) ?? Promise.resolve(null)).catch(() => null);

  const listed: Record<string, number> = {};
  for (const plan of catalogue.plans) listed[plan.providerId] = (listed[plan.providerId] ?? 0) + 1;
  const current = data ? periodOf(data, days.slice(-length)) : null;
  const previous = data ? periodOf(data, days.slice(0, length)) : null;
  const alerts = data
    ? alertsFor({ data, days: days.slice(-16, -1), sources: catalogue.sources, listedProviders: Object.keys(listed) })
    : [];

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-8 md:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-4">
        <div>
          <p className="text-sm font-semibold text-ink-2">יש קליטה? · לוח נתונים פרטי</p>
          <h1 className="mt-1 font-head text-3xl font-bold">איך משתמשים באתר</h1>
          <p className="mt-1 text-ink-2">
            {current ? `${shortDay(current.days[0])}–${shortDay(current.days.at(-1)!)} · ${length} ימים, כולל היום (עד עכשיו)` : 'אין עדיין נתונים'}
          </p>
        </div>
        <nav aria-label="תקופה">
          <ul className="flex flex-wrap gap-2">
            {PERIODS.map((option) => (
              <li key={option}>
                <Link
                  href={`/admin?days=${option}`}
                  aria-current={option === length ? 'page' : undefined}
                  className={
                    'inline-flex min-h-11 items-center rounded-full border px-4 font-semibold ' +
                    (option === length ? 'border-brand bg-brand text-on-brand' : 'border-line bg-surface text-ink')
                  }
                >
                  {option} ימים
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <p className="mt-4">
        <Link href="/admin/reviews" className="inline-flex min-h-11 items-center font-semibold text-brand underline underline-offset-4">
          {reviewsWaiting === null
            ? 'ביקורות'
            : reviewsWaiting === 1
              ? 'ביקורות: אחת ממתינה לאישור'
              : reviewsWaiting > 1
                ? `ביקורות: ${reviewsWaiting} ממתינות לאישור`
                : 'ביקורות (אין ממתינות)'}
        </Link>
      </p>

      {!store ? (
        <Notice title="שום דבר עוד לא נספר">
          <p>
            לא מחובר מאגר לספירה. ב־Vercel: Storage (או Marketplace) ← Upstash for Redis ← ליצור מאגר חינמי ולחבר אותו
            לפרויקט. Vercel מוסיפים לבד את KV_REST_API_URL ו־KV_REST_API_TOKEN, ומהפריסה הבאה האתר מתחיל לספור.
          </p>
        </Notice>
      ) : !data || !current || !previous ? (
        <Notice title="המאגר לא ענה">
          <p>הנתונים לא נקראו הפעם. כדאי לרענן בעוד דקה; אם זה חוזר, לבדוק ב־Vercel שהמאגר של Upstash עדיין מחובר.</p>
        </Notice>
      ) : (
        <Body current={current} previous={previous} listed={listed} />
      )}

      <Section title="תקינות האתר" id="health">
        <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-[max-content_1fr]">
          <dt className="font-semibold text-ink-2">גרסה</dt>
          <dd>
            {siteVersion} מ־{releasedOn}
            {buildCommit ? ` · ${buildCommit}` : ''}
          </dd>
          <dt className="font-semibold text-ink-2">ספירה</dt>
          <dd>{!store ? 'לא מחוברת' : process.env.STATS_STORE === 'memory' ? 'בזיכרון של השרת בלבד (שרת בדיקות)' : 'מחוברת (Upstash Redis)'}</dd>
        </dl>
        <Table
          caption="מקורות המחירים עכשיו"
          head={['מקור', 'מצב', 'חבילות']}
          rows={catalogue.sources.map((source) => [
            source.label,
            source.ok ? '✓ נטען' : `✗ לא נטען${source.error ? `: ${source.error}` : ''}`,
            number.format(source.planCount),
          ])}
        />
        <Table
          caption="חבילות שמוצגות באתר, לפי ספק"
          head={['ספק', 'חבילות']}
          rows={Object.entries(listed)
            .sort((a, b) => b[1] - a[1])
            .map(([id, plans]) => [providerLabel(id), number.format(plans)])}
        />
        <h3 className="mt-6 font-head text-lg font-semibold">התרעות</h3>
        {alerts.length === 0 ? (
          <p className="mt-1 text-ink-2">אין התרעות פתוחות.</p>
        ) : (
          <ul className="mt-2 grid gap-2">
            {alerts.map((alert) => (
              <li key={alert.key} className="rounded-sm border-s-4 border-s-warn-ink bg-warn-50 px-3 py-2 text-warn-ink">
                {alert.text}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-sm text-ink-2">
          התרעה נשלחת גם במייל, פעם אחת, בבדיקה היומית בבוקר. סיכום שבועי נשלח בכל יום ראשון.
        </p>
      </Section>

      <Section title="מה נספר, ומה לא" id="privacy">
        <ul className="grid list-disc gap-1 ps-5 text-ink-2">
          <li>רק סכומים לכל יום: כמה כניסות, חיפושים ולחיצות. אין רשומה של מבקר, של ביקור או של שעה.</li>
          <li>אין עוגיות, אין כתובת IP, אין מזהה. מדינת המבקר נלקחת מהכותרת ש־Vercel מוסיפים, כקוד של שתי אותיות, והכתובת עצמה לא נקראת.</li>
          <li>לא נשמר מה שמקלידים: רק מדינות מהרשימה של האתר, ספקים שמוצגים בו, ומספר הימים בקבוצות.</li>
          <li>דפדפן שמבקש לא לעקוב (Global Privacy Control או Do Not Track) לא נספר בכלל, וגם לא רובוטים.</li>
          <li>כל יום נמחק לבד אחרי כ־13 חודשים. הנתונים לא משפיעים על הדירוג באתר.</li>
        </ul>
      </Section>
    </div>
  );
}

function Body({ current, previous, listed }: { current: Period; previous: Period; listed: Record<string, number> }) {
  const visits = total(current, 'visits');
  const searches = total(current, 'searches');
  const clicks = total(current, 'clicks');
  const zero = breakdown(current, 'zero:').reduce((sum, row) => sum + row.count, 0);
  const providers = [...new Set([...Object.keys(listed), ...breakdown(current, 'click:').map((row) => row.key)])];

  return (
    <>
      <section aria-labelledby="tiles-title" className="mt-6">
        <h2 id="tiles-title" className="sr-only">
          במבט אחד
        </h2>
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <Tile label="כניסות לאתר" now={visits} before={total(previous, 'visits')} />
          <Tile label="צפיות בעמודים" now={total(current, 'views')} before={total(previous, 'views')} />
          <Tile label="חיפושים" now={searches} before={total(previous, 'searches')} />
          <Tile label="לחיצות לספקים" now={clicks} before={total(previous, 'clicks')} />
          <Tile label="לחיצות ל־Booking" now={bookingOut(current)} before={bookingOut(previous)} />
          <Tile
            label="חיפושים בלי אף תוצאה"
            now={zero}
            before={breakdown(previous, 'zero:').reduce((sum, row) => sum + row.count, 0)}
          />
        </ul>
        <p className="mt-3 text-ink-2">
          {percent(clicks, searches) === null
            ? 'עוד אין חיפושים בתקופה.'
            : `מכל 100 חיפושים יצאו ${percent(clicks, searches)} לחיצות לספק.`}{' '}
          {percent(searches, visits) === null ? '' : `מכל 100 כניסות היו ${percent(searches, visits)} חיפושים.`}
        </p>
      </section>

      <Section title="תנועה" id="traffic">
        {/* A list rather than a six-column table: it has to fit a phone. */}
        <details className="mt-4 rounded-sm border border-line bg-surface px-3 py-2">
          <summary className="cursor-pointer font-semibold">יום אחר יום</summary>
          <ul className="mt-2 grid gap-1">
            {[...current.daily].reverse().map((day) => (
              <li key={day.day} className="border-b border-line-soft py-1 last:border-b-0">
                <span className="font-semibold">{shortDay(day.day)}</span>: {number.format(day.visits)} כניסות ·{' '}
                {number.format(day.views)} צפיות · {number.format(day.searches)} חיפושים · {number.format(day.clicks)} לחיצות
                לספקים · {number.format(day.booking)} ל־Booking
              </li>
            ))}
          </ul>
        </details>
        <div className="grid gap-x-8 md:grid-cols-2">
          <Breakdown caption="מאיפה הגיעו" period={current} prefix="from:" label={(key) => sourceLabels[key] ?? key} />
          <Breakdown caption="מאיזה מכשיר" period={current} prefix="device:" label={(key) => deviceLabels[key] ?? key} />
          <Breakdown caption="מאיזו מדינה נכנסו" period={current} prefix="country:" label={countryLabel} limit={15} />
          <Breakdown caption="באיזו שפה" period={current} prefix="lang:" label={(key) => languageLabels[key] ?? key} />
          <Breakdown caption="אילו עמודים נצפו" period={current} prefix="page:" label={(key) => pageLabels[key] ?? key} />
          <Breakdown caption="עמודי מדינה שנצפו" period={current} prefix="destpage:" label={countryLabel} limit={15} />
        </div>
      </Section>

      <Section title="חיפושים" id="searches">
        <div className="grid gap-x-8 md:grid-cols-2">
          <Breakdown caption="לאן מחפשים" period={current} prefix="search:" label={countryLabel} limit={20} />
          <Breakdown caption="לפי אזור" period={current} prefix="region:" label={(key) => continentLabels[key as keyof typeof continentLabels] ?? key} />
          <Breakdown caption="אורך הטיול" period={current} prefix="days:" label={(key) => daysLabels[key] ?? key} />
          <Breakdown caption="כמה יעדים בטיול" period={current} prefix="stops:" label={(key) => stopsLabels[key] ?? key} />
          <Breakdown caption="שימוש בגלישה" period={current} prefix="usage:" label={usageLabel} />
          {/* Several ticks to a search, so each is a share of the searches the calculator sized. */}
          <Breakdown
            caption="מה סימנו במחשבון הגלישה"
            period={current}
            prefix="act:"
            label={activityLabel}
            of={total(current, 'calculated')}
            ofLabel="פעמים (מהחיפושים לפי המחשבון)"
          />
          <Breakdown caption="מטבע התצוגה" period={current} prefix="currency:" label={(key) => key} />
          <Breakdown caption="שילובים של כמה יעדים" period={current} prefix="combo:" label={tripLabel} limit={15} />
          <Breakdown caption="חיפושים שלא מצאו אף חבילה" period={current} prefix="zero:" label={tripLabel} limit={15} empty="כל חיפוש מצא חבילה." />
        </div>
      </Section>

      <Section title="ספקים" id="providers">
        <Table
          caption="לחיצות לכל ספק"
          head={['ספק', 'לחיצות', 'קודים שהועתקו']}
          rows={providers
            .map((id) => ({ id, clicks: total(current, `click:${id}`) }))
            .sort((a, b) => b.clicks - a.clicks)
            .map(({ id, clicks: count }) => [
              providerLabel(id),
              <Bar key={id} value={count} max={Math.max(1, clicks)} share={percent(count, clicks)} />,
              number.format(total(current, `code:${id}`)),
            ])}
        />
        <div className="grid gap-x-8 md:grid-cols-2">
          <Breakdown caption="איפה ברשימה עמדה החבילה שנלחצה" period={current} prefix="position:" label={(key) => positionLabels[key] ?? key} />
          <div>
            <p className="mt-6 text-ink-2">
              {clicks > 0
                ? `${percent(total(current, 'cheapest'), clicks)}% מהלחיצות היו על החבילה שסומנה "הכי זולה".`
                : 'עוד אין לחיצות בתקופה.'}
            </p>
          </div>
        </div>
        {providers.filter((id) => total(current, `click:${id}`) > 0).map((id) => (
          <details key={id} className="mt-3 rounded-sm border border-line bg-surface px-3 py-2">
            <summary className="cursor-pointer font-semibold">{providerLabel(id)}: לאילו יעדים לחצו</summary>
            <Breakdown caption={`לחיצות ל־${providerLabel(id)} לפי יעד`} period={current} prefix={`click:${id}:`} label={countryLabel} limit={20} />
          </details>
        ))}
        <h3 className="mt-6 font-head text-lg font-semibold">כמה כסף מכל ספק</h3>
        <p className="mt-1 max-w-[75ch] text-ink-2">
          העמלות לא נמשכות לכאן אוטומטית (כך הוחלט ב־13.10). הסכומים מופיעים בלוח השותפים של כל תוכנית: aloSIM, ‏Yesim,
          ‏ZenSim, ‏Saily, ו־Booking.com דרך CJ. הלחיצות בטבלה למעלה הן מה שהאתר שלח; ספק סופר רכישה רק אם הקונה סיים לקנות.
        </p>
      </Section>

      <Section title="Booking.com" id="booking">
        <Table
          caption="מה קרה עם Booking"
          head={['שלב', 'פעמים']}
          rows={bookingSteps.map((step) => [bookingStepLabels[step], number.format(total(current, `booking:${step}`))])}
        />
        <div className="grid gap-x-8 md:grid-cols-2">
          <Breakdown caption="מלונות, לפי יעד" period={current} prefix="booking:hotels:" label={countryLabel} limit={10} />
          <Breakdown caption="רכב, לפי יעד" period={current} prefix="booking:cars:" label={countryLabel} limit={10} />
          <Breakdown caption="אטרקציות, לפי יעד" period={current} prefix="booking:attractions:" label={countryLabel} limit={10} />
        </div>
      </Section>

      <Section title="שיתופים ופניות" id="contact">
        <p>שליחות בוואטסאפ: {number.format(total(current, 'share:whatsapp'))}</p>
        <Breakdown caption='הודעות מ"צור קשר", לפי נושא' period={current} prefix="contact:" label={(key) => contactLabels[key] ?? key} empty="לא נשלחו הודעות." />
      </Section>
    </>
  );
}

function Section({ title, id, children }: { title: string; id: string; children: ReactNode }) {
  return (
    <section aria-labelledby={`${id}-title`} className="mt-10">
      <h2 id={`${id}-title`} className="border-b border-line pb-2 font-head text-2xl font-semibold">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Notice({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-6 rounded-md border-s-4 border-s-warn-ink bg-warn-50 px-4 py-3 text-warn-ink">
      <h2 className="font-head text-lg font-semibold">{title}</h2>
      <div className="mt-1">{children}</div>
    </section>
  );
}

function Tile({ label, now, before }: { label: string; now: number; before: number }) {
  return (
    <li className="rounded-md border border-line bg-surface p-4">
      <p className="text-sm font-semibold text-ink-2">{label}</p>
      <p className="mt-1 font-head text-3xl font-bold tnum">{number.format(now)}</p>
      <p className="mt-1 text-sm text-ink-2">בתקופה הקודמת: {number.format(before)}</p>
    </li>
  );
}

/**
 * A count, its share, and a bar under them. The bar is decoration — the
 * numbers are the content — and it takes its width from the cell, so it
 * never widens the table on a phone.
 */
function Bar({ value, max, share }: { value: number; max: number; share: number | null }) {
  return (
    <span className="block min-w-[5ch]">
      <span className="tnum">{number.format(value)}</span>
      {share !== null ? <span className="text-sm text-ink-2"> ({share}%)</span> : null}
      <span aria-hidden="true" className="mt-1 block h-1.5 rounded-full bg-brand" style={{ width: `${Math.max(3, Math.round((value / max) * 100))}%` }} />
    </span>
  );
}

function Breakdown({
  caption,
  period,
  prefix,
  label,
  limit = 12,
  empty = 'אין עדיין נתונים.',
  of,
  ofLabel = 'פעמים (מהכול)',
}: {
  caption: string;
  period: Period;
  prefix: string;
  label: (key: string) => string;
  limit?: number;
  empty?: string;
  /** The whole each row is a share of, when the rows do not add up to it. */
  of?: number;
  ofLabel?: string;
}) {
  const rows = breakdown(period, prefix);
  const sum = of ?? rows.reduce((total, row) => total + row.count, 0);
  const max = rows[0]?.count ?? 1;
  const shown = rows.slice(0, limit);
  const rest = rows.slice(limit).reduce((total, row) => total + row.count, 0);
  if (rows.length === 0) {
    return (
      <div className="mt-6">
        <h3 className="font-head text-lg font-semibold">{caption}</h3>
        <p className="mt-1 text-ink-2">{empty}</p>
      </div>
    );
  }
  return (
    <Table
      caption={caption}
      head={['', ofLabel]}
      rows={[
        ...shown.map((row) => [label(row.key), <Bar key={row.key} value={row.count} max={max} share={percent(row.count, sum)} />]),
        ...(rest > 0 ? [[`עוד ${rows.length - limit}`, `${number.format(rest)} (${percent(rest, sum)}%)`]] : []),
      ]}
    />
  );
}

function Table({ caption, head, rows }: { caption: string; head: string[]; rows: ReactNode[][] }) {
  return (
    <table className="mt-6 w-full border-collapse text-start">
      <caption className="mb-2 text-start font-head text-lg font-semibold">{caption}</caption>
      <thead>
        <tr className="border-b border-line text-sm text-ink-2">
          {head.map((cell, index) => (
            <th key={index} scope="col" className="py-1 pe-2 text-start font-semibold">
              {cell || <span className="sr-only">מה</span>}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={index} className="border-b border-line-soft">
            {row.map((cell, column) =>
              column === 0 ? (
                <th key={column} scope="row" className="py-1.5 pe-2 text-start align-top font-normal [overflow-wrap:anywhere]">
                  {cell}
                </th>
              ) : (
                <td key={column} className="py-1.5 pe-2 align-top [overflow-wrap:anywhere]">
                  {cell}
                </td>
              ),
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
