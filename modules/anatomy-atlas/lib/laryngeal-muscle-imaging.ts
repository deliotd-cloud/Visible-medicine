import pins from '../content/laryngeal-muscle-teaching-pins.json' with {type:'json'};
import {laryngealMuscleImagingReferences as references,laryngealMuscleImagingTopics as topics} from '../content/laryngeal-muscle-imaging';
import {sourceCanonical} from './body-source-additions';
import type {BodyStructure} from '../app/body-types';
import type {ContentTab} from '../app/anatomy-data';
import type {ContentLesson} from './content-types';

type Family=keyof typeof topics;
const bound=new Map(pins.entries.map(entry=>[entry.identity.id,{signature:sourceCanonical(entry.identity),family:entry.family as Family}]));

/** CT/MRI orientation for the seven exact retained sources only. */
export function laryngealMuscleImagingLesson(s:BodyStructure,tab:ContentTab):ContentLesson|undefined {
  if(tab!=='ct'&&tab!=='mri')return undefined;
  const match=bound.get(s.id);
  if(!match||sourceCanonical(s)!==match.signature)return undefined;
  const topic=topics[match.family];
  const bullets=[
    topic.landmark,
    `Visible source: ${s.fmaId} · ${s.laterality} · ${s.sources.length} recorded component${s.sources.length===1?'':'s'} in ${s.bundle}. Attachment footprints, tissue boundaries and missing source compartments remain unvalidated.`,
    'No imaging study loaded. This source surface is not registered to a CT or MRI acquisition.',
  ];
  if(tab==='mri')bullets.push('High-resolution cadaveric MRI supports anatomical research, not routine in-vivo visibility of each muscle. Breathing, swallowing and pulsation can affect acquisition.');
  const citations:string[]=[references.anatomy];
  if(match.family==='posterior')citations.push(references.clinical);
  if(tab==='mri')citations.push(references.research);
  return {
    readiness:'draft',title:`${s.name} · ${tab.toUpperCase()} orientation · draft`,body:topic[tab],
    bullets,citations,
    note:'Source-bound educational draft; revision-bound radiologist review pending. No airway, mucosal layer or vocal-fold motion is modelled. No denervation, endoscopy, procedural guidance or acquisition registration is inferred. Atlas, case and paid-lecture access remain independent.',
  };
}
