/**
 * Fetch an impact.com catalogue and report what it yields.
 *
 * The point of this script is the report, not the import. Before any of this
 * data reaches the site, someone has to answer a question no documentation
 * can: does this advertiser publish a product catalogue, and does it carry
 * enough for a comparison? Run this and read the output.
 *
 *   IMPACT_ACCOUNT_SID=... IMPACT_AUTH_TOKEN=... \
 *   npm run fetch:impact -- --catalog 12345 --provider airalo
 *
 * With no credentials it runs against the fixture, so the pipeline can be
 * exercised end to end today.
 */
import { impactSource } from "../src/lib/sources/impact/impactSource";
import { impactFixture } from "../src/lib/sources/impact/fixture";
import { formatData } from "../src/lib/formatters/data";

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? undefined : process.argv[index + 1];
}

const accountSid = process.env.IMPACT_ACCOUNT_SID;
const authToken = process.env.IMPACT_AUTH_TOKEN;
const live = Boolean(accountSid && authToken);

const catalogId = arg("catalog") ?? "fixture";
const providerId = arg("provider") ?? "airalo";

const source = impactSource({
  credentials: {
    accountSid: accountSid ?? "fixture",
    authToken: authToken ?? "fixture",
  },
  catalogues: [{ catalogId, providerId }],
  ...(live ? {} : { fetchJson: async () => impactFixture }),
});

async function main() {
  const result = await source.fetch();

  console.log(
    live
      ? `LIVE  catalogue ${catalogId} → ${providerId}`
      : "FIXTURE (no credentials set)",
  );
  console.log(`fetched at ${result.fetchedAt}`);
  console.log(
    `\nmapped ${result.plans.length}, skipped ${result.skipped.length}\n`,
  );

  for (const plan of result.plans) {
    const size = plan.isUnlimited
      ? "unlimited"
      : formatData(plan.dataAmountMb, "en");
    const where =
      plan.coverage.kind === "country"
        ? plan.coverage.countries[0]
        : `${plan.coverage.regionId} (${plan.coverage.countries.length})`;
    console.log(
      `  ✓ ${plan.planName}\n` +
        `      ${size} · ${plan.validityDays}d · ${plan.sourceCurrency} ${(plan.finalPriceMinor / 100).toFixed(2)} · ${where}`,
    );
  }

  if (result.skipped.length) {
    console.log("\nskipped, by reason:");
    const byReason = new Map<string, typeof result.skipped>();
    for (const entry of result.skipped) {
      byReason.set(entry.reason, [
        ...(byReason.get(entry.reason) ?? []),
        entry,
      ]);
    }
    for (const [reason, entries] of [...byReason].sort()) {
      console.log(`\n  ${reason} — ${entries.length}`);
      for (const entry of entries.slice(0, 10)) {
        console.log(`      ${entry.label}\n        ${entry.detail}`);
      }
      if (entries.length > 10)
        console.log(`      … and ${entries.length - 10} more`);
    }
  }

  // The number that decides whether this integration is viable at all.
  const total = result.plans.length + result.skipped.length;
  if (total > 0) {
    const rate = Math.round((result.plans.length / total) * 100);
    console.log(`\nusable: ${rate}% of ${total} catalogue items`);
    if (rate < 60) {
      console.log(
        "A low rate here is information, not a bug: it means the catalogue does\n" +
          "not describe plans in a way a comparison can read, and this advertiser\n" +
          "needs structured custom fields or a different source.",
      );
    }
  }
}

main().catch((error) => {
  console.error(String(error instanceof Error ? error.message : error));
  process.exit(1);
});
