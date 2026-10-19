import pins from '../content/central-canal-imaging-pins.json' with {type:'json'};
import {centralCanalXrayTopics} from '../content/central-canal-xray';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

if(pins.entries.length!==1||
  pins.entries[0].identity.id!=='vm:anatomy:body:spine:midline:space:central-canal-of-spinal-cord'||
  pins.entries[0].identity.fmaId!=='FMA78497'||pins.entries[0].identity.nodeName!=='FMA78497'||
  pins.entries[0].identity.category!=='space'||pins.entries[0].identity.system!=='nerves'||
  pins.entries[0].identity.region!=='spine'||pins.entries[0].identity.laterality!=='midline'||
  pins.entries[0].identity.bundle!=='spine-nerves'||pins.entries[0].identity.sourceTree!=='isa')
  throw Error('Unexpected central-canal X-ray source identity.');
const identity=sourceCanonical(pins.entries[0].identity);

/** A modality limitation lesson, not a claim of direct plain-film visibility. */
export function centralCanalXrayLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined{
  if(tab!=='xray'||sourceCanonical(s)!==identity)return undefined;
  const topic=centralCanalXrayTopics.xray;
  return {readiness:'draft',title:`${s.name} · ${topic.title} · draft`,body:topic.body,
    bullets:[...topic.bullets],citations:[...topic.citations],
    note:'Original exact-source educational draft; exact-revision radiologist review pending. No publisher text or images imported. Not procedure advice, a diagnosis, measured CSF flow, clinical approval or patient-space registration. Atlas, imaging-case and paid-lecture access remain independent.'};
}
