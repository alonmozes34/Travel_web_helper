import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { currencies, currencyConfig, isCurrency, type CurrencyCode } from '@/i18n/config';
import { mockFxRates } from '@/data/fxRates';
import { convertPrice, crossThroughBase, findRate, RATE_BASE } from '@/lib/pricing/convert';

/**
 * The display currencies, and the arithmetic behind them.
 *
 * The rule that matters most here is not about money at all: prices are held
 * in minor units and divided by a hundred, so a currency with no decimal
 * places would render at a hundred times its value. That is a silent,
 * catastrophic bug on a comparison site, and it is one line away at any time
 * — so it is a test rather than a comment.
 */
describe('display currencies', () => {
  test('every currency has two decimal places', () => {
    // `toMajorUnits` divides by 100 unconditionally. The yen and the won have
    // no minor unit, so ¥1,000 would be shown as ¥100,000.00. Adding one means
    // teaching the pricing layer about minor-unit exponents first.
    for (const code of currencies) {
      const digits = new Intl.NumberFormat('en', {
        style: 'currency',
        currency: code,
      }).resolvedOptions().maximumFractionDigits;
      assert.equal(digits, 2, `${code} does not use two decimal places`);
    }
  });

  test('every currency has a symbol and a label', () => {
    for (const code of currencies) {
      assert.ok(currencyConfig[code]?.symbol, `${code} has no symbol`);
      assert.equal(currencyConfig[code].label, code);
    }
  });

  test('the base currency is one we display', () => {
    assert.ok(currencies.includes(RATE_BASE));
  });

  test('a currency code is recognised however it is typed in a URL', () => {
    assert.ok(isCurrency('EUR'));
    assert.ok(!isCurrency('eur'), 'the guard is exact; the proxy upper-cases first');
    assert.ok(!isCurrency('XYZ'));
    assert.ok(!isCurrency(''));
  });
});

describe('crossing rates through the base', () => {
  const perBase = new Map<CurrencyCode, number>([
    ['EUR', 1],
    ['USD', 1.164],
    ['ILS', 3.77],
  ]);
  const crossed = crossThroughBase(perBase, ['EUR', 'USD', 'ILS'], '2026-09-01', 'api');

  test('every ordered pair is produced, and none against itself', () => {
    assert.equal(crossed.length, 3 * 2);
    for (const rate of crossed) assert.notEqual(rate.from, rate.to);
  });

  test('a rate the feed states directly is not disturbed', () => {
    assert.equal(findRate(crossed, 'EUR', 'ILS')!.rate, 3.77);
  });

  test('a crossed pair is the quotient of its two legs', () => {
    const usdIls = findRate(crossed, 'USD', 'ILS')!;
    assert.ok(Math.abs(usdIls.rate - 3.77 / 1.164) < 5e-7, String(usdIls.rate));
  });

  test('a pair and its inverse agree', () => {
    for (const rate of crossed) {
      const back = findRate(crossed, rate.to, rate.from)!;
      assert.ok(Math.abs(rate.rate * back.rate - 1) < 1e-5, `${rate.from}->${rate.to}`);
    }
  });

  test('no rate carries float noise', () => {
    // The division came back as 3.045289855072464 and the page rendered every
    // digit, presenting arithmetic slop as precision.
    for (const rate of crossed) {
      const decimals = (String(rate.rate).split('.')[1] ?? '').length;
      assert.ok(decimals <= 6, `${rate.from}->${rate.to}: ${rate.rate}`);
    }
  });

  test('a currency missing from the map is skipped, not guessed', () => {
    const partial = crossThroughBase(perBase, ['EUR', 'USD', 'GBP'], '2026-09-01', 'api');
    assert.ok(!partial.some((rate) => rate.from === 'GBP' || rate.to === 'GBP'));
  });
});

describe('the mock table', () => {
  test('covers every pair the interface can ask for', () => {
    for (const from of currencies) {
      for (const to of currencies) {
        if (from === to) continue;
        assert.ok(findRate(mockFxRates, from, to), `${from}->${to} is missing`);
      }
    }
  });

  test('every mock rate is marked mock, so it can never pass as live', () => {
    assert.ok(mockFxRates.length > 0);
    for (const rate of mockFxRates) {
      assert.equal(rate.source, 'mock');
      assert.match(rate.asOf, /^\d{4}-\d{2}-\d{2}$/);
    }
  });

  test('converting and converting back lands within a rounding step', () => {
    for (const to of currencies) {
      if (to === 'ILS') continue;
      const out = convertPrice(10_000, 'ILS', to, mockFxRates);
      const back = convertPrice(out.amountMinor, to, 'ILS', mockFxRates);
      assert.ok(Math.abs(back.amountMinor - 10_000) <= 50, `ILS->${to}->ILS: ${back.amountMinor}`);
    }
  });

  test('a converted price still says what the provider charges', () => {
    const price = convertPrice(2000, 'USD', 'AUD', mockFxRates);
    assert.equal(price.isConverted, true);
    assert.equal(price.sourceCurrency, 'USD');
    assert.equal(price.sourceAmountMinor, 2000);
    assert.equal(price.fxSource, 'mock');
  });
});
