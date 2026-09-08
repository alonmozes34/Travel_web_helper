/**
 * Fill `{name}` placeholders in a dictionary string.
 *
 *   interpolate('eSIM ל{country}', { country: 'תאילנד' }) -> 'eSIM לתאילנד'
 */
export function interpolate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}
