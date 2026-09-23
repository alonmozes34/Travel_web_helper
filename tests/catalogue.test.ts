import assert from 'node:assert/strict';
import { test } from 'node:test';

import { cached } from '@/lib/catalogue/cache';
import { catalogueLoader } from '@/lib/catalogue/getCatalogue';
import { parseEcbDaily, ecbRateSource } from '@/lib/sources/ecb/ecbRateSource';
import { mockPlanSource, mockRateSource } from '@/lib/sources/mockPlanSource';
import { sourceResult, type ProviderSource } from '@/lib/sources/ProviderSource';
import type { RateSource } from '@/lib/sources/RateSource';
import { currencies } from '@/i18n/config';
import { mockPlans } from '@/data/mockPlans';

// ── the cache ────────────────────────────────────────────────────────────
test('a value is reused inside its TTL and refetched after it', async () => {
  let loads = 0;
  let clock = 1_000;
  const c = cached({ load: async () => ++loads, ttlMs: 100, now: () => clock });
  await c.get();
  await c.get();
  assert.equal(loads, 1, 'a second read inside the TTL must not refetch');
  clock += 100;
  await c.get();
  assert.equal(loads, 2);
});

test('a failed refresh keeps serving the last good value', async () => {
  // The behaviour that matters. A provider having a bad minute must not cost
  // the site its catalogue: a price an hour old is a comparison, none is a
  // broken page.
  let clock = 0;
  let shouldFail = false;
  const c = cached({
    load: async () => {
      if (shouldFail) throw new Error('provider timed out');
      return 'good';
    },
    ttlMs: 10,
    now: () => clock,
  });
  const first = await c.get();
  assert.equal(first.value, 'good');
  assert.equal(first.stale, false);

  shouldFail = true;
  clock += 10;
  const second = await c.get();
  assert.equal(second.value, 'good', 'the last good value survives');
  assert.equal(second.stale, true, 'and is marked stale');
  assert.match(second.error ?? '', /timed out/);
});

test('a first load that fails is a real failure, not a silent empty catalogue', async () => {
  const c = cached({ load: async () => { throw new Error('nope'); }, ttlMs: 10 });
  await assert.rejects(() => c.get(), /nope/);
});

test('concurrent readers share one refresh', async () => {
  let loads = 0;
  const c = cached({
    load: async () => { loads += 1; await new Promise((r) => setTimeout(r, 5)); return loads; },
    ttlMs: 1000,
  });
  await Promise.all([c.get(), c.get(), c.get()]);
  assert.equal(loads, 1, 'three readers on a cold cache must not start three fetches');
});

// ── ECB rates ────────────────────────────────────────────────────────────
const ECB_SAMPLE = `<?xml version="1.0" encoding="UTF-8"?>
<gesmes:Envelope><Cube><Cube time='2026-09-11'>
<Cube currency='USD' rate='1.1592'/><Cube currency='GBP' rate='0.85815'/>
<Cube currency='ILS' rate='3.5301'/><Cube currency='JPY' rate='178.56'/>
<Cube currency='AUD' rate='1.7684'/><Cube currency='CAD' rate='1.6012'/>
<Cube currency='CHF' rate='0.9331'/><Cube currency='NZD' rate='1.9455'/>
</Cube></Cube></gesmes:Envelope>`;

test('every pair the app can be asked for is derived from the feed', () => {
  const rates = parseEcbDaily(ECB_SAMPLE);
  for (const from of currencies) {
    for (const to of currencies) {
      if (from === to) continue;
      assert.ok(rates.find((r) => r.from === from && r.to === to), `${from}->${to} missing`);
    }
  }
  assert.equal(rates.length, currencies.length * (currencies.length - 1));
});

test('the rates are crossed through the euro correctly', () => {
  const rates = parseEcbDaily(ECB_SAMPLE);
  const usdIls = rates.find((r) => r.from === 'USD' && r.to === 'ILS')!;
  // 3.5301 shekels per euro / 1.1592 dollars per euro, to the rounding below.
  assert.ok(Math.abs(usdIls.rate - 3.5301 / 1.1592) < 5e-7, String(usdIls.rate));
  const eurIls = rates.find((r) => r.from === 'EUR' && r.to === 'ILS')!;
  assert.equal(eurIls.rate, 3.5301, 'a rate the feed states directly is not disturbed');
});

test('a derived rate is a rate, not float noise', () => {
  // The division produced 3.045289855072464 and the page rendered every
  // digit, presenting arithmetic slop as precision.
  for (const rate of parseEcbDaily(ECB_SAMPLE)) {
    const decimals = (String(rate.rate).split('.')[1] ?? '').length;
    assert.ok(decimals <= 6, `${rate.from}->${rate.to} carries ${decimals} decimals: ${rate.rate}`);
  }
});

test('a rate from the feed is marked as coming from one, with its date', () => {
  const rates = parseEcbDaily(ECB_SAMPLE);
  assert.ok(rates.every((r) => r.source === 'api'));
  assert.ok(rates.every((r) => r.asOf === '2026-09-11'));
});

test('an incomplete feed fails rather than returning some pairs', async () => {
  // A page converting one currency at today's rate and another at a fallback
  // would be wrong in a way nobody could see.
  const noIls = ECB_SAMPLE.replace(/<Cube currency='ILS'[^>]*\/>/, '');
  assert.throws(() => parseEcbDaily(noIls), /ILS/);
  assert.throws(() => parseEcbDaily('<xml/>'), /date/);
  assert.throws(() => parseEcbDaily(ECB_SAMPLE.replace("rate='1.1592'", "rate='0'")), /not usable/);
});

test('the ECB source reads a feed without touching the network', async () => {
  const source = ecbRateSource({ fetchText: async () => ECB_SAMPLE, now: () => 'T' });
  const result = await source.fetch();
  assert.equal(result.sourceId, 'ecb');
  assert.equal(result.fetchedAt, 'T');
  assert.ok(result.rates.length > 0);
});

// ── the catalogue ────────────────────────────────────────────────────────
test('the demo catalogue arrives through the source interface', async () => {
  const loader = catalogueLoader({ plans: [mockPlanSource()], rates: [mockRateSource()] });
  const catalogue = await loader.get();
  assert.ok(catalogue.plans.length > 0);
  assert.ok(catalogue.rates.length > 0);
  assert.ok(catalogue.plans.every((p) => p.source === 'mock'), 'demo plans must still say so');
  assert.equal(catalogue.collisions.length, 0);
});

test('one plan source failing does not take the others with it', async () => {
  const broken: ProviderSource = {
    id: 'broken', label: 'Broken', fetch: async () => { throw new Error('502 from provider'); },
  };
  const loader = catalogueLoader({ plans: [broken, mockPlanSource()], rates: [mockRateSource()] });
  const catalogue = await loader.get();
  assert.ok(catalogue.plans.length > 0, 'the working source still supplies a catalogue');
  const failed = catalogue.sources.find((s) => s.id === 'broken')!;
  assert.equal(failed.ok, false);
  assert.match(failed.error ?? '', /502/);
});

test('rates fall through to the fallback set, and never mix', async () => {
  const broken: RateSource = {
    id: 'broken-rates', label: 'Broken', fetch: async () => { throw new Error('feed down'); },
  };
  const loader = catalogueLoader({ plans: [mockPlanSource()], rates: [broken, mockRateSource()] });
  const catalogue = await loader.get();
  const sources = new Set(catalogue.rates.map((r) => r.source));
  assert.equal(sources.size, 1, 'one page must not mix live and fallback rates');
  assert.ok(catalogue.rates.every((r) => r.source === 'mock'));
  assert.equal(catalogue.sources.find((s) => s.id === 'broken-rates')?.ok, false);
});

test('what a source refused to map is reported, not silenced', async () => {
  const noisy: ProviderSource = {
    id: 'noisy',
    label: 'Noisy',
    fetch: async () =>
      sourceResult('noisy', [], [{ externalId: 'x', label: 'Mystery 5G', reason: 'unparsable-allowance', detail: 'no allowance in "Mystery 5G"' }], 'T'),
  };
  const loader = catalogueLoader({ plans: [noisy, mockPlanSource()], rates: [mockRateSource()] });
  const catalogue = await loader.get();
  assert.equal(catalogue.skipped.length, 1);
  assert.equal(catalogue.skipped[0].reason, 'unparsable-allowance');
});

test('two sources claiming the same plan id is surfaced', async () => {
  const twin = (): ProviderSource => ({
    id: 'twin', label: 'Twin', fetch: async () => sourceResult('twin', [mockPlans[0]], [], 'T'),
  });
  const loader = catalogueLoader({ plans: [twin(), twin()], rates: [mockRateSource()] });
  const catalogue = await loader.get();
  assert.equal(catalogue.collisions.length, 1, 'a duplicate id must not silently let one win');
});
