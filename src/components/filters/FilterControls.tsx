"use client";

import { Checkbox } from "@/components/ui/Checkbox";
import { Ltr } from "@/components/ui/Bdi";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/getDictionary";
import { interpolate } from "@/i18n/interpolate";
import type {
  FeatureKey,
  FilterOptions,
  PlanFilters,
} from "@/lib/comparison/filter";
import { featureKeys } from "@/lib/comparison/filter";
import { formatPrice } from "@/lib/formatters/price";
import type { CurrencyCode } from "@/i18n/config";

function Group({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="border-b border-line-soft py-4 first:pt-0 last:border-b-0">
      <legend className="mb-2 text-[0.7rem] font-semibold tracking-[0.09em] text-ink-3 uppercase">
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

/**
 * The filter body, shared by the desktop sidebar and the mobile sheet so the
 * two can never drift apart.
 *
 * Every option is derived from the plans actually on the page — the sidebar
 * never offers a filter that would return nothing.
 */
export function FilterControls({
  dict,
  locale,
  currency,
  options,
  filters,
  onChange,
}: {
  dict: Dictionary;
  locale: Locale;
  currency: CurrencyCode;
  options: FilterOptions;
  filters: PlanFilters;
  onChange: (filters: PlanFilters) => void;
}) {
  return (
    <div>
      <Group title={dict.filters.data}>
        <div className="flex flex-col">
          {options.dataGb.map((gb) => (
            <Checkbox
              key={gb}
              label={<Ltr className="tnum">{gb}GB</Ltr>}
              checked={filters.data.includes(String(gb))}
              onChange={() =>
                onChange({ ...filters, data: toggle(filters.data, String(gb)) })
              }
            />
          ))}
          {options.hasUnlimited ? (
            <Checkbox
              label={dict.units.unlimited}
              checked={filters.data.includes("unlimited")}
              onChange={() =>
                onChange({
                  ...filters,
                  data: toggle(filters.data, "unlimited"),
                })
              }
            />
          ) : null}
        </div>
      </Group>

      <Group title={dict.filters.validity}>
        <div className="flex flex-col">
          {options.validity.map((days) => (
            <Checkbox
              key={days}
              label={
                <Ltr className="tnum">
                  {interpolate(dict.filters.daysTemplate, { days })}
                </Ltr>
              }
              checked={filters.validity.includes(days)}
              onChange={() =>
                onChange({
                  ...filters,
                  validity: toggle(filters.validity, days),
                })
              }
            />
          ))}
        </div>
      </Group>

      {/* Offering a 5G filter for a destination whose networks nobody
          published can only ever return nothing. */}
      {options.hasKnownNetworks && (
        <Group title={dict.filters.network}>
          <div className="flex flex-col">
            <Checkbox
              label={dict.filters.onlyFiveG}
              checked={filters.onlyFiveG}
              onChange={(event) =>
                onChange({ ...filters, onlyFiveG: event.target.checked })
              }
            />
            {options.operators.map((operator) => (
              <Checkbox
                key={operator}
                label={operator}
                checked={filters.operators.includes(operator)}
                onChange={() =>
                  onChange({
                    ...filters,
                    operators: toggle(filters.operators, operator),
                  })
                }
              />
            ))}
          </div>
        </Group>
      )}

      <Group title={dict.filters.features}>
        <div className="flex flex-col">
          {featureKeys.map((feature: FeatureKey) => (
            <Checkbox
              key={feature}
              label={dict.plan[feature]}
              checked={filters.features.includes(feature)}
              onChange={() =>
                onChange({
                  ...filters,
                  features: toggle(filters.features, feature),
                })
              }
            />
          ))}
        </div>
      </Group>

      <Group title={dict.filters.providers}>
        <div className="flex flex-col">
          {options.providers.map((provider) => (
            <Checkbox
              key={provider.id}
              label={provider.name}
              checked={filters.providers.includes(provider.id)}
              onChange={() =>
                onChange({
                  ...filters,
                  providers: toggle(filters.providers, provider.id),
                })
              }
            />
          ))}
        </div>
      </Group>

      <Group title={dict.filters.price}>
        <label className="block">
          <span className="sr-only">{dict.filters.price}</span>
          <input
            type="range"
            min={options.minPriceMinor}
            max={options.maxPriceMinor}
            step={100}
            value={filters.maxPriceMinor ?? options.maxPriceMinor}
            onChange={(event) =>
              onChange({
                ...filters,
                maxPriceMinor: Number.parseInt(event.target.value, 10),
              })
            }
            className="h-11 w-full accent-brand"
          />
        </label>
        <p className="tnum mt-1 text-[0.8125rem] text-ink-2">
          <Ltr>
            {formatPrice(options.minPriceMinor, currency, locale)} —{" "}
            {formatPrice(
              filters.maxPriceMinor ?? options.maxPriceMinor,
              currency,
              locale,
            )}
          </Ltr>
        </p>
      </Group>
    </div>
  );
}
