import { MB_PER_GB } from "@/lib/formatters/data";
import { networksForDestinations } from "@/lib/types/network";
import type { ComparisonRow } from "./buildComparison";

export const featureKeys = ["hotspot", "calls", "sms", "topUp"] as const;
export type FeatureKey = (typeof featureKeys)[number];

export type PlanFilters = {
  /** GB values, plus 'unlimited'. */
  data: string[];
  /** Validity in days. */
  validity: number[];
  operators: string[];
  providers: string[];
  onlyFiveG: boolean;
  features: FeatureKey[];
  maxPriceMinor: number | null;
};

export const emptyFilters: PlanFilters = {
  data: [],
  validity: [],
  operators: [],
  providers: [],
  onlyFiveG: false,
  features: [],
  maxPriceMinor: null,
};

/**
 * Filter options come from the plans actually on the page, so the sidebar
 * never offers a choice that returns nothing.
 */
export type FilterOptions = {
  dataGb: number[];
  hasUnlimited: boolean;
  validity: number[];
  operators: string[];
  /** False when no plan publishes a network at the destinations being searched. */
  hasKnownNetworks: boolean;
  providers: Array<{ id: string; name: string }>;
  minPriceMinor: number;
  maxPriceMinor: number;
};

export function deriveFilterOptions(
  rows: ComparisonRow[],
  countryCodes: string[] = [],
): FilterOptions {
  const dataGb = new Set<number>();
  const validity = new Set<number>();
  const operators = new Set<string>();
  const providers = new Map<string, string>();
  let min = Number.POSITIVE_INFINITY;
  let max = 0;

  for (const row of rows) {
    if (!row.plan.isUnlimited)
      dataGb.add(Math.round(row.plan.dataAmountMb / MB_PER_GB));
    validity.add(row.plan.validityDays);
    // Only operators the traveller can actually get at their destination. A
    // global plan's Thai operator is not a filter for a trip to Brazil.
    for (const network of networksForDestinations(
      row.plan.networks,
      countryCodes,
    )) {
      operators.add(network.operator);
    }
    providers.set(row.provider.id, row.provider.name);
    min = Math.min(min, row.price.amountMinor);
    max = Math.max(max, row.price.amountMinor);
  }

  return {
    dataGb: [...dataGb].sort((a, b) => a - b),
    hasUnlimited: rows.some((row) => row.plan.isUnlimited),
    validity: [...validity].sort((a, b) => a - b),
    operators: [...operators].sort(),
    hasKnownNetworks: operators.size > 0,
    providers: [...providers].map(([id, name]) => ({ id, name })),
    minPriceMinor: Number.isFinite(min) ? min : 0,
    maxPriceMinor: max,
  };
}

export function applyFilters(
  rows: ComparisonRow[],
  filters: PlanFilters,
  countryCodes: string[] = [],
): ComparisonRow[] {
  return rows.filter((row) => {
    const { plan } = row;
    // A global plan has 5G somewhere in the world. That is not an answer to
    // "5G at my destination", so the network filters read the same narrowed
    // list the row shows.
    const networks = networksForDestinations(plan.networks, countryCodes);

    if (filters.data.length > 0) {
      const key = plan.isUnlimited
        ? "unlimited"
        : String(Math.round(plan.dataAmountMb / MB_PER_GB));
      if (!filters.data.includes(key)) return false;
    }

    if (
      filters.validity.length > 0 &&
      !filters.validity.includes(plan.validityDays)
    )
      return false;

    if (filters.operators.length > 0) {
      const matches = networks.some((network) =>
        filters.operators.includes(network.operator),
      );
      if (!matches) return false;
    }

    if (
      filters.providers.length > 0 &&
      !filters.providers.includes(plan.providerId)
    )
      return false;

    if (filters.onlyFiveG) {
      const hasFiveG = networks.some((network) =>
        network.technologies.includes("5G"),
      );
      if (!hasFiveG) return false;
    }

    for (const feature of filters.features) {
      if (!plan[feature]) return false;
    }

    if (
      filters.maxPriceMinor !== null &&
      row.price.amountMinor > filters.maxPriceMinor
    ) {
      return false;
    }

    return true;
  });
}

export function countActiveFilters(filters: PlanFilters): number {
  return (
    filters.data.length +
    filters.validity.length +
    filters.operators.length +
    filters.providers.length +
    filters.features.length +
    (filters.onlyFiveG ? 1 : 0) +
    (filters.maxPriceMinor !== null ? 1 : 0)
  );
}

/** Filters live in the URL so a filtered comparison can be shared. */
export function filtersToParams(filters: PlanFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.data.length) params.set("data", filters.data.join(","));
  if (filters.validity.length)
    params.set("validity", filters.validity.join(","));
  if (filters.operators.length) params.set("net", filters.operators.join(","));
  if (filters.providers.length)
    params.set("provider", filters.providers.join(","));
  if (filters.features.length)
    params.set("features", filters.features.join(","));
  if (filters.onlyFiveG) params.set("5g", "1");
  if (filters.maxPriceMinor !== null)
    params.set("max", String(filters.maxPriceMinor));
  return params;
}

export function filtersFromParams(params: URLSearchParams): PlanFilters {
  const list = (key: string) =>
    (params.get(key) ?? "").split(",").filter(Boolean);
  const max = Number.parseInt(params.get("max") ?? "", 10);

  return {
    data: list("data"),
    validity: list("validity")
      .map((value) => Number.parseInt(value, 10))
      .filter((value) => Number.isFinite(value)),
    operators: list("net"),
    providers: list("provider"),
    features: list("features").filter((value): value is FeatureKey =>
      (featureKeys as readonly string[]).includes(value),
    ),
    onlyFiveG: params.get("5g") === "1",
    maxPriceMinor: Number.isFinite(max) ? max : null,
  };
}
