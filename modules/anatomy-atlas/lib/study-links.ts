import type { BodyCatalog, BodyStructure } from '../app/body-types';
import { dissectionProfiles, stageStructures } from '../app/dissection-data.ts';
import { relatedStudyViews } from './study-navigation.ts';

export type StudySide = 'both' | 'right' | 'left';
export type StudyLinkRequest = {
  structureId: string;
  side: StudySide;
  sourceHash: string;
  focusId: string | null;
};
export type ParsedStudyLink =
  | { status: 'none' }
  | { status: 'invalid' }
  | { status: 'requested'; request: StudyLinkRequest };
export const noStudyLink: ParsedStudyLink = { status: 'none' };
export type StudySearchParams = Record<string, string | string[] | undefined>;
const queryKeys = ['study', 'structure', 'side', 'source', 'focus'] as const;
const identity = /^[a-zA-Z0-9:_-]{1,240}$/;
const focusIdentity = /^[a-zA-Z0-9_-]{1,100}$/;

/** Reject duplicate, partial, oversized and unsupported links before loading anatomy.
 * Unrelated query fields are ignored, never forwarded into a generated link.
 */
export function parseStudyLink(params: StudySearchParams): ParsedStudyLink {
  if (!params || typeof params !== 'object' || Array.isArray(params))
    return { status: 'invalid' };
  if (!queryKeys.some((key) => Object.hasOwn(params, key))) return noStudyLink;
  if (queryKeys.some((key) => Array.isArray(params[key])))
    return { status: 'invalid' };
  const [study, structure, side, source, focus] = queryKeys.map((key) =>
    Object.hasOwn(params, key) ? params[key] : undefined,
  );
  if (
    study !== '1' ||
    typeof structure !== 'string' ||
    !identity.test(structure) ||
    typeof source !== 'string' ||
    !/^[a-f0-9]{64}$/.test(source) ||
    (side !== 'both' && side !== 'right' && side !== 'left') ||
    (focus !== undefined &&
      (typeof focus !== 'string' || !focusIdentity.test(focus)))
  ) {
    return { status: 'invalid' };
  }
  return {
    status: 'requested',
    request: {
      structureId: structure,
      side,
      sourceHash: source,
      focusId: focus ?? null,
    },
  };
}

export function studyLinkKey(link: ParsedStudyLink) {
  return JSON.stringify(link);
}

export function bodyStudyScope(
  catalog: BodyCatalog,
  region: string,
  side: StudySide,
) {
  if (
    !['both', 'right', 'left'].includes(side) ||
    !Object.hasOwn(dissectionProfiles, region) ||
    (region !== 'whole-body' &&
      !catalog.regions.some((entry) => entry.id === region))
  )
    return [];
  return catalog.structures.filter(
    (item) =>
      (region === 'whole-body' || item.regions.includes(region)) &&
      (side === 'both' ||
        item.laterality === side ||
        ['midline', 'unpaired', 'unspecified'].includes(item.laterality)),
  );
}

export function resolveStudyLink(
  catalog: BodyCatalog,
  region: string,
  link: ParsedStudyLink,
) {
  if (link.status === 'none') return { status: 'none' as const };
  if (link.status !== 'requested')
    return { status: 'rejected' as const, reason: 'invalid' as const };
  const request = link.request;
  const scope = bodyStudyScope(catalog, region, request.side);
  const selected = scope.find((item) => item.id === request.structureId);
  if (!selected)
    return { status: 'rejected' as const, reason: 'out-of-scope' as const };
  const bundle = catalog.bundles.find((item) => item.id === selected.bundle);
  if (!bundle || bundle.sha256 !== request.sourceHash)
    return { status: 'rejected' as const, reason: 'source-changed' as const };
  const profile = dissectionProfiles[region];
  const focus = request.focusId
    ? profile.focuses.find((item) => item.id === request.focusId)
    : null;
  if (request.focusId && !focus)
    return {
      status: 'rejected' as const,
      reason: 'focus-unavailable' as const,
    };
  const visible = stageStructures(
    scope,
    profile,
    'assembled',
    focus?.id ?? null,
  );
  if (!visible.includes(selected))
    return {
      status: 'rejected' as const,
      reason: 'selection-not-in-focus' as const,
    };
  return {
    status: 'ready' as const,
    selected,
    side: request.side,
    focusId: focus?.id ?? null,
    focusTitle: focus?.title ?? null,
    view: focus?.view ?? profile.stages[0].view,
    visibleIds: visible.map((item) => item.id),
  };
}

/** Return only a relative, allowlisted atlas route, never an external redirect. */
export function makeStudyLink(
  catalog: BodyCatalog,
  region: string,
  structureId: string,
  side: StudySide,
  focusId: string | null = null,
): string | null {
  const selected = catalog.structures.find((item) => item.id === structureId);
  const bundle = catalog.bundles.find((item) => item.id === selected?.bundle);
  if (!selected || !bundle) return null;
  const query = new URLSearchParams({
    study: '1',
    structure: structureId,
    side,
    source: bundle.sha256,
  });
  if (focusId) query.set('focus', focusId);
  const link = parseStudyLink(Object.fromEntries(query));
  if (resolveStudyLink(catalog, region, link).status !== 'ready') return null;
  return `${region === 'whole-body' ? '/' : `/regions/${region}`}?${query.toString()}`;
}

export function studyDestinations(
  catalog: BodyCatalog,
  selected: BodyStructure,
  currentRegion: string,
  side: StudySide,
) {
  // Re-resolve an incoming object through the authoritative catalogue identity.
  const canonical = catalog.structures.find((item) => item.id === selected.id);
  if (!canonical) return [];
  const regions = [
    ...(currentRegion === 'whole-body'
      ? []
      : [{ id: 'whole-body', name: 'Whole body' }]),
    ...catalog.regions.filter(
      (region) =>
        canonical.regions.includes(region.id) && region.id !== currentRegion,
    ),
  ];
  return regions.flatMap((region) => {
    const href = makeStudyLink(catalog, region.id, canonical.id, side);
    if (!href) return [];
    const scope = bodyStudyScope(catalog, region.id, side);
    const views = relatedStudyViews(
      scope,
      dissectionProfiles[region.id],
      canonical.id,
    );
    return [
      {
        region: region.id,
        name: region.name,
        href,
        focuses: views.flatMap((view) => {
          const link = makeStudyLink(
            catalog,
            region.id,
            canonical.id,
            side,
            view.focusId,
          );
          return link
            ? [
                {
                  focusId: view.focusId,
                  title: view.title,
                  role: view.role,
                  href: link,
                },
              ]
            : [];
        }),
      },
    ];
  });
}
