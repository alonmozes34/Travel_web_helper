'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { count, referrerHost } from '@/lib/stats/client';

/** Whether the next page counted is the first of this load. */
let firstOfLoad = true;

/**
 * Counts each page shown, once: on arriving and on every move inside the
 * site. The first page of a load opened from outside the site is a visit, and
 * names where the visitor came from — the referring site's name only.
 *
 * The address is read from the window, not from the router: behind the
 * proxy's rewrite the two can differ, and the window is what the visitor saw.
 * A page that does not exist says so with `data-page-missing`, and is counted
 * as a 404 rather than under the address somebody typed.
 */
export function PageCount() {
  const pathname = usePathname();
  useEffect(() => {
    const first = firstOfLoad;
    firstOfLoad = false;
    const ref = first ? referrerHost() : null;
    count({
      e: 'view',
      path: window.location.pathname,
      entry: first && ref !== window.location.host,
      ref,
      notFound: document.querySelector('[data-page-missing]') !== null,
    });
  }, [pathname]);
  return null;
}
