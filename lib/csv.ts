export function toCsv(
  rows: Array<Record<string, string | number | boolean | null | undefined>>
): string {
  if (rows.length === 0) return '';

  const headers = Object.keys(rows[0]);

  const escape = (v: any) => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    if (s.includes('"') || s.includes(',') || s.includes('\n') || s.includes('\r')) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  };

  const lines: string[] = [];
  lines.push(headers.join(','));
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(','));
  }
  return lines.join('\n');
}
