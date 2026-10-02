import places from '@/data/places.generated.json';
import { searchPlaces, type PlaceRow } from '@/lib/places/searchPlaces';

/**
 * City search for the destination field: `?q=נאפולי&locale=he` →
 * `[{ name: "נאפולי", countryCode: "IT" }]`. Kept on the server so the list
 * of twelve thousand cities never ships to a phone; the field asks only after
 * a couple of letters, and shows countries first.
 */
const rows = places as unknown as PlaceRow[];

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = (url.searchParams.get('q') ?? '').slice(0, 60);
  const locale = url.searchParams.get('locale') === 'en' ? 'en' : 'he';
  return Response.json(searchPlaces(rows, query, locale), {
    headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=86400', 'X-Robots-Tag': 'noindex' },
  });
}
