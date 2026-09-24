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
