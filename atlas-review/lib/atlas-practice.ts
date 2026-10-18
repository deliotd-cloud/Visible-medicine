import type { BodyStructure } from '../app/body-types';
import * as identification from './anatomy-practice';
import { reasoningConceptFor } from './reasoning-questions';
import type { ReasoningConcept } from './reasoning-questions';
export { practicePool, missedPracticeIds } from './anatomy-practice';
export type { PracticeSampling } from './anatomy-practice';
export type PracticeMode = identification.PracticeMode | 'reason';
export type ReasoningQuestion = {
  target: string;
  choices: string[];
  reasoning?: {
    key: string;
    revision: number;
    readiness: 'draft';
    prompt: string;
    explanation: string;
    references: { title: string; url: string }[];
  };
};
export type PracticeSession = Omit<
  identification.PracticeSession,
  'mode' | 'questions'
> & {
  mode: PracticeMode;
  questions: ReasoningQuestion[];
};
export type PracticeAction =
  | Exclude<identification.PracticeAction, { type: 'start' }>
  | { type: 'start'; session: PracticeSession };
export const initialPractice: PracticeSession = identification.initialPractice;
function shuffled<T>(list: T[], random: () => number) {
  const result = [...list];
  for (let i = result.length - 1; i > 0; i--) {
    const v = random(),
      j = Math.floor(
        Math.max(0, Math.min(0.99999999, Number.isFinite(v) ? v : 0)) * (i + 1),
      );
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
function reasoningPool(items: BodyStructure[]) {
  const bound: { structure: BodyStructure; concept: ReasoningConcept }[] = [];
  const ids = new Set<string>();
  for (const s of items) {
    const concept = reasoningConceptFor(s);
    if (concept && !ids.has(s.id)) {
      ids.add(s.id);
      bound.push({ structure: s, concept });
    }
  }
  return bound
    .map((item) => ({
      ...item,
      alternatives: bound.filter(
        (other) =>
          other.structure.laterality === item.structure.laterality &&
          item.concept.distractors.includes(other.concept.key),
      ),
    }))
    .filter((item) => item.alternatives.length > 0);
}
export function practiceQuestionCount(
  pool: BodyStructure[],
  mode: PracticeMode,
  retryIds?: string[],
) {
  if (mode !== 'reason')
    return identification.practiceCanStart(pool, mode)
      ? new Set(
          pool
            .filter((s) => !retryIds || retryIds.includes(s.id))
            .map((s) => s.id),
        ).size
      : 0;
  return new Set(
    reasoningPool(pool)
      .filter((item) => !retryIds || retryIds.includes(item.structure.id))
      .map((item) => item.concept.key),
  ).size;
}
export function practiceCanStart(pool: BodyStructure[], mode: PracticeMode) {
  return practiceQuestionCount(pool, mode) > 0;
}
export function createPracticeSession(
  items: BodyStructure[],
  loaded: string[],
  options: Omit<
    Parameters<typeof identification.createPracticeSession>[2],
    'mode'
  > & { mode: PracticeMode },
  random = Math.random,
): PracticeSession | null {
  if (options.mode !== 'reason')
    return identification.createPracticeSession(
      items,
      loaded,
      { ...options, mode: options.mode },
      random,
    );
  if (!Number.isSafeInteger(options.id) || options.id < 1) return null;
  const pool = identification.practicePool(
    items,
    loaded,
    options.sampling === 'focus' ? (options.focusIds ?? []) : undefined,
  );
  const seen = new Set<string>();
  const candidates = shuffled(
    reasoningPool(pool).filter(
      (item) =>
        !options.retryIds || options.retryIds.includes(item.structure.id),
    ),
    random,
  ).filter((item) => {
    if (seen.has(item.concept.key)) return false;
    seen.add(item.concept.key);
    return true;
  });
  const limit = Math.max(
    1,
    Math.min(
      20,
      Math.floor(Number.isFinite(options.count) ? options.count : 5),
    ),
  );
  const questions: ReasoningQuestion[] = candidates
    .slice(0, limit)
    .map(({ structure, concept, alternatives }) => ({
      target: structure.id,
      choices: shuffled(
        [structure.id, ...alternatives.map((a) => a.structure.id)],
        random,
      ),
      reasoning: {
        key: concept.key,
        revision: concept.revision,
        readiness: 'draft',
        prompt: concept.prompt,
        explanation: concept.explanation,
        references: concept.references.map((r) => ({ ...r })),
      },
    }));
  if (!questions.length) return null;
  return {
    id: options.id,
    mode: 'reason',
    status: 'active',
    questions,
    renderedIds: [...new Set(questions.flatMap((q) => q.choices))],
    index: 0,
    responses: [],
  };
}
export function practiceReducer(
  state: PracticeSession,
  action: PracticeAction,
): PracticeSession {
  if (action.type === 'start')
    return state.status !== 'active' && action.session.id > state.id
      ? action.session
      : state;
  const normalized: identification.PracticeSession = {
    ...state,
    mode: state.mode === 'reason' ? 'name' : state.mode,
  };
  const next = identification.practiceReducer(normalized, action);
  if (next === normalized) return state;
  // Dismiss resets the mode along with the other in-memory session fields.
  return { ...next, mode: action.type === 'dismiss' ? next.mode : state.mode };
}
export const practiceScore = (state: PracticeSession) =>
  state.responses.filter((r) => r.chosen === r.target).length;
export const practiceRenderIds = (state: PracticeSession) =>
  state.status !== 'active'
    ? []
    : state.mode === 'reason'
      ? [...state.questions[state.index].choices]
      : identification.practiceRenderIds({ ...state, mode: state.mode });
/** UI must use this gate; explanations/citations never render before response. */
export function reasoningFeedback(state: PracticeSession, index = state.index) {
  return state.mode === 'reason' &&
    Number.isInteger(index) &&
    index >= 0 &&
    index < state.responses.length
    ? state.questions[index]?.reasoning
    : undefined;
}
