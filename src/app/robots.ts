import type { MetadataRoute } from 'next';
import { allowIndexing, siteUrl } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  // While plan data is mock, nothing here should reach a search result.
  if (!allowIndexing) {
    return { rules: [{ userAgent: '*', disallow: '/' }] };
  }

  return {
    rules: [{ userAgent: '*', allow: '/' }],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
