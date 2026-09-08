import type { ReactNode } from 'react';

/**
 * Isolates left-to-right content — prices, data amounts, codes — inside
 * right-to-left copy, so "₪59" and "8–14" never have their symbols or ranges
 * reordered by the bidirectional algorithm.
 *
 * It deliberately takes no `title`: a tooltip is invisible on touch and is not
 * reliably announced, so nothing a reader needs may live only there.
 */
export function Ltr({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <bdi dir="ltr" className={className}>
      {children}
    </bdi>
  );
}
