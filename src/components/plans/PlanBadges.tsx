import { Badge } from '@/components/ui/Badge';
import type { Dictionary } from '@/i18n/getDictionary';
import type { RecommendationKey } from '@/lib/comparison/recommend';

const badgeIcons: Record<RecommendationKey, string> = {
  bestValue: '🏆',
  cheapest: '💰',
  bestForBrowsing: '📶',
  bestUnlimited: '♾️',
};

/** Recommendation badges. Turquoise marks value; blue marks the rest. */
export function PlanBadges({
  badges,
  dict,
  demoCoverage = false,
}: {
  badges: RecommendationKey[];
  dict: Dictionary;
  demoCoverage?: boolean;
}) {
  if (badges.length === 0 && !demoCoverage) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {badges.map((key) => (
        <Badge key={key} tone={key === 'bestValue' ? 'value' : 'brand'}>
          <span aria-hidden="true">{badgeIcons[key]}</span>
          {dict.recommendations[key]}
        </Badge>
      ))}
    </div>
  );
}
