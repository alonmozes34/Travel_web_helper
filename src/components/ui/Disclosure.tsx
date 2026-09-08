import type { ReactNode } from 'react';
import { cn } from './cn';

/**
 * Expandable block built on <details>, so it works without JavaScript and is
 * findable by in-page browser search. Used for the FAQ and fair-usage notes.
 */
export function Disclosure({
  summary,
  children,
  className,
  defaultOpen = false,
}: {
  summary: ReactNode;
  children: ReactNode;
  className?: string;
  defaultOpen?: boolean;
}) {
  return (
    <details className={cn('group border-b border-line-soft', className)} open={defaultOpen}>
      <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 py-4 font-head font-semibold marker:content-none">
        <span className="flex-1">{summary}</span>
        <span
          aria-hidden="true"
          className="text-ink-3 transition-transform group-open:rotate-45"
        >
          ＋
        </span>
      </summary>
      <div className="pb-5 text-[0.9375rem] text-ink-2">{children}</div>
    </details>
  );
}
