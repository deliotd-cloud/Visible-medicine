// Offline history composition only; no runtime content or approval authority.
import assert from 'node:assert/strict';
import {beforeAbdominalAortaUltrasound,oldFocus,newFocus,targetId,hash} from './abdominal-aorta-ultrasound-history.mjs';
import pins from '../content/central-vessel-imaging-pins.json' with {type:'json'};
const entry=pins.entries.find(e=>e.identity.id===targetId),s=entry.identity;
const note='Anatomy/radiology review pending. Return separation to zero before comparing relationships. No scan or spatial registration is connected. Confirm patient, vessel, side, orientation and series in the separate Education viewer. These notes are not a diagnosis, acquisition protocol, management guideline or procedural route. Paid-lecture access remains independent.';
const limitation=entry.anatomy.bullets.find(b=>!b.startsWith('Source identity:'));
const prior={readiness:'draft',title:'Abdominal aorta · Ultrasound orientation · draft',body:oldFocus.body,bullets:[entry.anatomy.body,oldFocus.pitfall,...(limitation?[limitation]:[])],citations:[...new Set([...entry.anatomy.citations,'https://pmc.ncbi.nlm.nih.gov/articles/PMC9876736/'])],note};
assert.equal(hash(prior),'5838df6120062a0ab9dc23e5452b80356de2b8ed4f474e707a0a2cc768125ebe');
const shown=lesson=>{const{readiness,...content}=lesson;return content;};
const api={centralVesselImagingGroups:{'abdominal-aorta':{fmaId:'FMA3789',focus:{ultrasound:structuredClone(oldFocus)}}},
  centralVesselImagingReferences:{aortaEcho:'https://pmc.ncbi.nlm.nih.gov/articles/PMC9876736/'},
  centralVesselImagingLesson:()=>structuredClone(prior),bodyLesson:()=>structuredClone(entry.previous.ultrasound),
  bodyContent:()=>shown(structuredClone(entry.previous.ultrasound))};
const catalog={structures:[structuredClone(s)]};
assert.equal(beforeAbdominalAortaUltrasound(api,catalog),api,'Exact pending/old-draft composite is idempotent');
assert.equal(beforeAbdominalAortaUltrasound(beforeAbdominalAortaUltrasound(api,catalog),catalog),api);
let refused=0;const reject=value=>{assert.throws(()=>beforeAbdominalAortaUltrasound(value,catalog));refused++;};
for(const key of ['readiness','title','body','note'])reject({...api,bodyLesson:()=>({...entry.previous.ultrasound,[key]:'foreign'})});
reject({...api,bodyLesson:()=>({...entry.previous.ultrasound,citations:['https://example.invalid']})});
reject({...api,bodyContent:()=>({...shown(entry.previous.ultrasound),body:'foreign'})});
reject({...api,bodyContent:42});
for(const key of ['body','citations','note'])reject({...api,centralVesselImagingLesson:()=>({...prior,[key]:key==='citations'?[]:'foreign'})});
reject({...api,centralVesselImagingLesson:()=>undefined});
for(const key of ['body','pitfall','references']){const groups=structuredClone(api.centralVesselImagingGroups);groups['abdominal-aorta'].focus.ultrasound[key]=key==='references'?[]:'foreign';reject({...api,centralVesselImagingGroups:groups});}
reject({...api,centralVesselImagingGroups:{'abdominal-aorta':{fmaId:'FMA3789',focus:{ultrasound:newFocus}}}});
for(const key of ['aortaAiumUS','aortaNhsScreen'])reject({...api,centralVesselImagingReferences:{...api.centralVesselImagingReferences,[key]:'https://example.invalid'}});
reject({...api,centralVesselImagingReferences:{aortaEcho:'https://example.invalid'}});
for(const key of ['centralVesselImagingGroups','centralVesselImagingReferences','centralVesselImagingLesson']){const partial={...api};delete partial[key];reject(partial);}
const foreign=structuredClone(catalog);foreign.structures[0].sources[0].sha256='foreign';
assert.throws(()=>beforeAbdominalAortaUltrasound(api,foreign));refused++;
assert.throws(()=>beforeAbdominalAortaUltrasound(api,{structures:[s,s]}));refused++;
assert.equal(refused,23);
console.log(JSON.stringify({exactPendingComposite:true,idempotent:true,forgedOrMixedRefusals:refused,originalPinsUnchanged:true,clinicalApproval:false}));
