/**
 * One record from Yesim's Prices API (`GET /api_v0.1/api/prices`), as it
 * arrived on 28 September 2026. Every value is a string or null, numbers
 * included.
 */
export type YesimPlan = {
  plan_id: string;
  /** Days, e.g. "30". */
  period: string;
  /** In `capacityUnit` (always "MB" so far). "-1" is unlimited. */
  capacity: string;
  dataUnit: string;
  capacityUnit: string;
  /** Always null so far. */
  dataCapPer: string | null;
  /** "Possible throttling" on every unlimited plan, null on the rest. */
  capacityInfo: string | null;
  /** In `currency`, major units: "28.81". */
  price: string;
  currency: string;
  prices: Record<string, string> | null;
  planName: string;
  /** Lower-case ISO 3166-1 alpha-2 for a single-country plan, null for a region or global plan. */
  country_code: string | null;
  country: string;
  coverages: Array<{ code: string }>;
  /** The page for the plan's destination, with our partner id. */
  url: string;
  directLink: string;
  planType: string;
  priceInfo: string;
  package_id: string;
  targets: string | null;
};
