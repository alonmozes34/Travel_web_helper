import { get, put } from '@vercel/blob';

/**
 * Small JSON files in the project's private Vercel Blob store — the price
 * history, and the last ZenSim read. Connecting the store in Vercel sets
 * either BLOB_READ_WRITE_TOKEN or, for stores that authenticate with Vercel's
 * OIDC token, BLOB_STORE_ID; the Blob SDK reads whichever is there. Without
 * either, nothing is read or written.
 */
export function blobEnabled(env: Record<string, string | undefined> = process.env): boolean {
  return Boolean(env.BLOB_READ_WRITE_TOKEN?.trim() || env.BLOB_STORE_ID?.trim());
}

export async function readBlobJson<T>(pathname: string): Promise<T | null> {
  const result = await get(pathname, { access: 'private', useCache: false });
  if (!result || result.statusCode !== 200 || !result.stream) return null;
  return (await new Response(result.stream).json()) as T;
}

export async function writeBlobJson(pathname: string, value: unknown, overwrite: boolean): Promise<void> {
  await put(pathname, JSON.stringify(value), {
    access: 'private',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: overwrite,
  });
}
