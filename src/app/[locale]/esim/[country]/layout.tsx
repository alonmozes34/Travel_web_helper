import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { getCountryBySlug } from '@/data/countries';

/**
 * Checks the country before anything is sent.
 *
 * The loading screen beside this file goes out the moment a page is asked
 * for, and once it has, the response is a 200 whatever the page decides next.
 * An unknown country has to be turned away here, above it, or
 * `/esim/not-a-country` answers 200 with a "not found" page inside it — a soft
 * 404, which a search engine indexes as a real page.
 */
export default async function CountryLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string; country: string }>;
}) {
  const { country } = await params;
  if (!getCountryBySlug(country)) notFound();
  return children;
}
