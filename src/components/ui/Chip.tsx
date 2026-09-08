import type { ButtonHTMLAttributes, ReactNode } from 'react';
import Link from 'next/link';
import { cn } from './cn';

const chipBase =
  'inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3.5 text-[0.8125rem] ' +
  'transition-colors';
const chipIdle = 'border-line bg-surface text-ink hover:border-brand hover:text-brand';
const chipActive = 'border-brand bg-brand-50 font-semibold text-brand';

/** Toggle chip used for destinations, trip length and usage level. */
export function Chip({
  selected = false,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { selected?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(chipBase, selected ? chipActive : chipIdle, className)}
      {...props}
    />
  );
}

/** Navigational variant — e.g. the popular-destination shortcuts. */
export function ChipLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className={cn(chipBase, chipIdle, className)}>
      {children}
    </Link>
  );
}
