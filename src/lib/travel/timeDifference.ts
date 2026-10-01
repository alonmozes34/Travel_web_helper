/**
 * Minutes a time zone is ahead of UTC at a moment, from the platform's own
 * time zone data: "GMT+05:30" → 330. Summer time included, which is why the
 * difference from Israel is worked out when the page is shown, not stored.
 */
export function utcOffsetMinutes(timeZone: string, at: Date): number {
  const part = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'longOffset' })
    .formatToParts(at)
    .find((p) => p.type === 'timeZoneName')?.value;
  const match = /GMT([+-])(\d{2}):(\d{2})/.exec(part ?? '');
  if (!match) return 0; // "GMT" alone: UTC itself.
  const minutes = Number(match[2]) * 60 + Number(match[3]);
  return match[1] === '-' ? -minutes : minutes;
}

/** How far ahead of Israel a zone is, in minutes; negative when behind. */
export function minutesAheadOfIsrael(timeZone: string, at: Date): number {
  return utcOffsetMinutes(timeZone, at) - utcOffsetMinutes('Asia/Jerusalem', at);
}
