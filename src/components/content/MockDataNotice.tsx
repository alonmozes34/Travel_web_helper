import { Badge } from '@/components/ui/Badge';
import type { Dictionary } from '@/i18n/getDictionary';
import { cn } from '@/components/ui/cn';

/**
 * Mock data must never be mistaken for a real offer. This banner is rendered
 * wherever plan data is shown while `source` is still `'mock'`.
 */
export function MockDataNotice({ dict, className }: { dict: Dictionary; className?: string }) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-x-2 gap-y-1 rounded-sm bg-warn-50 px-3 py-2.5 text-sm text-warn-ink',
        className,
      )}
    >
      <Badge tone="warn" className="bg-transparent">
        <span aria-hidden="true">⚠︎</span> {dict.mockData.badge}
      </Badge>
      {/* The warning has to be unmissable, not long. The short line carries the
          claim that matters; the full wording is one tap away. */}
      <span>{dict.mockData.short}</span>
      <details className="w-full">
        <summary className="cursor-pointer text-sm font-semibold">
          {dict.mockData.more}
        </summary>
        <p className="mt-1 text-sm">{dict.mockData.notice}</p>
      </details>
    </div>
  );
}
