// Exact one-topic historical projection only; never runtime or approval code.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import pins from '../content/central-vessel-imaging-pins.json' with {type:'json'};
import {beforeAbdominalAortaUltrasound} from './abdominal-aorta-ultrasound-history.mjs';
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const focus={"body":"Specialist transoesophageal echocardiography (TOE/TEE) provides short-axis cross-sections and long-axis views of the descending thoracic aorta beside the oesophagus. Relate the imaged segment to the diaphragmatic region and distal arch; routine surface abdominal ultrasound is a different examination.","pitfall":"The changing oesophagus–aorta relationship makes screen orientation and exact level uncertain without examination landmarks. Nearby venous structures may resemble an aortic flap; actual Doppler helps distinguish flow. This exterior reference mesh supplies no patient echo plane, registered location, wall finding or Doppler measurement.","references":["echoTEE"]};
const previous={readiness:'pending',title:'Ultrasound content pending',body:'No imaging study or validated modality-specific teaching material is loaded for this structure. This is a spatial anatomy model, not a substitute for diagnostic imaging.',note:'Future imaging registration must use a verified patient coordinate frame; source-model coordinates are not patient coordinates.'};
const reference='https://www.asecho.org/wp-content/uploads/2014/05/2013_Performing-Comprehensive-TEE.pdf';
export function beforeDescendingAortaUltrasound(api,catalog) {
  api=beforeAbdominalAortaUltrasound(api,catalog);
  if(typeof api.bodyLesson!=='function')return api;
  // Early synthetic history APIs may omit the entire central-vessel contract.
  if(catalog===undefined&&api.centralVesselImagingGroups===undefined&&api.centralVesselImagingLesson===undefined&&api.bodyDisplayCatalog===undefined)return api;
  assert.equal(hash(pins),'a857867b80d31d01ab55c688264010759dce0a0a802a6a7cd76b9f7d68b467c4');
  const entry=pins.entries.find(e=>e.identity.fmaId==='FMA87217');
  assert.equal(entry.group,'descending-aorta');
  assert.equal(entry.identity.id,'vm:anatomy:body:thorax:unspecified:vessel:descending-thoracic-aorta');
  if(catalog!==undefined)assert.deepEqual(catalog.structures.find(s=>s.id===entry.identity.id),entry.identity,'Unrecorded descending-aorta source');
  // Immutable display-profile Git APIs omit central-vessel exports entirely.
  // Accept only the exact prior lesson; a new/forged draft cannot bypass replay.
  if(api.centralVesselImagingGroups===undefined&&api.centralVesselImagingLesson===undefined){
    assert.deepEqual(api.bodyLesson(entry.identity,'ultrasound'),previous,'Unrecorded descending-aorta omitted-contract prior');
    return api;
  }
  const group=api.centralVesselImagingGroups?.[entry.group];
  assert(group&&group.fmaId==='FMA87217','Missing descending-aorta historical group');
  const lesson=api.bodyLesson(entry.identity,'ultrasound');
  if(group.focus.ultrasound===undefined) {
    assert.deepEqual(lesson,previous,'Unrecorded descending-aorta prior lesson');
    assert.equal(api.centralVesselImagingLesson(entry.identity,'ultrasound'),undefined);
    return api;
  }
  assert.deepEqual(group.focus.ultrasound,focus,'Unrecorded descending-aorta ultrasound focus');
  assert.equal(api.centralVesselImagingReferences.echoTEE,reference);
  const limitation=entry.anatomy.bullets.find(b=>!b.startsWith('Source identity:'));
  const expected={readiness:'draft',title:entry.identity.name+' · Ultrasound orientation · draft',body:focus.body,
    bullets:[entry.anatomy.body,focus.pitfall,...(limitation?[limitation]:[])],
    citations:[...new Set([...entry.anatomy.citations,reference])],
    note:'Anatomy/radiology review pending. Return separation to zero before comparing relationships. No scan or spatial registration is connected. Confirm patient, vessel, side, orientation and series in the separate Education viewer. These notes are not a diagnosis, acquisition protocol, management guideline or procedural route. Paid-lecture access remains independent.'};
  assert(isDeepStrictEqual(lesson,expected),'Unrecorded descending-aorta ultrasound lesson');
  assert.deepEqual(api.centralVesselImagingLesson(entry.identity,'ultrasound'),expected,'Unrecorded descending-aorta helper');
  if(typeof api.bodyContent==='function'){const {readiness,...shown}=expected;assert.deepEqual(api.bodyContent(entry.identity,'ultrasound'),shown,'Unrecorded descending-aorta body content');}
  const matches=s=>s?.id===entry.identity.id;
  const bodyLesson=(s,t)=>{if(t!=='ultrasound'||!matches(s))return api.bodyLesson(s,t);assert.deepEqual(s,entry.identity,'Descending-aorta history needs exact source');return structuredClone(previous);};
  const groups=structuredClone(api.centralVesselImagingGroups);delete groups[entry.group].focus.ultrasound;
  return {...api,bodyLesson,centralVesselImagingGroups:groups,
    bodyContent(s,t){if(t!=='ultrasound'||!matches(s))return api.bodyContent(s,t);const {readiness,...shown}=bodyLesson(s,t);return shown;},
    centralVesselImagingLesson(s,t){if(t!=='ultrasound'||!matches(s))return api.centralVesselImagingLesson(s,t);assert.deepEqual(s,entry.identity,'Descending-aorta history needs exact source');return undefined;}};
}
