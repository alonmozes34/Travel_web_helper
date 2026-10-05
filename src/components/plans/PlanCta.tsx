"use client";

import { useState, type ReactNode } from "react";
import { Button, buttonClasses } from "@/components/ui/Button";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/getDictionary";
import { interpolate } from "@/i18n/interpolate";
import { MB_PER_GB } from "@/lib/formatters/data";
import { outboundLink } from "@/lib/affiliate/link";
import { track } from "@/lib/analytics/events";
import type { ComparisonRow } from "@/lib/comparison/buildComparison";
import { isPresentableDiscount } from "@/lib/types/discount";
import { useTripExtras } from "@/components/extras/TripExtrasProvider";
import { BeforeYouGo, beforeYouGoSnoozed } from "./BeforeYouGo";
import { copyText } from "./CopyCodeButton";

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
  locale,
  size = "sm",
  detailsOpen,
  detailsId,
  onToggleDetails,
  onChosen,
  demoDataEnabled = false,
  share,
  describedBy,
}: {
  row: ComparisonRow;
  dict: Dictionary;
  locale: Locale;
  size?: "sm" | "md";
  /** The desktop list states this once beneath the rows instead. */
  detailsOpen: boolean;
  /** The id of the panel the details button opens. */
  detailsId?: string;
  onToggleDetails: () => void;
  /**
   * Called when the traveller leaves for the provider. This site has no
   * checkout, so an outbound click is the only "chose a plan" event there is
   * — and because the link opens in a new tab, the page raising it is still
   * on screen. That is what the trip-extras offer hangs off.
   */
  onChosen?: () => void;
  /** Whether a demo discount code may be shown, as on the card. */
  demoDataEnabled?: boolean;
  /** A share button, kept in the same row as the plan's other actions. */
  share?: ReactNode;
  /**
   * The card's heading. Ten cards each had a "more details" button and
   * several a "go to Yesim" one, with nothing a screen reader could tell
   * apart; described by the heading, each says which plan it belongs to.
   */
  describedBy?: string;
}) {
  const [noted, setNoted] = useState(false);
  const [beforeYouGo, setBeforeYouGo] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  // A code the traveller has to type at the provider's checkout. It is copied
  // on the way out, without a question — the owner: the question on the way
  // out is the rental car, not the code.
  const { discount } = row.plan;
  const codeToType =
    discount && !discount.appliedByLink && isPresentableDiscount(discount, demoDataEnabled) ? discount : null;
  // The car question, when a real rental network is connected.
  const askCar = Boolean(useTripExtras()?.carRentalOffer);
  const hasDialog = askCar;

  async function copyCodeOnTheWay() {
    if (codeToType && (await copyText(codeToType.code))) setCodeCopied(true);
  }
  const link = outboundLink(row.plan, locale);
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
      <div className="flex flex-wrap items-center gap-2">
        {link ? (
          // A plain anchor, not next/link: this leaves the site, and the
          // router has no business prefetching a provider's checkout.
          <a
            href={link.href}
            aria-describedby={describedBy}
            rel={link.rel}
            target={link.target}
            onClick={(event) => {
              if (hasDialog && !beforeYouGoSnoozed()) {
                event.preventDefault();
                setBeforeYouGo(true);
                return;
              }
              void copyCodeOnTheWay();
              if (hasDialog) {
                // Snoozed: straight through, and no car question on the page
                // either — "not for ten minutes" means it.
                track({ name: "provider_clicked", planId: row.plan.id, providerId: row.plan.providerId });
                return;
              }
              recordClick();
            }}
            className={buttonClasses("primary", size, "grow sm:grow-0")}
          >
            {label}
            <span className="sr-only"> {dict.plan.opensInNewTab}</span>
          </a>
        ) : (
          <Button
            size={size}
            aria-describedby={describedBy}
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
          aria-controls={detailsOpen ? detailsId : undefined}
          aria-describedby={describedBy}
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
        {share}
      </div>
      {/* Naming the destination on the button, and saying what happens there,
          is the difference between a link someone follows and a link someone
          is afraid of. Nobody should have to click to find out whether this
          charges them. */}
      {/* The link opens the provider's page for the destination, where this
          plan sits among the others; say which one to pick, in the terms the
          provider's own page uses. */}
      {link && (row.plan.affiliateLandsOn === "destination" || row.plan.affiliateLandsOn === "duration") ? (
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
      {link && hasDialog ? (
        <BeforeYouGo
          open={beforeYouGo}
          onClose={() => setBeforeYouGo(false)}
          row={row}
          discount={codeToType}
          link={link}
          dict={dict}
          locale={locale}
          onContinue={(askedAboutCar) => {
            void copyCodeOnTheWay();
            track({ name: "provider_clicked", planId: row.plan.id, providerId: row.plan.providerId });
            // Asked in the dialog already: the page does not ask again.
            if (!askedAboutCar) onChosen?.();
            setBeforeYouGo(false);
          }}
        />
      ) : null}
      {/* "You don't pay here" is said once under the list, not on every
          card; only the demo's dead button needs a word of its own. */}
      <p className="text-sm text-ink-2 empty:hidden" aria-live="polite">
        {!link && noted ? dict.plan.prototypeLink : null}
        {codeCopied && codeToType
          ? interpolate(dict.plan.codeCopiedOnTheWayTemplate, { code: codeToType.code, provider: row.provider.name })
          : null}
      </p>
    </div>
  );
}
