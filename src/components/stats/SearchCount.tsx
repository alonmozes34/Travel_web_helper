'use client';

import { useEffect } from 'react';
import { count } from '@/lib/stats/client';
import type { StatEvent } from '@/lib/stats/events';

type Search = Omit<Extract<StatEvent, { e: 'search' }>, 'e'>;

/**
 * Counts a results page once per trip asked about: where to, for how long
 * when the traveller said, how they use their phone, and whether anything
 * answered. Filtering and sorting the list do not count again — they change
 * the address without asking the server for a new page.
 */
export function SearchCount(search: Search) {
  // One string, so a new render of the same trip is not a new search.
  const trip = JSON.stringify(search);
  useEffect(() => {
    count({ e: 'search', ...(JSON.parse(trip) as Search) });
  }, [trip]);
  return null;
}
