'use client';

import { useCallback, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { FilterControls } from '@/components/filters/FilterControls';
import { CompareTable } from '@/components/comparison/CompareTable';
import { CompareTray, MAX_COMPARE } from '@/components/comparison/CompareTray';
import { PlanListItem } from '@/components/plans/PlanListItem';
import type { CurrencyCode, Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/getDictionary';
import { interpolate } from '@/i18n/interpolate';
import { track } from '@/lib/analytics/events';
import type { ComparisonRow } from '@/lib/comparison/buildComparison';
import {
  applyFilters,
  countActiveFilters,
  deriveFilterOptions,
  emptyFilters,
  filtersToParams,
  type PlanFilters,
} from '@/lib/comparison/filter';
import type { RecommendationKey } from '@/lib/comparison/recommend';
import { sortRows, sortKeys, type SortKey } from '@/lib/comparison/sort';
import { RecommendationTabs } from './RecommendationTabs';

/** Each category is an ordering preset; unlimited also narrows the list. */
const tabSort: Record<RecommendationKey, SortKey> = {
  bestValue: 'recommended',
  cheapest: 'price',
  bestForBrowsing: 'recommended',
  bestUnlimited: 'recommended',
};

export function ResultsView({
  rows,
  locale,
  dict,
  currency,
  tripDays,
  demoDataEnabled,
  availableRecommendations,
  initialFilters,
  initialSort,
}: {
  rows: ComparisonRow[];
  locale: Locale;
  dict: Dictionary;
  currency: CurrencyCode;
  tripDays: number;
  demoDataEnabled: boolean;
  availableRecommendations: RecommendationKey[];
  /** Parsed on the server from the URL, so a shared filtered link renders
      the same markup on both sides and needs no post-hydration correction. */
  initialFilters: PlanFilters;
  initialSort: SortKey;
}) {
  const options = useMemo(() => deriveFilterOptions(rows), [rows]);
  const [filters, setFilters] = useState<PlanFilters>(initialFilters);
  const [sort, setSort] = useState<SortKey>(initialSort);
  const [tab, setTab] = useState<RecommendationKey>('bestValue');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);

  /**
   * Filters are written straight into the address bar rather than pushed
   * through the router: the plan data is already on the page, so a round trip
   * to the server on every checkbox would only make filtering feel slower.
   */
  const syncUrl = useCallback((next: PlanFilters, nextSort: SortKey) => {
    const params = filtersToParams(next);
    const existing = new URLSearchParams(window.location.search);
    for (const key of ['days', 'usage']) {
      const value = existing.get(key);
      if (value) params.set(key, value);
    }
    if (nextSort !== 'recommended') params.set('sort', nextSort);
    const query = params.toString();
    window.history.replaceState(null, '', query ? `?${query}` : window.location.pathname);
  }, []);

  const updateFilters = useCallback(
    (next: PlanFilters) => {
      setFilters(next);
      syncUrl(next, sort);
    },
    [sort, syncUrl],
  );

  const updateSort = useCallback(
    (next: SortKey) => {
      setSort(next);
      syncUrl(filters, next);
      track({ name: 'filter_used', filter: 'sort', value: next });
    },
    [filters, syncUrl],
  );

  const visible = useMemo(() => {
    const filtered = applyFilters(rows, filters);
    const scoped = tab === 'bestUnlimited' ? filtered.filter((row) => row.plan.isUnlimited) : filtered;

    if (tab === 'bestForBrowsing' && sort === 'recommended') {
      return [...scoped].sort((a, b) => b.browsingScore - a.browsingScore);
    }
    if (tab === 'bestUnlimited' && sort === 'recommended') {
      return [...scoped].sort(
        (a, b) => (a.pricePerDayMinor ?? Infinity) - (b.pricePerDayMinor ?? Infinity),
      );
    }
    return sortRows(scoped, sort);
  }, [rows, filters, sort, tab]);

  const selected = useMemo(
    () => selectedIds.map((id) => rows.find((row) => row.plan.id === id)).filter(Boolean) as ComparisonRow[],
    [selectedIds, rows],
  );

  const toggleSelected = useCallback((planId: string, isSelected: boolean) => {
    setSelectedIds((current) => {
      if (!isSelected) return current.filter((id) => id !== planId);
      if (current.includes(planId)) return current;
      const next = current.length >= MAX_COMPARE ? current : [...current, planId];
      track({ name: 'compare_selected', planId, selectionCount: next.length });
      return next;
    });
  }, []);

  const activeCount = countActiveFilters(filters);

  const planRowProps = (row: ComparisonRow) => ({
    row,
    locale,
    dict,
    tripDays,
    demoDataEnabled,
    isSelected: selectedIds.includes(row.plan.id),
    canSelect: selectedIds.length < MAX_COMPARE,
    onSelect: (isSelected: boolean) => toggleSelected(row.plan.id, isSelected),
  });

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 pb-4">
        <RecommendationTabs
          available={availableRecommendations}
          active={tab}
          dict={dict}
          onSelect={(key) => {
            setTab(key);
            updateSort(tabSort[key]);
          }}
        />
        <label className="ms-auto flex items-center gap-2 text-[0.8125rem] text-ink-2">
          <span>{dict.filters.sort}</span>
          <select
            value={sort}
            onChange={(event) => updateSort(event.target.value as SortKey)}
            className="min-h-10 rounded-sm border border-line bg-surface px-2 text-[0.8125rem] font-semibold text-ink"
          >
            {sortKeys.map((key) => (
              <option key={key} value={key}>
                {dict.filters.sortOptions[key]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {rows.some((row) => row.price.isConverted) ? (
        <p className="mb-4 rounded-sm border-s-[3px] border-s-line bg-surface-2 px-3 py-2 text-[0.8125rem] text-ink-2">
          {dict.plan.conversionNote}
        </p>
      ) : null}

      {tab === 'bestForBrowsing' ? (
        <p className="mb-4 rounded-sm bg-brand-50 px-3 py-2 text-[0.8125rem] text-ink-2">
          {dict.recommendations.browsingNote}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[230px_1fr]">
        <aside className="hidden lg:block" aria-label={dict.filters.title}>
          <div className="flex items-center justify-between pb-2">
            <h2 className="text-[0.7rem] font-semibold tracking-[0.09em] text-ink-3 uppercase">
              {dict.filters.title}
            </h2>
            {activeCount > 0 ? (
              <button
                type="button"
                onClick={() => updateFilters(emptyFilters)}
                className="text-[0.8125rem] font-semibold text-brand"
              >
                {dict.filters.clearAll}
              </button>
            ) : null}
          </div>
          <FilterControls
            dict={dict}
            locale={locale}
            currency={currency}
            options={options}
            filters={filters}
            onChange={updateFilters}
          />
        </aside>

        <section aria-label={dict.filters.resultsLabel}>
          <p aria-live="polite" className="sr-only">
            {interpolate(dict.filters.showResultsTemplate, { count: visible.length })}
          </p>
          <div className="mb-3 lg:hidden">
            <Button variant="secondary" size="sm" onClick={() => setFiltersOpen(true)}>
              {dict.filters.open}
              {activeCount > 0 ? ` · ${activeCount}` : ''}
            </Button>
          </div>

          {visible.length === 0 ? (
            <p className="rounded-lg border border-dashed border-line bg-surface p-8 text-center text-ink-2">
              {dict.filters.noResults}
            </p>
          ) : (
            <>
              <div className="grid gap-3 lg:block lg:gap-0 lg:overflow-hidden lg:rounded-lg lg:border lg:border-line lg:bg-surface">
                {visible.map((row) => (
                  <PlanListItem key={row.plan.id} {...planRowProps(row)} />
                ))}
              </div>
              <p className="mt-2 text-[0.8125rem] text-ink-3">{dict.plan.buyAtProvider}</p>
            </>
          )}
        </section>
      </div>

      <Sheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title={dict.filters.title}
        closeLabel={dict.common.close}
        footer={
          <Button className="w-full" onClick={() => setFiltersOpen(false)}>
            {interpolate(dict.filters.showResultsTemplate, { count: visible.length })}
          </Button>
        }
      >
        <FilterControls
          dict={dict}
          locale={locale}
          currency={currency}
          options={options}
          filters={filters}
          onChange={updateFilters}
        />
      </Sheet>

      <CompareTray
        selected={selected}
        dict={dict}
        onRemove={(planId) => toggleSelected(planId, false)}
        onClear={() => setSelectedIds([])}
        onCompare={() => setCompareOpen(true)}
      />

      <CompareTable
        open={compareOpen}
        onClose={() => setCompareOpen(false)}
        rows={selected}
        locale={locale}
        dict={dict}
      />
    </div>
  );
}
