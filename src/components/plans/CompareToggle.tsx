'use client';

import { cn } from '@/components/ui/cn';
import type { Dictionary } from '@/i18n/getDictionary';

/**
 * Selects a plan for side-by-side comparison.
 *
 * Once three are chosen the remaining checkboxes say so in visible text rather
 * than only in a tooltip, which a touch user never sees.
 */
export function CompareToggle({
  checked,
  disabled,
  onChange,
  dict,
  className,
}: {
  checked: boolean;
  disabled: boolean;
  onChange: (checked: boolean) => void;
  dict: Dictionary;
  className?: string;
}) {
  return (
    <label
      className={cn(
        'inline-flex min-h-11 items-center gap-2 text-sm',
        disabled ? 'cursor-not-allowed text-ink-3' : 'cursor-pointer text-ink-2',
        className,
      )}
      aria-label={disabled ? dict.compare.maxReached : undefined}
    >
      <input
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span
        aria-hidden="true"
        className={
          'relative size-5 shrink-0 rounded-[5px] border-2 border-line bg-surface ' +
          'peer-checked:border-brand peer-checked:bg-brand ' +
          'peer-focus-visible:outline peer-focus-visible:outline-2 ' +
          'peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand ' +
          'after:absolute after:start-[6px] after:top-[2px] after:hidden after:h-2.5 after:w-1.5 ' +
          'after:rotate-45 after:border-on-brand after:border-e-2 after:border-b-2 ' +
          'peer-checked:after:block'
        }
      />
      <span>
        {checked ? dict.compare.remove : disabled ? dict.plan.maxCompareShort : dict.plan.compareLabel}
      </span>
    </label>
  );
}
