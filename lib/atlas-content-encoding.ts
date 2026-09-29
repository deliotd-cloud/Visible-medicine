const MAX_ACCEPT_ENCODING_LENGTH = 8192;
const CODING = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/;
const WEIGHT = /^q=(0(?:\.[0-9]{0,3})?|1(?:\.0{0,3})?)$/i;
const trimOws = (value: string): string => value.replace(/^[ \t]+|[ \t]+$/g, '');

/**
 * RFC 9110 §§12.4.2 and 12.5.3:
 * https://www.rfc-editor.org/rfc/rfc9110.html#section-12.5.3
 * Local policy chooses identity for an absent header, gives implicit identity
 * quality 1, and prefers gzip on ties. Duplicate entries use their minimum
 * quality; malformed parameters make that coding unacceptable. Invalid coding
 * syntax and oversized fields fail closed instead of falling through to '*'.
 */
export function selectAtlasEncoding(header: string | null, allowGzip: boolean): 'gzip' | 'identity' | null {
  if (header === null) return 'identity';
  if (header.length > MAX_ACCEPT_ENCODING_LENGTH) return null;
  if (trimOws(header) === '') return 'identity';

  const qualities = new Map<string, number>();
  for (const entry of header.split(',')) {
    // RFC list syntax permits empty members, including combined empty fields.
    if (trimOws(entry) === '') continue;
    const parts = entry.split(';');
    const coding = trimOws(parts[0]).toLowerCase();
    if (!CODING.test(coding)) return null;
    const weight = parts.length === 2 ? WEIGHT.exec(trimOws(parts[1])) : null;
    const quality = parts.length === 1 ? 1 : weight ? Number(weight[1]) : 0;
    qualities.set(coding, Math.min(qualities.get(coding) ?? 1, quality));
  }

  const wildcard = qualities.get('*');
  const identity = qualities.get('identity') ?? (wildcard === 0 ? 0 : 1);
  const gzip = allowGzip ? (qualities.get('gzip') ?? wildcard ?? 0) : 0;
  if (gzip > 0 && gzip >= identity) return 'gzip';
  return identity > 0 ? 'identity' : null;
}
