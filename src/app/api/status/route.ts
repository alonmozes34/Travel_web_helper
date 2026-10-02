import { getCatalogue, planSourcesFromEnv } from '@/lib/catalogue/getCatalogue';
import { getLocalRates } from '@/lib/sources/ecb/localCurrencyRates';
import { buildCommit, releasedOn, siteVersion } from '@/lib/version';

export const dynamic = 'force-dynamic';

/**
 * Which price sources this deployment has, and whether each loaded — so "a
 * provider is missing from the site" can be answered by looking rather than
 * guessing (29 September 2026: ZenSim did not appear, and nothing said why).
 *
 * Only what is already public in effect: source names, counts, and the error
 * a source raised. No setting's value is shown — for each provider only
 * whether it is configured — and no credential ever reaches an error message.
 */
export async function GET() {
  const configured = planSourcesFromEnv().map((source) => source.id);
  const [catalogue, local] = await Promise.all([getCatalogue(), getLocalRates()]);
  const listed: Record<string, number> = {};
  for (const plan of catalogue.plans) listed[plan.providerId] = (listed[plan.providerId] ?? 0) + 1;

  return Response.json(
    {
      version: siteVersion,
      releasedOn,
      commit: buildCommit,
      fetchedAt: catalogue.fetchedAt,
      configured,
      sources: catalogue.sources,
      listedPlansByProvider: listed,
      // The rates prices are converted at, and those the "before you go"
      // facts quote — so the nightly check can hold them against the Bank of
      // Israel's representative rates.
      rates: {
        prices: Object.fromEntries(
          catalogue.rates
            .filter((rate) => rate.to === 'ILS')
            .map((rate) => [rate.from, { ilsPer: rate.rate, asOf: rate.asOf, source: rate.source }]),
        ),
        local: local
          ? { asOf: local.asOf, ilsPer: Object.fromEntries([...local.ilsPer].map(([code, ils]) => [code, Number(ils.toFixed(6))])) }
          : null,
      },
    },
    { headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } },
  );
}
