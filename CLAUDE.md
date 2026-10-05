@AGENTS.md

# Standing constraints for this project

These outlive any one session. Read them before planning work, and do not
treat them as done because a previous session said something was green.

## Accessibility is not a feature, and it is not optional

The owner operates from Israel and is explicit that legal exposure is the
concern. Israeli law (the Equal Rights for Persons with Disabilities (Service
Accessibility Adjustments) Regulations, 5773-2013, regulation 35, with IS 5568
as the technical standard) obliges a public-facing service site to be
accessible **and** to publish a statement with a route for reporting a
barrier.

Rules that follow from that, and hold for every change:

1. **Never let a change reduce accessibility.** Every commit runs
   `npm run test:a11y` — axe-core across the pages and dialogs, plus reflow at
   320px, 200% text, keyboard-only completion of the funnel, visible focus,
   target size and reduced motion. A red run blocks the change; it is not a
   thing to fix later.

2. **A passing automated run is not conformance, and must never be described
   as one.** Automated rules catch a minority of real barriers. The site has
   never been tested with a screen reader (NVDA, VoiceOver, JAWS) and has not
   been reviewed by a licensed מורשה נגישות שירות. Say so plainly whenever the
   subject comes up.

3. **The statement may never contain an invented detail.** A placeholder name,
   phone or licence number published as though it were real is worse than
   publishing nothing, and it is exactly the kind of thing a complaint is
   built on. A field nobody has supplied stays empty and is marked.

4. **Do not tell the owner they are safe.** The current reading — no
   registered business, no turnover, `noindex`, nothing sold — points at the
   exemption in regulation 35ו(ז), and a licensed consultant is not required
   for a website. That is a reading of the regulations, recorded in the README
   so it can be checked, and it is not legal advice. It also expires: the
   obligation attaches when a business is registered and turnover grows.

5. **The contact route is in place, and it is only a route if someone reads
   it.** The owner supplied `yeshklita.info@gmail.com` on 14 September 2026
   (commit `ccd877a`), and `/accessibility` links to it. The gate in
   `src/lib/site.ts` still checks the statement on every build, so if the
   address is ever removed indexing closes again by itself. Check
   `missingAccessibilityFields()` before describing the statement as
   incomplete — an earlier session did so from this file after the gap had
   closed. Phone, postal address and response window stay empty and marked
   until the owner supplies them; do not fill them.

## Every buy link opens the plan the visitor chose

The owner's rule (28 September 2026): "every link must go to the specific
plan — if the customer starts searching on the provider's site, we have done
nothing." `buyLinkLandsOnPlan` in `src/lib/catalogue/getCatalogue.ts` drops
any real plan whose link lands anywhere else. Yesim's links open each plan's
own page on yesim.app (`yesimPlanLink`, since 0.10.0), so Yesim is on the
site; a Yesim plan whose page address is not known falls back to the country
page and is dropped by this rule. (An earlier version of this file said Yesim
was hidden — it was stale by 5 October 2026; check the live /api/status
`listedPlansByProvider` rather than this file.) Do not weaken the rule to
show a provider — ask the provider for plan links.

**The one exception is ZenSim, and it is the owner's own (29 September
2026).** ZenSim have no plan-level link and no price feed. The owner allowed,
for ZenSim only:

- a link that opens their country page on the plan's duration, with the plan
  among the three or four on screen (`affiliateLandsOn: 'duration'`, allowed
  only for providers in `DURATION_LINK_ALLOWED`). The card says which plan to
  pick there. "If the links bring me to where I can choose the right plan for
  the region and the number of days, that's great."
- reading their prices from their own country pages — only the schema.org
  data they publish for search engines, every six hours
  (`src/lib/sources/zensim/`). Their private GraphQL backend is not used.

Neither extends to any other provider without the owner saying so. If ZenSim
ever offer a feed or plan links, switch to those.

## Versions

The owner asked to be able to follow what changed. Every change that reaches
the site is released as a version:

- Move `siteVersion` and `releasedOn` in `src/lib/version.ts` and `version` in
  `package.json` together — `tests/version.test.ts` fails if they disagree.
- Add an entry at the top of `CHANGELOG.md`, in Hebrew, in words the owner
  would use: what a visitor would notice, not what the code did.
- Tag the commit `v<version>`. The cloud sessions may push only their branch —
  a tag push is refused there, and is not to be worked around — so the tag
  stays local unless the owner adds it on GitHub; the changelog and the
  footer are the record that matters.
- Minor for anything a visitor could notice, patch for fixes only; `1.0.0` is
  the public launch.

The footer shows the version, its date, and the commit the host built, so the
owner can check which build is live.

## After every scheduled run, problems get fixed

The owner (3 October 2026): "after every run, if there are problems, they
must be fixed." Two Routines run unattended and only report — neither may
push, because a push to the branch deploys the live site:

- **Nightly QA** (02:49 Israel time) publishes
  https://claude.ai/artifact/Ac41PCCjrreHJ7wL14G8r3
- **Weekly eSIM devices check** (Sunday 08:47) publishes
  https://claude.ai/artifact/1PomsmJSh2SA6ngKV6ec2i

The owner's main session watches both pages and is woken when either is
republished. On each wake: read the report; for every failure, reproduce it,
find the cause, fix it (site, data or test — whichever is wrong), run the
suites including `npm run test:a11y`, version it if a visitor would notice,
push, and tell the owner in Hebrew what failed and what was done. A provider's
momentary outage is fixed by making the check tolerate it, never by deleting
the check; a test is never skipped or weakened to get green. Device changes
are applied only as copied from the manufacturer's own page.
