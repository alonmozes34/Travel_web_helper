/**
 * What a saily.com page sells: plan id → price in US cents, from the
 * schema.org data the page publishes for search engines (an `Offer` per
 * plan, whose `sku` is the plan's id in the partner API). Only US-dollar
 * offers: the API prices in dollars, and a price in another currency is not
 * the same price.
 */
export function sailyOffersInPage(html: string): Map<string, number> {
  const offers = new Map<string, number>();
  const walk = (node: unknown) => {
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (!node || typeof node !== 'object') return;
    const record = node as Record<string, unknown>;
    if (record['@type'] === 'Offer' && typeof record.sku === 'string' && record.priceCurrency === 'USD') {
      const cents = Math.round(Number(record.price) * 100);
      if (cents > 0) offers.set(record.sku, cents);
    }
    Object.values(record).forEach(walk);
  };
  for (const match of html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
    try {
      walk(JSON.parse(match[1]));
    } catch {
      // A block that is not JSON holds no offer we can read.
    }
  }
  return offers;
}
