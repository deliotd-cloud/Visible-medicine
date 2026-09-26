import data from '../public/models/bodyparts3d/portal-veins/catalog.json' with { type: 'json' };
import { createArterialExplorer } from './regional-arterial';
import { addPortalVeins, portalReferences } from './portal-veins';
import type { VenousKind } from '../content/systemic-venous';
// A separate portal circuit. These are teaching relationships, not mesh-derived junctions.
const notes = {
  FMA50735:
    'Portal inflow enters liver sinusoids before hepatic venous outflow. There is no direct portal-to-hepatic-vein or portal-to-caval edge here.',
  FMA14331:
    'The splenic and superior mesenteric contributions meet at the portal confluence. Exact source junctions and smaller tributaries remain unvalidated.',
  FMA14332:
    'Available intestinal, colic and gastric contributors are a subset, not a complete mesenteric venous tree.',
  FMA15391:
    'The splenic outlet is one recognised IMV pattern. Superior mesenteric, confluence and jejunal terminations also occur; none is assigned to this donor.',
  FMA15405:
    'One ileal source selection, not every intestinal tributary or an entire venous territory.',
  FMA15406:
    'The SMV outlet is one middle-colic pattern. Gastrocolic, inferior mesenteric, splenic and jejunal outlets also occur.',
  FMA15407:
    'The displayed SMV route is simplified. Right-colic collecting trunks and confluence variants are not separately segmented.',
  FMA15390:
    'Left gastroepiploic is also called left gastro-omental. Whole source geometry is retained.',
  FMA15397:
    'Right gastroepiploic is also called right gastro-omental. A separate gastrocolic collecting trunk is not supplied.',
  FMA15399:
    'Lesser-curvature drainage is distinct from gastroepiploic drainage; no oesophageal collateral network is generated.',
  FMA15400:
    'Source laterality and original crossing of the midline are retained; the name is not a cutting plane.',
};
type Key = keyof typeof notes;
export const portalRelationships: {
  from: Key;
  to: Key;
  kind: VenousKind;
  note: string;
}[] = [
  {
    from: 'FMA14331',
    to: 'FMA50735',
    kind: 'confluence',
    note: 'Splenic contribution to portal formation.',
  },
  {
    from: 'FMA14332',
    to: 'FMA50735',
    kind: 'confluence',
    note: 'Superior mesenteric contribution to portal formation.',
  },
  {
    from: 'FMA15391',
    to: 'FMA14331',
    kind: 'variable',
    note: 'One recognised outlet, not a universal termination or donor finding.',
  },
  {
    from: 'FMA15405',
    to: 'FMA14332',
    kind: 'tributary',
    note: 'Available ileal contribution; smaller channels are not supplied.',
  },
  {
    from: 'FMA15406',
    to: 'FMA14332',
    kind: 'variable',
    note: 'One recognised middle-colic outlet; other termination patterns exist.',
  },
  {
    from: 'FMA15407',
    to: 'FMA14332',
    kind: 'via-unmodelled',
    note: 'Collecting trunks and the precise confluence are not separately represented.',
  },
  {
    from: 'FMA15390',
    to: 'FMA14331',
    kind: 'tributary',
    note: 'Left gastro-omental contribution.',
  },
  {
    from: 'FMA15397',
    to: 'FMA14332',
    kind: 'via-unmodelled',
    note: 'Gastrocolic collecting routes are not separately represented.',
  },
  {
    from: 'FMA15399',
    to: 'FMA50735',
    kind: 'tributary',
    note: 'Left gastric contribution.',
  },
  {
    from: 'FMA15400',
    to: 'FMA50735',
    kind: 'tributary',
    note: 'Right gastric contribution.',
  },
];
const explorer = createArterialExplorer(
  {
    ...data,
    entries: [...data.contextRecords, ...data.structures],
    bundles: [...data.contextBundles, ...data.bundles],
  },
  Object.fromEntries(
    Object.entries(notes).map(([id, note]) => [
      id,
      { fmaIds: [id], context: 'abdomen', note },
    ]),
  ),
  portalRelationships.map((r) => ({ ...r, kind: 'branch' as const })),
  portalReferences,
  'portal venous',
  'explicit-concept',
);
type Args = Parameters<typeof explorer.neighbours>;
export function portalVenousNeighbours(...args: Args) {
  try {
    if (addPortalVeins(args[0]) !== args[0]) return null;
  } catch {
    return null;
  }
  const info = explorer.neighbours(...args);
  if (!info) return null;
  return {
    ...info,
    group: info.concept,
    rows: info.rows.map((row) => {
      const relation = portalRelationships.find(
        (r) =>
          (r.from === info.concept && r.to === row.structure.fmaId) ||
          (r.to === info.concept && r.from === row.structure.fmaId),
      )!;
      return {
        ...row,
        kind: relation.kind,
        direction:
          row.direction === 'upstream'
            ? ('receives' as const)
            : ('outlet' as const),
      };
    }),
  };
}
export function portalVenousPlan(...args: Args) {
  if (!portalVenousNeighbours(...args)) return null;
  return explorer.plan(...args);
}
