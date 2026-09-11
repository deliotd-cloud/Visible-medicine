import pins from '../content/systemic-venous-pins.json' with { type: 'json' };
import {
  systemicVenousGroups as groups,
  systemicVenousRelationships as relationships,
  systemicVenousReferences as references,
} from '../content/systemic-venous';
import {
  createArterialExplorer,
  type ArterialDefinitions,
} from './regional-arterial';

// Reuse only the source-admission/traversal core, never arterial anatomy or labels.
// A separate concept per actual side prevents contralateral tributaries at paired vessels.
const concepts: ArterialDefinitions = {};
const groupForConcept = new Map<string, keyof typeof groups>();
for (const [key, definition] of Object.entries(groups)) {
  definition.fmaIds.forEach((fma, i) => {
    const id = `${key}:${i}`;
    concepts[id] = { ...definition, fmaIds: [fma] };
    groupForConcept.set(id, key as keyof typeof groups);
  });
}
const edges = relationships.flatMap((relation) => {
  const from = groups[relation.from].fmaIds,
    to = groups[relation.to].fmaIds;
  return from.flatMap((_, i) =>
    to.flatMap((_, j) =>
      from.length === 2 && to.length === 2 && i !== j
        ? []
        : [
            {
              from: `${relation.from}:${i}`,
              to: `${relation.to}:${j}`,
              kind:
                relation.kind === 'continuation'
                  ? ('continuation' as const)
                  : ('branch' as const),
              note: relation.note,
              venousKind: relation.kind,
            },
          ],
    ),
  );
});
const traversal = createArterialExplorer(
  pins,
  concepts,
  edges,
  references,
  'systemic venous',
  'explicit-concept',
);
type Args = Parameters<typeof traversal.neighbours>;
export function systemicVenousNeighbours(...args: Args) {
  const info = traversal.neighbours(...args);
  if (!info) return null;
  return {
    ...info,
    group: groupForConcept.get(info.concept)!,
    rows: info.rows.map((row) => {
      const edge = edges.find(
        (e) =>
          (e.from === info.concept &&
            concepts[e.to].fmaIds.includes(row.structure.fmaId)) ||
          (e.to === info.concept &&
            concepts[e.from].fmaIds.includes(row.structure.fmaId)),
      )!;
      return {
        ...row,
        kind: edge.venousKind,
        direction:
          row.direction === 'upstream'
            ? ('receives' as const)
            : ('outlet' as const),
      };
    }),
  };
}
export function systemicVenousPlan(...args: Args) {
  const info = systemicVenousNeighbours(...args);
  if (!info) return null;
  const [catalog, region] = args,
    related = new Set<keyof typeof groups>([info.group]);
  for (const r of relationships) {
    if (r.from === info.group) related.add(r.to);
    if (r.to === info.group) related.add(r.from);
  }
  // Retain both source counterparts for subsequent side changes; never duplicate geometry.
  const fmas = new Set([...related].flatMap((g) => groups[g].fmaIds));
  const keep = new Set(
    pins.entries
      .filter(
        (s) =>
          fmas.has(s.fmaId) ||
          (s.system === 'skeleton' &&
            s.regions.includes(groups[info.group].context)),
      )
      .map((s) => s.id),
  );
  return {
    action: {
      type: 'load-view' as const,
      hiddenIds: catalog.structures
        .filter(
          (s) =>
            (region === 'whole-body' || s.regions.includes(region)) &&
            !keep.has(s.id),
        )
        .map((s) => s.id),
    },
    selectedId: info.selected.id,
    label: info.selected.name,
  };
}
