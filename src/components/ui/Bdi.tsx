import type { ReactNode } from 'react';

/**
 * Isolates left-to-right content — prices, data amounts, codes — inside
 * right-to-left copy, so "₪59" and "#0B6BD3" never have their symbol pushed
 * to the wrong end by the bidirectional algorithm.
 */
export function Ltr({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <bdi dir="ltr" className={className}>
      {children}
    </bdi>
  );
}
