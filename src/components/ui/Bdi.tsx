import type { ReactNode } from 'react';

/**
 * Isolates left-to-right content — prices, data amounts, codes — inside
 * right-to-left copy, so "₪59" and "8–14" never have their symbols or ranges
 * reordered by the bidirectional algorithm.
 */
export function Ltr({
  children,
  className,
  title,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <bdi dir="ltr" className={className} title={title}>
      {children}
    </bdi>
  );
}
