import { Ltr } from '@/components/ui/Bdi';
import { MB_PER_GB } from '@/lib/formatters/data';
import type { Dictionary } from '@/i18n/getDictionary';
import { interpolate } from '@/i18n/interpolate';
import type { ComparisonRow } from '@/lib/comparison/buildComparison';
import { scoreWeights } from '@/lib/comparison/scorePlan';

/**
 * The expanded panel behind "details".
 *
 * Besides the remaining specs it shows how the plan's score was reached. That
 * is the point: a comparison site that ranks plans owes the reader the
 * reasoning, and showing the four factors makes the absence of a commission
 * factor something you can see rather than something we assert.
 */
export function PlanDetails({ row, dict }: { row: ComparisonRow; dict: Dictionary }) {
  const { plan } = row;

  const specs = [
    { label: dict.details.sms, value: plan.sms ? dict.common.yes : dict.common.no },
    { label: dict.details.topUp, value: plan.topUp ? dict.common.yes : dict.common.no },
    { label: dict.plan.calls, value: plan.calls ? dict.common.yes : dict.common.no },
    { label: dict.plan.hotspot, value: plan.hotspot ? dict.common.yes : dict.common.no },
  ];

  const factors = [
    { label: dict.details.factors.needFit, value: row.breakdown.needFit * scoreWeights.needFit },
    { label: dict.details.factors.price, value: row.breakdown.price * scoreWeights.price },
    { label: dict.details.factors.headroom, value: row.breakdown.headroom * scoreWeights.headroom },
    { label: dict.details.factors.features, value: row.breakdown.features * scoreWeights.features },
  ];

  return (
    <div className="mt-3 grid gap-5 rounded-md bg-surface-2 p-4 sm:grid-cols-2">
      <div>
        <h4 className="font-head text-[0.9375rem] font-semibold">{dict.details.title}</h4>
        <dl className="mt-2 grid gap-1.5 text-[0.8125rem]">
          {specs.map((spec) => (
            <div key={spec.label} className="flex justify-between gap-3 border-b border-line-soft pb-1.5">
              <dt className="text-ink-2">{spec.label}</dt>
              <dd className="font-semibold">{spec.value}</dd>
            </div>
          ))}
          <div className="flex justify-between gap-3">
            <dt className="text-ink-2">{dict.details.activation}</dt>
            <dd className="font-semibold">{dict.details.activationValues[row.provider.activation]}</dd>
          </div>
        </dl>

        {plan.fairUsage?.dailyThresholdMb ? (
          <p className="mt-3 text-[0.8125rem] text-warn-ink">
            <strong className="font-semibold">{dict.details.fairUsageTitle}:</strong>{' '}
            {interpolate(dict.plan.fairUsageDetailTemplate, {
              gb: Math.round(plan.fairUsage.dailyThresholdMb / MB_PER_GB),
              kbps: plan.fairUsage.throttledToKbps ?? '—',
            })}
          </p>
        ) : null}
      </div>

      <div>
        <h4 className="font-head text-[0.9375rem] font-semibold">{dict.details.whyTitle}</h4>
        <p className="tnum mt-1 text-[0.8125rem] text-ink-2">
          <Ltr>{interpolate(dict.details.scoreTemplate, { score: row.score })}</Ltr>
        </p>
        <ul className="mt-2 grid gap-2">
          {factors.map((factor) => (
            <li key={factor.label} className="text-[0.8125rem]">
              <span className="flex justify-between gap-3 text-ink-2">
                {factor.label}
                <Ltr className="tnum">{Math.round(factor.value * 100)}</Ltr>
              </span>
              <span
                aria-hidden="true"
                className="mt-1 block h-1 overflow-hidden rounded-full bg-line"
              >
                <span
                  className="block h-full rounded-full bg-teal"
                  style={{ width: `${Math.min(100, Math.round(factor.value * 100 * 2))}%` }}
                />
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[0.8125rem] text-ink-3">{dict.details.noCommission}</p>
      </div>
    </div>
  );
}
