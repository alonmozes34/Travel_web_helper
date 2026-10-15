import { countryTravelFacts, type CountryTravelFacts } from '@/data/countryFacts.generated';
import { localePath, type Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/getDictionary';
import { interpolate } from '@/i18n/interpolate';

/** The official warnings page, as `TravelFacts` links it. */
const NSC_TRAVEL_WARNINGS = 'https://www.nsc.gov.il/he/Travel-Warnings/Pages/default.aspx';

export type ChecklistItem = { id: string; text: string; href?: string; linkText?: string; external?: boolean };

/**
 * The "before you fly" list for a country (the owner, 15 October 2026): the
 * eSIM steps of the install guide, then what the country's facts call for.
 * Every country line comes from `countryFacts.generated.ts`; a fact the data
 * does not have adds no line, and Israel's own sockets and voltage come from
 * the same data, not from memory.
 */
export function tripChecklist(code: string, countryName: string, locale: Locale, dict: Dictionary): ChecklistItem[] {
  const t = dict.tripChecklist.items;
  const facts: CountryTravelFacts | undefined = countryTravelFacts[code];
  const home = countryTravelFacts.IL;
  const items: ChecklistItem[] = [
    { id: 'phone', text: t.phone, href: localePath(locale, '/devices'), linkText: t.phoneLink },
    { id: 'plan', text: t.plan },
    { id: 'install', text: t.install, href: localePath(locale, '/guides/install'), linkText: t.installLink },
    { id: 'roaming', text: t.roaming },
    { id: 'homeLine', text: t.homeLine },
    { id: 'keep', text: t.keep },
  ];
  if (facts?.plugs.length) {
    items.push({
      id: 'plugs',
      text: interpolate(t.plugsTemplate, {
        country: countryName,
        types: facts.plugs.join(', '),
        home: home?.plugs.join(', ') ?? '',
      }),
    });
  }
  // 220 V and 240 V run what 230 V runs; 100 V or 120 V is worth a look at the charger.
  const odd = facts?.voltages.filter((volts) => volts < 200 || volts > 250) ?? [];
  if (odd.length) items.push({ id: 'voltage', text: interpolate(t.voltageTemplate, { volts: odd.join('/') }) });
  if (facts?.driving && home?.driving && facts.driving !== home.driving) {
    items.push({ id: 'driving', text: facts.driving === 'left' ? t.drivingLeft : t.drivingRight });
  }
  if (facts?.emergency.length) {
    const numbers = [...new Set(facts.emergency.map((entry) => entry.number))].join(', ');
    items.push({ id: 'emergency', text: interpolate(t.emergencyTemplate, { numbers }) });
  }
  items.push({ id: 'warnings', text: t.warnings, href: NSC_TRAVEL_WARNINGS, linkText: t.warningsLink, external: true });
  items.push({ id: 'insurance', text: t.insurance });
  return items;
}
