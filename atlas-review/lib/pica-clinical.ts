import pins from '../content/pica-clinical-pins.json' with {type:'json'};
import {picaClinicalTopics, picaClinicalReferences} from '../content/pica-clinical';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';
const bindings=new Map(pins.entries.map(e=>[e.identity.id,sourceCanonical(e.identity)]));
export function picaClinicalLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined{
  if(tab!=='clinical'&&tab!=='pathology')return undefined;
  if(bindings.get(s.id)!==sourceCanonical(s))return undefined;
  const topic=picaClinicalTopics[tab];
  return {
    readiness:'draft',title:`${s.name} · ${topic.title} · draft`,body:topic.body,
    bullets:[topic.prompt,
      'Source limit: 13 original files on this side contain 14 disconnected components. No bridges, segment boundaries, complete perforators, continuous lumen or measured territory are supplied.',
      `Visible source: ${s.fmaId} · ${s.laterality} · ${s.bundle}. ${s.coverageNote ?? 'Anatomical boundaries remain unvalidated.'}`,
      'References: Miao et al. (2020), CC BY 4.0, original summary; Mercier et al. (2008), factual reference only; NHS stroke symptoms. No source figures or patient examples imported.'],
    citations:[...picaClinicalReferences],
    note:'Educational draft for revision-bound radiologist review, not a diagnostic test, procedure plan or treatment recommendation. No patient CT/MRI registration, perfusion or clinical approval is inferred. Atlas, imaging-case and paid-lecture access remain independent.',
  };
}
