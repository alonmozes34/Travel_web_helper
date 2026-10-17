import type { Dictionary } from '@/i18n/getDictionary';
import { interpolate } from '@/i18n/interpolate';
import type { Combination } from './buildCombination';

/**
 * "Three separate purchases from two providers": counted from the legs. It
 * said "two purchases from two providers" whatever the card held, and a trip
 * across three continents is the trip that gets three plans, two of them
 * sometimes from the same provider.
 */
export function purchasesNote(combination: Pick<Combination, 'legs'>, dict: Dictionary): string {
  const copy = dict.combination;
  const legs = combination.legs.length;
  const providers = new Set(combination.legs.map((leg) => leg.plan.providerId)).size;
  return interpolate(copy.noteTemplate, {
    purchases: legs === 2 ? copy.purchasesTwo : interpolate(copy.purchasesTemplate, { count: legs }),
    providers:
      providers === 1
        ? copy.providersOne
        : providers === 2
          ? copy.providersTwo
          : interpolate(copy.providersTemplate, { count: providers }),
  });
}
