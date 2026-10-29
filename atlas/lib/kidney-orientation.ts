import pins from '../content/kidney-orientation-pins.json' with { type: 'json' };
import { kidneyOrientation, kidneyOrientationNote } from '../content/kidney-orientation';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

type Side = keyof typeof kidneyOrientation;
type Topic = 'anatomy' | 'ct' | 'mri' | 'quiz';
const topics: readonly ContentTab[] = ['anatomy', 'ct', 'mri', 'quiz'];
const expected = {
  right: { id: 'vm:anatomy:body:abdomen:right:organ:right-kidney', fmaId: 'FMA7204' },
  left: { id: 'vm:anatomy:body:abdomen:left:organ:left-kidney', fmaId: 'FMA7205' },
} as const;
if (pins.baselineHead !== '4d29390eaa4e3eb8f656c88b22eb93bc2dd308b9' || pins.entries.length !== 2) {
  throw Error('Unexpected kidney orientation source binding');
}
const bindings = new Map<string, { signature: string; side: Side }>();
for (const side of ['right', 'left'] as const) {
  const matches = pins.entries.filter(entry => entry.side === side);
  if (matches.length !== 1 || matches[0].identity.id !== expected[side].id || matches[0].identity.fmaId !== expected[side].fmaId) {
    throw Error('Unexpected kidney orientation identity');
  }
  bindings.set(expected[side].id, { signature: sourceCanonical(matches[0].identity), side });
}

/** Exact whole-source binding for two kidneys and four tabs only. */
export function kidneyOrientationLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (!topics.includes(tab)) return undefined;
  const binding = bindings.get(s.id);
  if (!binding || sourceCanonical(s) !== binding.signature) return undefined;
  const topic = kidneyOrientation[binding.side][tab as Topic];
  return {
    readiness: 'draft',
    title: `${s.name} · ${tab === 'quiz' ? 'spatial and imaging check' : tab.toUpperCase() + ' orientation'} · draft`,
    body: topic.body,
    bullets: [...topic.bullets],
    citations: [...topic.citations],
    ...('correctAnswer' in topic ? {
      correctAnswer: topic.correctAnswer,
      explanation: topic.explanation,
      additionalChecks: topic.additionalChecks.map(check => ({ ...check, bullets: [...check.bullets], citations: [...check.citations] })),
    } : {}),
    note: kidneyOrientationNote,
  };
}
