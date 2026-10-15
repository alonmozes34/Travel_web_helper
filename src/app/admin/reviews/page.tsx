import { headers } from 'next/headers';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ReviewList } from '@/components/reviews/ReviewList';
import { getDictionary } from '@/i18n/getDictionary';
import { newestFirst, type Review } from '@/lib/reviews/reviews';
import { reviewStoreFromEnv } from '@/lib/reviews/store';
import { dashboardAccess } from '@/lib/stats/dashboardAccess';
import { approveReview, removeReview } from './actions';

export const dynamic = 'force-dynamic';

/**
 * Reviews waiting for the owner (the owner, 15 October 2026: nothing is
 * published before they approve it), and the published ones, which can be
 * removed. A review is approved or removed as written: the text is never
 * edited here, so what appears on the site is what its writer sent.
 */
export default async function ReviewsAdminPage() {
  if (dashboardAccess((await headers()).get('authorization')) !== 'ok') notFound();
  const store = reviewStoreFromEnv();
  const [pending, published] = store
    ? await Promise.all([store.pending().catch(() => null), store.published().catch(() => null)])
    : [null, null];
  const copy = getDictionary('he').reviewsPage;

  return (
    <div className="mx-auto max-w-[900px] px-4 py-8 md:px-8">
      <header className="border-b border-line pb-4">
        <p className="text-sm font-semibold text-ink-2">
          <Link href="/admin" className="underline">
            יש קליטה? · לוח נתונים פרטי
          </Link>
        </p>
        <h1 className="mt-1 font-head text-3xl font-bold">ביקורות</h1>
        <p className="mt-1 text-ink-2">
          ביקורת עולה לאתר רק אחרי שאישרת אותה. אין כאן עריכה: מאשרים או מוחקים, כך שמה שעולה הוא מה שהכותב שלח.
        </p>
      </header>

      {!store ? (
        <p className="mt-6 rounded-sm border-s-4 border-s-warn-ink bg-warn-50 px-3 py-2 text-warn-ink">
          לא מחובר מאגר, אז אי אפשר לשלוח ביקורות. זה אותו מאגר של הספירה (Upstash ב־Vercel).
        </p>
      ) : pending === null || published === null ? (
        <p className="mt-6 rounded-sm border-s-4 border-s-warn-ink bg-warn-50 px-3 py-2 text-warn-ink">
          המאגר לא ענה. כדאי לרענן בעוד דקה.
        </p>
      ) : (
        <>
          <Group title={`ממתינות לאישור (${pending.length})`} empty="אין ביקורות שממתינות." reviews={newestFirst(pending)} copy={copy} approve />
          <Group title={`באתר (${published.length})`} empty="עוד לא פורסמה ביקורת." reviews={newestFirst(published)} copy={copy} />
        </>
      )}

      <section className="mt-10 border-t border-line pt-6 text-ink-2">
        <h2 className="font-head text-lg font-semibold text-ink">לפני שמאשרים</h2>
        <ul className="mt-2 grid list-disc gap-1 ps-5">
          <li>בלי פרטים אישיים בטקסט: טלפון, מייל, מספר הזמנה או שם מלא של מישהו אחר.</li>
          <li>בלי פרסום, קישורים או קודי הנחה של אתרים אחרים, ובלי דברים פוגעניים.</li>
          <li>ביקורת שלילית אמיתית מאשרים כמו חיובית. ביקורת שנראית מזויפת לא מאשרים.</li>
          <li>מי שכתב ביקורת ורוצה להסיר אותה יכול לבקש בטופס יצירת הקשר. מוחקים אותה כאן.</li>
        </ul>
      </section>
    </div>
  );
}

function Group({
  title,
  empty,
  reviews,
  copy,
  approve = false,
}: {
  title: string;
  empty: string;
  reviews: Review[];
  copy: ReturnType<typeof getDictionary>['reviewsPage'];
  approve?: boolean;
}) {
  return (
    <section className="mt-8">
      <h2 className="font-head text-xl font-semibold">{title}</h2>
      {reviews.length === 0 ? (
        <p className="mt-2 text-ink-2">{empty}</p>
      ) : (
        <ul className="mt-3 grid gap-4">
          {reviews.map((review) => (
            <li key={review.id}>
              <ReviewList reviews={[review]} locale="he" copy={copy} empty="" />
              <div className="mt-2 flex flex-wrap gap-3">
                {approve ? (
                  <form action={approveReview}>
                    <input type="hidden" name="id" value={review.id} />
                    <button type="submit" className="inline-flex min-h-11 items-center rounded-md bg-brand px-4 font-semibold text-on-brand">
                      לאשר ולפרסם
                    </button>
                  </form>
                ) : null}
                <form action={removeReview}>
                  <input type="hidden" name="id" value={review.id} />
                  <button type="submit" className="inline-flex min-h-11 items-center rounded-md border border-line bg-surface px-4 font-semibold text-warn-ink">
                    {approve ? 'לא לפרסם (למחוק)' : 'להסיר מהאתר (למחוק)'}
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
