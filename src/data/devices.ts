/**
 * Which devices can hold an eSIM.
 *
 * This is the one question that stops a purchase before it starts, and it is
 * also the one where a wrong answer costs a reader money: someone who buys a
 * travel eSIM for a phone that cannot install it has bought nothing.
 *
 * So every model name and every caveat below is copied from the
 * manufacturer's own support page — the pages in `deviceSources` — rather
 * than from memory or from a reseller's marketing list. Nothing here is
 * inferred. Where a manufacturer states a rule instead of a list ("iPhone XS,
 * iPhone XS Max, iPhone XR, or later"), the rule is carried in the dictionary
 * alongside the list, because the rule outlives the list.
 *
 * `checkedOn` is the date the page was read. It is shown to the reader,
 * because a device list that silently ages is worse than one that admits how
 * old it is. When a new model ships, this file is stale and says so.
 *
 * The lists are deliberately not the product's promise. Every manufacturer
 * here except Apple states that a device on the list may still lack eSIM
 * depending on where it was bought, so the page leads with the on-device
 * check and treats these lists as orientation.
 */

export type DeviceBrand = 'apple' | 'samsung' | 'google';

export type DeviceKind = 'phone' | 'tablet';

/**
 * Whether a group can hold an eSIM.
 *
 *  - `yes`      the manufacturer lists it as supported
 *  - `regional` supported, but the manufacturer says availability depends on
 *               where the device was bought
 *  - `no`       outside the manufacturer's stated support
 *
 * `regional` is a separate state rather than a footnote on `yes` because it
 * changes what the reader should do: check the device before buying a plan.
 */
export type DeviceSupport = 'yes' | 'regional' | 'no';

export type DeviceSourceId = 'appleIphone' | 'appleIpad' | 'appleModels' | 'samsung' | 'pixel';

export type DeviceNoteKey =
  | 'chinaMainland'
  | 'hongKongMacao'
  | 'samsungOrigin'
  | 'samsungARegion'
  | 'pixelDualEsim'
  | 'pixelOutsideRule';

export type DeviceGroup = {
  id: string;
  brand: DeviceBrand;
  kind: DeviceKind;
  support: DeviceSupport;
  /**
   * Model names exactly as the manufacturer writes them, in Latin script in
   * both locales — Apple and Samsung do not translate them, and a reader
   * matching the name on their box needs the name on their box.
   */
  models: readonly string[];
  notes: readonly DeviceNoteKey[];
  sources: readonly DeviceSourceId[];
};

export const deviceSources: Record<DeviceSourceId, { url: string; checkedOn: string }> = {
  appleIphone: { url: 'https://support.apple.com/en-us/118669', checkedOn: '2026-09-20' },
  appleIpad: { url: 'https://support.apple.com/en-us/119592', checkedOn: '2026-09-20' },
  appleModels: { url: 'https://support.apple.com/en-us/108044', checkedOn: '2026-09-20' },
  samsung: {
    url: 'https://www.samsung.com/uk/support/mobile-devices/galaxy-esim-and-supported-network-carriers/',
    checkedOn: '2026-09-20',
  },
  pixel: { url: 'https://support.google.com/pixelphone/answer/9449293', checkedOn: '2026-09-20' },
};

export const deviceGroups: readonly DeviceGroup[] = [
  {
    id: 'apple-iphone-supported',
    brand: 'apple',
    kind: 'phone',
    support: 'yes',
    models: [
      'iPhone XR',
      'iPhone XS',
      'iPhone XS Max',
      'iPhone 11',
      'iPhone 11 Pro',
      'iPhone 11 Pro Max',
      'iPhone SE (2nd generation)',
      'iPhone 12 mini',
      'iPhone 12',
      'iPhone 12 Pro',
      'iPhone 12 Pro Max',
      'iPhone 13 mini',
      'iPhone 13',
      'iPhone 13 Pro',
      'iPhone 13 Pro Max',
      'iPhone SE (3rd generation)',
      'iPhone 14',
      'iPhone 14 Plus',
      'iPhone 14 Pro',
      'iPhone 14 Pro Max',
      'iPhone 15',
      'iPhone 15 Plus',
      'iPhone 15 Pro',
      'iPhone 15 Pro Max',
      'iPhone 16e',
      'iPhone 16',
      'iPhone 16 Plus',
      'iPhone 16 Pro',
      'iPhone 16 Pro Max',
      'iPhone 17e',
      'iPhone 17',
      'iPhone 17 Pro',
      'iPhone 17 Pro Max',
      'iPhone Air',
      'iPhone 18 Pro',
      'iPhone 18 Pro Max',
    ],
    notes: ['chinaMainland', 'hongKongMacao'],
    sources: ['appleIphone', 'appleModels'],
  },
  {
    id: 'apple-iphone-unsupported',
    brand: 'apple',
    kind: 'phone',
    support: 'no',
    models: [
      'iPhone X',
      'iPhone 8',
      'iPhone 8 Plus',
      'iPhone 7',
      'iPhone 7 Plus',
      'iPhone SE (1st generation)',
      'iPhone 6s',
      'iPhone 6s Plus',
      'iPhone 6',
      'iPhone 6 Plus',
      'iPhone 5s',
      'iPhone 5c',
      'iPhone 5',
    ],
    notes: [],
    sources: ['appleIphone', 'appleModels'],
  },
  {
    id: 'apple-ipad-supported',
    brand: 'apple',
    kind: 'tablet',
    support: 'yes',
    models: [
      'iPad Pro 13-inch (M4, M5) Wi-Fi + Cellular',
      'iPad Pro 11-inch (M4, M5) Wi-Fi + Cellular',
      'iPad Pro 11-inch (1st through 4th generation) Wi-Fi + Cellular',
      'iPad Pro 12.9-inch (3rd through 6th generation) Wi-Fi + Cellular',
      'iPad Air 13-inch (M2, M3, M4) Wi-Fi + Cellular',
      'iPad Air 11-inch (M2, M3, M4) Wi-Fi + Cellular',
      'iPad Air (3rd through 5th generation) Wi-Fi + Cellular',
      'iPad (A16) Wi-Fi + Cellular',
      'iPad (7th through 10th generation) Wi-Fi + Cellular',
      'iPad mini (A17 Pro) Wi-Fi + Cellular',
      'iPad mini (5th and 6th generation) Wi-Fi + Cellular',
    ],
    notes: ['chinaMainland'],
    sources: ['appleIpad'],
  },
  {
    id: 'samsung-galaxy-s',
    brand: 'samsung',
    kind: 'phone',
    support: 'yes',
    models: [
      'Galaxy S26',
      'Galaxy S26+',
      'Galaxy S26 Ultra',
      'Galaxy S25',
      'Galaxy S25+',
      'Galaxy S25 Ultra',
      'Galaxy S25 Edge',
      'Galaxy S25 FE',
      'Galaxy S24',
      'Galaxy S24+',
      'Galaxy S24 Ultra',
      'Galaxy S24 FE',
      'Galaxy S23',
      'Galaxy S23+',
      'Galaxy S23 Ultra',
      'Galaxy S23 FE',
      'Galaxy S22',
      'Galaxy S22+',
      'Galaxy S22 Ultra',
      'Galaxy S21',
      'Galaxy S21+',
      'Galaxy S21 Ultra',
      'Galaxy S20',
      'Galaxy S20+',
      'Galaxy S20 Ultra',
    ],
    notes: ['samsungOrigin'],
    sources: ['samsung'],
  },
  {
    id: 'samsung-galaxy-z',
    brand: 'samsung',
    kind: 'phone',
    support: 'yes',
    models: [
      'Galaxy Z Fold8 Ultra',
      'Galaxy Z Fold8',
      'Galaxy Z Flip8',
      'Galaxy Z TriFold',
      'Galaxy Z Fold7',
      'Galaxy Z Flip7',
      'Galaxy Z Flip7 FE',
      'Galaxy Z Fold6',
      'Galaxy Z Flip6',
      'Galaxy Z Fold5',
      'Galaxy Z Flip5',
      'Galaxy Z Fold4',
      'Galaxy Z Flip4',
      'Galaxy Z Fold3',
      'Galaxy Z Flip3',
      'Galaxy Z Fold2',
      'Galaxy Z Flip 5G',
      'Galaxy Z Flip',
      'Galaxy Fold',
    ],
    notes: ['samsungOrigin'],
    sources: ['samsung'],
  },
  {
    id: 'samsung-galaxy-a',
    brand: 'samsung',
    kind: 'phone',
    support: 'regional',
    models: ['Galaxy A56', 'Galaxy A55', 'Galaxy A54', 'Galaxy A36', 'Galaxy A35'],
    notes: ['samsungARegion', 'samsungOrigin'],
    sources: ['samsung'],
  },
  {
    id: 'samsung-xcover',
    brand: 'samsung',
    kind: 'phone',
    support: 'yes',
    models: ['Galaxy XCover7 Pro', 'Galaxy XCover7'],
    notes: ['samsungOrigin'],
    sources: ['samsung'],
  },
  {
    id: 'samsung-tab',
    brand: 'samsung',
    kind: 'tablet',
    support: 'yes',
    models: [
      'Galaxy Tab S11',
      'Galaxy Tab S11 Ultra',
      'Galaxy Tab S10+',
      'Galaxy Tab S10 Ultra',
      'Galaxy Tab S10 FE',
      'Galaxy Tab S10 FE+',
      'Galaxy Tab S9',
      'Galaxy Tab S9+',
      'Galaxy Tab S9 Ultra',
      'Galaxy Tab S9 FE',
      'Galaxy Tab S9 FE+',
      'Galaxy Tab Active5 Pro',
      'Galaxy Tab Active5',
    ],
    notes: ['samsungOrigin'],
    sources: ['samsung'],
  },
  {
    id: 'pixel-supported',
    brand: 'google',
    kind: 'phone',
    support: 'yes',
    models: [
      'Pixel 11 Pro XL',
      'Pixel 11 Pro Fold',
      'Pixel 11 Pro',
      'Pixel 11',
      'Pixel 10 Pro XL',
      'Pixel 10 Pro Fold',
      'Pixel 10 Pro',
      'Pixel 10a',
      'Pixel 10',
      'Pixel 9 Pro XL',
      'Pixel 9 Pro Fold',
      'Pixel 9 Pro',
      'Pixel 9a',
      'Pixel 9',
      'Pixel 8 Pro',
      'Pixel 8a',
      'Pixel 8',
      'Pixel Fold',
      'Pixel 7 Pro',
      'Pixel 7a',
      'Pixel 7',
      'Pixel 6 Pro',
      'Pixel 6a',
      'Pixel 6',
      'Pixel 5a (5G)',
      'Pixel 5',
      'Pixel 4a (5G)',
      'Pixel 4a',
      'Pixel 4 XL',
      'Pixel 4',
      'Pixel 3a XL',
      'Pixel 3a',
    ],
    notes: ['pixelDualEsim'],
    sources: ['pixel'],
  },
  {
    id: 'pixel-outside-rule',
    brand: 'google',
    kind: 'phone',
    support: 'no',
    models: ['Pixel 3 XL', 'Pixel 3', 'Pixel 2 XL', 'Pixel 2'],
    notes: ['pixelOutsideRule'],
    sources: ['pixel'],
  },
];

/** The date of the oldest source, which is how stale the page really is. */
export function devicesCheckedOn(): string {
  return Object.values(deviceSources)
    .map((source) => source.checkedOn)
    .sort()[0];
}
