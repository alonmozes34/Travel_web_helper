import { cookies } from 'next/headers';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import { buttonClasses } from '@/components/ui/Button';
import { isLocale, localePath, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/getDictionary';
import { matchesPreviewPassword, PREVIEW_COOKIE, safeNextPath } from '@/lib/previewGate';

/**
 * The way past the preview gate.
 *
 * A real page rather than the browser's own credential dialog, for two
 * reasons. A dialog cannot be reached by client-side navigation, so pressing
 * "השוו חבילות" simply did nothing — the router fetched the next route, got a
 * 401 it could not prompt for, and left the visitor where they were. And a
 * partner reviewer opening this link deserves to be told what they are
 * looking at, in the site's own language, rather than shown a grey box.
 *
 * The page is public by construction: `/unlock` is not one of the gated
 * segments, so the gate never redirects to a page it would itself block.
 */
export default async function UnlockPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  // Bound to a typed const so the narrowing survives into the server action
  // below, which is a separate function body.
  const locale: Locale = raw;

  const query = await searchParams;
  const dict = getDictionary(locale);
  const home = localePath(locale, '/');
  const next = safeNextPath(typeof query.next === 'string' ? query.next : null) ?? home;
  const failed = query.error === '1';

  async function unlock(formData: FormData) {
    'use server';

    const password = process.env.SITE_PASSWORD ?? '';
    const supplied = String(formData.get('password') ?? '');

    if (!matchesPreviewPassword(supplied, password)) {
      redirect(`${localePath(locale, '/unlock')}?next=${encodeURIComponent(next)}&error=1`);
    }

    // The password itself, kept where script cannot read it. Over HTTPS this
    // is the same exposure HTTP Basic would have had on every request.
    (await cookies()).set(PREVIEW_COOKIE, password, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });

    redirect(next);
  }

  return (
    <Container className="flex justify-center py-16 md:py-24">
      <div className="w-full max-w-[54ch] rounded-lg border border-line bg-surface p-7 md:p-9">
        <h1 className="font-head text-2xl font-bold tracking-tight md:text-3xl">
          {dict.preview.heading}
        </h1>
        <p className="mt-4 text-base text-ink-2">{dict.preview.body}</p>
        <p className="mt-2 text-base text-ink-2">{dict.preview.publicHint}</p>

        <form action={unlock} className="mt-7">
          <label htmlFor="preview-password" className="block font-head text-sm font-semibold text-ink-2">
            {dict.preview.invite}
          </label>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input
              id="preview-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              aria-label={dict.preview.label}
              aria-invalid={failed || undefined}
              aria-describedby={failed ? 'preview-error' : undefined}
              className="min-h-11 min-w-0 flex-1 rounded-sm border border-line bg-surface px-3 text-base text-ink"
            />
            <button type="submit" className={buttonClasses('primary', 'md')}>
              {dict.preview.submit}
            </button>
          </div>
          {/* The error is a live region as well as a described-by target: a
              screen-reader user who submits and lands back here must be told
              why, not left to re-read the form. */}
          {failed ? (
            <p id="preview-error" role="alert" className="mt-3 text-base font-semibold text-warn-ink">
              {dict.preview.error}
            </p>
          ) : null}
        </form>

        <p className="mt-7">
          <Link href={home} className="text-base font-semibold text-brand">
            {dict.preview.back}
          </Link>
        </p>
      </div>
    </Container>
  );
}
