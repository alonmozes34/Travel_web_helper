import type { MetadataRoute } from 'next';
import { allowIndexing, siteUrl } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  /**
   * Before launch the site stays out of search results through the `noindex`
   * on every page, not through robots.txt. A blanket Disallow kept out the
   * affiliate networks' review crawlers too: Booking.com's team on CJ
   * declined the application on 5 October 2026 because the site was "not
   * accessible" to them. Crawlers may now read the pages — which is also the
   * only way a search engine sees the `noindex` at all — and the pages still
   * ask not to be indexed. No sitemap is offered until launch.
   */
  if (!allowIndexing) {
    return { rules: [{ userAgent: '*', allow: '/', disallow: '/api/' }] };
  }

  return {
    rules: [{ userAgent: '*', allow: '/', disallow: '/api/' }],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
