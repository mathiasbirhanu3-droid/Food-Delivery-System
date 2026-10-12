/**
 * CSV serializer built for hostile data — order notes contain commas,
 * quotes, newlines; dish names may too. Rules:
 * - RFC 4180: fields containing " , \n \r are quoted; inner quotes doubled
 * - BOM (\uFEFF) first — Excel reads UTF-8 correctly (ETB, any script)
 * - formula-injection guard: a leading = + - @ is prefixed with ' so a
 *   crafted note cannot execute as a spreadsheet formula when opened
 */
export function escapeCsvField(value: unknown): string {
  if (value === null || value === undefined) return '';
  let s = typeof value === 'object' ? JSON.stringify(value) : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  if (/[",\n\r]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function toCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers, ...rows].map((row) => row.map(escapeCsvField).join(','));
  return '\uFEFF' + lines.join('\r\n');
}