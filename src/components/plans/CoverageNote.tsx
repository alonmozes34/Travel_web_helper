import { Badge } from '@/components/ui/Badge';
import { Ltr } from '@/components/ui/Bdi';
import { getRegion } from '@/data/regions';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/getDictionary';
import { interpolate } from '@/i18n/interpolate';
import type { PlanCoverage } from '@/lib/types/coverage';

/**
 * What a plan covers.
 *
 * A provider's "works in 130 destinations" is their claim and is labelled as
 * one. Beside it we show how many of those destinations we can actually verify
 * — matching only ever runs on the verified list, so a traveller is never told
 * a plan covers their country on the strength of a marketing number.
 */
export function CoverageNote({
  coverage,
  locale,
  dict,
}: {
  coverage: PlanCoverage;
  locale: Locale;
  dict: Dictionary;
}) {
  if (coverage.kind === 'country') return null;

  const region = coverage.regionId ? getRegion(coverage.regionId) : undefined;
  const label =
    coverage.kind === 'global'
      ? dict.search.coverageGlobal
      : interpolate(dict.search.coverageRegionTemplate, {
          region: region?.names[locale] ?? coverage.regionId ?? '',
        });

  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
      <Badge tone="brand">
        <span aria-hidden="true">{coverage.kind === 'global' ? '🌍' : '🗺️'}</span>
        {label}
      </Badge>
      {coverage.publishedDestinationCount ? (
        <span className="text-[0.7rem] text-ink-3">
          <Ltr className="tnum">
            {interpolate(dict.search.coverageClaimTemplate, {
              count: coverage.publishedDestinationCount,
            })}
          </Ltr>
          {' · '}
          <Ltr className="tnum">
            {interpolate(dict.search.coverageVerifiedTemplate, { count: coverage.countries.length })}
          </Ltr>
        </span>
      ) : null}
    </div>
  );
}
