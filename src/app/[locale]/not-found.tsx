'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Container } from '@/components/ui/Container';

/**
 * The page for an address that does not exist, in the site's own look.
 *
 * A not-found page receives no route parameters, so the language is read
 * from the address: English pages live under /en, Hebrew ones at the root.
 * The copy is here rather than in the dictionaries so the whole dictionary
 * is not shipped to the browser for four sentences.
 */
const copy = {
  he: {
    code: 'שגיאה 404',
    title: 'לא מצאנו את העמוד הזה',
    body: 'ייתכן שהקישור ישן, או שנפלה בו טעות הקלדה. אפשר להתחיל מחדש מאחד המקומות האלה:',
    home: 'לעמוד הבית',
    destinations: 'לכל היעדים',
  },
  en: {
    code: 'Error 404',
    title: 'We could not find that page',
    body: 'The link may be old, or it may have a typo in it. You can start again from one of these:',
    home: 'Home page',
    destinations: 'All destinations',
  },
} as const;

export default function NotFound() {
  const pathname = usePathname() ?? '/';
  const english = pathname === '/en' || pathname.startsWith('/en/');
  const t = english ? copy.en : copy.he;
  const prefix = english ? '/en' : '';

  return (
    <section className="on-night bg-hero text-on-night">
      <Container className="py-16 md:py-24">
        <p className="font-head text-sm font-semibold tracking-wide text-sky">{t.code}</p>
        <h1 className="mt-2 font-head text-4xl font-bold tracking-tight text-on-night md:text-5xl">{t.title}</h1>
        <p className="mt-4 max-w-[60ch] text-lg text-on-night-2">{t.body}</p>
        <ul className="mt-8 flex flex-wrap gap-3">
          <li>
            <Link
              href={prefix || '/'}
              className="inline-flex min-h-11 items-center rounded-full bg-surface px-5 font-semibold text-ink"
            >
              {t.home}
            </Link>
          </li>
          <li>
            <Link
              href={`${prefix}/esim`}
              className="inline-flex min-h-11 items-center rounded-full border border-white/30 px-5 font-semibold text-on-night"
            >
              {t.destinations}
            </Link>
          </li>
        </ul>
      </Container>
    </section>
  );
}
