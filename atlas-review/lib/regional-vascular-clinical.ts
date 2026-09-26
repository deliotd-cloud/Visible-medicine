import pins from '../content/regional-vascular-clinical-pins.json' with {type:'json'};
import {regionalVascularClinicalTopics} from '../content/regional-vascular-clinical';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';
const bindings=new Map(pins.entries.map(e=>[e.identity.id,{identity:sourceCanonical(e.identity),family:e.family}]));
export function regionalVascularClinicalLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined{
  if(tab!=='clinical'&&tab!=='pathology')return undefined;
  const binding=bindings.get(s.id);
  if(!binding||binding.identity!==sourceCanonical(s))return undefined;
  const family=binding.family;
  if(family!=='subscapular'&&family!=='circumflex'&&family!=='epigastric')return undefined;
  if(family==='epigastric'&&tab!=='pathology')return undefined;
  const topic=family==='epigastric'?regionalVascularClinicalTopics.epigastric.pathology:regionalVascularClinicalTopics[family][tab];
  return {
    readiness:'draft',title:`${s.name} · ${topic.title} · draft`,body:topic.body,
    bullets:[topic.prompt,
      family==='subscapular'
        ? 'Source limit: one source-labelled subscapular artery, not a complete collateral circuit or flap pedicle. Branch junctions, lumen and supplied territories remain unvalidated.'
        : family==='circumflex'
          ? 'Source limit: one source-labelled descending branch, not the whole lateral circumflex femoral artery. Perforators, junctions, lumen and perfusion territories remain unvalidated.'
          : 'Source limit: one source-labelled inferior epigastric artery, not the superficial epigastric artery or a venous selection. Fascial boundaries, perforators, lumen and flow are not supplied.',
      `Visible source: ${s.fmaId} · ${s.laterality} · ${s.bundle}. ${s.coverageNote ?? 'Anatomical boundaries remain unvalidated.'}`,
      `Reference: ${topic.credit} Original short factual teaching only; no source figures, scans or datasets imported.`],
    citations:[topic.citation],
    note:'Educational draft for revision-bound radiologist review, not a diagnostic test, procedure plan or treatment recommendation. No patient scan, registration or clinical approval is inferred. Atlas, imaging-case and paid-lecture access remain independent.',
  };
}
