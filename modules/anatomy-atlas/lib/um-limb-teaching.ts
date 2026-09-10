import pins from '../content/um-limb-teaching-bindings.v1.json' with { type: 'json' };
import type { SpecimenLesson } from '../content/um-limb-teaching';
import type { SpecimenDefinition, SpecimenSurface } from './independent-specimen';
import { specimenTopics, type SpecimenTopic } from './specimen-links';
const canonical = (value: unknown): string => Array.isArray(value) ? `[${value.map(canonical).join(',')}]`
  : value && typeof value === 'object' ? `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${canonical((value as Record<string, unknown>)[k])}`).join(',')}}` : JSON.stringify(value);

/** Exact source binding, not a guessed name/FMA correspondence. Returning a
 * detached lesson prevents a viewer from modifying the shared registry. */
export function specimenTeachingFor(definition: SpecimenDefinition, selected: SpecimenSurface): SpecimenLesson | null {
  const current = definition.surfaces.find(s => s.id === selected.id);
  const pin = pins.bindings.find(p => p.surface.id === selected.id);
  const bundle = definition.catalog.bundles.find(b => b.id === selected.bundle);
  if (!current || !pin || !bundle || bundle.sha256 !== pin.bundleSha256 || canonical(current) !== canonical(pin.surface) || canonical(selected) !== canonical(current)) return null;
  return JSON.parse(JSON.stringify(pin.lesson)) as SpecimenLesson;
}

/** Only exact bound drafts are linkable; absence is not a generic completed lesson. */
export function availableSpecimenTopics(definition: SpecimenDefinition, selectedId: string): SpecimenTopic[] {
  const selected = definition.surfaces.find(s => s.id === selectedId);
  const lesson = selected && specimenTeachingFor(definition, selected);
  if (!lesson) return [];
  return specimenTopics.filter(topic => topic === 'anatomy' || topic === 'function' || lesson.extended?.topics[topic]?.readiness === 'draft');
}

export type IdentificationQuestion = { targetId: string; options: string[] };
export type IdentificationResult = { targetId: string; firstTry: boolean; revealed: boolean };
export type IdentificationState = {
  questions: IdentificationQuestion[]; index: number; wrong: string[];
  feedback: 'ready' | 'wrong' | 'correct' | 'revealed'; results: IdentificationResult[];
};
function shuffle<T>(values: T[], random: () => number) {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i--) { const r = random(); if (!Number.isFinite(r) || r < 0 || r >= 1) throw Error('Invalid shuffle input'); const j = Math.floor(r * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; }
  return copy;
}
/** Only the caller's visible, pinned source selections can enter a round. */
export function createIdentification(definition: SpecimenDefinition, visibleIds: string[], random = Math.random, targets?: string[]): IdentificationState | null {
  const visible = new Set(visibleIds), pool = definition.surfaces.filter(s => visible.has(s.id) && specimenTeachingFor(definition, s));
  if (pool.length < 2) return null;
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
