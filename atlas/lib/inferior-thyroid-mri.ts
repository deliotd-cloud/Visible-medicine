import pins from '../content/inferior-thyroid-mri-pins.json' with {type: 'json'};
import {inferiorThyroidMriContent as content, inferiorThyroidMriReferences as references, inferiorThyroidMriNote as note} from '../content/inferior-thyroid-mri.ts';
import {sourceCanonical} from './body-source-additions.ts';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

const bindings = new Map(pins.entries.map(entry => [entry.identity.id, sourceCanonical(entry.identity)]));

/** Bind the complete pinned identity, including side, source, geometry, licence and review state. */
export function inferiorThyroidMriLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'mri') return undefined;
  const signature = bindings.get(s.id);
  if (!signature || sourceCanonical(s) !== signature) return undefined;
  return {
    readiness: 'draft',
    title: s.name + ' · MRI thoracic-inlet orientation · draft',
    body: content.body,
    bullets: [...content.bullets],
    citations: [...references],
    note,
  };
}
