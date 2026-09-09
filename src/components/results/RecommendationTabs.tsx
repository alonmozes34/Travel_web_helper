'use client';

import { cn } from '@/components/ui/cn';
import type { Dictionary } from '@/i18n/getDictionary';
import { recommendationKeys, type RecommendationKey } from '@/lib/comparison/recommend';

const icons: Record<RecommendationKey, string> = {
  bestValue: '🏆',
  cheapest: '💰',
  bestForBrowsing: '📶',
  bestUnlimited: '♾️',
};

/**
 * The four categories, as ordering presets rather than badges alone. Only
 * categories that actually have a winner are offered — a tab that would lead
 * nowhere is not rendered.
 */
export function RecommendationTabs({
  available,
  active,
  dict,
  onSelect,
}: {
  available: RecommendationKey[];
  active: RecommendationKey;
  dict: Dictionary;
  onSelect: (key: RecommendationKey) => void;
}) {
  const tabs = recommendationKeys.filter((key) => available.includes(key));
  if (tabs.length === 0) return null;

  return (
    <div
      role="group"
      aria-label={dict.filters.categoriesLabel}
      className="flex gap-2 overflow-x-auto pb-1"
    >
      {tabs.map((key) => (
        <button
          key={key}
          type="button"
          aria-pressed={key === active}
          onClick={() => onSelect(key)}
          className={cn(
            'inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition-colors',
            key === active
              ? 'border-ink bg-ink text-surface'
              : 'border-line bg-surface text-ink-2 hover:border-brand hover:text-brand',
          )}
        >
          <span aria-hidden="true">{icons[key]}</span>
          {dict.recommendations[key]}
        </button>
      ))}
    </div>
  );
}
