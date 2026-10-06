import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { providersOnSite } from '@/lib/catalogue/providersOnSite';
import type { Plan } from '@/lib/types/plan';

const plan = (providerId: string, countries: string[]) => ({ providerId, coverage: { countries } }) as unknown as Plan;

describe('providers on the site', () => {
  test('one entry per provider with plans, counted from the catalogue', () => {
    const list = providersOnSite([plan('zensim', ['GR']), plan('alosim', ['GR', 'IT']), plan('alosim', ['IT', 'FR']), plan('yesim', ['JP'])]);
    assert.deepEqual(list.map((p) => [p.id, p.plans, p.destinations]), [['alosim', 2, 3], ['yesim', 1, 1], ['zensim', 1, 1]]);
  });

  test('ordered by name, never by how many plans or what they pay', () => {
    const list = providersOnSite([plan('zensim', ['GR']), plan('zensim', ['IT']), plan('alosim', ['GR'])]);
    assert.deepEqual(list.map((p) => p.name), ['aloSIM', 'ZenSim']);
  });

  test('a provider with no plans on the site is not shown', () => {
    assert.deepEqual(providersOnSite([plan('alosim', ['GR'])]).map((p) => p.id), ['alosim']);
    assert.deepEqual(providersOnSite([]), []);
  });

  test('an unknown provider id is skipped rather than shown nameless', () => {
    assert.deepEqual(providersOnSite([plan('nobody', ['GR'])]), []);
  });
});

describe('the providers band', () => {
  test('waits for five providers before it appears', async () => {
    const { MIN_PROVIDERS_FOR_BAND } = await import('@/lib/catalogue/providersOnSite');
    assert.equal(MIN_PROVIDERS_FOR_BAND, 5);
  });
});
