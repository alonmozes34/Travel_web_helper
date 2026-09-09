"use client";

import { Ltr } from "@/components/ui/Bdi";
import { Sheet } from "@/components/ui/Sheet";
import { cn } from "@/components/ui/cn";
import { currencyConfig, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/getDictionary";
import { interpolate } from "@/i18n/interpolate";
import type { ComparisonRow } from "@/lib/comparison/buildComparison";
import { MB_PER_GB, formatData } from "@/lib/formatters/data";
import { formatPrice } from "@/lib/formatters/price";
import { hasTechnology, networksForDestinations } from "@/lib/types/network";

type RowSpec = {
  key: keyof Dictionary["compare"]["rows"];
  /** A stable string used to decide whether the plans actually differ. */
  compare: (row: ComparisonRow) => string;
  render: (row: ComparisonRow) => React.ReactNode;
};

/**
 * Side-by-side comparison of up to three plans.
 *
 * Rows where every plan agrees are dimmed and rows that differ are marked, so
 * the eye goes straight to what actually separates the options instead of
 * re-reading thirteen identical cells.
 */
export function CompareTable({
  open,
  onClose,
  rows,
  locale,
  dict,
  countryCodes = [],
}: {
  open: boolean;
  onClose: () => void;
  rows: ComparisonRow[];
  locale: Locale;
  dict: Dictionary;
  /** Narrows a regional plan's networks to the destinations being compared. */
  countryCodes?: string[];
}) {
  const yes = dict.common.yes;
  const no = dict.common.no;
  const unknown = dict.common.unknown;

  // The table compares plans at the traveller's destination, so the network
  // rows read the operators there — not every operator the plan has anywhere.
  const networksAt = (row: ComparisonRow) =>
    networksForDestinations(row.plan.networks, countryCodes);

  const specs: RowSpec[] = [
    {
      key: "provider",
      compare: (row) => row.provider.name,
      render: (row) => (
        <span className="font-head font-semibold">{row.provider.name}</span>
      ),
    },
    {
      key: "price",
      compare: (row) =>
        `${row.price.sourceCurrency}${row.price.sourceAmountMinor}`,
      render: (row) => (
        <Ltr className="tnum font-head text-lg font-bold">
          {formatPrice(
            row.price.sourceAmountMinor,
            row.price.sourceCurrency,
            locale,
          )}
          <span className="ms-1 font-body text-sm font-normal text-ink-3">
            {currencyConfig[row.price.sourceCurrency].label}
          </span>
        </Ltr>
      ),
    },
    {
      key: "sourcePrice",
      compare: (row) => String(row.price.amountMinor),
      render: (row) =>
        row.price.isConverted ? (
          <Ltr className="tnum text-ink-2">
            {interpolate(dict.plan.approxTemplate, {
              price: formatPrice(
                row.price.amountMinor,
                row.price.currency,
                locale,
              ),
            })}
          </Ltr>
        ) : (
          "—"
        ),
    },
    {
      key: "data",
      compare: (row) =>
        row.plan.isUnlimited ? "unlimited" : String(row.plan.dataAmountMb),
      render: (row) =>
        row.plan.isUnlimited ? (
          dict.units.unlimited
        ) : (
          <Ltr className="tnum">
            {formatData(row.plan.dataAmountMb, locale)}
          </Ltr>
        ),
    },
    {
      key: "validity",
      compare: (row) => String(row.plan.validityDays),
      render: (row) => (
        <Ltr className="tnum">
          {interpolate(dict.filters.daysTemplate, {
            days: row.plan.validityDays,
          })}
        </Ltr>
      ),
    },
    {
      key: "perUnit",
      compare: (row) =>
        String(row.pricePerGbMinor ?? row.pricePerDayMinor ?? 0),
      render: (row) =>
        row.pricePerGbMinor !== null ? (
          <Ltr className="tnum">
            {interpolate(dict.plan.perGbTemplate, {
              price: formatPrice(
                row.pricePerGbMinor,
                row.price.currency,
                locale,
              ),
            })}
          </Ltr>
        ) : row.pricePerDayMinor !== null ? (
          <Ltr className="tnum">
            {interpolate(dict.plan.perDayTemplate, {
              price: formatPrice(
                row.pricePerDayMinor,
                row.price.currency,
                locale,
              ),
            })}
          </Ltr>
        ) : (
          "—"
        ),
    },
    {
      key: "network",
      compare: (row) =>
        networksAt(row)
          .map((network) => network.operator)
          .join("+"),
      render: (row) =>
        networksAt(row)
          .map((network) => network.operator)
          .join(" + ") || dict.plan.networkUnknown,
    },
    {
      key: "technology",
      compare: (row) =>
        networksAt(row).length === 0
          ? "unknown"
          : String(hasTechnology(networksAt(row), "5G")),
      render: (row) =>
        networksAt(row).length === 0
          ? unknown
          : hasTechnology(networksAt(row), "5G")
            ? yes
            : no,
    },
    {
      key: "hotspot",
      compare: (row) => String(row.plan.hotspot),
      render: (row) => (row.plan.hotspot ? yes : no),
    },
    {
      key: "calls",
      compare: (row) => String(row.plan.calls),
      render: (row) => (row.plan.calls ? yes : no),
    },
    {
      key: "sms",
      compare: (row) => String(row.plan.sms),
      render: (row) => (row.plan.sms ? yes : no),
    },
    {
      key: "topUp",
      compare: (row) => String(row.plan.topUp),
      render: (row) => (row.plan.topUp ? yes : no),
    },
    {
      key: "fairUsage",
      compare: (row) => String(row.plan.fairUsage?.dailyThresholdMb ?? 0),
      render: (row) =>
        row.plan.fairUsage?.dailyThresholdMb ? (
          <Ltr className="tnum text-warn-ink">
            {Math.round(row.plan.fairUsage.dailyThresholdMb / MB_PER_GB)}GB /{" "}
            {row.plan.fairUsage.throttledToKbps}kbps
          </Ltr>
        ) : (
          "—"
        ),
    },
  ];

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={dict.compare.title}
      closeLabel={dict.common.close}
      side="center"
      panelClassName="max-w-[920px]"
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] table-fixed border-collapse text-base">
          <caption className="sr-only">{dict.compare.title}</caption>
          <tbody>
            {specs.map((spec) => {
              const values = rows.map(spec.compare);
              const differs = new Set(values).size > 1;

              return (
                <tr
                  key={spec.key}
                  className={cn(
                    "border-b border-line-soft",
                    !differs && "text-ink-3",
                  )}
                >
                  <th
                    scope="row"
                    className="w-[9.5rem] py-3 pe-3 text-start align-top text-sm font-semibold text-ink-2"
                  >
                    {dict.compare.rows[spec.key]}
                    {differs ? (
                      <span className="mt-1 block text-xs font-normal text-teal-ink">
                        {dict.compare.differsLabel}
                      </span>
                    ) : null}
                  </th>
                  {rows.map((row) => (
                    <td
                      key={row.plan.id}
                      className={cn(
                        "py-3 pe-3 align-top",
                        differs && "bg-teal-50/60 font-medium text-ink",
                      )}
                    >
                      {spec.render(row)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {rows.some((row) => row.price.isConverted) ? (
        <p className="mt-4 text-sm text-ink-3">
          {dict.plan.conversionNote}
        </p>
      ) : null}
    </Sheet>
  );
}
