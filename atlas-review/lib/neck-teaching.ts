import pins from '../content/neck-teaching-pins.json' with {type:'json'};
import {longusClinicalTopics,longusPartContext,thyroidClinicalTopics,longusTeachingReference} from '../content/neck-teaching';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';
const bindings=new Map(pins.entries.map(e=>[e.identity.id,{identity:sourceCanonical(e.identity),family:e.family}]));
export function neckTeachingLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined{
  if(tab!=='clinical'&&tab!=='pathology'&&tab!=='ct'&&tab!=='mri')return undefined;
  const binding=bindings.get(s.id);
  if(!binding||binding.identity!==sourceCanonical(s))return undefined;
  const family=binding.family;
  if(family!=='thyroid'&&family!=='superior'&&family!=='vertical'&&family!=='inferior')return undefined;
  if(family==='thyroid'&&(tab==='ct'||tab==='mri'))return undefined;
  const topic=family==='thyroid'?thyroidClinicalTopics[tab as 'clinical'|'pathology']:longusClinicalTopics[tab];
  const reference=family==='thyroid'?thyroidClinicalTopics[tab as 'clinical'|'pathology']:undefined;
  return {
    readiness:'draft',title:`${s.name} · ${topic.title} · draft`,body:topic.body,
    bullets:[topic.prompt,
      family==='thyroid'
        ? 'Source limit: one source-labelled inferior thyroid artery; no complete glandular supply, recurrent laryngeal nerve, patent junction or validated surgical corridor.'
        : `Source limit: ${longusPartContext[family]} Only the supplied left parts exist; no right counterpart or disease geometry is inferred.`,
      `Visible source: ${s.fmaId} · ${s.laterality} · ${s.bundle}. ${s.coverageNote ?? 'Anatomical boundaries remain unvalidated.'}`,
      `Reference: ${reference?.credit ?? longusTeachingReference.credit}`],
    citations:[reference?.citation ?? longusTeachingReference.url],
    note:'Educational draft for revision-bound radiologist review, not a diagnostic test, procedure plan or treatment recommendation. No patient scan, registration or clinical approval is inferred. Atlas, imaging-case and paid-lecture access remain independent.',
  };
}
