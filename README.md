# eSIM Compare

An independent eSIM comparison tool for travellers. The launch market is Israel
(Hebrew, RTL, ₪), and the product is built so that other languages and
currencies are additions rather than rewrites.

> **All plan data in this repository is mock data.** Nothing here is a real
> offer from any provider. See [Mock data](#mock-data).

## Stack

Next.js 16 (App Router) · TypeScript · React 19 · Tailwind CSS v4.

```bash
npm run dev       # development server
npm run build     # production build (also typechecks)
npm run start     # serve the production build
npm run lint      # eslint
npm run test:unit # unit tests for pricing, estimation and scoring
npm run test:e2e  # smoke test the core path against a running server
```

`test:e2e` drives a real browser through destination → results. Point it at a
server you have already started:

```bash
npm run build && npm run start &
BASE_URL=http://localhost:3000 npm run test:e2e
```

## Locale routing

Every route lives under `src/app/[locale]`. Hebrew is the default locale and is
served from clean, unprefixed URLs — `/esim/thailand` is the canonical Hebrew
page — while other locales are prefixed (`/en/esim/thailand`).

`src/proxy.ts` rewrites unprefixed requests onto the `[locale]` segment and
redirects an explicit `/he/...` to the canonical form, so the two never compete
in search results.

Build links with `localePath(locale, path)` from `src/i18n/config.ts`; never
hand-write a locale prefix.

## Conventions

- **No hard-coded UI strings.** Copy lives in `src/i18n/dictionaries/`. Hebrew
  (`he.ts`) is the source of truth and defines the `Dictionary` type that every
  other locale must satisfy.
- **No physical direction in CSS.** Use logical utilities — `ps-*`, `pe-*`,
  `ms-*`, `me-*`, `start-*`, `end-*`, `text-start`, `border-s` — so RTL and LTR
  come from one stylesheet.
- **Money is integers.** Prices are stored in the currency's minor unit
  (agorot, cents) and formatted through `src/lib/formatters/price.ts`.
- **Data is MB.** Allowances are stored in MB and converted to GB only for
  display.
- **Wrap LTR values in `<Ltr>`** (`src/components/ui/Bdi.tsx`) when they sit
  inside Hebrew copy, so prices and codes keep their symbols in place.
- **Light mode only in V1.** Tokens live in `src/app/globals.css`. Blue
  (`--color-brand`) is for actions; turquoise is for value and recommendation.
  The two never swap roles.

## Coverage: country, regional and global plans

A plan is not tied to one country. `Plan.coverage` holds the kind
(`country` / `region` / `global`), the **verified** list of countries, and —
separately — the provider's own destination count.

Matching only ever reads the verified list. A provider's "works in 130
destinations" is shown as their claim, beside how many of those we can
actually confirm, because telling a traveller their country is covered has to
be something we can stand behind.

### Trips with more than one stop

Destinations are a list, and each stop carries its own length
(`?to=DE:1,US:14`). A night in Germany and a fortnight in the States are
different purchases; sizing both from one total would over-buy for the short
stop.

Results only ever contain plans covering **every** stop. When that set is thin
or expensive — which it usually is for a trip spanning two regions — a
**combination** is offered alongside it: the cheapest adequate set of plans,
found by greedy set cover minimising cost per stop covered, with a total.

Cost, not the general value score, is the objective there on purpose: the
combination earns its place by being cheaper, and a scorer weighing headroom
and features would happily pick a dearer plan and lose the argument. Candidate
plans still have to be adequate — enough data for those days, validity that
outlasts them — so it never recommends a combination that runs out. If one plan
covers everything better, no combination is shown, because then there is
nothing to combine.

No provider will ever suggest buying from a competitor to save money. That is
exactly why a comparison site should.

## How "best value" is decided

`src/lib/comparison/` holds the recommendation logic, and it exists to enforce
one rule: **price per GB alone is not value.**

`estimateDataNeed` turns the trip profile into an expected data requirement
(the daily assumptions live in one documented table). `scorePlan` then judges
each plan on whether it covers that need, on price relative to the cheapest
plan for the destination, on how cheap any extra data is, and on features —
with a near-disqualifying penalty for a plan that expires before the trip ends.

Extra data has diminishing returns, which is the whole point. For a traveller
needing 10GB:

| Plan | Price | Outcome |
| --- | --- | --- |
| 10GB | ₪60 | covers the need |
| 20GB | ₪62 | **scores highest** — the extra 10GB costs ₪2 |
| 50GB | ₪90 | scores lowest despite the best price per GB |

Price is scored as a ratio against the cheapest plan rather than a min–max
spread, so one expensive unlimited plan cannot flatten the differences beneath
it. All of the above is covered by `npm run test:unit`.

Coverage ratings are **not** an input. The `Coverage` type exists for a future
phase, but V1's fourth category is "best for browsing", which uses only facts
providers publish — 5G, number of local networks, hotspot, allowance and
limitations — and makes no claim about real-world coverage.

## Accessibility

- Contrast is enforced by a test, not by eye: `tests/contrast.test.ts` reads
  the tokens out of `globals.css` and fails if any text pair drops below
  WCAG AA on either white or the canvas tint. The greys were darkened once
  this test was written, because two of them did not pass.
- The smoke test walks the accessibility tree and fails if any button, link,
  checkbox or combobox is missing an accessible name, and checks that the
  first plan's action can be reached by tabbing alone.
- Modals are native `<dialog>` elements, so focus trapping, Escape and
  background inertness come from the platform. The FAQ and plan details are
  `<details>`, so they work without JavaScript and are found by in-page
  search.
- Tap targets are at least 44px, the result count is announced to screen
  readers as filters change, and every layout is checked for horizontal
  overflow at phone, tablet and desktop widths.

## SEO

Country pages carry per-locale titles, descriptions, canonical URLs and
hreflang alternates, and `sitemap.ts` emits every page in every locale with
its alternates.

The practical information on a country page is generated from the plans on
that page — how many providers, which local operators, how many plans offer
5G, how much data the trip is likely to need. It cannot go stale relative to
the listings, and when no plan offers 5G the page says so rather than staying
quiet. That is the difference between useful content and keyword filler.

**Indexing is off by default.** `robots.ts` disallows everything and pages are
marked `noindex` unless `NEXT_PUBLIC_ALLOW_INDEXING=true`, because indexing a
site whose every price is invented would put fabricated offers into search
results. There is deliberately no Product or Offer structured data for the same
reason, and the FAQ structured data is published on the homepage only rather
than repeated across every destination.

## Showing prices

The large number on every result is **the amount the provider charges, in the
currency it charges in**. That figure can be checked against the provider's own
page and cannot be wrong.

The converted amount sits underneath it, smaller, always prefixed with `≈` and
labelled as an estimate — because it will differ from what the traveller is
billed. Rates move between the moment we render and the moment they buy, and
card issuers convert at their own rate and add a foreign-transaction fee of
around 2–3%. A shekel figure presented as *the* price would be systematically
low, always in the same direction, and travellers notice.

Comparison, sorting, filtering and per-unit figures all still run on the
converted amount — that is what makes plans priced in dollars and euros
comparable at all — so per-unit values carry the same `≈`.

The chosen currency lives in a cookie (`CURRENCY_COOKIE`) rather than
localStorage, so the server renders prices in it on the first paint instead of
the page changing under the reader after hydration. Changing it calls
`router.refresh()` so the server re-renders with the new cookie.

## Mock data

Plan data will carry `source: 'mock' | 'api'`. Anywhere mock data is rendered,
`MockDataNotice` states so on the page, and mock discount codes are never
presented as real offers. This separation is a type-level guarantee, not a
convention to remember.

The internal `Plan` model deliberately has **no** `commission`, `payout` or
`manualRank` field. The recommendation scorer only ever receives plan facts and
the traveller's trip profile, so "we do not rank by commission" is something
you can verify in the code rather than a claim on a page.

## Build phases

1. **Foundations** — tokens, RTL, Header/Footer, UI primitives, disclosure. ✅
2. **Homepage and destination search** — hero, combobox, popular
   destinations, optional trip details, how it works, trust, FAQ. ✅
3. **Plan model, mock data, pricing and scoring** — the common `Plan` shape,
   42 mock plans across six destinations, currency conversion, per-unit
   pricing and the value scorer. ✅
4. **Results, filters and comparison** — recommendation categories,
   responsive result rows, URL-synced filters and side-by-side comparison. ✅
5. **Country page content, SEO, accessibility and QA** — practical
   information derived from the data, sitemap and robots, contrast audit,
   keyboard checks and tablet layout. ✅
