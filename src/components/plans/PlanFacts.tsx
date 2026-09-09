import { Ltr } from "@/components/ui/Bdi";
import { cn } from "@/components/ui/cn";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/getDictionary";
import { interpolate } from "@/i18n/interpolate";
import type { ComparisonRow } from "@/lib/comparison/buildComparison";
import { MB_PER_GB } from "@/lib/formatters/data";
import { formatData } from "@/lib/formatters/data";
import { formatPrice } from "@/lib/formatters/price";
import { hasTechnology, networksForDestinations } from "@/lib/types/network";

/** One labelled fact: a small caption, a prominent value, a quiet sub-line. */
export function Fact({
  label,
  value,
  sub,
  subTone = "muted",
  className,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  subTone?: "muted" | "warn";
  className?: string;
}) {
  return (
    <div className={className}>
      <span className="block text-[0.7rem] font-semibold tracking-[0.08em] text-ink-3 uppercase">
        {label}
      </span>
      <span className="block font-head text-lg font-semibold tracking-tight">
        {value}
      </span>
      {sub ? (
        <span
          className={cn(
            "mt-0.5 block text-[0.8125rem]",
            subTone === "warn" ? "text-warn-ink" : "text-ink-3",
          )}
        >
          {sub}
        </span>
      ) : null}
    </div>
  );
}

/** Data allowance, with price per GB as the quiet sub-line beneath it. */
export function DataFact({
  row,
  locale,
  dict,
}: {
  row: ComparisonRow;
  locale: Locale;
  dict: Dictionary;
}) {
  const { plan } = row;

  const value = plan.isUnlimited ? (
    dict.units.unlimited
  ) : (
    <Ltr className="tnum">{formatData(plan.dataAmountMb, locale)}</Ltr>
  );

  const sub = plan.isUnlimited
    ? plan.fairUsage?.dailyThresholdMb
      ? interpolate(dict.plan.perDayTemplate, {
          price: formatData(plan.fairUsage.dailyThresholdMb, locale),
        })
      : undefined
    : row.pricePerGbMinor !== null
      ? interpolate(dict.plan.perGbTemplate, {
          // Per-unit figures are in the comparison currency, so they carry the
          // same "≈" as any other converted amount.
          price: row.price.isConverted
            ? interpolate(dict.plan.approxTemplate, {
                price: formatPrice(
                  row.pricePerGbMinor,
                  row.price.currency,
                  locale,
                ),
              })
            : formatPrice(row.pricePerGbMinor, row.price.currency, locale),
        })
      : undefined;

  return (
    <Fact
      label={dict.plan.data}
      value={value}
      sub={sub ? <Ltr className="tnum">{sub}</Ltr> : undefined}
    />
  );
}

/** Validity, with how it relates to the traveller's trip beneath it. */
export function ValidityFact({
  row,
  dict,
  tripDays,
}: {
  row: ComparisonRow;
  dict: Dictionary;
  tripDays: number;
}) {
  const { plan } = row;

  return (
    <Fact
      label={dict.plan.validity}
      value={
        <Ltr className="tnum">
          {plan.validityDays}
          <span className="ms-1 font-body text-[0.8125rem] font-normal text-ink-2">
            {dict.units.days}
          </span>
        </Ltr>
      }
      sub={
        row.coversTrip
          ? interpolate(dict.plan.coversTripTemplate, { days: tripDays })
          : dict.plan.shortValidity
      }
      subTone={row.coversTrip ? "muted" : "warn"}
    />
  );
}

/**
 * The local operator is the headline here, not the technology: "AIS" tells a
 * traveller more than "4G" does. Technology and features sit beneath it as
 * small tags, and what a plan lacks is shown greyed rather than omitted.
 */
export function NetworkFact({
  row,
  dict,
  countryCodes = [],
}: {
  row: ComparisonRow;
  dict: Dictionary;
  /** Narrows a regional plan's networks to the destinations being searched. */
  countryCodes?: string[];
}) {
  const { plan } = row;
  const networks = networksForDestinations(plan.networks, countryCodes);
  const operators = networks.map((network) => network.operator).join(" + ");
  const fiveG = hasTechnology(networks, "5G");

  const tags: Array<{ label: string; on: boolean }> = [
    // With no network published for this destination we do not know whether
    // there is 5G there, and "no 5G" would be a claim rather than a fact.
    ...(networks.length > 0
      ? [{ label: fiveG ? "5G" : dict.plan.no5g, on: fiveG }]
      : []),
    {
      label: plan.hotspot ? dict.plan.hotspot : dict.plan.noHotspot,
      on: plan.hotspot,
    },
    { label: plan.calls ? dict.plan.calls : dict.plan.noCalls, on: plan.calls },
  ];

  return (
    <div>
      <span className="block text-[0.7rem] font-semibold tracking-[0.08em] text-ink-3 uppercase">
        {dict.plan.network}
      </span>
      <span
        className={cn(
          "block font-head",
          operators ? "font-semibold" : "text-[0.8125rem] text-ink-3",
        )}
      >
        {operators || dict.plan.networkUnknown}
      </span>
      <div className="mt-1.5 flex flex-wrap gap-1">
        {tags.map((tag) => (
          <span
            key={tag.label}
            className={cn(
              "rounded-xs border border-line bg-surface px-1.5 py-0.5 text-[0.7rem]",
              tag.on ? "text-ink-2" : "text-ink-3",
            )}
          >
            {tag.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Fair-usage disclosure for unlimited plans — visible, with the detail one click away. */
export function FairUsageNote({
  row,
  dict,
}: {
  row: ComparisonRow;
  dict: Dictionary;
}) {
  const fup = row.plan.fairUsage;
  if (!row.plan.isUnlimited || !fup?.dailyThresholdMb) return null;

  return (
    <details className="mt-2 inline-block max-w-full rounded-xs bg-warn-50 px-2 py-1 text-[0.8125rem] text-warn-ink">
      <summary className="cursor-pointer list-none marker:content-none">
        <span aria-hidden="true">⚠︎</span> {dict.plan.fairUsage}
      </summary>
      <p className="mt-1 max-w-[46ch]">
        {interpolate(dict.plan.fairUsageDetailTemplate, {
          gb: Math.round(fup.dailyThresholdMb / MB_PER_GB),
          kbps: fup.throttledToKbps ?? "—",
        })}
      </p>
    </details>
  );
}
