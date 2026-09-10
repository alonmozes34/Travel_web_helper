import { NextResponse, type NextRequest } from 'next/server';
import { defaultLocale, locales } from '@/i18n/config';
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

  const mode = gateMode({
    password: process.env.SITE_PASSWORD,
    allowUnprotected: process.env.ALLOW_UNPROTECTED_MOCK,
    nodeEnv: process.env.NODE_ENV,
  });

  if (mode.kind === 'open') return null;

  // Default closed: a deployment that set neither the password nor the
  // opt-out serves no prices at all, rather than quietly publishing invented
  // ones under real companies' names.
  if (mode.kind === 'unconfigured') {
    return new NextResponse(
      'This preview is not configured. Set SITE_PASSWORD, or ALLOW_UNPROTECTED_MOCK=true to run it open.',
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
