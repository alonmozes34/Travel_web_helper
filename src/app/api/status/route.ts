import { getCatalogue, planSourcesFromEnv } from '@/lib/catalogue/getCatalogue';
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
  const catalogue = await getCatalogue();
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
    },
    { headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } },
  );
}
