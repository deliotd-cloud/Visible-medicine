import wristPins from '../content/connective-imaging-pins.json' with { type: 'json' };
import footPins from '../content/foot-surface-imaging-pins.json' with { type: 'json' };
import { connectiveProjectionXrayGroups as groups, connectiveProjectionXrayTopics as topics,
  connectiveProjectionXrayNote as note } from '../content/connective-projection-xray';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

type Group = keyof typeof groups;
const bindings = new Map<string, { signature: string; group: Group }>();
// Reuse geometry identities only; older MRI/US pin topics are not X-ray permissions.
for (const [group, fmas] of Object.entries(groups)) {
  for (const fma of fmas) {
    const matches = group === 'wrist'
      ? wristPins.entries.filter(entry => entry.group === group && entry.identity.fmaId === fma)
      : footPins.entries.filter(entry => entry.family === group && entry.identity.fmaId === fma);
    if (matches.length !== 1) throw Error('Unexpected connective projection X-ray binding');
    const identity = matches[0].identity;
    if (bindings.has(identity.id)) throw Error('Duplicate connective projection X-ray identity');
    bindings.set(identity.id, { signature: sourceCanonical(identity), group: group as Group });
  }
}
if (bindings.size !== 4) throw Error('Unexpected connective projection X-ray binding count');

/** Four unchanged source selections, X-ray orientation only; no scan correspondence. */
export function connectiveProjectionXrayLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'xray') return undefined;
  const binding = bindings.get(s.id);
  if (!binding || sourceCanonical(s) !== binding.signature) return undefined;
  const topic = topics[binding.group];
  return { readiness: 'draft', title: `${s.name} · X-ray bony orientation · draft`,
    body: topic.body, bullets: [...topic.bullets], citations: [...topic.citations], note };
}
