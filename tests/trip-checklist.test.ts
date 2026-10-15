import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { countryTravelFacts } from '@/data/countryFacts.generated';
import { en } from '@/i18n/dictionaries/en';
import { he } from '@/i18n/dictionaries/he';
import { tripChecklist } from '@/lib/travel/checklist';

/**
 * The before-you-fly list (the owner, 15 October 2026): the eSIM steps, then
 * only what the country's own facts call for.
 */
const ids = (code: string) => tripChecklist(code, 'X', 'he', he).map((item) => item.id);

describe('the before-you-fly list', () => {
  test('always the eSIM steps first, and the warnings and insurance last', () => {
    for (const code of ['JP', 'FR', 'TH', 'US']) {
      const list = ids(code);
      assert.deepEqual(list.slice(0, 6), ['phone', 'plan', 'install', 'roaming', 'homeLine', 'keep']);
      assert.deepEqual(list.slice(-2), ['warnings', 'insurance']);
    }
  });

  test('Japan: an adapter line with its sockets and Israel’s, a voltage line, and driving on the left', () => {
    const list = tripChecklist('JP', 'יפן', 'he', he);
    const plugs = list.find((item) => item.id === 'plugs')!;
    assert.ok(plugs.text.includes(countryTravelFacts.JP!.plugs.join(', ')));
    assert.ok(plugs.text.includes(countryTravelFacts.IL!.plugs.join(', ')));
    assert.ok(list.some((item) => item.id === 'voltage' && item.text.includes('100')));
    assert.ok(list.some((item) => item.id === 'driving' && item.text === he.tripChecklist.items.drivingLeft));
  });

  test('France: no voltage line at 230 V, and nothing about driving, which is on the right as at home', () => {
    const list = ids('FR');
    assert.ok(!list.includes('voltage'));
    assert.ok(!list.includes('driving'));
  });

  test('a country the data knows nothing about gets only the general lines', () => {
    assert.deepEqual(ids('XX'), ['phone', 'plan', 'install', 'roaming', 'homeLine', 'keep', 'warnings', 'insurance']);
  });

  test('every line has its English too, and the external link says so', () => {
    const english = tripChecklist('JP', 'Japan', 'en', en);
    assert.ok(english.every((item) => item.text && !item.text.includes('{')));
    assert.equal(english.find((item) => item.id === 'warnings')!.external, true);
  });
});
