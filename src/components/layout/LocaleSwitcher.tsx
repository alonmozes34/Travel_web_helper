'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { localeConfig, localePath, locales, stripLocale, type Locale } from '@/i18n/config';

/**
 * Switches language while staying on the same page. The current path is
 * stripped of its locale prefix and rebuilt for the target locale, so
 * `/en/esim/thailand` and `/esim/thailand` map onto each other.
 *
 * Three shapes, one per place it appears:
 * - `pills` — every language side by side, in the header from `sm` up.
 * - `other` — only the language the page is not in, in the header on a phone.
 *   It has to be there and not only in the menu: someone who landed on the
 *   Hebrew site and cannot read Hebrew will not guess that "תפריט" hides the
 *   way out. The word "English" is recognisable without reading anything else.
 * - `list` — full-width rows in the phone menu.
 *
 * Each language name carries its own `lang`, so a screen reader on the Hebrew
 * page says "English" in English rather than spelling it with Hebrew rules.
 */
export function LocaleSwitcher({
  locale,
  label,
  variant = 'pills',
  onNavigate,
}: {
  locale: Locale;
  label: string;
  variant?: 'pills' | 'other' | 'list';
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const basePath = stripLocale(pathname ?? '/');
  const options = variant === 'other' ? locales.filter((option) => option !== locale) : locales;

  return (
    <nav aria-label={label}>
      <ul className={variant === 'list' ? 'flex flex-col' : 'flex items-center gap-1'}>
        {options.map((option) => {
          const isActive = option === locale;
          const { htmlLang, nativeName } = localeConfig[option];
          return (
            <li key={option}>
              <Link
                href={localePath(option, basePath)}
                hrefLang={htmlLang}
                lang={htmlLang}
                aria-current={isActive ? 'true' : undefined}
                onClick={onNavigate}
                className={linkClass(variant, isActive)}
              >
                {nativeName}
                {variant === 'list' && isActive ? (
                  <span aria-hidden="true" className="ms-auto text-brand">
                    ✓
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function linkClass(variant: 'pills' | 'other' | 'list', isActive: boolean): string {
  if (variant === 'list') {
    return (
      'flex min-h-14 items-center gap-3 border-b border-line-soft font-head font-semibold ' +
      (isActive ? 'text-ink' : 'text-ink-2 hover:text-brand')
    );
  }
  if (variant === 'other') {
    // 44px tall, the same as the menu button beside it: this is the one
    // language control on a phone, and it is pressed with a thumb.
    return 'inline-flex min-h-11 items-center rounded-sm border border-line bg-surface px-3 text-sm font-semibold text-ink hover:text-brand';
  }
  return (
    'inline-flex min-h-9 items-center rounded-full border px-3 text-sm font-semibold transition-colors ' +
    (isActive ? 'border-line bg-surface-2 text-ink' : 'border-transparent text-ink-2 hover:text-brand')
  );
}
