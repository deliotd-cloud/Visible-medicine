import type { BodyCatalog } from '../app/body-types';
import { dissectionProfiles } from '../app/dissection-data.ts';
import {
  bodyStudyScope,
  makeStudyLink,
  type StudySide,
} from './study-links.ts';
import { studyLibrary } from './study-library.ts';

export type WorkspaceMode = 'explore' | 'dissect' | 'practice';
export const workspaceModes: WorkspaceMode[] = [
  'explore',
  'dissect',
  'practice',
];
export const cameraDirections = [
  'anterior',
  'posterior',
  'right',
  'left',
  'inferior',
  'superior',
] as const;
export type CameraDirection = (typeof cameraDirections)[number];
export function directionLabel(view: CameraDirection, region: string) {
  return region === 'foot' && view === 'inferior'
    ? 'Plantar'
    : view[0].toUpperCase() + view.slice(1);
}
export type AtlasSearchEntry = {
  key: string;
  label: string;
  detail: string;
  keywords: string;
  kind: 'region' | 'structure' | 'view';
  action:
    | { type: 'link'; href: string }
    | { type: 'select'; id: string }
    | { type: 'window' | 'focus'; id: string };
};
/** One index of actual source identities, valid source-bound links and current
 * scope recipes. Searching never changes visibility or bypasses laterality. */
export function atlasSearchIndex(
  catalog: BodyCatalog,
  region: string,
  side: StudySide,
): AtlasSearchEntry[] {
  const scope = bodyStudyScope(catalog, region, side),
    local = new Set(scope.map((s) => s.id));
  const entries: AtlasSearchEntry[] = [
    { id: 'whole-body', name: 'Whole body' },
    ...catalog.regions,
  ].map((r) => ({
    key: `region:${r.id}`,
    kind: 'region',
    label: r.name,
    detail: 'Region · opens a fresh view',
    keywords: `${r.name} ${r.id}`,
    action: {
      type: 'link',
      href: r.id === 'whole-body' ? '/' : `/regions/${r.id}`,
    },
  }));
  entries.push({
    key: 'dedicated-shoulder',
    kind: 'region',
    label: 'Shoulder dissection',
    detail: 'Dedicated rotator-cuff explorer',
    keywords: 'shoulder rotator cuff',
    action: { type: 'link', href: '/shoulder' },
  });
  for (const s of catalog.structures) {
    const destination = s.regions.find((r) =>
      catalog.regions.some((item) => item.id === r),
    );
    const href = local.has(s.id)
      ? null
      : makeStudyLink(
          catalog,
          destination ?? 'whole-body',
          s.id,
          s.laterality === 'right' || s.laterality === 'left'
            ? s.laterality
            : 'both',
        );
    if (!local.has(s.id) && !href) continue;
    entries.push({
      key: `structure:${s.id}`,
      kind: 'structure',
      label: s.name,
      detail: `${s.fmaId} · ${local.has(s.id) ? 'Select in this view' : 'Open ' + (catalog.regions.find((r) => r.id === destination)?.name ?? 'whole body')}`,
      keywords: `${s.name} ${s.sourceName} ${s.fmaId} ${s.id} ${s.system} ${s.laterality}`,
      action: local.has(s.id)
        ? { type: 'select', id: s.id }
        : { type: 'link', href: href! },
    });
  }
  const profile = dissectionProfiles[region];
  if (profile)
    for (const card of studyLibrary(scope, profile)) {
      // Equivalent window/focus choices keep their explicit distinct actions.
      for (const recipe of card.recipes.filter((r) => r.available))
        entries.push({
          key: `view:${recipe.key}`,
          kind: 'view',
          label: recipe.title,
          detail: `${recipe.kind === 'window' ? 'Study window' : 'Compartment focus'} · this region · resets custom dissection`,
          keywords: `${recipe.title} ${recipe.id} ${recipe.visible.map((s) => `${s.name} ${s.fmaId}`).join(' ')}`,
          action: { type: recipe.kind, id: recipe.id },
        });
    }
  return entries;
}
export function filterAtlasSearch(
  entries: AtlasSearchEntry[],
  query: string,
  kind: AtlasSearchEntry['kind'] | 'all' = 'all',
) {
  const words = query
    .slice(0, 256)
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  return entries
    .filter(
      (e) =>
        (kind === 'all' || e.kind === kind) &&
        words.every((w) => e.keywords.toLowerCase().includes(w)),
    )
    .sort(
      (a, b) =>
        Number(b.label.toLowerCase() === query.trim().toLowerCase()) -
          Number(a.label.toLowerCase() === query.trim().toLowerCase()) ||
        Number(b.action.type === 'select') -
          Number(a.action.type === 'select') ||
        a.label.localeCompare(b.label, 'en'),
    );
}
