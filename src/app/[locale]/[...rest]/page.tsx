import { notFound } from 'next/navigation';

/**
 * Any address under a locale that no page answers. Without this, Next served
 * its own bare 404 — no header, no footer, none of the site — because an
 * unmatched URL never reaches a segment's `not-found`. Calling notFound()
 * from here renders `[locale]/not-found.tsx` inside the site's layout, with
 * the 404 status intact.
 */
export default function UnknownPage() {
  notFound();
}
