import type { BodyStructure } from '../app/body-types';

export type PracticeSampling = 'landmarks' | 'all' | 'focus';
export type PracticeMode = 'find' | 'name';
export function practicePool(
  items: BodyStructure[],
  loaded: string[],
  focusIds?: string[],
) {
  return [
    ...new Map(
      items
        .filter(
          (s) =>
            loaded.includes(s.bundle) &&
            (focusIds === undefined || focusIds.includes(s.id)),
        )
        .map((s) => [s.id, s]),
    ).values(),
  ];
}
function shuffled<T>(items: T[], random: () => number) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const value = random();
    const j = Math.floor(
      Math.max(0, Math.min(0.99999999, Number.isFinite(value) ? value : 0)) *
        (i + 1),
    );
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Varied landmark practice from loaded surfaces only; not a validated assessment. */
export function practiceTargets(
  items: BodyStructure[],
  loaded: string[],
  count: number,
  random = Math.random,
  options: { sampling?: PracticeSampling; focusIds?: string[] } = {},
) {
  const limit = Math.max(
    1,
    Math.min(20, Math.floor(Number.isFinite(count) ? count : 5)),
  );
  const volume = (s: BodyStructure) =>
    s.bounds.max.reduce(
      (value, n, i) => value * Math.max(0.01, n - s.bounds.min[i]),
      1,
    );
  let candidates = practicePool(
    items,
    loaded,
    options.sampling === 'focus' ? (options.focusIds ?? []) : undefined,
  );
  if (!options.sampling || options.sampling === 'landmarks')
    candidates = candidates
      .sort((a, b) => volume(b) - volume(a))
      .slice(0, limit * 3);
  return shuffled(candidates, random).slice(0, limit);
}

export type PracticeResponse = { target: string; chosen: string | null };
export type PracticeSession = {
  id: number;
  mode: PracticeMode;
  status: 'idle' | 'active' | 'complete';
  questions: Array<{ target: string; choices: string[] }>;
  renderedIds: string[];
  index: number;
  responses: PracticeResponse[];
};
export const initialPractice: PracticeSession = {
  id: 0,
  mode: 'find',
  status: 'idle',
  questions: [],
  renderedIds: [],
  index: 0,
  responses: [],
};
/** Snapshot choices once. All distractors and targets are in the loaded visible scope. */
export function createPracticeSession(
  items: BodyStructure[],
  loaded: string[],
  options: {
    id: number;
    mode: PracticeMode;
    count: number;
    sampling: PracticeSampling;
    focusIds?: string[];
    retryIds?: string[];
  },
  random = Math.random,
): PracticeSession | null {
  if (
    !Number.isSafeInteger(options.id) ||
    options.id < 1 ||
    !['find', 'name'].includes(options.mode)
  )
    return null;
  const pool = practicePool(
    items,
    loaded,
    options.sampling === 'focus' ? (options.focusIds ?? []) : undefined,
  );
  if (
    !pool.length ||
    (options.mode === 'name' &&
      new Set(pool.map((s) => s.name.toLowerCase())).size < 2)
  )
    return null;
  const candidates = options.retryIds
    ? pool.filter((s) => options.retryIds!.includes(s.id))
    : pool;
  const targets = practiceTargets(candidates, loaded, options.count, random, {
    sampling: options.sampling,
    focusIds: options.focusIds,
  });
  if (!targets.length) return null;
  const questions = targets.map((target) => {
    // Prefer same-system, same-side alternatives, without duplicate visible names.
    const names = new Set([target.name.toLowerCase()]);
    const distractors = shuffled(
      pool.filter((s) => s.id !== target.id),
      random,
    )
      .sort(
        (a, b) =>
          Number(b.system === target.system) * 2 +
          Number(b.laterality === target.laterality) -
          Number(a.system === target.system) * 2 -
          Number(a.laterality === target.laterality),
      )
      .filter((s) => {
        const name = s.name.toLowerCase();
        if (names.has(name)) return false;
        names.add(name);
        return true;
      })
      .slice(0, 3);
    return {
      target: target.id,
      choices:
        options.mode === 'name'
          ? shuffled([target.id, ...distractors.map((s) => s.id)], random)
          : [],
    };
  });
  return {
    id: options.id,
    mode: options.mode,
    status: 'active',
    questions,
    renderedIds: targets.map((s) => s.id),
    index: 0,
    responses: [],
  };
}
export type PracticeAction =
  | { type: 'start'; session: PracticeSession }
  | { type: 'answer'; sessionId: number; index: number; chosen: string | null }
  | { type: 'next'; sessionId: number; index: number }
  | { type: 'exit' }
  | { type: 'dismiss' };
/** Atomic answer-once transitions reject double clicks, stale questions and foreign picks. */
export function practiceReducer(
  state: PracticeSession,
  action: PracticeAction,
): PracticeSession {
  if (action.type === 'start')
    return state.status !== 'active' && action.session.id > state.id
      ? action.session
      : state;
  if (action.type === 'dismiss') return { ...initialPractice, id: state.id };
  if (action.type === 'exit')
    return { ...state, status: state.responses.length ? 'complete' : 'idle' };
  if (
    state.status !== 'active' ||
    action.sessionId !== state.id ||
    action.index !== state.index
  )
    return state;
  const question = state.questions[state.index];
  if (!question) return state;
  if (action.type === 'answer') {
    if (state.responses.length > state.index) return state;
    const allowed =
      state.mode === 'name' ? question.choices : state.renderedIds;
    if (action.chosen !== null && !allowed.includes(action.chosen))
      return state;
    return {
      ...state,
      responses: [
        ...state.responses,
        { target: question.target, chosen: action.chosen },
      ],
    };
  }
  if (state.responses.length !== state.index + 1) return state;
  return state.index + 1 === state.questions.length
    ? { ...state, status: 'complete' }
    : { ...state, index: state.index + 1 };
}
export const practiceScore = (state: PracticeSession) =>
  state.responses.filter((r) => r.chosen === r.target).length;
export const missedPracticeIds = (responses: PracticeResponse[]) =>
  responses.filter((r) => r.chosen !== r.target).map((r) => r.target);
export const practiceRenderIds = (state: PracticeSession) =>
  state.status !== 'active'
    ? []
    : state.mode === 'name'
      ? [state.questions[state.index].target]
      : state.renderedIds;
