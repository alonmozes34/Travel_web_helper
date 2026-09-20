import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { deviceGroups, deviceSources, devicesCheckedOn } from '@/data/devices';
import { countMatchedModels, findDevices, normaliseDeviceText } from '@/lib/devices';
import { he } from '@/i18n/dictionaries/he';
import { en } from '@/i18n/dictionaries/en';

/**
 * The device list is a claim about somebody else's hardware, published to a
 * reader who is about to spend money on the strength of it. These tests guard
 * the two ways that goes wrong: a model that silently loses its label or its
 * source, and a search box that answers "not supported" when it only means
 * "I did not understand you".
 */
describe('device data', () => {
  test('every group has a title in both dictionaries', () => {
    for (const group of deviceGroups) {
      const key = group.id as keyof typeof he.devicesPage.groupTitles;
      assert.ok(he.devicesPage.groupTitles[key], `missing Hebrew title for ${group.id}`);
      assert.ok(en.devicesPage.groupTitles[key], `missing English title for ${group.id}`);
    }
  });

  test('every note and source a group refers to exists', () => {
    for (const group of deviceGroups) {
      for (const note of group.notes) {
        assert.ok(he.devicesPage.notes[note], `missing Hebrew note ${note}`);
        assert.ok(en.devicesPage.notes[note], `missing English note ${note}`);
      }
      assert.ok(group.sources.length > 0, `${group.id} cites no source`);
      for (const source of group.sources) {
        assert.ok(deviceSources[source], `${group.id} cites unknown source ${source}`);
        assert.ok(
          he.devicesPage.list.sourceLabels[source],
          `source ${source} has no Hebrew label`,
        );
      }
    }
  });

  test('every source is a manufacturer URL carrying the date it was read', () => {
    const manufacturers = ['support.apple.com', 'samsung.com', 'support.google.com'];
    for (const [id, source] of Object.entries(deviceSources)) {
      assert.ok(
        manufacturers.some((host) => source.url.includes(host)),
        `${id} does not point at a manufacturer: ${source.url}`,
      );
      assert.match(source.checkedOn, /^\d{4}-\d{2}-\d{2}$/, `${id} has no readable date`);
    }
  });

  test('no model is listed twice, in the same group or across groups', () => {
    const seen = new Map<string, string>();
    for (const group of deviceGroups) {
      for (const model of group.models) {
        const previous = seen.get(model);
        assert.equal(previous, undefined, `${model} appears in ${previous} and ${group.id}`);
        seen.set(model, group.id);
      }
    }
  });

  test('a group marked unsupported never repeats a supported model', () => {
    const supported = new Set(
      deviceGroups.filter((group) => group.support !== 'no').flatMap((group) => group.models),
    );
    for (const group of deviceGroups.filter((item) => item.support === 'no')) {
      for (const model of group.models) {
        assert.ok(!supported.has(model), `${model} is listed both as supported and unsupported`);
      }
    }
  });

  test('the page reports the oldest source date, not the newest', () => {
    const dates = Object.values(deviceSources).map((source) => source.checkedOn);
    assert.equal(devicesCheckedOn(), [...dates].sort()[0]);
  });
});

describe('device search', () => {
  test('an empty query returns every group', () => {
    const matches = findDevices('');
    assert.equal(matches.length, deviceGroups.length);
    assert.equal(
      countMatchedModels(matches),
      deviceGroups.reduce((total, group) => total + group.models.length, 0),
    );
  });

  test('Hebrew spellings find Latin model names', () => {
    // A Hebrew-first site whose search only speaks Latin tells a reader
    // typing "אייפון 13" that their phone is not on the list.
    const hebrew = findDevices('אייפון 13');
    const latin = findDevices('iPhone 13');
    assert.deepEqual(
      hebrew.flatMap((match) => match.models),
      latin.flatMap((match) => match.models),
    );
    assert.equal(countMatchedModels(hebrew), 4);
  });

  test('גלקסי and פיקסל resolve too', () => {
    assert.ok(countMatchedModels(findDevices('גלקסי S21')) > 0);
    assert.ok(countMatchedModels(findDevices('פיקסל 8')) > 0);
  });

  test('"s21 plus" and "Galaxy S21+" are the same question', () => {
    const typed = findDevices('s21 plus').flatMap((match) => match.models);
    assert.deepEqual(typed, ['Galaxy S21+']);
  });

  test('a model name run together with its number still matches', () => {
    assert.equal(normaliseDeviceText('iphone13'), normaliseDeviceText('iPhone 13'));
    assert.ok(countMatchedModels(findDevices('iphone13')) > 0);
  });

  test('an unsupported model is found, so the answer is "no" rather than silence', () => {
    const matches = findDevices('iPhone 8');
    assert.equal(matches.length, 1);
    assert.equal(matches[0].group.support, 'no');
    assert.deepEqual(matches[0].models, ['iPhone 8', 'iPhone 8 Plus']);
  });

  test('a brand we do not list returns nothing rather than a wrong verdict', () => {
    assert.deepEqual(findDevices('Xiaomi 14'), []);
  });

  test('searching is case and punctuation insensitive', () => {
    assert.equal(
      countMatchedModels(findDevices('galaxy z fold7')),
      countMatchedModels(findDevices('Galaxy Z Fold7')),
    );
  });
});
