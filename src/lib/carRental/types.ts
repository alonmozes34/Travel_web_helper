import type { CurrencyCode } from '@/i18n/config';

/**
 * Car rental, the first "trip extra".
 *
 * The shape below is deliberately the same shape of promise the eSIM
 * catalogue makes: one internal type, every affiliate network maps onto it,
 * and nothing downstream knows which network a row came from. Two rules are
 * carried in the types rather than in a comment nobody reads:
 *
 * 1. **A category is not a car.** Rental suppliers guarantee a class, not a
 *    model, so the model is `exampleModel` and is never presented without the
 *    "or similar" wording. A page that promises a Golf and delivers a Focus
 *    is the single most common complaint in this industry, and it would be
 *    our sentence that caused it.
 * 2. **Anything the network did not send is absent, not guessed.** `rating`,
 *    `exampleModel` and `imageUrl` are nullable and `unknown` is a real value
 *    for every policy field, because "we were not told" and "there is no
 *    limit" are different facts.
 */

export type RentalDataSource = 'demo' | 'api';

export type PickupKind = 'airport' | 'city' | 'train' | 'other';
export const pickupKinds: readonly PickupKind[] = ['airport', 'city', 'train', 'other'];

export function isPickupKind(value: string): value is PickupKind {
  return (pickupKinds as readonly string[]).includes(value);
}

/**
 * What the traveller is asking for.
 *
 * `countryCode` is the only field the eSIM search can fill. Everything else
 * is the traveller's, because the site has never known their dates or their
 * city — the trip profile stores a country and a number of days, nothing more.
 */
export type RentalQuery = {
  countryCode: string;
  /** Free text: a city, an airport, an address. Empty until answered. */
  pickupLocation: string;
  pickupKind: PickupKind;
  sameDropoff: boolean;
  /** Ignored while `sameDropoff` is true. */
  dropoffLocation: string;
  /** ISO dates and 24-hour times; empty strings mean unanswered. */
  pickupDate: string;
  pickupTime: string;
  dropoffDate: string;
  dropoffTime: string;
  driverAge: number;
};

export const carCategories = [
  'mini',
  'economy',
  'compact',
  'intermediate',
  'suv',
  'van',
  'luxury',
] as const;
export type CarCategory = (typeof carCategories)[number];

export type Transmission = 'automatic' | 'manual';
export type FuelPolicy = 'full-to-full' | 'full-to-empty' | 'same-to-same' | 'unknown';
export type MileagePolicy = 'unlimited' | 'limited' | 'unknown';
export type CancellationPolicy = 'free' | 'paid' | 'none' | 'unknown';
export type InsuranceNote = 'excess-applies' | 'basic-included' | 'unknown';

export type RentalOffer = {
  id: string;
  /** The affiliate network the row came through. */
  sourceId: string;
  /** The rental company, as the network named it. */
  supplierName: string;
  category: CarCategory;
  /** Presented only as "<model> or similar". Null when none was supplied. */
  exampleModel: string | null;
  imageUrl: string | null;
  seats: number;
  bags: number;
  transmission: Transmission;
  fuelPolicy: FuelPolicy;
  mileagePolicy: MileagePolicy;
  /** Free text from the network: "Terminal 1, shuttle bus". */
  pickupDescription: string;
  cancellation: CancellationPolicy;
  insurance: InsuranceNote;
  currency: CurrencyCode;
  totalPriceMinor: number;
  rentalDays: number;
  /** Only when the network supplies one. Never computed to look fuller. */
  rating: { score: number; outOf: number; count: number | null } | null;
  bookingUrl: string | null;
  source: RentalDataSource;
};

/** Derived, so a row can never disagree with itself. */
export function pricePerDayMinor(offer: RentalOffer): number {
  if (offer.rentalDays <= 0) return offer.totalPriceMinor;
  return Math.round(offer.totalPriceMinor / offer.rentalDays);
}

export const rentalSkipReasons = [
  'missing-price',
  'unsupported-currency',
  'unknown-category',
  'missing-link',
  'no-availability',
] as const;
export type RentalSkipReason = (typeof rentalSkipReasons)[number];

export type SkippedOffer = {
  externalId: string;
  label: string;
  reason: RentalSkipReason;
  detail: string;
};

export type RentalSearchResult = {
  sourceId: string;
  offers: RentalOffer[];
  /** Reported rather than silenced, exactly as `ProviderSource` does. */
  skipped: SkippedOffer[];
  searchedAt: string;
};

/**
 * An affiliate network that can be asked for cars.
 *
 * `isConfigured` is what keeps DiscoverCars and Ofran from being hard-coded
 * in: an adapter ships with the code, stays unconfigured until its
 * credentials exist in the environment, and is simply not queried until then.
 * Adding a network is a new file and one registry entry — no UI changes.
 */
export type RentalSource = {
  id: string;
  label: string;
  isConfigured(): boolean;
  search(query: RentalQuery): Promise<RentalSearchResult>;
};
