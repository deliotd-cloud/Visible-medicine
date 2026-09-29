import type { BodyStructure } from '../app/body-types';
import type { RendererHealth } from './renderer-health';
import { nestedPartsFor, type NestedStudy } from './nested-anatomy';
import { nestedTeachingFor } from './nested-teaching';

const eligibleFmaIds: Partial<Record<NestedStudy, ReadonlySet<string>>> = {
  cardiac: new Set(['FMA11359', 'FMA9465', 'FMA9291', 'FMA9466']),
  ventricles: new Set(['FMA78450', 'FMA78449', 'FMA78454', 'FMA78469']),
  cerebral: new Set(['FMA72970','FMA72969','FMA72974','FMA72973','FMA72972','FMA72971','FMA72976','FMA72975','FMA72978','FMA72977','FMA72801','FMA72800','FMA72805','FMA72804','FMA72714','FMA72713']),
  brainstem: new Set(['FMA61993','FMA67943','FMA62004','FMA67944','FMA73464','FMA73463']),
  pulmonary: new Set(['FMA7333','FMA7383','FMA7337','FMA7370','FMA7371']),
  hepatic: new Set(['FMA14778','FMA14779','FMA15414','FMA15415','FMA71857','FMA71858','FMA15800']),
  renal: new Set(['FMA70492','FMA69265','FMA14335','FMA14343','FMA70493','FMA14336','FMA14349']),
  'visual-pathway': new Set(['FMA62045','FMA62382','FMA67936']),
  cricothyroid: new Set(['FMA46611','FMA46612','FMA46613','FMA46614']),
  'coronary-venous': new Set(['FMA4706','FMA4714']),
};

export function nestedPracticeKind(study: NestedStudy): 'space' | 'structure' | null {
  if (!eligibleFmaIds[study]) return null;
  return study === 'cardiac' || study === 'ventricles' ? 'space' : 'structure';
}

/** Explicit named source selections only, never automatic catalogue admission.
 * Source groups retain their full names/boundaries; they are not whole organs.
 * Context, chamber walls and unlisted studies remain excluded. */
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
