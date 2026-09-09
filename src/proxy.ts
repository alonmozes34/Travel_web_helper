import { NextResponse, type NextRequest } from 'next/server';
import { defaultLocale, locales } from '@/i18n/config';
import { gateMode, isAuthorised, PREVIEW_REALM } from '@/lib/previewGate';

const prefixedLocales = locales.filter((locale) => locale !== defaultLocale);

/**
 * Locale routing.
 *
 * Every route lives under `app/[locale]`, but Hebrew — the default locale and
 * the launch market — is served from clean, unprefixed URLs so that
 * `/esim/thailand` is the canonical Hebrew page. Unprefixed requests are
 * rewritten (not redirected) onto the `[locale]` segment; an explicit `/he/...`
 * request redirects to the canonical form so the two never compete in search.
 */
export function proxy(request: NextRequest) {
  const gate = guard(request);
  if (gate) return gate;

  const { pathname } = request.nextUrl;

  if (pathname.startsWith(`/${defaultLocale}/`) || pathname === `/${defaultLocale}`) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(defaultLocale.length + 1) || '/';
    return NextResponse.redirect(url);
  }

  const hasPrefix = prefixedLocales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );
  if (hasPrefix) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = `/${defaultLocale}${pathname === '/' ? '' : pathname}`;
  return NextResponse.rewrite(url);
}

/**
 * The preview gate, applied before any routing.
 *
 * Only pages pass through here — the matcher below lets anything with a file
 * extension past, so the brand assets, robots.txt and the sitemap stay
 * reachable. None of those carry a price, and robots.txt disallows everything
 * regardless.
 */
function guard(request: NextRequest): NextResponse | null {
  const mode = gateMode({
    password: process.env.SITE_PASSWORD,
    allowUnprotected: process.env.ALLOW_UNPROTECTED_MOCK,
    nodeEnv: process.env.NODE_ENV,
  });

  if (mode.kind === 'open') return null;

  // Default closed: a deployment that set neither the password nor the
  // opt-out serves nothing at all, rather than quietly serving invented
  // prices under real companies' names.
  if (mode.kind === 'unconfigured') {
    return new NextResponse(
      'This preview is not configured. Set SITE_PASSWORD, or ALLOW_UNPROTECTED_MOCK=true to run it open.',
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  if (isAuthorised(request.headers.get('authorization'), process.env.SITE_PASSWORD ?? '')) {
    return null;
  }

  return new NextResponse('יש קליטה? — תצוגה מוקדמת. נדרשת סיסמה.', {
    status: 401,
    headers: {
      // Says which site is asking, and that the data behind it is not real.
      'WWW-Authenticate': `Basic realm="${PREVIEW_REALM}"`,
      'Cache-Control': 'no-store',
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}

export const config = {
  // Skip Next internals, API routes and anything with a file extension.
  matcher: ['/((?!api|_next/static|_next/image|.*\\.).*)'],
};
