/**
 * The shape of an impact.com catalogue item.
 *
 * Taken from the published Brand/Publisher API reference: an item carries
 * `Name`, `Description`, `Url`, `CurrentPrice`, `OriginalPrice`, `Currency`
 * (ISO 4217), `StockAvailability`, `ImageUrl` and a `CatalogItemId`, plus
 * manufacturer, GTIN and a set of custom text and numeric fields the
 * advertiser defines.
 *
 * Note what is *not* there: gigabytes, validity, destination, network,
 * hotspot. impact.com models retail products, and an eSIM plan's defining
 * attributes are not retail product attributes. They are recoverable only from
 * `Name`/`Description`, or from custom fields if the advertiser bothered to
 * populate them — which is the single biggest unknown in this integration and
 * the first thing to check against a real catalogue.
 *
 * Fields are optional and loosely typed on purpose: this is an external feed,
 * and the mapper's job is to be strict about what it accepts, not to assume
 * the feed is well-formed.
 */
export type ImpactCatalogItem = {
  CatalogItemId?: string;
  Name?: string;
  Description?: string;
  /** The item's page on the advertiser's site. Not yet the tracking link. */
  Url?: string;
  CurrentPrice?: string | number;
  OriginalPrice?: string | number;
  /** ISO 4217. */
  Currency?: string;
  StockAvailability?:
    | 'InStock'
    | 'OutOfStock'
    | 'BackOrder'
    | 'PreOrder'
    | 'LimitedAvailability'
    | string;
  ImageUrl?: string;
  Manufacturer?: string;
  Labels?: string[];
  /** Advertiser-defined. Where structured eSIM attributes would live if at all. */
  [custom: string]: unknown;
};

export type ImpactCatalogResponse = {
  Items?: ImpactCatalogItem[];
  '@page'?: number;
  '@numpages'?: number;
  '@total'?: number;
  '@nextpageuri'?: string;
};

/**
 * What the caller must supply per advertiser.
 *
 * `providerId` is ours, not impact.com's: the catalogue says "Airalo" in a
 * name field, and mapping that to our provider record is a decision, not a
 * lookup.
 */
export type ImpactCatalogConfig = {
  /** impact.com catalogue id. */
  catalogId: string;
  /** Our provider id, e.g. 'airalo'. */
  providerId: string;
  /**
   * Custom-field names to read structured values from, when the advertiser
   * publishes them. Checked before falling back to parsing the name.
   */
  fields?: {
    allowanceMb?: string;
    validityDays?: string;
    countryCode?: string;
    unlimited?: string;
  };
};

export type ImpactCredentials = {
  /** Used as the HTTP Basic username, per the API reference. */
  accountSid: string;
  /** Used as the HTTP Basic password. */
  authToken: string;
  /** Overridable so a fixture or a sandbox can be pointed at instead. */
  baseUrl?: string;
};
