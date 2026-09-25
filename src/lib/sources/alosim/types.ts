/**
 * The aloSIM Store API, as its OpenAPI document describes it
 * (https://api.alosim.com/store/swagger/index.html, version 1.3) and as the
 * live catalogue returned it on 25 September 2026.
 *
 * One discrepancy with the document, from the live data: `locations` and
 * `providers[].countryCode` are ISO 3166-1 alpha-3 ("THA"), where the
 * document's example shows alpha-2.
 */
export type AlosimNetwork = {
  network: string;
  /** "5G", "LTE", "3G", "2G" or "". */
  speed: string;
  country: string;
  /** Alpha-3. */
  countryCode: string;
  phone: string;
};

export type AlosimPlan = {
  /** The destination or bundle name, lower-case, e.g. "thailand", "europe". */
  name: string;
  /** Alpha-3 codes. */
  locations: string[];
  /** A number as text, or "Unlimited". */
  dataGigabytes: string;
  validityDays: number;
  /** In `currency`, in cents. */
  price: number;
  /** The same plan priced by aloSIM in each currency they sell in, in cents. */
  prices: Record<string, number>;
  currency: string;
  /** Their plan page, already carrying our affiliate and offer ids. */
  url: string;
  providers: AlosimNetwork[];
  /** On unlimited plans, e.g. "3 GB"; otherwise "". */
  dataBeforeThrottle: string;
  /** On unlimited plans, e.g. "1 Mbps"; otherwise "". */
  throttleSpeed: string;
};

export type AlosimPage = { items: AlosimPlan[]; offset: number; total: number };

export type AlosimCredentials = { clientId: string; clientSecret: string };

/** Where "buy" goes for one plan. */
export type AlosimLink = {
  href: string;
  landsOn: 'plan' | 'destination';
  /** The same link to aloSIM's page in another language, where it has one. */
  byLocale?: Partial<Record<import('@/i18n/config').Locale, string>>;
};
