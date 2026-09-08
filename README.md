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
3. Plan model, mock data, pricing and scoring.
4. Results, filters and comparison.
5. Thailand country page, accessibility and polish.
