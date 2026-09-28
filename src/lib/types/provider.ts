export type ActivationMethod = 'qr' | 'app' | 'both';

export type Provider = {
  id: string;
  name: string;
  slug: string;
  /** Used for the initial tile when there is no logo. */
  brandColor: string;
  /**
   * The provider's own logo, as issued to affiliates in their creatives — never
   * lifted from their website. Served from `public/providers/`. Absent, the
   * tile shows the provider's initial on `brandColor`.
   */
  logo?: { src: string; width: number; height: number };
  /** Null when the provider has not told us, rather than a guess. */
  activation: ActivationMethod | null;
  /**
   * Whether the price in the provider's currency is what a traveller from here
   * is actually charged. `not-confirmed` when the provider's feed gives one
   * currency but their shop may show and charge another (by location, by a
   * currency picker): the page then calls it the provider's listed price and
   * not "what your card is charged". Absent means confirmed.
   */
  billingCurrency?: 'as-listed' | 'not-confirmed';
};
