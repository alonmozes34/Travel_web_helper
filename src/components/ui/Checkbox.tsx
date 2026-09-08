'use client';

import type { InputHTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';

/**
 * A real checkbox input with a styled box, so keyboard and screen-reader
 * behaviour comes from the platform rather than from us.
 */
export function Checkbox({
  label,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode }) {
  return (
    <label
      className={cn(
        'group flex min-h-11 cursor-pointer items-center gap-2.5 text-[0.8125rem] text-ink-2',
        className,
      )}
    >
      <input type="checkbox" className="peer sr-only" {...props} />
      <span
        aria-hidden="true"
        className={
          'relative size-4 shrink-0 rounded-[4px] border-[1.5px] border-line bg-surface ' +
          'peer-checked:border-brand peer-checked:bg-brand ' +
          'peer-focus-visible:outline peer-focus-visible:outline-2 ' +
          'peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand ' +
          "after:absolute after:start-[5px] after:top-[1px] after:hidden after:h-2 after:w-1 " +
          'after:rotate-45 after:border-on-brand after:border-e-2 after:border-b-2 ' +
          'peer-checked:after:block'
        }
      />
      <span className="peer-checked:text-ink">{label}</span>
    </label>
  );
}
