'use client';

import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { count } from '@/lib/stats/client';
import type { StatEvent } from '@/lib/stats/events';

/**
 * A link from a server-rendered page that adds one to the site's own count as
 * it is followed. The link itself is untouched: the same address, nothing
 * added to it.
 */
export function CountedLink({
  event,
  children,
  ...anchor
}: AnchorHTMLAttributes<HTMLAnchorElement> & { event: StatEvent; children: ReactNode }) {
  return (
    <a {...anchor} onClick={() => count(event)}>
      {children}
    </a>
  );
}
