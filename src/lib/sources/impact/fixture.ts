import type { ImpactCatalogResponse } from './types';

/**
 * A stand-in impact.com catalogue response.
 *
 * Shaped from their published field reference, and deliberately messy: real
 * feeds are. It contains items that map cleanly, items that cannot be parsed,
 * an out-of-stock item, a broken price and a currency we do not display — so
 * the adapter's refusals are exercised rather than assumed.
 *
 * This is NOT provider data. The names and prices are invented to test the
 * mapper, they are not what Airalo or anyone else charges, and nothing built
 * from this file may be presented as a real offer. It exists so the
 * integration is complete and testable before credentials arrive; the moment
 * they do, `impactSource` talks to the API and this file is only used by tests.
 */
export const impactFixture: ImpactCatalogResponse = {
  '@page': 1,
  '@numpages': 1,
  '@total': 9,
  Items: [
    {
      CatalogItemId: 'ex-1',
      Name: 'Japan 10GB 30 Days',
      Description: 'Prepaid travel eSIM for Japan.',
      Url: 'https://example-provider.test/plans/japan-10gb',
      CurrentPrice: '18.00',
      OriginalPrice: '22.00',
      Currency: 'USD',
      StockAvailability: 'InStock',
    },
    {
      CatalogItemId: 'ex-2',
      Name: 'Thailand 5 GB - 15 Days',
      Url: 'https://example-provider.test/plans/thailand-5gb',
      CurrentPrice: '9.50',
      Currency: 'USD',
      StockAvailability: 'InStock',
    },
    {
      CatalogItemId: 'ex-3',
      Name: 'Europe Unlimited (7 days)',
      Url: 'https://example-provider.test/plans/europe-unlimited',
      CurrentPrice: '34.00',
      Currency: 'EUR',
      StockAvailability: 'InStock',
    },
    // A 5G plan whose name must not be read as a 5GB allowance.
    {
      CatalogItemId: 'ex-4',
      Name: 'Italy 20GB 30 Days 5G',
      Url: 'https://example-provider.test/plans/italy-20gb',
      CurrentPrice: '25.00',
      Currency: 'EUR',
      StockAvailability: 'InStock',
    },
    // No allowance in the name at all.
    {
      CatalogItemId: 'ex-5',
      Name: 'Traveller Starter Pack',
      Url: 'https://example-provider.test/plans/starter',
      CurrentPrice: '12.00',
      Currency: 'USD',
      StockAvailability: 'InStock',
    },
    // No validity.
    {
      CatalogItemId: 'ex-6',
      Name: 'Greece 3GB',
      Url: 'https://example-provider.test/plans/greece-3gb',
      CurrentPrice: '7.00',
      Currency: 'EUR',
      StockAvailability: 'InStock',
    },
    // A destination we cannot resolve.
    {
      CatalogItemId: 'ex-7',
      Name: 'Nordics Explorer 10GB 14 Days',
      Url: 'https://example-provider.test/plans/nordics',
      CurrentPrice: '30.00',
      Currency: 'EUR',
      StockAvailability: 'InStock',
    },
    {
      CatalogItemId: 'ex-8',
      Name: 'Spain 10GB 30 Days',
      Url: 'https://example-provider.test/plans/spain-10gb',
      CurrentPrice: '15.00',
      Currency: 'EUR',
      StockAvailability: 'OutOfStock',
    },
    {
      CatalogItemId: 'ex-9',
      Name: 'Turkey 10GB 30 Days',
      Url: 'https://example-provider.test/plans/turkey-10gb',
      CurrentPrice: '450.00',
      Currency: 'TRY',
      StockAvailability: 'InStock',
    },
  ],
};
