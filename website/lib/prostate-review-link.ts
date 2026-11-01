import { PROSTATE_ZONE_REVISION } from '../atlas-review/lib/prostate-zones';

/** A compiled schematic revision, never a patient/series or parent-mesh identity. */
export function prostateReviewModelHref(revision: string): string | null {
  if (!/^[a-f0-9]{64}$/.test(revision) || revision !== PROSTATE_ZONE_REVISION) return null;
  return '/atlas-review-viewer/index.html?' + new URLSearchParams({
    kind: 'prostate', region: 'pelvis', modelRevision: revision,
  });
}

export function parseProstateReviewLink(search: string): string | null {
  const query = new URLSearchParams(search);
  const keys = ['kind', 'region', 'modelRevision'];
  if (query.size !== keys.length || keys.some(key => query.getAll(key).length !== 1) ||
      query.get('kind') !== 'prostate' || query.get('region') !== 'pelvis') return null;
  const revision = query.get('modelRevision')!;
  return prostateReviewModelHref(revision) ? revision : null;
}
