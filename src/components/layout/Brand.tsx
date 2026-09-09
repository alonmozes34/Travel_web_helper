import Link from 'next/link';
import { localePath, type Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/getDictionary';

/**
 * The brand lives in one component so the temporary name and mark can be
 * replaced in a single place.
 *
 * The mark is a signal-strength climb — four bars, the tallest in brand blue
 * and the one before it in turquoise, echoing the value accent used on
 * recommended plans.
 */
export function Brand({
  locale,
  dict,
  className,
}: {
  locale: Locale;
  dict: Dictionary;
  className?: string;
}) {
  return (
    <Link
      href={localePath(locale, '/')}
      className={`inline-flex items-center gap-2.5 ${className ?? ''}`}
      aria-label={dict.brand.logoAlt}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <rect x="1" y="15.5" width="4" height="7.5" rx="1.4" fill="#8598A8" />
        <rect x="6.7" y="11" width="4" height="12" rx="1.4" fill="#5A6D7E" />
        <rect x="12.4" y="6.5" width="4" height="16.5" rx="1.4" fill="#16BFB6" />
        <rect x="18.1" y="1" width="4" height="22" rx="1.4" fill="#0B6BD3" />
      </svg>
      <span className="font-head text-lg font-semibold tracking-tight text-ink">
        eSIM <span className="text-brand">Compare</span>
      </span>
    </Link>
  );
}
