import { deviceGroups, type DeviceGroup } from '@/data/devices';

/**
 * Searching the device list.
 *
 * The list is long enough that scrolling it is the wrong way to answer "does
 * my phone do this", so the page filters as you type. Three details decide
 * whether that filter actually finds anything:
 *
 *  - Hebrew readers type Hebrew. Somebody looking for an iPhone 13 on a
 *    Hebrew-first site types "אייפון 13", and a filter that only speaks Latin
 *    returns nothing and reads as "your phone is not supported" — the exact
 *    wrong answer. `ALIASES` maps the Hebrew spellings onto the Latin brand
 *    names the manufacturers use.
 *  - People type "iphone13" and "s21 plus" as often as "iPhone 13" and
 *    "Galaxy S21+", so a digit stuck to a word is split and "+" is spelled
 *    out, on both sides of the comparison.
 *  - Nothing here decides support. It only filters names; the answer still
 *    comes from the manufacturer's own list.
 */

const ALIASES: ReadonlyArray<[RegExp, string]> = [
  [/אייפון|אייפן/g, 'iphone'],
  [/אייפד|איפד/g, 'ipad'],
  [/אפל/g, 'apple'],
  [/גלקסי|גלאקסי/g, 'galaxy'],
  [/סמסונג/g, 'samsung'],
  [/פיקסל/g, 'pixel'],
  [/גוגל/g, 'google'],
  [/נוט/g, 'note'],
  [/טאב/g, 'tab'],
];

/**
 * Lower-cases, spells "+" out, and splits a digit from the word in front of
 * it. Applied to the stored model name and to what was typed, so the two
 * meet in the same shape: "Galaxy S21+" and "galaxy s21 plus" both become
 * "galaxy s 21 plus".
 */
export function normaliseDeviceText(value: string): string {
  let text = value.toLowerCase();
  for (const [pattern, replacement] of ALIASES) text = text.replace(pattern, ` ${replacement} `);
  return text
    .replace(/\+/g, ' plus ')
    .replace(/([a-z])(\d)/g, '$1 $2')
    .replace(/[^a-z0-9֐-׿]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export type DeviceMatch = { group: DeviceGroup; models: readonly string[] };

/**
 * Groups that still have at least one matching model, in the order the data
 * file lists them. An empty query returns everything rather than nothing:
 * the page opens showing the whole list, so the reader can browse when they
 * do not know what their model is called.
 */
export function findDevices(query: string, groups: readonly DeviceGroup[] = deviceGroups): DeviceMatch[] {
  const needle = normaliseDeviceText(query);
  if (!needle) return groups.map((group) => ({ group, models: group.models }));

  const matches: DeviceMatch[] = [];
  for (const group of groups) {
    const models = group.models.filter((model) => normaliseDeviceText(model).includes(needle));
    if (models.length > 0) matches.push({ group, models });
  }
  return matches;
}

/** How many model names a match list holds, for the "n results" line. */
export function countMatchedModels(matches: readonly DeviceMatch[]): number {
  return matches.reduce((total, match) => total + match.models.length, 0);
}
