import assert from 'node:assert/strict';
import { test } from 'node:test';
import { impactSource } from '../src/lib/sources/impact/impactSource';
import { impactFixture } from '../src/lib/sources/impact/fixture';
import { mapImpactItem } from '../src/lib/sources/impact/mapItem';
import {
  destinationCandidates,
  parseAllowanceMb,
  parseValidityDays,
} from '../src/lib/sources/parsePlanText';
import { MB_PER_GB } from '../src/lib/formatters/data';

const credentials = { accountSid: 'test', authToken: 'test', baseUrl: 'https://example.test' };
const catalogues = [{ catalogId: '1', providerId: 'airalo' }];

async function run() {
  const source = impactSource({
    credentials,
    catalogues,
    fetchJson: async () => impactFixture,
    now: () => '2026-09-09T00:00:00.000Z',
  });
  return source.fetch();
}

test('a catalogue item becomes a plan only when every fact is recoverable', async () => {
  const { plans, skipped } = await run();
  const ids = plans.map((plan) => plan.id);

  assert.deepEqual(ids.sort(), [
    'impact-airalo-ex-1',
    'impact-airalo-ex-2',
    'impact-airalo-ex-3',
    'impact-airalo-ex-4',
  ]);
  assert.equal(skipped.length, 5);
});

test('every refusal says which fact was missing', async () => {
  const { skipped } = await run();
  const byId = new Map(skipped.map((entry) => [entry.externalId, entry]));

  assert.equal(byId.get('ex-5')?.reason, 'unparsable-allowance');
  assert.equal(byId.get('ex-6')?.reason, 'unparsable-validity');
  assert.equal(byId.get('ex-7')?.reason, 'unknown-destination');
  assert.equal(byId.get('ex-8')?.reason, 'out-of-stock');
  assert.equal(byId.get('ex-9')?.reason, 'unsupported-currency');

  for (const entry of skipped) {
    assert.ok(entry.detail.length > 0, `${entry.externalId} has no detail`);
    assert.ok(entry.label.length > 0, `${entry.externalId} has no label`);
  }
});

test('"5G" in a plan name is a technology, never a 5GB allowance', async () => {
  // The single most damaging parse this feed can produce: a 20GB plan sold as
  // a 5GB one because its name advertises the network.
  assert.equal(parseAllowanceMb('Italy 20GB 30 Days 5G'), 20 * MB_PER_GB);
  assert.equal(parseAllowanceMb('Japan 5G plan 30 days'), null);

  const { plans } = await run();
  const italy = plans.find((plan) => plan.id === 'impact-airalo-ex-4');
  assert.equal(italy?.dataAmountMb, 20 * MB_PER_GB);
});

test('two different allowances in one name are refused, not chosen between', () => {
  assert.equal(parseAllowanceMb('Japan 5GB or 10GB'), null);
  assert.equal(parseValidityDays('valid 15 days, extendable to 30 days'), null);
});

test('a validity beyond a year is not a validity', () => {
  assert.equal(parseValidityDays('2000 days'), null);
  assert.equal(parseValidityDays('30 Days'), 30);
  assert.equal(parseValidityDays('1 Day'), 1);
});

test('prices and currencies come from the feed or the item is dropped', async () => {
  const { plans } = await run();
  const japan = plans.find((plan) => plan.id === 'impact-airalo-ex-1');

  assert.equal(japan?.sourceCurrency, 'USD');
  assert.equal(japan?.finalPriceMinor, 1800);
  assert.equal(japan?.originalPriceMinor, 2200, 'a genuine was-price is kept');

  const thailand = plans.find((plan) => plan.id === 'impact-airalo-ex-2');
  assert.equal(
    thailand?.originalPriceMinor,
    thailand?.finalPriceMinor,
    'no OriginalPrice means no discount, not a zero',
  );
});

test('a region in the name resolves to the countries in it, never to a label', async () => {
  const { plans } = await run();
  const europe = plans.find((plan) => plan.id === 'impact-airalo-ex-3');

  assert.equal(europe?.coverage.kind, 'region');
  assert.equal(europe?.coverage.regionId, 'europe');
  assert.ok((europe?.coverage.countries.length ?? 0) > 10);
  assert.ok(europe?.coverage.countries.includes('FR'));
  assert.equal(europe?.isUnlimited, true);
});

test('a feed cannot claim features it does not carry', async () => {
  // An affiliate catalogue has no network, hotspot, calls, SMS or fair-usage
  // data. Those must arrive as absent, not as generous defaults.
  const { plans } = await run();
  for (const plan of plans) {
    assert.deepEqual(plan.networks, []);
    assert.equal(plan.hotspot, false);
    assert.equal(plan.calls, false);
    assert.equal(plan.sms, false);
    assert.equal(plan.topUp, false);
    assert.equal(plan.fairUsage, null);
  }
});

test('plans from a real source are marked as such and carry their link', async () => {
  const { plans, sourceId, fetchedAt } = await run();
  assert.equal(sourceId, 'impact');
  assert.equal(fetchedAt, '2026-09-09T00:00:00.000Z');

  for (const plan of plans) {
    assert.equal(plan.source, 'api');
    assert.equal(plan.lastUpdatedAt, '2026-09-09T00:00:00.000Z');
    assert.ok(plan.affiliateUrl?.startsWith('https://'), plan.id);
  }
});

test('a declared country code is trusted over the name', () => {
  const mapped = mapImpactItem(
    {
      CatalogItemId: 'x',
      Name: 'Mystery Pack 10GB 30 Days',
      Url: 'https://example.test/x',
      CurrentPrice: '10.00',
      Currency: 'USD',
      country_code: 'PT',
    },
    { catalogId: '1', providerId: 'airalo', fields: { countryCode: 'country_code' } },
    '2026-09-09T00:00:00.000Z',
  );
  assert.ok('plan' in mapped);
  assert.deepEqual(mapped.plan.coverage.countries, ['PT']);
});

test('structured custom fields are preferred to parsing prose', () => {
  const mapped = mapImpactItem(
    {
      CatalogItemId: 'y',
      // The name says one thing; the advertiser's own fields say another.
      Name: 'Japan Traveller Pack',
      Url: 'https://example.test/y',
      CurrentPrice: '10.00',
      Currency: 'USD',
      gb: 25,
      days: 45,
    },
    {
      catalogId: '1',
      providerId: 'airalo',
      fields: { allowanceMb: 'gb', validityDays: 'days' },
    },
    '2026-09-09T00:00:00.000Z',
  );
  assert.ok('plan' in mapped);
  assert.equal(mapped.plan.dataAmountMb, 25);
  assert.equal(mapped.plan.validityDays, 45);
});

test('destination candidates strip the parts that are never a place', () => {
  const candidates = destinationCandidates('Japan 10GB 30 Days 5G eSIM');
  assert.ok(candidates.includes('Japan'));
  assert.ok(!candidates.some((candidate) => /GB|Days|5G|eSIM/i.test(candidate)));
});

test('paging follows the next-page link without looping', async () => {
  let calls = 0;
  const source = impactSource({
    credentials,
    catalogues,
    fetchJson: async (url) => {
      calls += 1;
      // A feed that points at itself must not spin forever.
      return url.includes('page=2')
        ? { Items: [] }
        : { Items: impactFixture.Items, '@nextpageuri': '/page=2' };
    },
    now: () => '2026-09-09T00:00:00.000Z',
  });
  const result = await source.fetch();
  assert.equal(calls, 2);
  assert.equal(result.plans.length, 4);
});
