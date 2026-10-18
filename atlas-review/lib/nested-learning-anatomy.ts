import type { BodyCatalog } from '../app/body-types';
import {
  bodyDisplayCatalog,
  eyeDisplayCorrection,
} from './body-display-catalog';
import {
  nestedStudyTargets,
  resolveNestedTarget,
  type NestedRequest,
} from './nested-anatomy';
import { learningAnatomyRepresentations } from './learning-anatomy';
import { learningAnatomyBindingKey } from './learning-resources';
import type {
  AnatomyRepresentation,
  NestedAnatomyRepresentation,
} from './learning-resource-types';

const canonical = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object')
    return `{${Object.keys(value)
      .sort()
      .map(
        (key) =>
          `${JSON.stringify(key)}:${canonical((value as Record<string, unknown>)[key])}`,
      )
      .join(',')}}`;
  return JSON.stringify(value);
};
function currentCatalog(catalog: BodyCatalog) {
  if (
    catalog.sourceVersion !== '4.0' ||
    canonical(catalog.coordinateSystem) !==
      canonical(eyeDisplayCorrection.coordinateSystem)
  )
    throw Error(
      'Unsupported nested anatomy source revision or coordinate metadata',
    );
  return bodyDisplayCatalog(catalog);
}

/** Derive only selectable children of the currently supported display parents.
 * Context, held anatomy and guessed mirrored parts are not destinations.
 * This is separate from authored teaching, review approval and scan registration. */
export function nestedLearningAnatomyRepresentations(
  catalog: BodyCatalog,
): NestedAnatomyRepresentation[] {
  const current = currentCatalog(catalog);
  return nestedStudyTargets(current).map((target) => {
    const parent = current.structures.find((s) => s.id === target.parentId)!;
    return {
      scope: 'nested',
      structureId: target.structureId,
      sources: structuredClone(target.structure.sources),
      nested: {
        study: target.study,
        parentId: target.parentId,
        parentSources: structuredClone(parent.sources),
        parentBundleSha256: target.parentHash,
        bundleSha256: target.sourceHash,
      },
    };
  });
}

/** Unified current-display registry. The separate legacy helper can still read archives. */
export function allLearningAnatomyRepresentations(
  catalog: BodyCatalog,
  manifest: Parameters<typeof learningAnatomyRepresentations>[1],
  names: Parameters<typeof learningAnatomyRepresentations>[2],
): AnatomyRepresentation[] {
  const current = currentCatalog(catalog);
  return [
    ...learningAnatomyRepresentations(current, manifest, names),
    ...nestedLearningAnatomyRepresentations(current),
  ];
}

/** Convert a host-authorized correspondence into the existing dissection request.
 * Call only after current resource/Atlas/approval gates; repeat them at the
 * destination. This resolver itself grants no access and carries no resource URL,
 * scan coordinates, patient data, lecture title or externally supplied camera. */
export function nestedLearningSelection(
  catalog: BodyCatalog,
  representation: unknown,
  side: 'both' | 'left' | 'right' = 'both',
): NestedRequest | null {
  const key = learningAnatomyBindingKey(representation);
  if (!key) return null;
  const current = currentCatalog(catalog);
  const binding = nestedLearningAnatomyRepresentations(current).find(
    (entry) => learningAnatomyBindingKey(entry) === key,
  );
  if (!binding) return null;
  const target = resolveNestedTarget(
    current,
    binding.nested.parentId,
    {
      study: binding.nested.study,
      structureId: binding.structureId,
      sourceHash: binding.nested.bundleSha256,
    },
    side,
  );
  if (!target || target.parentHash !== binding.nested.parentBundleSha256)
    return null;
  return {
    study: target.study,
    parentId: target.parentId,
    parentHash: target.parentHash,
    structureId: target.structureId,
    sourceHash: target.sourceHash,
  };
}
