'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { localeConfig, localePath, locales, stripLocale, type Locale } from '@/i18n/config';

/**
 * Switches language while staying on the same page. The current path is
 * stripped of its locale prefix and rebuilt for the target locale, so
 * `/en/esim/thailand` and `/esim/thailand` map onto each other.
 */
export function LocaleSwitcher({ locale, label }: { locale: Locale; label: string }) {
  const pathname = usePathname();
  const basePath = stripLocale(pathname ?? '/');

  return (
    <nav aria-label={label} className="flex items-center gap-1">
      {locales.map((option) => {
        const isActive = option === locale;
        return (
          <Link
            key={option}
            href={localePath(option, basePath)}
            hrefLang={localeConfig[option].htmlLang}
            aria-current={isActive ? 'true' : undefined}
            className={
              'inline-flex min-h-9 items-center rounded-full border px-3 text-sm font-semibold transition-colors ' +
              (isActive
                ? 'border-line bg-surface-2 text-ink'
                : 'border-transparent text-ink-2 hover:text-brand')
            }
          >
            {localeConfig[option].nativeName}
          </Link>
        );
      })}
    </nav>
  );
}
