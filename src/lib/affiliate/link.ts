import type { Plan } from '@/lib/types/plan';

/**
 * The outbound link to a provider.
 *
 * Three things this has to get right, and the brief is explicit about all
 * three: the traveller must know they are leaving, the link must be marked as
 * a paid relationship for search engines, and the destination must be the
 * provider's own site rather than anything of ours that resembles a checkout.
 *
 * There is no redirector. A click goes straight to the provider, so the URL in
 * the status bar is the URL that opens — a redirect hop through our own domain
 * would let us count clicks at the cost of hiding where the link goes, and
 * that trade is not worth making on a site whose product is trust.
 */
export type OutboundLink = {
  href: string;
  /**
   * `sponsored` is the correct value for an affiliate link and Google asks for
   * it explicitly; `noopener` is required whenever a link opens in a new tab.
   */
  rel: string;
  target: '_blank';
};

export function outboundLink(plan: Plan): OutboundLink | null {
  if (!plan.affiliateUrl) return null;
  // Only http(s). A feed is external input, and `javascript:` in an href is
  // the oldest trick there is.
  if (!/^https?:\/\//i.test(plan.affiliateUrl)) return null;

  return {
    href: plan.affiliateUrl,
    rel: 'sponsored noopener noreferrer',
    target: '_blank',
  };
}
