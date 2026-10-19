import pins from '../content/hand-arterial-ultrasound-pins.json' with { type: 'json' };
import { handArterialXrayReferences as references, handArterialXrayTeaching as teaching, handArterialXrayNote as note, type HandArterialXrayGroup } from '../content/hand-arterial-xray';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

// Reuse original exact geometry identities, not their ultrasound topic permissions.
// Only these evidence-supported groups gain X-ray orientation; other arteries stay pending.
const groups: readonly string[] = ['superficialArch', 'deepArch', 'princeps'];
const bindings = new Map(pins.entries.filter(entry => groups.includes(entry.group)).map(entry => [entry.identity.id, {
  signature: sourceCanonical(entry.identity), group: entry.group as HandArterialXrayGroup,
}]));

export function handArterialXrayLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'xray') return undefined;
  const binding = bindings.get(s.id);
  if (!binding || sourceCanonical(s) !== binding.signature) return undefined;
  const lesson = teaching[binding.group];
  return { readiness: 'draft', title: `${s.name} · ${lesson.title} · draft`, body: lesson.body,
    bullets: [...lesson.bullets, `Source limit: ${s.coverageNote}`],
    citations: lesson.citations.map(key => references[key]), note };
}
