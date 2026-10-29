import pins from '../content/craniofacial-calcification-ct-pins.json' with { type: 'json' };
import { stylohyoidMriContext } from '../content/stylohyoid-mri-context';
import { craniofacialCalcificationCtNote as note } from '../content/craniofacial-calcification-ct';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

const bindings = new Map(pins.entries.filter(entry => entry.group === 'stylohyoid')
  .map(entry => [entry.identity.id, sourceCanonical(entry.identity)]));

/** MRI context for the two exact source records; existing CT dispatch stays separate. */
export function stylohyoidMriContextLesson(structure: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'mri') return undefined;
  const signature = bindings.get(structure.id);
  if (!signature || sourceCanonical(structure) !== signature) return undefined;
  return {
    readiness: 'pending',
    title: `${structure.name} · MRI context · review pending`,
    body: stylohyoidMriContext.body,
    bullets: [...stylohyoidMriContext.bullets],
    citations: [...stylohyoidMriContext.citations],
    note,
  };
}
