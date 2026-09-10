import type { BodyCatalog } from '../app/body-types';
import { dissectionProfiles } from '../app/dissection-data.ts';
import {
  bodyStudyScope,
  makeStudyLink,
  type StudySide,
} from './study-links.ts';
import { studyLibrary } from './study-library.ts';
import {
  nestedStudyTargets,
  nestedSideMatches,
  type NestedRequest,
} from './nested-anatomy.ts';
import {
  structureSearchAliases,
  normalizeAnatomySearch,
  anatomySearchWordMatches,
} from './anatomy-search.ts';

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
  aliases?: string[];
  kind: 'region' | 'structure' | 'view';
  action:
    | { type: 'link'; href: string }
    | { type: 'select'; id: string }
    | { type: 'dissect'; target: NestedRequest }
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
    const aliases = structureSearchAliases(s);
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
      keywords: `${s.name} ${s.sourceName} ${s.fmaId} ${s.id} ${s.system} ${s.laterality} ${aliases.join(' ')}`,
      aliases,
      action: local.has(s.id)
        ? { type: 'select', id: s.id }
        : { type: 'link', href: href! },
    });
  }
  for (const target of nestedStudyTargets(catalog)) {
    const s = target.structure;
    const here = local.has(target.parentId) && nestedSideMatches(s, side);
    const selection = {
      study: target.study,
      structureId: s.id,
      sourceHash: target.sourceHash,
    };
    const href = here
      ? null
      : makeStudyLink(
          catalog,
          'head-neck',
          target.parentId,
          s.laterality === 'left' || s.laterality === 'right'
            ? s.laterality
            : 'both',
          null,
          selection,
        );
    if (!here && !href) continue;
    entries.push({
      key: `nested:${target.study}:${s.id}`,
      kind: 'structure',
      label: s.name,
      detail: `${s.fmaId} · ${target.title} · ${here ? 'Open dissection' : 'Open Head & neck dissection'} · draft`,
      keywords: `${s.name} ${s.sourceName} ${s.fmaId} ${s.id} ${s.system} ${s.laterality} ${target.title}`,
      action: here
        ? {
            type: 'dissect',
            target: {
              ...selection,
              parentId: target.parentId,
              parentHash: target.parentHash,
            },
          }
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
          keywords: `${recipe.title} ${recipe.id} ${recipe.visible.map((s) => `${s.name} ${s.fmaId} ${structureSearchAliases(s).join(' ')}`).join(' ')}`,
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
  const needle = normalizeAnatomySearch(query.slice(0, 256));
  if (!needle && query.trim()) return [];
  const words = needle.split(' ').filter(Boolean);
  return entries
    .flatMap((entry) => {
      if (kind !== 'all' && entry.kind !== kind) return [];
      const keywords = normalizeAnatomySearch(entry.keywords);
      if (!words.every((word) => anatomySearchWordMatches(keywords, word)))
        return [];
      const label = normalizeAnatomySearch(entry.label);
      // Exact names/IDs, then aliases, then label matches, then contextual matches.
      const rank = !needle
        ? 0
        : label === needle ||
            (/^fma\d+$/.test(needle) && keywords.split(' ').includes(needle))
          ? 0
          : entry.aliases?.some(
                (alias) => normalizeAnatomySearch(alias) === needle,
              )
            ? 1
            : words.every((word) => anatomySearchWordMatches(label, word))
              ? 2
              : 3;
      return [{ entry, rank }];
    })
    .sort(
      (a, b) =>
        a.rank - b.rank ||
        Number(b.entry.action.type === 'select') -
          Number(a.entry.action.type === 'select') ||
        Number(b.entry.kind === 'structure') -
          Number(a.entry.kind === 'structure') ||
        a.entry.label.localeCompare(b.entry.label, 'en'),
    )
    .map(({ entry }) => entry);
}
