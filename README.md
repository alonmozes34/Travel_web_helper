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
4. Results, filters and comparison.
5. Thailand country page, accessibility and polish.
