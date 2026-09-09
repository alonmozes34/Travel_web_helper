import Link from 'next/link';
import { localePath, type Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/getDictionary';

/**
 * The brand lives in one component so the name and mark can be replaced in a
 * single place.
 *
 * The mark is a signal-strength climb — four bars, the tallest in brand blue
 * and the one before it in turquoise, echoing the value accent used on
 * recommended plans. It is the literal picture of the name.
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
      className={`inline-flex min-h-11 items-center gap-2.5 ${className ?? ''}`}
      // The accessible name opens with the visible wordmark verbatim, so the
      // link satisfies WCAG 2.5.3 and a voice-control user can say what they
      // see. The wordmark's own text is not announced twice: an aria-label
      // replaces the element's contents rather than adding to them.
      aria-label={dict.brand.logoAlt}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <rect x="1" y="15.5" width="4" height="7.5" rx="1.4" fill="#8598A8" />
        <rect x="6.7" y="11" width="4" height="12" rx="1.4" fill="#5A6D7E" />
        <rect x="12.4" y="6.5" width="4" height="16.5" rx="1.4" fill="#16BFB6" />
        <rect x="18.1" y="1" width="4" height="22" rx="1.4" fill="#0B6BD3" />
      </svg>
      <BrandName
        name={dict.brand.name}
        className="font-head text-lg font-semibold tracking-tight text-ink"
      />
    </Link>
  );
}

/**
 * The wordmark as real text.
 *
 * The question mark is the brand's one piece of personality, so it is set in
 * the action blue rather than left as grey punctuation — but it stays inside
 * the same text node it belongs to, never an image or a pseudo-element. That
 * keeps it selectable, searchable, resizable with the rest of the text, and
 * part of the accessible name wherever this is used without an aria-label.
 *
 * Splitting on a trailing '?' rather than hard-coding the Hebrew means the
 * English wordmark ("Yesh Klita", no question mark) renders correctly with no
 * branching at the call site.
 */
export function BrandName({ name, className }: { name: string; className?: string }) {
  const hasMark = name.endsWith('?');
  const base = hasMark ? name.slice(0, -1) : name;

  return (
    <span className={className}>
      {base}
      {hasMark ? <span className="text-brand">?</span> : null}
    </span>
  );
}
