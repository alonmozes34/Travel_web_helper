import type { Dictionary } from '@/i18n/getDictionary';
import { cn } from '@/components/ui/cn';

/**
 * Affiliate transparency. `inline` is the quiet strip that sits under results;
 * `full` is the complete statement used in the footer.
 *
 * Visible, never hidden, and always paired with the note that commission does
 * not affect ranking — which is enforced in the data model, not just claimed.
 */
export function AffiliateDisclosure({
  dict,
  variant = 'inline',
  className,
}: {
  dict: Dictionary;
  variant?: 'inline' | 'full';
  className?: string;
}) {
  if (variant === 'inline') {
    return (
      <p className={cn('text-[0.8125rem] text-ink-2', className)}>
        <strong className="font-semibold text-ink">{dict.disclosure.short}</strong>{' '}
        {dict.disclosure.full}
      </p>
    );
  }

  return (
    <div className={cn('text-[0.8125rem] leading-relaxed text-ink-2', className)}>
      <p className="font-semibold text-ink">{dict.disclosure.short}</p>
      <p className="mt-1">{dict.disclosure.full}</p>
      <p className="mt-1">{dict.disclosure.rankingNote}</p>
    </div>
  );
}
