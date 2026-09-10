import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import {
  gateMode,
  isAuthorised,
  isGatedPath,
  matchesPreviewPassword,
  safeNextPath,
} from '@/lib/previewGate';
import { locales } from '@/i18n/config';

/**
 * While the catalogue is mock, the site must not be publicly readable: every
 * price is invented and every one of them carries a real company's name.
 */
describe('preview gate', () => {
  test('development is open without configuration', () => {
    assert.deepEqual(gateMode({ nodeEnv: 'development' }), { kind: 'open' });
  });

  test('production with no password and no opt-out serves nothing', () => {
    // The failure that matters. Forgetting the password on a deploy must not
    // publish the site.
    assert.deepEqual(gateMode({ nodeEnv: 'production' }), { kind: 'unconfigured' });
  });

  test('production with a password challenges', () => {
    assert.deepEqual(gateMode({ nodeEnv: 'production', password: 'x' }), { kind: 'challenge' });
  });

  test('the opt-out is explicit, and only the exact string opts out', () => {
    assert.deepEqual(
      gateMode({ nodeEnv: 'production', allowUnprotected: 'true' }),
      { kind: 'open' },
    );
    for (const value of ['TRUE', '1', 'yes', '']) {
      assert.notDeepEqual(
        gateMode({ nodeEnv: 'production', allowUnprotected: value }),
        { kind: 'open' },
        `"${value}" must not open the gate`,
      );
    }
  });


  const header = (user: string, password: string) =>
    `Basic ${Buffer.from(`${user}:${password}`).toString('base64')}`;

  test('the right password is accepted, whatever the username', () => {
    assert.ok(isAuthorised(header('anyone', 'letmein'), 'letmein'));
    assert.ok(isAuthorised(header('', 'letmein'), 'letmein'));
  });

  test('a password containing a colon survives the split', () => {
    assert.ok(isAuthorised(header('user', 'a:b:c'), 'a:b:c'));
  });

  test('everything else is refused', () => {
    assert.equal(isAuthorised(header('user', 'wrong'), 'letmein'), false);
    assert.equal(isAuthorised(null, 'letmein'), false);
    assert.equal(isAuthorised('Bearer token', 'letmein'), false);
    assert.equal(isAuthorised('Basic !!!not-base64!!!', 'letmein'), false);
    assert.equal(isAuthorised(`Basic ${Buffer.from('no-colon').toString('base64')}`, 'letmein'), false);
    // An empty configured password must not turn the gate into a no-op.
    assert.equal(isAuthorised(header('user', ''), 'letmein'), false);
  });

  /**
   * Which routes the gate covers.
   *
   * The split is measured, not assumed: the public pages render zero prices
   * and name zero providers, while a country page renders seventeen prices
   * across seven real companies.
   */
  describe('scope', () => {
    const gated = [
      '/esim/thailand',
      '/esim',
      '/search',
      '/search/',
      '/he/esim/thailand',
      '/en/esim/thailand',
      '/en/search',
      '/esim/thailand/',
    ];
    for (const path of gated) {
      test(`gated: ${path}`, () => assert.ok(isGatedPath(path, locales), path));
    }

    const open = [
      '/',
      '/en',
      '/he',
      '/accessibility',
      '/en/accessibility',
      '/disclosure',
      '/privacy',
      '/terms',
    ];
    for (const path of open) {
      test(`public: ${path}`, () => assert.equal(isGatedPath(path, locales), false, path));
    }

    test('matching is on whole segments, not prefixes', () => {
      // A route that merely starts with the same letters must not be gated by
      // accident, and — far worse — a price-bearing route must not slip past
      // because someone matched loosely.
      assert.equal(isGatedPath('/esimulator', locales), false);
      assert.equal(isGatedPath('/searching', locales), false);
      assert.equal(isGatedPath('/esim-compare', locales), false);
    });

    test('a locale-looking segment that is not a locale is not stripped', () => {
      // '/de' is not one of our locales, so '/de/esim' has no locale prefix
      // and its first segment is 'de' — not gated, and correctly so: it is a
      // 404, not a results page.
      assert.equal(isGatedPath('/de/esim', locales), false);
    });
  });


  describe('the unlock cookie', () => {
    test('the right password matches', () => {
      assert.ok(matchesPreviewPassword('letmein', 'letmein'));
    });

    test('an unset password never opens the gate', () => {
      // Otherwise a deployment with SITE_PASSWORD="" would be opened by a
      // visitor sending an empty cookie.
      assert.equal(matchesPreviewPassword('', ''), false);
      assert.equal(matchesPreviewPassword('anything', ''), false);
    });

    test('a wrong or absent cookie does not', () => {
      assert.equal(matchesPreviewPassword('nope', 'letmein'), false);
      assert.equal(matchesPreviewPassword('', 'letmein'), false);
    });
  });

  describe('where unlocking sends you', () => {
    test('same-site paths are kept', () => {
      assert.equal(safeNextPath('/esim/thailand'), '/esim/thailand');
      assert.equal(safeNextPath('/en/search?to=DE:1'), '/en/search?to=DE:1');
    });

    test('anything that could leave the origin is discarded', () => {
      // `next` arrives in a URL somebody can be sent, so this is an open
      // redirect if it is trusted.
      for (const hostile of [
        '//evil.test',
        'https://evil.test',
        'http://evil.test',
        '/\\evil.test',
        '/foo\\bar',
        'esim/thailand',
        '',
        null,
        undefined,
      ]) {
        assert.equal(safeNextPath(hostile), null, String(hostile));
      }
    });
  });
});