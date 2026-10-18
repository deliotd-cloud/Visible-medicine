import {
  referenceTransform,
  REFERENCE_FRAME,
  type Point3,
  type SourceCoordinates,
} from './anatomy-coordinates';

export type AnatomyLinkEntry = {
  id: string;
  name: string;
  sources: { file: string; sha256: string }[];
  reference: {
    frame: typeof REFERENCE_FRAME;
    kind: 'surface-bounds-centre';
    point: Point3;
  };
};
type Bounds = { min: number[]; max: number[] };
type Manifest = {
  version: string;
  coordinateSystem: SourceCoordinates;
  parts: {
    structureId: string;
    sourceFile: string;
    sourceSha256: string;
    bounds: Bounds;
  }[];
};
type Catalog = {
  sourceVersion: string;
  coordinateSystem: SourceCoordinates;
  structures: {
    id: string;
    name: string;
    bounds: Bounds;
    sources: { file: string; sha256: string }[];
  }[];
};
const shoulderPrefix = 'vm:anatomy:upper-limb:shoulder:right:muscle:';
const bodyPrefix = 'vm:anatomy:body:shoulder-arm:right:muscle:';
/** Explicit representation relationships, verified against identical source OBJ hashes by imaging:test. */
export const shoulderBodyRelations = [
  {
    shoulder: shoulderPrefix + 'biceps-long-head',
    body: [bodyPrefix + 'long-head-of-right-biceps-brachii'],
    kind: 'alias',
  },
  {
    shoulder: shoulderPrefix + 'deltoid',
    body: ['clavicular', 'acromial', 'spinal'].map(
      (part) => bodyPrefix + part + '-part-of-right-deltoid',
    ),
    kind: 'components',
  },
] as const;
const centre = (bounds: Bounds): Point3 =>
  bounds.min.map((v, k) => (v + bounds.max[k]) / 2) as Point3;
export function shoulderLinkEntries(
  manifest: Manifest,
  names: { id: string; name: string }[],
): AnatomyLinkEntry[] {
  if (manifest.version !== '4.0')
    throw new Error('Unsupported shoulder reference revision');
  const transform = referenceTransform(manifest.coordinateSystem);
  return names.map(({ id, name }) => {
    const parts = manifest.parts.filter((p) => p.structureId === id);
    if (!parts.length) throw new Error('Missing shoulder source identity');
    const bounds = {
      min: [0, 1, 2].map((k) => Math.min(...parts.map((p) => p.bounds.min[k]))),
      max: [0, 1, 2].map((k) => Math.max(...parts.map((p) => p.bounds.max[k]))),
    };
    return {
      id,
      name,
      sources: parts.map((p) => ({
        file: p.sourceFile.replace(/\.obj$/, ''),
        sha256: p.sourceSha256,
      })),
      reference: {
        frame: REFERENCE_FRAME,
        kind: 'surface-bounds-centre',
        point: transform.toReference(centre(bounds)),
      },
    };
  });
}
export function bodyLinkEntries(catalog: Catalog): AnatomyLinkEntry[] {
  if (catalog.sourceVersion !== '4.0')
    throw new Error('Unsupported body reference revision');
  const transform = referenceTransform(catalog.coordinateSystem);
  return catalog.structures.map((s) => ({
    id: s.id,
    name: s.name,
    sources: s.sources,
    reference: {
      frame: REFERENCE_FRAME,
      kind: 'surface-bounds-centre',
      point: transform.toReference(centre(s.bounds)),
    },
  }));
}
export type SelectionResolution = {
  status: 'selected' | 'choice-required' | 'out-of-scope' | 'unknown-structure';
  mapping: 'exact' | 'alias' | 'components' | 'aggregate' | null;
  candidates: AnatomyLinkEntry[];
};
export function resolveLinkedStructure(
  id: string,
  entries: AnatomyLinkEntry[],
  allowedIds: readonly string[],
): SelectionResolution {
  let ids = [id];
  let mapping: SelectionResolution['mapping'] = 'exact';
  if (!entries.some((entry) => entry.id === id)) {
    const relation = shoulderBodyRelations.find(
      (r) => r.shoulder === id || r.body.includes(id),
    );
    if (relation) {
      const fromShoulder = relation.shoulder === id;
      ids = fromShoulder ? [...relation.body] : [relation.shoulder];
      mapping =
        relation.kind === 'alias'
          ? 'alias'
          : fromShoulder
            ? 'components'
            : 'aggregate';
    }
  }
  const known = ids.flatMap((id) => entries.filter((entry) => entry.id === id));
  if (known.length !== ids.length)
    return { status: 'unknown-structure', mapping: null, candidates: [] };
  const candidates = known.filter((entry) => allowedIds.includes(entry.id));
  if (candidates.length !== known.length)
    return { status: 'out-of-scope', mapping, candidates: [] };
  return {
    status:
      mapping === 'components' || mapping === 'aggregate'
        ? 'choice-required'
        : 'selected',
    mapping,
    candidates,
  };
}
