/**
 * Where the loading screen's plane is flying to, read from the address the
 * visitor asked for — before the page, and without shipping the country list
 * to the loading screen: `?to=JP:10,KR:5` names the countries; otherwise a
 * country page's slug is matched against each region's English name, the
 * same way `scripts/generate-countries.ts` makes slugs. Anything not
 * recognised is simply "your destination".
 */
const SLUG_OVERRIDES: Record<string, string> = { usa: 'US', turkey: 'TR' };

export function slugify(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’'`]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function flagOf(code: string): string {
  return String.fromCodePoint(...[...code].map((letter) => 0x1f1e6 + letter.charCodeAt(0) - 65));
}

function codeForSlug(slug: string): string | null {
  if (SLUG_OVERRIDES[slug]) return SLUG_OVERRIDES[slug];
  const english = new Intl.DisplayNames(['en'], { type: 'region' });
  for (let a = 65; a <= 90; a += 1) {
    for (let b = 65; b <= 90; b += 1) {
      const code = String.fromCharCode(a, b);
      const name = english.of(code);
      if (name && name !== code && slugify(name) === slug) return code;
    }
  }
  return null;
}

/**
 * `label` for beside the plane ("🇯🇵 יפן", "🇮🇹 איטליה + 🇫🇷 צרפת"), `names`
 * for the sentence ("יפן"), or null when the address names nothing we
 * recognise.
 */
export function destinationLabel(pathname: string, search: string, locale: string): { label: string; names: string } | null {
  const names = new Intl.DisplayNames([locale], { type: 'region' });
  const codes = (new URLSearchParams(search).get('to') ?? '')
    .split(',')
    .map((stop) => stop.split(':')[0]?.trim().toUpperCase())
    .filter((code): code is string => /^[A-Z]{2}$/.test(code ?? ''));
  if (codes.length === 0) {
    const slug = /\/esim\/([a-z0-9-]+)/.exec(pathname)?.[1];
    const code = slug ? codeForSlug(slug) : null;
    if (code) codes.push(code);
  }
  const unique = [...new Set(codes)];
  if (unique.length === 0) return null;
  const more = unique.length > 2 ? ` +${unique.length - 2}` : '';
  const first = unique.slice(0, 2);
  return {
    label: first.map((code) => `${flagOf(code)} ${names.of(code) ?? code}`).join(' + ') + more,
    names: first.map((code) => names.of(code) ?? code).join(' + ') + more,
  };
}
