import type { BodyStructure } from '../app/body-types';
import type { RendererHealth } from './renderer-health';
import { nestedPartsFor, type NestedStudy } from './nested-anatomy';
import { nestedTeachingFor } from './nested-teaching';

const eligibleFmaIds: Partial<Record<NestedStudy, ReadonlySet<string>>> = {
  cardiac: new Set(['FMA11359', 'FMA9465', 'FMA9291', 'FMA9466']),
  ventricles: new Set(['FMA78450', 'FMA78449', 'FMA78454', 'FMA78469']),
};

/** Only exact, authored space identities may enter nested identification.
 * Context, walls, aggregates and every unlisted study remain excluded. */
export function nestedPracticePool(
  parent: BodyStructure,
  study: NestedStudy,
  candidates: BodyStructure[],
  loaded: string[],
  hidden: string[],
): BodyStructure[] {
  const allowed = eligibleFmaIds[study];
  if (!allowed) return [];
  const current = new Map(nestedPartsFor(parent, study).map((part) => [part.id, part]));
  return [...new Map(candidates.map((candidate) => [candidate.id, candidate])).values()]
    .filter((candidate) => {
      const resolved = current.get(candidate.id);
      return (
        !!resolved &&
        allowed.has(candidate.fmaId) &&
        loaded.includes(candidate.bundle) &&
        !hidden.includes(candidate.id) &&
        nestedTeachingFor(parent, study, candidate) !== null
      );
    })
    .map((structure) => structuredClone(structure));
}

export function nestedPracticeReady(
  health: RendererHealth,
  requiredBundleIds: string[],
  loaded: string[],
  failed: string[],
) {
  const required = [...new Set(requiredBundleIds)];
  return (
    health === 'ready' &&
    required.length > 0 &&
    required.every((id) => loaded.includes(id) && !failed.includes(id))
  );
}
