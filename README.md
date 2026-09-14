# יש קליטה? (Yesh Klita)

An independent eSIM comparison site for travellers. The launch market is Israel
(Hebrew, RTL, ₪), and the product is built so that other languages and
currencies are additions rather than rewrites.

The brand is **יש קליטה?** — the question a traveller asks on landing. The
question mark is part of the visible wordmark and never appears in a URL, a
file name, an environment variable or any other identifier; the technical
identifier is `yeshklita`.

The domain is never hard-coded, and **the serving host decides it**.
`resolveSiteUrl` in `src/lib/site.ts` takes `VERCEL_PROJECT_PRODUCTION_URL`
when the host supplies one, otherwise `NEXT_PUBLIC_SITE_URL`, otherwise
localhost. A first deploy needs nothing configured, and attaching a custom
domain is picked up on its own.

That order is the way round it is because of what happened when it was the
other way. `NEXT_PUBLIC_SITE_URL` was set to a domain that had never been
bought and had no DNS at all, while the site served from somewhere else: every
canonical link, every sitemap entry and the Open Graph image addressed the dead
host, so the site looked perfect and a shared link showed a blank preview. The
variable stayed wrong across two attempts to correct it, because it lives in a
dashboard and nothing in the system could contradict it. A host that reports
its production domain cannot be wrong about which domain answers; a settings
page can be. So the canonical domain is now chosen in one place — the host's
domain settings — and a `NEXT_PUBLIC_SITE_URL` that disagrees is named in the
build log and ignored.

**Redeploy after attaching a domain.** The homepage and the English homepage
are prerendered, so their canonical link and share-card URL are fixed at build
time. Dynamic routes pick the new domain up immediately; those two do not,
until the next build.

We compare. The traveller buys from the provider — this site never sells or
issues an eSIM, and the copy says so on every page that shows a price.

## Demo providers, and the gate that is no longer needed

Every price in `src/data/mockPlans.ts` is invented. They used to be attached
to **real, named companies** — Airalo, Nomad, Saily and five others, with
their actual product names ("Discover Thailand", "Eurolink", "Mamma Mia") —
and that is a false claim about somebody else's commercial terms, which a
warning banner does not cure. So the priced routes sat behind a password.

The providers are now plainly demo providers. Nobody is misrepresented, the
banner still says the data is not real, and the site is public — which is the
point, because a comparison tool nobody can open demonstrates nothing. The
real names come back with real data, from a provider source, and not before.

The gate machinery stays, because the need recurs. `PREVIEW_GATE=on` together
with `SITE_PASSWORD` closes `/esim/*` and `/search` again, redirecting to
`/unlock`:

| `PREVIEW_GATE` | `SITE_PASSWORD` | Priced routes |
| --- | --- | --- |
| unset | anything | **public** |
| `on` | set | redirect to `/unlock` |
| `on` | unset | 503 — a half-configured gate fails safe |

Both are required on purpose: a password left behind in a dashboard cannot
quietly shut the site. `GATED_SEGMENTS` in `src/lib/previewGate.ts` lists what
closes — `esim` and `search`. It is an allow-nothing list, so a new route that
shows prices has to be added there deliberately.

`/unlock` is a real page, not the browser's credential dialog. A dialog cannot
be reached by client-side navigation — pressing "השוו חבילות" fetched the next
route, got a 401 it could not prompt for, and left the visitor exactly where
they were with nothing having happened. Unlocking sets an httpOnly cookie; the
`next` parameter is validated by `safeNextPath` so it cannot become an open
redirect. An `Authorization: Basic` header is also accepted, so `curl` and a
deploy check need no browser session.

## Brand assets

`src/app/icon.svg` is the mark — a signal-strength climb, which is the literal
picture of the name. Everything else is derived from it and from the
dictionaries by `npm run generate:brand`, which needs the built site running
because the share cards are drawn inside a page of it, in the same Rubik and
Assistant that `next/font` self-hosts:

```
npm run build && npm run start &
BASE_URL=http://localhost:3000 npm run generate:brand
```

It writes `src/app/favicon.ico` (16/32/48), `src/app/apple-icon.png`,
`public/icon-192.png`, `public/icon-512.png` and one 1200x630 share card per
locale (`public/share-he.png`, `public/share-en.png`). The output is committed
so a deploy never depends on a browser being available at build time.

The share cards are referenced explicitly from `generateMetadata` rather than
through Next's `opengraph-image` file convention: the locale layout declares
its own `openGraph` block, and a segment that does so replaces the images it
would otherwise inherit. `npm run test:e2e` fails if a page stops carrying an
`og:image`, or if any brand asset stops being served.

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
npm run test:a11y # axe-core audit plus reflow, zoom, keyboard and target-size checks

npm run generate:countries # regenerate the country list from CLDR
npm run generate:brand     # regenerate favicon, app icons and share cards
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

`npm run test:a11y` runs axe-core over the homepage, a country page, a
multi-stop search, the empty search, the English homepage, the open mobile
menu and the open comparison dialog, against the WCAG 2.0/2.1/2.2 A and AA
rule sets — currently **zero violations**. It then checks what axe cannot see:
reflow at 320px, text at 200%, completing the search with the keyboard alone,
a visible focus indicator on every tabbable element, WCAG 2.2 target sizes and
`prefers-reduced-motion`.

### Accessibility statement

`/accessibility` is live and linked from every page's footer. Every detail on
it comes from `src/data/accessibility.ts`, where **all fields are currently
`null`**:

| Field | Required? | What goes in it |
| --- | --- | --- |
| `operator` | answered | An individual, or a registered entity by name |
| `lastReviewedAt` | **yes** | ISO date of the technical review |
| `contact.email` **or** `.phone` | **yes** | Somewhere a barrier can be reported |
| `auditedBy` | no | A מורשה נגישות שירות is not required to approve a *website* under regulation 35 |
| `contact.coordinatorName` | no | A רכז נגישות is required of an organisation with 25+ employees |
| `contact.postalAddress`, `.responseWindowDays` | no | Published if offered |

The optional rows are rendered as an explanation of *why* they are absent,
never as a blank or a "not yet set" marker — a reader cannot tell an
exemption from an omission, and the page has to say which it is.

Demanding all seven put eight "not yet set" markers on a live page, four of
them inside the section inviting people to report a problem — so it asked for
reports and offered nobody anywhere to send one. When no contact route is
configured at all, that section now says so plainly instead.

`operator` is never "missing": a personal project run by one person before any
company exists is the ordinary way something like this starts, and marking it
as an unfilled field says something false about the operator while inviting
them to invent a company name to clear the warning. It is `{ kind:
'individual' }` or `{ kind: 'entity', name }`, and the page states either
truthfully in whichever language it is read.

That leaves exactly one thing outstanding: somewhere to report a barrier. The
banner at the top of the page says so by name rather than calling the whole
statement a skeleton.

This reading of the regulations is recorded here so it can be checked; it is
not legal advice.

While anything is missing the page carries a "draft — not yet complete" notice
and marks each empty field, rather than reading like a finished legal document
with invented details.

**Indexing is gated on this at runtime.** `allowIndexing` in `src/lib/site.ts`
requires both `NEXT_PUBLIC_ALLOW_INDEXING=true` *and* a complete statement, so
`robots.txt` keeps disallowing and every page keeps its `noindex` until the
table above is filled in. A build that asked to be indexed and was refused
says so on stdout, naming the missing fields. This used to be a unit test
alone, which never runs on the host where that variable is actually set —
`next build` does not run tests — so the guard existed everywhere except where
the risk was.

Tests hold both halves: one fails if any field looks like a placeholder
(`example`, `123456`, `ישראל ישראלי`), one fails if indexing is ever on while
the statement is incomplete, and one fails if a *complete* statement stops
releasing the gate.

**Automated rules find a minority of real barriers.** Nothing here has been
tested with an actual screen reader, and the site has not been reviewed by a
licensed accessibility consultant. In Israel, IS 5568 (which adopts WCAG 2.0
AA) is the binding standard for public-facing websites, and compliance also
requires a published accessibility statement and a contact route for
accessibility issues — neither of which exists yet, because both need real
business details.

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
