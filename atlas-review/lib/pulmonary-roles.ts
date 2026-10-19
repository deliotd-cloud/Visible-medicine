import raw from '../public/models/bodyparts3d/pulmonary/branch-types.json' with { type: 'json' };
import type { BodyCatalog, BodyStructure } from '../app/body-types';
import {
  pulmonaryCatalog,
  pulmonaryFor,
  pulmonaryViewCatalog,
} from './pulmonary';

export type PulmonaryRole = 'all' | 'airway' | 'artery' | 'vein';
export const pulmonaryRoleNames: Record<PulmonaryRole, string> = {
  all: 'All branch types',
  airway: 'Airways',
  artery: 'Pulmonary arteries',
  vein: 'Pulmonary veins',
};
export const pulmonaryRoleNotes: Record<
  Exclude<PulmonaryRole, 'all'>,
  string
> = {
  airway:
    'Source-labelled airway branches only; alveoli and a continuous open airway lumen are not supplied.',
  artery:
    'Source-labelled arterial branches only; no complete arterial tree, capillary bed or validated perfusion territory.',
  vein: 'Source-labelled venous branches only; complete drainage, ostia and anatomical variants are not established.',
};
export const pulmonaryRoleSource = raw as unknown as {
  parents: BodyStructure[];
  originalStructures: BodyStructure[];
  originalBundles: BodyCatalog['bundles'];
  coordinateSystem: BodyCatalog['coordinateSystem'];
  bundles: BodyCatalog['bundles'];
  subsets: Array<
    Pick<
      BodyStructure,
      'bundle' | 'nodeName' | 'bounds' | 'center' | 'anchor' | 'sources'
    > & {
      groupId: string;
      role: Exclude<PulmonaryRole, 'all'>;
      triangles: number;
    }
  >;
};
const canonical = (value: unknown): string =>
  Array.isArray(value)
    ? `[${value.map(canonical).join(',')}]`
    : value && typeof value === 'object'
      ? `{${Object.keys(value)
          .sort()
          .map(
            (key) =>
              `${JSON.stringify(key)}:${canonical((value as Record<string, unknown>)[key])}`,
          )
          .join(',')}}`
      : JSON.stringify(value);

/** Filtering is a display projection, not a new anatomical target or FMA claim. */
export function pulmonaryRolesAvailable(parent: BodyStructure | null) {
  const groups = pulmonaryFor(parent);
  if (
    !groups.length ||
    canonical(pulmonaryRoleSource.parents.find((p) => p.id === parent?.id)) !==
      canonical(parent) ||
    canonical(pulmonaryRoleSource.originalStructures) !==
      canonical(pulmonaryCatalog.structures) ||
    canonical(pulmonaryRoleSource.originalBundles) !==
      canonical(pulmonaryCatalog.bundles) ||
    canonical(pulmonaryRoleSource.coordinateSystem) !==
      canonical(pulmonaryCatalog.coordinateSystem)
  )
    return false;
  return groups.every((group) => {
    const subsets = pulmonaryRoleSource.subsets.filter(
      (s) => s.groupId === group.id,
    );
    if (
      subsets.length !== 3 ||
      new Set(subsets.map((s) => s.role)).size !== 3 ||
      subsets.some((s) => !['airway', 'artery', 'vein'].includes(s.role))
    )
      return false;
    const files = subsets.flatMap((s) => s.sources);
    if (
      files.length !== group.sources.length ||
      new Set(files.map((f) => f.file)).size !== files.length ||
      !group.sources.every((f) =>
        files.some((s) => canonical(s) === canonical(f)),
      )
    )
      return false;
    return subsets.every(
      (s) =>
        s.nodeName === `${group.nodeName}_${s.role}` &&
        s.bundle === `${group.bundle}-branch-types` &&
        [s.bounds.min, s.bounds.max, s.center, s.anchor].every(
          (v) => v.length === 3 && v.every(Number.isFinite),
        ) &&
        s.bounds.min.every(
          (v, i) =>
            v <= s.bounds.max[i] &&
            v >= group.bounds.min[i] &&
            s.bounds.max[i] <= group.bounds.max[i] &&
            s.anchor[i] >= v &&
            s.anchor[i] <= s.bounds.max[i],
        ) &&
        s.sources.length > 0 &&
        Number.isSafeInteger(s.triangles) &&
        s.triangles > 0 &&
        pulmonaryRoleSource.bundles.filter(
          (b) =>
            b.id === s.bundle &&
            b.url ===
              `/models/bodyparts3d/pulmonary/${group.bundle}-branch-types.glb?v=${b.sha256}` &&
            /^[a-f0-9]{64}$/.test(b.sha256) &&
            b.bytes > 0,
        ).length === 1,
    );
  });
}
export function pulmonaryRoleViewCatalog(
  parent: BodyStructure | null,
  role: PulmonaryRole = 'all',
) {
  const base = pulmonaryViewCatalog(parent);
  if (role === 'all') return base;
  if (
    !['airway', 'artery', 'vein'].includes(role) ||
    !pulmonaryRolesAvailable(parent)
  )
    return { ...base, structures: [], selectableIds: [], bundles: [] };
  const structures = base.structures.map((group) => {
    const subset = pulmonaryRoleSource.subsets.find(
      (s) => s.groupId === group.id && s.role === role,
    )!;
    return {
      ...group,
      ...subset,
      id: group.id,
      name: `${group.name} · ${pulmonaryRoleNames[role].toLowerCase()} only`,
      displaySubset: { ofId: group.id, role },
    };
  });
  return {
    ...base,
    structures,
    bundles: pulmonaryRoleSource.bundles.filter((b) =>
      structures.some((s) => s.bundle === b.id),
    ),
  };
}
export function pulmonaryRoleColour(role: PulmonaryRole) {
  return role === 'airway'
    ? '#a99369'
    : role === 'artery'
      ? '#738bac'
      : '#b97973';
}
