import pin from '../public/models/bodyparts3d/coronary-venous/root-vessel-context.json' with { type: 'json' };
import root from '../public/models/bodyparts3d/full-body/catalog.json' with { type: 'json' };
import anterior from '../public/models/bodyparts3d/anterior-cardiac-vein/catalog.json' with { type: 'json' };
import type { BodyCatalog, BodyStructure } from '../app/body-types';
import { coronaryVenousCatalog, coronaryVenousFor } from './coronary-venous';

const source = pin as unknown as {
  schemaVersion: number;
  sourceVersion: string;
  license: string;
  credit: string;
  coordinateSystem: BodyCatalog['coordinateSystem'];
  parent: BodyStructure;
  parentBundle: BodyCatalog['bundles'][number];
  structures: BodyStructure[];
  bundles: BodyCatalog['bundles'];
};
const wholeBody = root as unknown as BodyCatalog;
const anteriorSource = anterior as unknown as {
  sourceVersion: string;
  coordinateSystem: BodyCatalog['coordinateSystem'];
  structures: BodyStructure[];
  bundles: BodyCatalog['bundles'];
};
const fmaIds = ['FMA76767', 'FMA4707', 'FMA4713'] as const;
const canonical = (value: unknown): string =>
  Array.isArray(value)
    ? `[${value.map(canonical).join(',')}]`
    : value && typeof value === 'object'
      ? `{${Object.keys(value).sort().map((key) =>
          `${JSON.stringify(key)}:${canonical((value as Record<string, unknown>)[key])}`).join(',')}}`
      : JSON.stringify(value);
const same = (a: unknown, b: unknown) => canonical(a) === canonical(b);
export const coronaryVenousContextCopy = {
  button: 'Show cardiac vein landmarks',
  guide: 'Optional landmarks are nonselectable existing root surfaces. The anterior cardiac vein is a two-file source group; the middle cardiac vein groups fourteen files. Source groups do not establish individually named branches or a joined lumen, ostium, drainage junction, flow or patient registration.',
  learning: 'Optional anterior FMA76767, great FMA4707 and middle FMA4713 vein landmarks remain nonselectable. The anterior and middle selections group two and fourteen source files respectively; no individual branch count is implied.',
  visible: 'Cardiac vein landmarks are orientation surfaces only; their junctions and flow are not shown.',
} as const;

/** Exact existing root surfaces only; the heart parent and nested children are never duplicated. */
export function coronaryVenousContextFor(
  parent: BodyStructure | null,
  currentRoot?: BodyCatalog,
): BodyStructure[] {
  if (source.schemaVersion !== 1 || !parent ||
      !same(parent, source.parent) || !same(parent, coronaryVenousCatalog.parent) ||
      coronaryVenousFor(parent).length !== 2 ||
      source.structures.length !== 3 ||
      source.bundles.length !== 2 ||
      !same(source.coordinateSystem, coronaryVenousCatalog.coordinateSystem) ||
      !same(source.coordinateSystem, wholeBody.coordinateSystem) ||
      !same(source.coordinateSystem, anteriorSource.coordinateSystem) ||
      source.sourceVersion !== coronaryVenousCatalog.sourceVersion ||
      source.sourceVersion !== wholeBody.sourceVersion ||
      source.sourceVersion !== anteriorSource.sourceVersion ||
      source.license !== wholeBody.license ||
      source.license !== (anterior as { license: string }).license ||
      source.credit !== wholeBody.credit ||
      source.credit !== (anterior as { credit: string }).credit ||
      wholeBody.structures.filter((s) => s.id === source.parent.id).length !== 1 ||
      !same(wholeBody.structures.find((s) => s.id === source.parent.id), source.parent) ||
      wholeBody.bundles.filter((b) => b.id === source.parentBundle.id).length !== 1 ||
      !same(wholeBody.bundles.find((b) => b.id === source.parentBundle.id),
        source.parentBundle) ||
      source.parent.bundle !== source.parentBundle.id) return [];

  const supplied = [...anteriorSource.structures, ...wholeBody.structures];
  const suppliedBundles = [...anteriorSource.bundles, ...wholeBody.bundles];
  const roots = source.structures;
  if (roots.some((record, i) =>
    record.fmaId !== fmaIds[i] ||
    supplied.filter((s) => s.id === record.id).length !== 1 ||
    !same(supplied.find((s) => s.id === record.id), record) ||
    (currentRoot && (
      currentRoot.structures.filter((s) => s.id === record.id).length !== 1 ||
      !same(currentRoot.structures.find((s) => s.id === record.id), record)
    ))
  )) return [];
  if (source.bundles.some((bundle) =>
    suppliedBundles.filter((b) => b.id === bundle.id).length !== 1 ||
    !same(suppliedBundles.find((b) => b.id === bundle.id), bundle) ||
    (currentRoot && (
      currentRoot.bundles.filter((b) => b.id === bundle.id).length !== 1 ||
      !same(currentRoot.bundles.find((b) => b.id === bundle.id), bundle)
    ))
  )) return [];
  if (currentRoot && (
    currentRoot.sourceVersion !== source.sourceVersion ||
    currentRoot.license !== source.license ||
    currentRoot.credit !== source.credit ||
    !same(currentRoot.coordinateSystem, source.coordinateSystem) ||
    currentRoot.structures.filter((s) => s.id === parent.id).length !== 1 ||
    !same(currentRoot.structures.find((s) => s.id === parent.id), source.parent) ||
    currentRoot.bundles.filter((b) => b.id === source.parentBundle.id).length !== 1 ||
    !same(currentRoot.bundles.find((b) => b.id === source.parentBundle.id),
      source.parentBundle)
  )) return [];

  const children = coronaryVenousFor(parent);
  const childFiles = new Set(children.flatMap((s) => s.sources.map((file) => file.file)));
  const rootFiles = roots.flatMap((s) => s.sources.map((file) => file.file));
  if (roots.some((s) => s.id === parent.id ||
      children.some((child) => child.id === s.id) ||
      !source.bundles.some((bundle) => bundle.id === s.bundle)) ||
      rootFiles.length !== new Set(rootFiles).size ||
      rootFiles.some((file) => childFiles.has(file)) ||
      source.bundles.some((bundle) =>
        coronaryVenousCatalog.bundles.some((childBundle) => childBundle.id === bundle.id))
  ) return [];
  return structuredClone(roots);
}

/** Stable exact source and visible-copy material for revision-bound Review. */
export function coronaryVenousContextMaterial(
  parent: BodyStructure | null,
  currentRoot?: BodyCatalog,
) {
  const structures = coronaryVenousContextFor(parent, currentRoot);
  if (structures.length !== 3) return null;
  return JSON.parse(JSON.stringify({
    parent: source.parent,
    parentBundle: source.parentBundle,
    structures,
    bundles: source.bundles,
    coordinateSystem: source.coordinateSystem,
    sourceVersion: source.sourceVersion,
    license: source.license,
    credit: source.credit,
    copy: coronaryVenousContextCopy,
  })) as {
    parent: BodyStructure;
    parentBundle: BodyCatalog['bundles'][number];
    structures: BodyStructure[];
    bundles: BodyCatalog['bundles'];
    coordinateSystem: BodyCatalog['coordinateSystem'];
    sourceVersion: string;
    license: string;
    credit: string;
    copy: typeof coronaryVenousContextCopy;
  };
}

export function coronaryVenousContextViewCatalog(
  parent: BodyStructure | null,
  visible: boolean,
  currentRoot?: BodyCatalog,
) {
  const context = visible ? coronaryVenousContextFor(parent, currentRoot) : [];
  if (!context.length) return coronaryVenousCatalog;
  return {
    ...coronaryVenousCatalog,
    structures: [...coronaryVenousCatalog.structures, ...context],
    contextIds: context.map((s) => s.id),
    bundles: [...coronaryVenousCatalog.bundles, ...source.bundles],
  };
}

export function coronaryVenousContextColour(structure: BodyStructure) {
  return structure.fmaId === 'FMA76767' ? '#b77a9d'
    : structure.fmaId === 'FMA4707' ? '#768fbb' : '#6a9eac';
}
