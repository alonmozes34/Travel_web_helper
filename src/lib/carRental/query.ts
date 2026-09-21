import { getCountryByCode } from '@/data/countries';
import { isPickupKind, type RentalQuery } from './types';

/**
 * The rental query, and how it survives being carried in a URL.
 *
 * It travels in the address bar for the same reason the trip profile does:
 * the offer opens the search in a new tab, and a new tab shares nothing with
 * the old one except the link between them. A query in the URL is also a
 * query somebody can send to whoever is driving.
 */

export const MIN_DRIVER_AGE = 18;
export const MAX_DRIVER_AGE = 99;
export const DEFAULT_DRIVER_AGE = 30;

/** How far ahead the form opens. A form default, not something we know. */
const DEFAULT_LEAD_DAYS = 7;
const DEFAULT_TRIP_DAYS = 7;

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(date: string, days: number): string {
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return date;
  parsed.setUTCDate(parsed.getUTCDate() + days);
  return isoDate(parsed);
}

/**
 * What the form opens with after an eSIM was chosen.
 *
 * The country is the one thing carried over; the dates are defaults the
 * traveller edits, and the gap between them is the trip length they already
 * told us, which is the only part of this that is actually theirs.
 */
export function defaultRentalQuery(
  countryCode: string,
  tripDays: number | undefined,
  today = new Date(),
): RentalQuery {
  const days = Number.isFinite(tripDays) && (tripDays ?? 0) > 0 ? Math.min(tripDays!, 90) : DEFAULT_TRIP_DAYS;
  const pickupDate = addDays(isoDate(today), DEFAULT_LEAD_DAYS);
  return {
    countryCode: getCountryByCode(countryCode) ? countryCode : '',
    pickupLocation: '',
    pickupKind: 'airport',
    sameDropoff: true,
    dropoffLocation: '',
    pickupDate,
    pickupTime: '10:00',
    dropoffDate: addDays(pickupDate, days),
    dropoffTime: '10:00',
    driverAge: DEFAULT_DRIVER_AGE,
  };
}

/** How many days the rental runs. Never below one — a same-day hire is a day. */
export function rentalDays(query: RentalQuery): number {
  if (!query.pickupDate || !query.dropoffDate) return 0;
  const from = new Date(`${query.pickupDate}T00:00:00Z`).getTime();
  const until = new Date(`${query.dropoffDate}T00:00:00Z`).getTime();
  if (Number.isNaN(from) || Number.isNaN(until)) return 0;
  const diff = Math.round((until - from) / 86_400_000);
  return diff > 0 ? diff : 1;
}

/**
 * Whether there is enough to search with.
 *
 * A country alone is not enough and the page says so rather than guessing a
 * city: a traveller sent to the wrong airport is worse served than one asked
 * one more question.
 */
export function isSearchable(query: RentalQuery): boolean {
  if (!query.countryCode) return false;
  if (!query.pickupLocation.trim()) return false;
  if (!query.pickupDate || !query.dropoffDate) return false;
  if (!query.sameDropoff && !query.dropoffLocation.trim()) return false;
  if (query.dropoffDate < query.pickupDate) return false;
  return true;
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^\d{2}:\d{2}$/;

function first(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

/** Trims free text so a 10,000-character "city" cannot reach a network. */
function text(value: string): string {
  return value.trim().slice(0, 120);
}

export function rentalQueryFromParams(
  params: Record<string, string | string[] | undefined>,
  today = new Date(),
): RentalQuery {
  const country = first(params.country).toUpperCase();
  const base = defaultRentalQuery(country, undefined, today);

  const kind = first(params.kind);
  const pickupDate = first(params.from);
  const dropoffDate = first(params.until);
  const age = Number.parseInt(first(params.age), 10);

  const query: RentalQuery = {
    ...base,
    pickupLocation: text(first(params.pickup)),
    pickupKind: isPickupKind(kind) ? kind : base.pickupKind,
    // A checkbox sends nothing when unticked, so the parameter names the
    // *exception* — `diff=1` — and its absence means the ordinary case. That
    // keeps the form working with a plain GET and no JavaScript.
    sameDropoff: first(params.diff) !== '1',
    dropoffLocation: text(first(params.dropoff)),
    pickupDate: DATE.test(pickupDate) ? pickupDate : base.pickupDate,
    pickupTime: TIME.test(first(params.fromTime)) ? first(params.fromTime) : base.pickupTime,
    dropoffDate: DATE.test(dropoffDate) ? dropoffDate : base.dropoffDate,
    dropoffTime: TIME.test(first(params.untilTime)) ? first(params.untilTime) : base.dropoffTime,
    driverAge:
      Number.isFinite(age) && age >= MIN_DRIVER_AGE && age <= MAX_DRIVER_AGE ? age : base.driverAge,
  };

  // A drop-off before the pick-up is the one combination the form cannot
  // render sensibly, and a URL is not a form — it arrives however it arrives.
  if (query.dropoffDate < query.pickupDate) {
    query.dropoffDate = addDays(query.pickupDate, 1);
  }
  return query;
}

export function rentalQueryToParams(query: RentalQuery): string {
  const params = new URLSearchParams();
  if (query.countryCode) params.set('country', query.countryCode);
  if (query.pickupLocation) params.set('pickup', query.pickupLocation);
  params.set('kind', query.pickupKind);
  if (!query.sameDropoff) {
    params.set('diff', '1');
    if (query.dropoffLocation) params.set('dropoff', query.dropoffLocation);
  }
  params.set('from', query.pickupDate);
  params.set('fromTime', query.pickupTime);
  params.set('until', query.dropoffDate);
  params.set('untilTime', query.dropoffTime);
  params.set('age', String(query.driverAge));
  return `?${params.toString()}`;
}
