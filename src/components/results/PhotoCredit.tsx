import type { DestinationImage } from '@/data/destinationImages.generated';
import type { Dictionary } from '@/i18n/getDictionary';
import { interpolate } from '@/i18n/interpolate';

/**
 * The credit a free licence asks for: who took the photograph, the licence,
 * and a link to the file's own page. Shared by every place a destination
 * photograph appears, so none of them can drop a part of it.
 */
export function PhotoCredit({
  image,
  label,
  multi = false,
  dict,
}: {
  image: DestinationImage;
  /** What is pictured, or the country — used when several credits share a line. */
  label: string;
  multi?: boolean;
  dict: Dictionary;
}) {
  const copy = dict.destinationPhoto;
  return (
    <>
      {interpolate(multi ? copy.creditMultiTemplate : copy.creditTemplate, {
        country: label,
        artist: image.artist || image.licence,
      })}
      {', '}
      {image.licenceUrl ? (
        <a href={image.licenceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-6 items-center underline">
          {image.licence}
          <span className="sr-only"> {copy.opensInNewTab}</span>
        </a>
      ) : (
        image.licence
      )}
      {', '}
      <a href={image.page} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-6 items-center underline">
        {copy.source}
        <span className="sr-only"> {copy.opensInNewTab}</span>
      </a>
    </>
  );
}
