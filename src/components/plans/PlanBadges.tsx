import { Badge } from '@/components/ui/Badge';
import type { Dictionary } from '@/i18n/getDictionary';
import type { RecommendationKey } from '@/lib/comparison/recommend';

const badgeIcons: Record<RecommendationKey, string> = {
  bestValue: '🏆',
  cheapest: '💰',
  bestForBrowsing: '📶',
  bestUnlimited: '♾️',
};

/**
 * Recommendation badges. Turquoise marks value; blue marks the rest.
 *
 * `isDemo` marks a row whose price is invented, and is only ever set while
 * real and demo plans share a page. When everything on the page is demo the
 * banner above says so once, and repeating it on every row would be noise
 * that distinguishes nothing. It replaces a `demoCoverage` prop that was
 * declared, gated the early return, and then rendered nothing at all.
 */
export function PlanBadges({
  badges,
  dict,
  isDemo = false,
}: {
  badges: RecommendationKey[];
  dict: Dictionary;
  isDemo?: boolean;
}) {
  if (badges.length === 0 && !isDemo) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {/* First, so it is read before any claim the row makes about itself. */}
      {isDemo ? (
        <Badge tone="warn">
          <span aria-hidden="true">⚠︎</span>
          {dict.mockData.badge}
        </Badge>
      ) : null}
      {badges.map((key) => (
        <Badge key={key} tone={key === 'bestValue' ? 'value' : 'brand'}>
          <span aria-hidden="true">{badgeIcons[key]}</span>
          {dict.recommendations[key]}
        </Badge>
      ))}
    </div>
  );
}
