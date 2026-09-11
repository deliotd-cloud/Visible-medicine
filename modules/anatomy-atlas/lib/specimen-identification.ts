import type { SpecimenDefinition, SpecimenSurface } from './independent-specimen';

export type IdentificationQuestion = { targetId: string; options: string[] };
export type IdentificationResult = { targetId: string; firstTry: boolean; revealed: boolean };
export type IdentificationState = {
  questions: IdentificationQuestion[]; index: number; wrong: string[];
  feedback: 'ready' | 'wrong' | 'correct' | 'revealed'; results: IdentificationResult[];
};
export type SpecimenPracticeAdapter = {
  eligibleIds: (definition: SpecimenDefinition, visibleIds: string[]) => string[];
  createRound: (definition: SpecimenDefinition, visibleIds: string[], random?: () => number, targets?: string[]) => IdentificationState | null;
  feedback: (definition: SpecimenDefinition, surface: SpecimenSurface) => string | null;
  scopeNote: string;
};
function shuffle<T>(values: T[], random: () => number) {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i--) { const r = random(); if (!Number.isFinite(r) || r < 0 || r >= 1) throw Error('Invalid shuffle input'); const j = Math.floor(r * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; }
  return copy;
}
/** The source-specific adapter must verify identity/frame before passing this pool. */
export function identificationFromPool(pool: Pick<SpecimenSurface, 'id' | 'tissue'>[], random = Math.random, targets?: string[]): IdentificationState | null {
  if (pool.length < 2 || new Set(pool.map(s => s.id)).size !== pool.length) return null;
  const targetSet = targets ? new Set(targets) : null;
  const selected = shuffle(pool.filter(s => !targetSet || targetSet.has(s.id)), random).slice(0, 10);
  if (!selected.length) return null;
  return { questions: selected.map(target => {
    const same = shuffle(pool.filter(s => s.id !== target.id && s.tissue === target.tissue), random);
    const other = shuffle(pool.filter(s => s.id !== target.id && s.tissue !== target.tissue), random);
    const alternatives = [...same, ...other].slice(0, 3).map(s => s.id);
    return { targetId: target.id, options: shuffle([target.id, ...alternatives], random) };
  }), index: 0, wrong: [], feedback: 'ready', results: [] };
}
export function reduceIdentification(state: IdentificationState, action: { type: 'answer'; id: string } | { type: 'reveal' | 'next' }): IdentificationState {
  const question = state.questions[state.index];
  if (!question) return state;
  const settled = state.feedback === 'correct' || state.feedback === 'revealed';
  if (action.type === 'next') return settled ? { ...state, index: state.index + 1, wrong: [], feedback: 'ready' } : state;
  if (settled) return state;
  if (action.type === 'answer' && !question.options.includes(action.id)) return state;
  if (action.type === 'answer' && action.id !== question.targetId) return state.wrong.includes(action.id) ? state : { ...state, wrong: [...state.wrong, action.id], feedback: 'wrong' };
  return { ...state, feedback: action.type === 'reveal' ? 'revealed' : 'correct', results: [...state.results, { targetId: question.targetId, firstTry: action.type === 'answer' && !state.wrong.length, revealed: action.type === 'reveal' }] };
}
