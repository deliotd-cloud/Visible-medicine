import pins from '../content/portal-hepatic-clinical-pins.json' with {type:'json'};
import {portalHepaticClinicalTopics as topics,portalHepaticClinicalReferences as references,portalHepaticClinicalCredit as credit} from '../content/portal-hepatic-clinical';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

type Family=keyof typeof topics;
const bound=new Map(pins.entries.map(entry=>[entry.identity.id,{signature:sourceCanonical(entry.identity),family:entry.family as Family}]));

/** Exact root identities only; do not substitute nested or similarly named veins. */
export function portalHepaticClinicalLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined {
  if(tab!=='clinical'&&tab!=='pathology')return undefined;
  const match=bound.get(s.id);
  if(!match||sourceCanonical(s)!==match.signature)return undefined;
  const topic=topics[match.family][tab];
  return {
    readiness:'draft',title:`${s.name} · ${topic.title} · draft`,body:topic.body,
    bullets:[topic.prompt,
      s.bundle==='hepatic-veins'
        ? 'Source limit: original faces and disconnected parts remain unbridged. No validated venous territories, complete collecting junctions or lumens are supplied; nested liver-branches selections remain separate.'
        : 'Source limit: this whole source surface does not establish smaller tributaries, lumens or exact confluences. Typical drainage relationships are teaching context, not measured flow or pressure.',
      `Visible source: ${s.fmaId} · ${s.laterality} · ${s.sources.length} source file${s.sources.length===1?'':'s'} in ${s.bundle}. ${s.coverageNote ?? 'Anatomical boundaries and connections remain unvalidated.'}`,
      credit],
    citations:[...references],
    note:'Source-bound educational draft for revision-bound radiologist review. No flow, thrombosis, portal pressure, tissue viability or CT/MRI/ultrasound registration is inferred from static surfaces. Not a diagnostic test, intervention plan or treatment algorithm. Atlas, case and paid-lecture access remain independent.',
  };
}
