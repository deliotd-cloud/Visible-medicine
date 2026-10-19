import pins from '../content/upper-venous-clinical-pins.json' with {type:'json'};
import {upperVenousClinicalTopics,upperVenousClinicalReferences} from '../content/upper-venous-clinical';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';
const bindings=new Map(pins.entries.map(e=>[e.identity.id,{identity:sourceCanonical(e.identity),family:e.family}]));
export function upperVenousClinicalLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined{
  if(tab!=='clinical'&&tab!=='pathology')return undefined;
  const binding=bindings.get(s.id);
  if(!binding||binding.identity!==sourceCanonical(s))return undefined;
  if(binding.family!=='brachial'&&binding.family!=='cubital'&&binding.family!=='antebrachial')return undefined;
  const family=binding.family,topic=upperVenousClinicalTopics[family][tab];
  return {
    readiness:'draft',title:`${s.name} · ${topic.title} · draft`,body:topic.body,
    bullets:[topic.prompt,
      family==='brachial'
        ? 'Source limit: one source-labelled medial brachial vein on this side. Companion veins, valves, lumen and exact junctions are not supplied.'
        : 'Source limit: one source-labelled superficial vein on this side, not a complete cubital venous network. No missing connection, valve or patient-specific variant has been created.',
      `Visible source: ${s.fmaId} · ${s.laterality} · ${s.bundle}. ${s.coverageNote ?? 'Anatomical boundaries remain unvalidated.'}`,
      family==='brachial'
        ? 'References: UAMS upper-limb vein table; ACR/RSNA RadiologyInfo upper-extremity DVT; NHS DVT. Original short factual teaching only, with no source figures or patient examples imported.'
        : 'References: UAMS upper-limb vein table; Mikuni et al. (2013), primary anatomical study; NHS phlebitis and DVT. Original short factual teaching only, with no source figures or patient examples imported.'],
    citations:[...upperVenousClinicalReferences[family]],
    note:'Educational draft for revision-bound radiologist review, not a diagnostic test, procedure plan or treatment recommendation. Suspected DVT needs urgent assessment; in the UK use an urgent GP appointment or NHS 111. DVT symptoms with chest pain or breathlessness require emergency help (UK 999). No patient scan, registration or clinical approval is inferred. Atlas, imaging-case and paid-lecture access remain independent.',
  };
}
