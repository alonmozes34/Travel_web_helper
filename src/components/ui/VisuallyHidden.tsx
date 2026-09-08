import type { ReactNode } from 'react';

/** Content available to screen readers but not shown visually. */
export function VisuallyHidden({ children }: { children: ReactNode }) {
  return <span className="sr-only">{children}</span>;
}
