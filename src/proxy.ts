import { NextResponse, type NextRequest } from 'next/server';
import { defaultLocale, locales } from '@/i18n/config';

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

export const config = {
  // Skip Next internals, API routes and anything with a file extension.
  matcher: ['/((?!api|_next/static|_next/image|.*\\.).*)'],
};
