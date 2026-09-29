import type { Dictionary } from '@/i18n/getDictionary';
import { recommendationKeys, type RecommendationKey } from '@/lib/comparison/recommend';
import { recommendationIcons } from './RecommendationTabs';

/**
 * What each label on the page means, in one line each — the labels on this
 * page only. Asked for by the owner on 29 September 2026, after "best value"
 * on the dearest of three plans looked like a mistake: a label a traveller
 * cannot explain is one they cannot trust.
 */
export function TagLegend({ available, dict }: { available: RecommendationKey[]; dict: Dictionary }) {
  const keys = recommendationKeys.filter((key) => available.includes(key));
  if (keys.length === 0) return null;
  return (
    <details className="mb-4 rounded-sm border-s-[3px] border-s-line bg-surface-2 px-3 py-2">
      <summary className="cursor-pointer text-sm font-semibold text-ink-2 marker:text-ink-3">
        {dict.recommendations.legendSummary}
      </summary>
      <dl className="mt-2 grid max-w-[80ch] gap-2 text-sm">
        {keys.map((key) => (
          <div key={key}>
            <dt className="font-semibold text-ink">
              <span aria-hidden="true">{recommendationIcons[key]} </span>
              {dict.recommendations[key]}
            </dt>
            <dd className="text-ink-2">{dict.recommendations.legend[key]}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-sm text-ink-2">{dict.recommendations.legendCommission}</p>
    </details>
  );
}
