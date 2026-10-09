/**
 * One plan from Saily's partner API (`GET web.saily.com/v3/partners/plans`),
 * as it arrived on 9 October 2026 — only the fields the site reads.
 */
export type SailyPlan = {
  /** A UUID. Also the `sku` of the plan's offer on its saily.com page. */
  identifier: string;
  /** "Thailand 20GB 30 days", "Europe UNLIMITED 7 days". */
  name: string;
  /** "standard", or "ultra" for plans saily.com sells as a subscription. */
  category: string;
  /** ISO 3166-1 alpha-2, with a few of their own ("HI" for Hawaii, "S1"). */
  covered_countries: string[];
  /** The plan's page on saily.com: "esim-thailand", "esim-united-states/hawaii". */
  pricing_slug: string;
  is_unlimited: boolean;
  /** One entry so far: `{ type: "DATA", unit: "GB", amount: 20 }`; 999GB on unlimited plans. */
  balances: Array<{ amount: number; is_unlimited: boolean; type: string; unit: string }>;
  duration: { amount: number; unit: string };
  /** In the currency's minor unit, tax included: 1999 is US$19.99. */
  price: { amount_with_tax: number; currency: string };
  /**
   * URL-encoded: the plan's page with `selectedPlan` set to `identifier`, and
   * TUNE's macros for the click (`{transaction_id}`, `{offer_id}`, `{aff_id}`),
   * which their tracking link fills in on the way.
   */
  destination_url: string;
  /** Two identical entries so far. `metadata` carries an unlimited plan's fair-usage terms. */
  merchant_plans: Array<{ metadata: SailyMetadata }>;
};

export type SailyMetadata = {
  /** Full-speed data per `unrestricted_data_after` period. */
  unrestricted_data?: { amount: number; unit: string };
  /** `{ interval: 1, unit: "DAY" }`: the allowance resets daily. */
  unrestricted_data_after?: { interval: number; unit: string };
  /** The speed after the allowance: `{ amount: 1024, unit: "KBPS" }` or `{ amount: 1, unit: "MBPS" }`. */
  throttled_speed?: { amount: number; unit: string };
};
