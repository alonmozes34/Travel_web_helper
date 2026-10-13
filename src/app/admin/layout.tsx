import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import '../globals.css';

/**
 * The owner's dashboard has a page of its own (the owner, 13 October 2026):
 * none of the site's header, footer or counting, so opening it never adds to
 * the numbers it shows. The password is checked in `src/proxy.ts`.
 */
export const metadata: Metadata = {
  title: 'לוח נתונים | יש קליטה?',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { colorScheme: 'light' };

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="he" dir="rtl" className="h-full">
      <body className="min-h-full bg-canvas text-ink">{children}</body>
    </html>
  );
}
