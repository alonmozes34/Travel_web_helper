import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { mockFxRates } from '@/data/fxRates';
import { profileFactKeys, providerProfiles } from '@/data/providerProfiles';
import { providers } from '@/data/providers';
import { providerSummary } from '@/lib/comparison/providerSummary';
import { MB_PER_GB } from '@/lib/formatters/data';
import type { Plan } from '@/lib/types/plan';

/**
 * Provider pages (the owner, 15–16 October 2026): only what each provider
 * publishes on its own pages, each fact with the page it was read on.
 */
const OWN_HOSTS: Record<string, readonly string[]> = {
  alosim: ['alosim.com', 'support.alosim.com'],
  yesim: ['yesim.app', 'help.yesim.tech'],
  zensim: ['zensim.com', 'documents.zensim.com.au'],
  saily: ['saily.com', 'support.saily.com'],
};

describe('what each provider publishes', () => {
  test('every provider on the site has a page, read on a stated day', () => {
    for (const provider of providers) {
      const profile = providerProfiles.find((entry) => entry.providerId === provider.id);
      assert.ok(profile, `${provider.id} has no profile`);
      assert.match(profile!.checkedOn, /^\d{4}-\d{2}-\d{2}$/);
    }
  });

  test('each fact says where it was read: the provider’s own pages, with their words', () => {
    for (const profile of providerProfiles) {
      const hosts = OWN_HOSTS[profile.providerId];
      assert.ok(hosts, `no own domains listed for ${profile.providerId}`);
      for (const key of Object.keys(profile.facts)) assert.ok((profileFactKeys as readonly string[]).includes(key), key);
      for (const [key, fact] of Object.entries(profile.facts)) {
        assert.ok(fact!.he.trim() && fact!.en.trim(), `${profile.providerId}.${key} is not worded in both languages`);
        assert.ok(fact!.sources.length > 0, `${profile.providerId}.${key} has no source`);
        for (const source of fact!.sources) {
          const url = new URL(source.url);
          assert.equal(url.protocol, 'https:');
          assert.ok(hosts.includes(url.host.replace(/^www\./, '')), `${profile.providerId}.${key}: ${url.host} is not their own site`);
          assert.ok(source.quote.trim().length > 5 && source.quote.length < 400, `${profile.providerId}.${key}: quote`);
        }
      }
    }
  });

  test('no plan prices: those come from the feeds alone', () => {
    for (const profile of providerProfiles) {
      for (const [key, fact] of Object.entries(profile.facts)) {
        assert.ok(!/[$₪]\s?\d|\d\s?[$₪]/.test(`${fact!.he} ${fact!.en}`), `${profile.providerId}.${key} names a price`);
      }
    }
  });
});

describe('what the comparison holds for a provider', () => {
  const plan = (id: string, extra: Partial<Plan>): Plan => ({
    id,
    providerId: 'saily',
    planName: id,
    coverage: { kind: 'country', countries: ['JP'], regionId: null, publishedDestinationCount: null },
    dataAmountMb: MB_PER_GB,
    isUnlimited: false,
    fairUsage: null,
    validityDays: 7,
    sourceCurrency: 'USD',
    originalPriceMinor: 500,
    finalPriceMinor: 500,
    discount: null,
    networks: [],
    hotspot: null,
    calls: null,
    sms: null,
    topUp: null,
    affiliateUrl: 'https://example.com',
    affiliateLandsOn: 'plan',
    source: 'mock',
    lastUpdatedAt: null,
    ...extra,
  });

  test('counted from the catalogue: plans, destinations, several-country plans, the cheapest, where links land', () => {
    const summary = providerSummary(
      [
        plan('a', {}),
        plan('b', { coverage: { kind: 'region', countries: ['FR', 'IT'], regionId: null, publishedDestinationCount: null }, finalPriceMinor: 300, originalPriceMinor: 300 }),
        plan('c', { isUnlimited: true, dataAmountMb: 0 }),
        plan('other', { providerId: 'yesim', finalPriceMinor: 1 }),
      ],
      'saily',
      'USD',
      mockFxRates,
    );
    assert.equal(summary.planCount, 3);
    assert.equal(summary.destinationCount, 3);
    assert.equal(summary.multiCountryCount, 1);
    assert.equal(summary.hasUnlimited, true);
    assert.equal(summary.cheapest?.plan.id, 'b');
    assert.equal(summary.landsOn, 'plan');
    assert.equal(providerSummary([], 'saily', 'USD', mockFxRates).planCount, 0);
  });
});
