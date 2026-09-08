'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Sheet } from '@/components/ui/Sheet';
import type { NavLink } from './navLinks';

export function MobileMenu({
  links,
  openLabel,
  closeLabel,
  title,
}: {
  links: NavLink[];
  openLabel: string;
  closeLabel: string;
  title: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        className="inline-flex size-11 items-center justify-center rounded-sm border border-line bg-surface md:hidden"
      >
        <span aria-hidden="true" className="flex flex-col gap-[3px]">
          <span className="block h-0.5 w-[17px] rounded-sm bg-ink-2" />
          <span className="block h-0.5 w-[17px] rounded-sm bg-ink-2" />
          <span className="block h-0.5 w-[17px] rounded-sm bg-ink-2" />
        </span>
        <span className="sr-only">{openLabel}</span>
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} title={title} closeLabel={closeLabel}>
        <ul className="flex flex-col">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                onClick={() => setOpen(false)}
                className="flex min-h-14 items-center border-b border-line-soft font-head font-semibold text-ink"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </Sheet>
    </>
  );
}
