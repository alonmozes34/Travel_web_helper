"use client";

import { useState } from "react";
import { Button, buttonClasses } from "@/components/ui/Button";
import type { Dictionary } from "@/i18n/getDictionary";
import { interpolate } from "@/i18n/interpolate";
import { MB_PER_GB } from "@/lib/formatters/data";
import { outboundLink } from "@/lib/affiliate/link";
import { track } from "@/lib/analytics/events";
import type { ComparisonRow } from "@/lib/comparison/buildComparison";

/**
 * Primary call to action.
 *
 * A plan that carries a link is a real link — an anchor, so it opens in a new
 * tab, shows its destination in the status bar and can be middle-clicked like
 * any other. A plan without one keeps the old honest button that says the
 * prototype has no link yet. The two states are visibly the same control and
 * behave differently, which is the point: nothing here pretends.
 */
export function PlanCta({
  row,
  dict,
  size = "sm",
  detailsOpen,
  onToggleDetails,
  onChosen,
}: {
  row: ComparisonRow;
  dict: Dictionary;
  size?: "sm" | "md";
  /** The desktop list states this once beneath the rows instead. */
  detailsOpen: boolean;
  onToggleDetails: () => void;
  /**
   * Called when the traveller leaves for the provider. This site has no
   * checkout, so an outbound click is the only "chose a plan" event there is
   * — and because the link opens in a new tab, the page raising it is still
   * on screen. That is what the trip-extras offer hangs off.
   */
  onChosen?: () => void;
}) {
  const [noted, setNoted] = useState(false);
  const link = outboundLink(row.plan);
  const label = interpolate(dict.plan.viewAtTemplate, {
    provider: row.provider.name,
  });

  function recordClick() {
    track({
      name: "provider_clicked",
      planId: row.plan.id,
      providerId: row.plan.providerId,
    });
    onChosen?.();
  }

  return (
    <div className="grid gap-1.5">
      <div className="flex flex-wrap items-center gap-1">
        {link ? (
          // A plain anchor, not next/link: this leaves the site, and the
          // router has no business prefetching a provider's checkout.
          <a
            href={link.href}
            rel={link.rel}
            target={link.target}
            onClick={recordClick}
            className={buttonClasses("primary", size)}
          >
            {label}
            <span className="sr-only"> {dict.plan.opensInNewTab}</span>
          </a>
        ) : (
          <Button
            size={size}
            onClick={() => {
              recordClick();
              setNoted(true);
            }}
          >
            {label}
          </Button>
        )}
        <Button
          variant="quiet"
          size={size}
          aria-expanded={detailsOpen}
          onClick={() => {
            if (!detailsOpen) {
              track({
                name: "plan_viewed",
                planId: row.plan.id,
                providerId: row.plan.providerId,
              });
            }
            onToggleDetails();
          }}
        >
          {detailsOpen ? dict.details.close : dict.plan.details}
        </Button>
      </div>
      {/* Naming the destination on the button, and saying what happens there,
          is the difference between a link someone follows and a link someone
          is afraid of. Nobody should have to click to find out whether this
          charges them. */}
      {/* The link opens the provider's page for the destination, where this
          plan sits among the others; say which one to pick, in the terms the
          provider's own page uses. */}
      {link && row.plan.affiliateLandsOn === "destination" ? (
        <p className="text-sm font-semibold text-ink">
          {interpolate(dict.plan.pickThereTemplate, {
            provider: row.provider.name,
            days: row.plan.validityDays,
            data: row.plan.isUnlimited
              ? dict.plan.pickThereUnlimited
              : `${Math.round((row.plan.dataAmountMb / MB_PER_GB) * 10) / 10}GB`,
          })}
        </p>
      ) : null}
      <p className="text-sm text-ink-2" aria-live="polite">
        {!link && noted ? dict.plan.prototypeLink : dict.plan.buyAtProvider}
      </p>
    </div>
  );
}
