'use client';

import { cn } from '@/components/ui/cn';
import type { Dictionary } from '@/i18n/getDictionary';

/** Selects a plan for side-by-side comparison. Disabled once three are chosen. */
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
        'inline-flex min-h-11 items-center gap-2 text-[0.8125rem]',
        disabled ? 'cursor-not-allowed text-ink-3' : 'cursor-pointer text-ink-2',
        className,
      )}
      title={disabled ? dict.compare.maxReached : undefined}
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
          'relative size-4 shrink-0 rounded-[4px] border-[1.5px] border-line bg-surface ' +
          'peer-checked:border-brand peer-checked:bg-brand ' +
          'peer-focus-visible:outline peer-focus-visible:outline-2 ' +
          'peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand ' +
          'after:absolute after:start-[5px] after:top-[1px] after:hidden after:h-2 after:w-1 ' +
          'after:rotate-45 after:border-on-brand after:border-e-2 after:border-b-2 ' +
          'peer-checked:after:block'
        }
      />
      <span>{checked ? dict.compare.remove : dict.plan.compareLabel}</span>
    </label>
  );
}
