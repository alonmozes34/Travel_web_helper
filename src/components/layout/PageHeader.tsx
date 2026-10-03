import type { ReactNode } from 'react';
import { Container } from '@/components/ui/Container';
import { cn } from '@/components/ui/cn';

/**
 * The top of every inner page, on the same night ground as the home page's
 * first screen, so the site keeps one look from page to page (the owner,
 * 3 October 2026: "keep the colours on every screen").
 *
 * Only the heading, the lead and a short note sit on the night ground, in the
 * two on-night tones that the contrast test covers. Anything a visitor fills
 * in or reads at length stays below, on the light page.
 */
export function PageHeader({
  title,
  intro,
  note,
  before,
  narrow = false,
}: {
  title: ReactNode;
  intro?: ReactNode;
  /** A dated or secondary line under the lead. */
  note?: ReactNode;
  /** Above the heading: a link back to the section the page belongs to. */
  before?: ReactNode;
  /** For a page read as one column of text, like the accessibility statement. */
  narrow?: boolean;
}) {
  return (
    <section className="on-night bg-hero text-on-night">
      <Container className={cn('py-12 md:py-16', narrow && 'max-w-[76ch]')}>
        {before ? <div className="mb-3 text-sm">{before}</div> : null}
        <h1 className="font-head text-3xl font-bold tracking-tight text-on-night sm:text-4xl md:text-5xl [overflow-wrap:anywhere]">
          {title}
        </h1>
        {intro ? <p className="mt-4 max-w-[70ch] text-lg text-on-night-2">{intro}</p> : null}
        {note ? <p className="mt-3 max-w-[70ch] text-sm text-on-night-2">{note}</p> : null}
      </Container>
    </section>
  );
}
