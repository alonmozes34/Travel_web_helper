'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/components/ui/cn';

/**
 * Copies a discount code, and says so where a screen reader hears it.
 *
 * The clipboard API needs a secure page and a user's click, both of which it
 * has here; where it is refused anyway (an old browser, a locked-down
 * embedded view) the code is selected instead, so a long-press copies it.
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function CopyCodeButton({
  code,
  label,
  copiedLabel,
  className,
}: {
  code: string;
  label: string;
  copiedLabel: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2500);
    return () => window.clearTimeout(timer);
  }, [copied]);

  return (
    <>
      <button
        type="button"
        onClick={async () => setCopied(await copyText(code))}
        className={cn(
          'inline-flex min-h-11 items-center justify-center gap-1.5 rounded-sm border border-teal-ink bg-surface px-3 text-sm font-semibold text-teal-ink hover:bg-teal-50',
          className,
        )}
      >
        <span aria-hidden="true">{copied ? '✓' : '⧉'}</span>
        {copied ? copiedLabel : label}
      </button>
      <span className="sr-only" aria-live="polite">
        {copied ? copiedLabel : ''}
      </span>
    </>
  );
}
