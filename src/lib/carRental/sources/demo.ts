import type {
  CarCategory,
  RentalOffer,
  RentalQuery,
  RentalSearchResult,
  RentalSource,
} from '../types';
import { rentalDays } from '../query';

/**
 * Demo offers, for building and demonstrating the flow before a network is
 * connected.
 *
 * The supplier names are deliberately not real rental companies, for exactly
 * the reason the eSIM catalogue stopped naming real providers: a public page
 * stating what Hertz charges, where the number is invented, is a false claim
 * about somebody else's commercial terms, and a banner does not cure it.
 * "Demo Rentals Alpha" misrepresents nobody.
 *
 * Results are derived from the query rather than randomised, so the same
 * search returns the same cars twice running. A comparison that reshuffles on
 * reload teaches a visitor not to trust it.
 */

const DEMO_SOURCE_ID = 'demo-rentals';

type Template = {
  supplierName: string;
  category: CarCategory;
  exampleModel: string | null;
  seats: number;
  bags: number;
  transmission: 'automatic' | 'manual';
  /** Per day, in minor units of EUR, before the query-derived adjustment. */
  baseDayMinor: number;
  fuelPolicy: RentalOffer['fuelPolicy'];
  mileagePolicy: RentalOffer['mileagePolicy'];
  cancellation: RentalOffer['cancellation'];
  insurance: RentalOffer['insurance'];
  rating: RentalOffer['rating'];
};

const TEMPLATES: readonly Template[] = [
  {
    supplierName: 'Demo Rentals Alpha',
    category: 'economy',
    exampleModel: 'Demo Hatch 1.0',
    seats: 5,
    bags: 1,
    transmission: 'manual',
    baseDayMinor: 2400,
    fuelPolicy: 'full-to-full',
    mileagePolicy: 'unlimited',
    cancellation: 'free',
    insurance: 'excess-applies',
    rating: { score: 8.1, outOf: 10, count: 412 },
  },
  {
    supplierName: 'Demo Rentals Beta',
    category: 'compact',
    exampleModel: 'Demo Compact 1.4',
    seats: 5,
    bags: 2,
    transmission: 'automatic',
    baseDayMinor: 3150,
    fuelPolicy: 'full-to-full',
    mileagePolicy: 'unlimited',
    cancellation: 'free',
    insurance: 'excess-applies',
    rating: { score: 7.6, outOf: 10, count: 188 },
  },
  {
    supplierName: 'Demo Rentals Gamma',
    category: 'mini',
    exampleModel: null,
    seats: 4,
    bags: 1,
    transmission: 'manual',
    baseDayMinor: 1950,
    fuelPolicy: 'same-to-same',
    mileagePolicy: 'limited',
    cancellation: 'paid',
    insurance: 'basic-included',
    // Not every network sends a rating, and an absent one stays absent.
    rating: null,
  },
  {
    supplierName: 'Demo Rentals Delta',
    category: 'intermediate',
    exampleModel: 'Demo Estate 1.6',
    seats: 5,
    bags: 3,
    transmission: 'automatic',
    baseDayMinor: 4100,
    fuelPolicy: 'full-to-full',
    mileagePolicy: 'unlimited',
    cancellation: 'free',
    insurance: 'excess-applies',
    rating: { score: 8.8, outOf: 10, count: 1034 },
  },
  {
    supplierName: 'Demo Rentals Epsilon',
    category: 'suv',
    exampleModel: 'Demo Crossover',
    seats: 5,
    bags: 3,
    transmission: 'automatic',
    baseDayMinor: 5600,
    fuelPolicy: 'full-to-empty',
    mileagePolicy: 'limited',
    cancellation: 'none',
    insurance: 'unknown',
    rating: { score: 7.1, outOf: 10, count: 96 },
  },
  {
    supplierName: 'Demo Rentals Zeta',
    category: 'van',
    exampleModel: 'Demo Van 7',
    seats: 7,
    bags: 4,
    transmission: 'manual',
    baseDayMinor: 6900,
    fuelPolicy: 'full-to-full',
    mileagePolicy: 'unlimited',
    cancellation: 'free',
    insurance: 'excess-applies',
    rating: { score: 8.3, outOf: 10, count: 57 },
  },
];

/** Stable, seeded only by the query, so the same search is the same page. */
function seedFrom(query: RentalQuery): number {
  const text = `${query.countryCode}|${query.pickupLocation.toLowerCase()}|${query.pickupKind}|${query.pickupDate}`;
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) | 0;
  }
  return Math.abs(hash);
}

const PICKUP_DESCRIPTIONS: Record<RentalQuery['pickupKind'], string> = {
  airport: 'Airport terminal · shuttle bus',
  city: 'City centre desk',
  train: 'Train station desk',
  other: 'Meet and greet',
};

export const demoRentalSource: RentalSource = {
  id: DEMO_SOURCE_ID,
  label: 'Demo rentals',
  // Always available: it is what the page runs on until a network is live.
  isConfigured: () => true,

  async search(query: RentalQuery): Promise<RentalSearchResult> {
    const days = rentalDays(query);
    const seed = seedFrom(query);
    const searchedAt = new Date().toISOString();

    if (days <= 0) {
      return { sourceId: DEMO_SOURCE_ID, offers: [], skipped: [], searchedAt };
    }

    const offers: RentalOffer[] = TEMPLATES.map((template, index): RentalOffer => {
      // A small, deterministic spread so the list is not a straight line.
      const swing = ((seed >> (index * 2)) % 17) - 8;
      const perDay = Math.max(900, template.baseDayMinor + swing * 45);
      // Longer hires cost less per day, which is how this market really works.
      const lengthFactor = days >= 7 ? 0.88 : days >= 4 ? 0.95 : 1;
      const total = Math.round(perDay * days * lengthFactor);
      const young = query.driverAge < 25 ? Math.round(total * 0.18) : 0;

      return {
        id: `${DEMO_SOURCE_ID}-${index}`,
        sourceId: DEMO_SOURCE_ID,
        supplierName: template.supplierName,
        category: template.category,
        exampleModel: template.exampleModel,
        imageUrl: null,
        seats: template.seats,
        bags: template.bags,
        transmission: template.transmission,
        fuelPolicy: template.fuelPolicy,
        mileagePolicy: template.mileagePolicy,
        pickupDescription: PICKUP_DESCRIPTIONS[query.pickupKind],
        cancellation: template.cancellation,
        insurance: template.insurance,
        currency: 'EUR',
        totalPriceMinor: total + young,
        rentalDays: days,
        rating: template.rating,
        // No link, because there is nothing real to link to. The card says so
        // rather than sending anybody to a page that does not exist.
        bookingUrl: null,
        source: 'demo',
      };
    }).sort((a, b) => a.totalPriceMinor - b.totalPriceMinor);

    return { sourceId: DEMO_SOURCE_ID, offers, skipped: [], searchedAt };
  },
};
