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
};
