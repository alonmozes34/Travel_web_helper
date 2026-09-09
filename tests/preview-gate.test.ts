import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { gateMode, isAuthorised, PREVIEW_REALM } from '@/lib/previewGate';

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

  test('the realm is ASCII, so the 401 does not become a 500', () => {
    // HTTP header values are ByteStrings. An em dash here throws inside the
    // response constructor, and every refusal turns into a server error —
    // which is how this shipped the first time.
    for (const character of PREVIEW_REALM) {
      assert.ok(
        character.charCodeAt(0) <= 255,
        `"${character}" (${character.charCodeAt(0)}) cannot go in a header value`,
      );
    }
    assert.ok(!PREVIEW_REALM.includes('"'), 'a quote would terminate the realm early');
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
});
