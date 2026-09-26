import type { BodyStructure } from '../app/body-types';

/** Exact presentation metadata in local bookmarks, separate from clinical approval. */
export function bodyPresentationRevision(structures: BodyStructure[]): string {
  return JSON.stringify(structures.filter(s => s.presentationParts).map(s => ({
    id: s.id, nodeName: s.nodeName, bounds: s.bounds, anchor: s.anchor,
    parts: s.presentationParts,
  })).sort((a, b) => a.id.localeCompare(b.id)));
}

/** Only source-audited two-file bilateral compounds are currently supported.
 * Full source records remain canonical for teaching, reviews and imaging links. */
export function validBodyPresentationParts(s: BodyStructure): boolean {
  const parts = s.presentationParts;
  if (!parts) return true;
  if (s.laterality !== 'unspecified' || parts.length !== 2 || s.sources.length !== 2)
    return false;
  if (new Set(parts.map(p => p.displaySide)).size !== 2 ||
      new Set(parts.map(p => p.nodeName)).size !== 2 ||
      new Set(s.sources.map(p => p.file)).size !== 2) return false;
  const vec = (p: number[]) => Array.isArray(p) && p.length === 3 && p.every(Number.isFinite);
  if (!vec(s.bounds.min) || !vec(s.bounds.max)) return false;
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (!['left', 'right'].includes(p.displaySide) || !p.nodeName || p.nodeName === s.nodeName ||
        p.source.file !== s.sources[i].file || p.source.sha256 !== s.sources[i].sha256 ||
        !/^[a-f0-9]{64}$/.test(p.source.sha256) ||
        ![p.bounds.min, p.bounds.max, p.center, p.anchor].every(vec)) return false;
    if (p.bounds.min.some((n, k) => n > p.bounds.max[k] ||
        p.center[k] < n || p.center[k] > p.bounds.max[k] ||
        p.anchor[k] < n || p.anchor[k] > p.bounds.max[k])) return false;
  }
  return s.bounds.min.every((n, k) => n === Math.min(...parts.map(p => p.bounds.min[k]))) &&
    s.bounds.max.every((n, k) => n === Math.max(...parts.map(p => p.bounds.max[k])));
}

export function bodySideMatches(s: BodyStructure, side: string): boolean {
  if (!['both', 'left', 'right'].includes(side) || !validBodyPresentationParts(s)) return false;
  if (s.presentationParts) return side === 'both' || s.presentationParts.some(p => p.displaySide === side);
  return side === 'both' || s.laterality === side || ['midline', 'unpaired', 'unspecified'].includes(s.laterality);
}

/** Rendering/spatial-use projection only. Never persist this as source evidence,
 * pass it to source-bound lessons, or publish it as an imaging registration. */
export function bodyPresentationStructure(s: BodyStructure, side: string): BodyStructure {
  if (!bodySideMatches(s, side)) throw new Error('Unavailable source presentation side');
  if (!s.presentationParts || side === 'both') return s;
  const p = s.presentationParts.find(p => p.displaySide === side)!;
  return { ...s, nodeName: p.nodeName, bounds: p.bounds, center: p.center, anchor: p.anchor };
}
