// Offline historical comparison only; never imported by the viewer or export gate.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import pins from '../content/thoracoabdominal-organ-imaging-pins.json' with {type:'json'};
import transition from '../content/main-bronchus-xray.transition.json' with {type:'json'};
import {beforeProperDigitalTeaching} from './proper-digital-teaching-history.mjs';
export const mainBronchusXrayHash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const hash=mainBronchusXrayHash;
export function authoringBeforeMainBronchusXray(context){
  const originalApi=context.api;
  const replayApi=beforeProperDigitalTeaching(originalApi);
  if(replayApi!==originalApi)context={...context,api:replayApi};
  const {api}=context;
  assert.equal(hash(transition),'92d3e8c0decffccca088ddd5a97df1ab54f54cbb16a0efdb81d59610dee3dfe1');
  assert.equal(transition.parentCommit,'977ac4160e27f0762c497741e6a2250aa3f4749e');
  assert.equal(hash(pins),transition.originalPinsHash);
  assert.deepEqual(transition.entries.map(e=>e.fmaId),['FMA7395','FMA7396']);
  const pinned=new Map(pins.entries.map(e=>[e.identity.id,e.identity]));
  let draftCount=0,priorCount=0;
  for(const {id,fmaId,draftHash} of transition.entries){
    const identity=pinned.get(id);assert.equal(identity?.fmaId,fmaId);
    assert.equal(hash(api.mainBronchusXrayLesson(identity,'xray')),draftHash,'Unrecorded main-bronchus X-ray draft');
    const current=api.bodyLesson(identity,'xray');
    if(hash(current)===draftHash)draftCount++;
    else {assert.deepEqual(current,transition.previous,'Unrecorded main-bronchus X-ray change');priorCount++;}
  }
  assert(draftCount===2||priorCount===2,'Mixed main-bronchus X-ray history');
  if(priorCount===2)return context;
  const ids=new Set(transition.entries.map(e=>e.id));
  const bodyLesson=(s,t)=>{
    if(t!=='xray'||!ids.has(s.id))return api.bodyLesson(s,t);
    assert.deepEqual(s,pinned.get(s.id),'Cannot reconstruct another bronchial source');
    return structuredClone(transition.previous);
  };
  return {...context,api:{...api,bodyLesson,bodyContent(s,t){const {readiness:_readiness,...content}=bodyLesson(s,t);return content;}}};
}
