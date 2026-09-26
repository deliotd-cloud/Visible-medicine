import pins from '../content/sca-mca-clinical-pins.json' with {type:'json'};
import {scaMcaClinicalTopics, scaMcaClinicalReferences} from '../content/sca-mca-clinical';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';
const bindings=new Map(pins.entries.map(e=>[e.identity.id,{identity:sourceCanonical(e.identity),family:e.family}]));
export function scaMcaClinicalLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined{
  if(tab!=='clinical'&&tab!=='pathology')return undefined;
  const binding=bindings.get(s.id);
  if(!binding||binding.identity!==sourceCanonical(s))return undefined;
  if(binding.family!=='sca'&&binding.family!=='mca')return undefined;
  const family=binding.family,topic=scaMcaClinicalTopics[family][tab];
  return {
    readiness:'draft',title:`${s.name} · ${topic.title} · draft`,body:topic.body,
    bullets:[topic.prompt,
      family==='sca'
        ? 'Source limit: one original file and one connected component on this side. Small proximal midline crossing is retained with official source laterality; neither reflection nor fitting has been applied. Complete branches, territories and patent junctions are not established.'
        : 'Source limit: three ordered PART-OF files contain six disconnected components. They are not validated M1/M2/M3 segments. No bridges, complete perforators or left MCA have been created.',
      `Visible source: ${s.fmaId} · ${s.laterality} · ${s.bundle}. ${s.coverageNote ?? 'Anatomical boundaries remain unvalidated.'}`,
      family==='sca'
        ? 'References: UAMS artery tables; Kase et al. (1993), primary clinical series; NHS stroke symptoms. Short original factual teaching only; no publisher figures, tables or patient examples imported.'
        : 'References: UAMS artery tables; American Stroke Association spatial neglect and ischaemic stroke; NHS stroke symptoms. Short original factual teaching only; no source images, tables or patient examples imported.'],
    citations:[...scaMcaClinicalReferences[family]],
    note:'Educational draft for revision-bound radiologist review, not a diagnostic test, procedure plan or treatment recommendation. No patient CT/MRI registration, perfusion or clinical approval is inferred. Suspected stroke requires emergency assessment; in the UK call 999 even if symptoms settle. Atlas, imaging-case and paid-lecture access remain independent.',
  };
}
