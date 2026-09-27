import type { BodyCatalog } from '../app/body-types';
import { createPracticeSession } from './atlas-practice';
import { reasoningConceptFor } from './reasoning-questions';

/** Snapshot the actual practice engine, not a separately maintained answer bank. */
export function bodyReasoningReview(catalog: BodyCatalog, structureId: string) {
  const targets = catalog.structures.filter(s => s.id === structureId);
  if (targets.length !== 1 || !reasoningConceptFor(targets[0])) return null;
  const session = createPracticeSession(
    catalog.structures,
    catalog.bundles.map(b => b.id),
    { id: 1, mode: 'reason', sampling: 'all', count: 1, retryIds: [structureId] },
    () => 0.314159,
  );
  const question = session?.questions[0];
  if (!question?.reasoning || question.target !== structureId) return null;
  const choices = [...question.choices].sort().map(id => {
    const matches = catalog.structures.filter(s => s.id === id);
    if (matches.length !== 1) throw new Error('Ambiguous reasoning review choice');
    const s = matches[0];
    const bundles = catalog.bundles.filter(b => b.id === s.bundle);
    if (bundles.length !== 1) throw new Error('Ambiguous reasoning review bundle');
    return {
      id: s.id, name: s.name, fmaId: s.fmaId, laterality: s.laterality,
      regions: [...s.regions], bundle: s.bundle, bundleSha256: bundles[0].sha256,
      nodeName: s.nodeName, sourceTree: s.sourceTree,
      sources: s.sources.map(p => ({ ...p })),
    };
  });
  return {
    ...question.reasoning,
    answerId: question.target,
    choices,
    scope: 'Exact source selection and the eligible same-side choices below. Learner filters may reduce this set; choice order is randomized. Other source representations and other questions are not included.',
  };
}
export type BodyReasoningReview = NonNullable<ReturnType<typeof bodyReasoningReview>>;
