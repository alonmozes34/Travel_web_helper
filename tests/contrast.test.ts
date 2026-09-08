import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, test } from 'node:test';

/**
 * Contrast audit.
 *
 * Colours are read out of globals.css rather than duplicated here, so this
 * test fails if a token is changed to something unreadable.
 */
const css = readFileSync(new URL('../src/app/globals.css', import.meta.url), 'utf8');

function token(name: string): string {
  const match = css.match(new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`));
  assert.ok(match, `token --color-${name} not found`);
  return match![1];
}

function channel(value: number): number {
  const srgb = value / 255;
  return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const r = channel(Number.parseInt(hex.slice(1, 3), 16));
  const g = channel(Number.parseInt(hex.slice(3, 5), 16));
  const b = channel(Number.parseInt(hex.slice(5, 7), 16));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(foreground: string, background: string): number {
  const a = luminance(foreground);
  const b = luminance(background);
  const [light, dark] = a > b ? [a, b] : [b, a];
  return (light + 0.05) / (dark + 0.05);
}

/** Every pair below renders body-sized text somewhere in the product. */
const textPairs: Array<[string, string]> = [
  ['ink', 'surface'],
  ['ink', 'canvas'],
  ['ink', 'surface-2'],
  ['ink-2', 'surface'],
  ['ink-2', 'canvas'],
  ['ink-2', 'surface-2'],
  ['ink-3', 'surface'],
  ['ink-3', 'canvas'],
  ['brand', 'surface'],
  ['brand', 'canvas'],
  ['brand', 'brand-50'],
  ['teal-ink', 'surface'],
  ['teal-ink', 'teal-50'],
  ['warn-ink', 'surface'],
  ['warn-ink', 'warn-50'],
  ['on-brand', 'brand'],
];

describe('colour contrast', () => {
  for (const [foreground, background] of textPairs) {
    test(`${foreground} on ${background} meets AA`, () => {
      const ratio = contrast(token(foreground), token(background));
      assert.ok(
        ratio >= 4.5,
        `${foreground} (${token(foreground)}) on ${background} (${token(background)}) is ${ratio.toFixed(2)}:1`,
      );
    });
  }

  test('the greys stay distinguishable from one another', () => {
    assert.ok(contrast(token('ink-2'), token('ink-3')) >= 1.3, 'ink-2 and ink-3 look the same');
    assert.ok(contrast(token('ink'), token('ink-2')) >= 1.5, 'ink and ink-2 look the same');
  });
});
