import type { ReactNode } from 'react';
import { cn } from './cn';

export type BadgeTone = 'neutral' | 'brand' | 'value' | 'warn';

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-surface border-line text-ink-2',
  brand: 'bg-brand-50 border-transparent text-brand',
  // Turquoise is reserved for value and recommendation.
  value: 'bg-teal-50 border-transparent text-teal-ink',
  warn: 'bg-warn-50 border-transparent text-warn-ink',
};

/** Small, non-interactive label: "5G", "הכי משתלם", "נתוני הדגמה". */
export function Badge({
  tone = 'neutral',
  children,
  className,
}: {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-sm border px-2.5 py-1 text-sm font-semibold',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
