import { NextResponse, type NextRequest } from 'next/server';
import {
  CURRENCY_COOKIE,
  CURRENCY_PARAM,
  defaultLocale,
  isCurrency,
  locales,
} from '@/i18n/config';
import {
  gateMode,
  isAuthorised,
  isGatedPath,
  matchesPreviewPassword,
  PREVIEW_COOKIE,
} from '@/lib/previewGate';

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

  const currency = chooseCurrency(request);
  if (currency) return currency;

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
 * A link that lands somebody in their own currency.
 *
 * `?currency=EUR` on any URL — alongside the locale prefix, so
 * `/en/esim/france?currency=EUR` is English in euros — sets the preference
 * and then redirects to the same page without the parameter.
 *
 * The redirect is the point rather than an inconvenience. The display
 * currency is read from a cookie on the server so prices are right in the
 * first paint; a request that only carries the parameter has no such cookie
 * yet, so rendering it straight away would show the old currency and change
 * it under the reader on the next click. One hop, and the page that arrives
 * is already correct.
 *
 * An unrecognised value is ignored rather than corrected: somebody linking to
 * `?currency=XYZ` gets the ordinary page, not a redirect loop.
 */
function chooseCurrency(request: NextRequest) {
  const requested = request.nextUrl.searchParams.get(CURRENCY_PARAM);
  if (!requested) return null;

  const code = requested.toUpperCase();
  if (!isCurrency(code)) return null;

  const url = request.nextUrl.clone();
  url.searchParams.delete(CURRENCY_PARAM);
  const response = NextResponse.redirect(url);
  response.cookies.set(CURRENCY_COOKIE, code, {
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}

/**
 * The preview gate, applied before any routing.
 *
 * Scoped to the routes that render fabricated prices. Everything else — the
 * homepage, how-it-works, the FAQ, the affiliate disclosure, the
 * accessibility statement — is public, because a partner programme has to be
 * able to see what this is before it will give us the data that makes the
 * rest publishable.
 *
 * Static files never reach here at all: the matcher below lets anything with
 * a file extension past, so the brand assets, robots.txt and the sitemap stay
 * reachable. None of those carry a price.
 */
function guard(request: NextRequest): NextResponse | null {
  if (!isGatedPath(request.nextUrl.pathname, locales)) return null;

  const mode = gateMode({ gate: process.env.PREVIEW_GATE, password: process.env.SITE_PASSWORD });

  if (mode.kind === 'open') return null;

  // Asking for the gate without supplying a password serves nothing rather
  // than serving everything: a half-configured gate must fail the safe way.
  if (mode.kind === 'unconfigured') {
    return new NextResponse(
      'PREVIEW_GATE is on but SITE_PASSWORD is not set, so nothing is served. Set the password, or unset PREVIEW_GATE to make the site public.',
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  // Either the cookie the unlock page sets, or an Authorization header — the
  // latter so that curl and a deploy check can reach a gated page without a
  // browser session.
  const password = process.env.SITE_PASSWORD ?? '';
  const cookie = request.cookies.get(PREVIEW_COOKIE)?.value ?? '';
  if (matchesPreviewPassword(cookie, password)) return null;
  if (isAuthorised(request.headers.get('authorization'), password)) return null;

  // A redirect rather than a 401. The browser's own credential dialog cannot
  // be reached by client-side navigation: pressing "השוו חבילות" fetches the
  // next route, gets a 401 it cannot prompt for, and leaves the visitor
  // sitting on the page they were already on with nothing having happened —
  // which is what a partner reviewer would have seen. A redirect is something
  // the router follows.
  const url = request.nextUrl.clone();
  url.pathname = `${localePrefix(request.nextUrl.pathname)}/unlock`;
  url.search = `?next=${encodeURIComponent(request.nextUrl.pathname + request.nextUrl.search)}`;
  return NextResponse.redirect(url);
}

/** '' for the default locale's clean URLs, '/en' for a prefixed one. */
function localePrefix(pathname: string): string {
  const first = pathname.split('/').filter(Boolean)[0] ?? '';
  return prefixedLocales.includes(first as (typeof prefixedLocales)[number]) ? `/${first}` : '';
}

export const config = {
  // Skip Next internals, API routes and anything with a file extension.
  matcher: ['/((?!api|_next/static|_next/image|.*\\.).*)'],
};
