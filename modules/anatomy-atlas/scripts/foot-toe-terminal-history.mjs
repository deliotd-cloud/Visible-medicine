// Frozen offline late-teaching junction helper; never runtime or approval authority.
// Only the foot-followup config uses this; generic replay remains untouched.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {replayPinnedTeaching} from './pinned-teaching-replay.mjs';
import footPins from '../content/foot-ultrasound-followup-pins.json' with {type:'json'};
import footTransition from '../content/foot-ultrasound-followup.transition.json' with {type:'json'};
import toePins from '../content/toe-bone-ultrasound-pins.json' with {type:'json'};
import toeTransition from '../content/toe-bone-ultrasound.transition.json' with {type:'json'};
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const key=(id,tab)=>JSON.stringify([id,tab]);
const shown=lesson=>{const{readiness:_readiness,...content}=lesson;return content;};
const footPinsHash='87df5b06e49b9f5fa28dcaf226fd582fa5e9f7eb8b80a40301190906a811a48d';
const footTransitionHash='f0bf6ae655f55e959dd0a4ff38269232dccc7a6c32d0cbbc2369f9cdd88fe193';
const toePinsHash='3821c623cf0e31b608ca2ac69f2b124a150beb27312675822e50dee1771f6f5e';
const toeTransitionHash='6907c1135c75364776c5bf18920de3b66d1f546b5bdc0a0e85aa253189fa449b';

// Return true only for the terminal footprint observed in ACTUAL_FOOT.json.
function exactToeTerminal(api,config,catalog){
 assert.equal(hash(footPins),footPinsHash,'foot-followup pins changed');
 assert.equal(hash(footTransition),footTransitionHash,'foot-followup transition changed');
 assert.equal(hash(toePins),toePinsHash,'toe-bone pins changed');
 assert.equal(hash(toeTransition),toeTransitionHash,'toe-bone transition changed');
 assert.equal(config.name,'foot-ultrasound-followup','Wrong late teaching junction');
 assert.equal(config.helper,'footUltrasoundFollowupLesson','Foreign foot config helper');
 assert.equal(config.optionalHelper,true,'Foreign foot config helper policy');
 assert.equal(config.singleTab,undefined,'Foreign foot config topic policy');
 assert.equal(config.pinsHash,footPinsHash,'Foreign foot config pins');
 assert.equal(config.transitionHash,footTransitionHash,'Foreign foot config transition');
 assert.deepEqual(config.pins,footPins,'Foreign foot config content');
 assert.deepEqual(config.transition,footTransition,'Foreign foot transition content');
 assert.equal(footTransition.sourcePinsHash,footPinsHash,'Foot transition pins hash');
 assert.equal(toeTransition.sourcePinsHash,toePinsHash,'Toe transition pins hash');
 assert.equal(footTransition.baseline,footPins.baseline,'Foot baseline');
 assert.equal(toeTransition.baseline,toePins.baseline,'Toe baseline');
 const toes=new Map();
 for(const e of toePins.entries.filter(e=>footPins.entries.some(f=>f.identity.id===e.identity.id))){
  assert.equal(Object.keys(e.previous).length,1,'Toe pin topic count');
  assert(e.previous.ultrasound,'Toe ultrasound predecessor');
  assert(!toes.has(e.identity.id),'Duplicate toe identity');
  toes.set(e.identity.id,e);
 }
 assert.equal(toes.size,4,'Exact four hallux predecessors');
 const toeRows=new Map();
 for(const row of toeTransition.entries.filter(r=>toes.has(r.id))){
  const pinned=toes.get(row.id);
  assert(pinned&&!toeRows.has(row.id),'Duplicate or foreign toe transition');
  assert.equal(row.fmaId,pinned.identity.fmaId,'Toe transition FMA');
  toeRows.set(row.id,row);
 }
 assert.equal(toeRows.size,4,'Complete toe transition');
 const footRows=new Map();
 for(const row of footTransition.entries){
  const slot=key(row.id,row.tab);
  assert.equal(row.tab,'ultrasound','Foot transition topic');
  assert(!footRows.has(slot),'Duplicate foot transition');
  footRows.set(slot,row);
 }
 assert.equal(footRows.size,12,'Exact twelve foot transitions');
 assert.equal(footPins.entries.length,12,'Exact twelve foot pins');
 if(catalog!==undefined){
  const display=typeof api.bodyDisplayCatalog==='function'?api.bodyDisplayCatalog(catalog):catalog;
  assert(Array.isArray(display?.structures),'Foot terminal requires source catalog');
  for(const e of footPins.entries){
   const matches=display.structures.filter(s=>s.id===e.identity.id);
   assert.equal(matches.length,1,'Missing or duplicate foot source');
   assert.deepEqual(matches[0],e.identity,'Foreign foot source');
  }
 }
 assert.equal(typeof api.bodyLesson,'function','Foot terminal requires body lesson');
 assert.equal(typeof api.bodyContent,'function','Foot terminal requires learner content');
 assert.equal(typeof api.footUltrasoundFollowupLesson,'function','Foot terminal requires draft helper');
 let toeCount=0,otherCount=0;
 for(const e of footPins.entries){
  const slot=key(e.identity.id,'ultrasound'),record=footRows.get(slot);
  assert(record,'Missing foot transition');
  assert.equal(record.fmaId,e.identity.fmaId,'Foot transition FMA');
  const toe=toes.get(e.identity.id);
  if(toe){
   assert.equal(e.family,'halluxNote','Only hallux overlaps toe');
   assert.deepEqual(toe.identity,e.identity,'Toe/foot identity mismatch');
   assert.equal(hash(e.previous.ultrasound),toeRows.get(e.identity.id).draftHash,'Foot previous is toe authored');
   toeCount++;
  }else{
   assert.notEqual(e.family,'halluxNote','Missing hallux toe pin');
   otherCount++;
  }
  const expected=toe?toe.previous.ultrasound:e.previous.ultrasound;
  assert(isDeepStrictEqual(api.bodyLesson(e.identity,'ultrasound'),expected),'Foreign foot/toe terminal lesson');
  assert.equal(hash(api.footUltrasoundFollowupLesson(e.identity,'ultrasound')),record.draftHash,'Foreign foot draft helper');
  assert.deepEqual(api.bodyContent(e.identity,'ultrasound'),shown(expected),'Foreign foot learner content');
 }
 assert.equal(toeCount,4,'All four hallux topics');
 assert.equal(otherCount,8,'All eight foot surface topics');
 return true;
}

export function replayFootFollowupToeTerminal(api,config,catalog){
 if(config.name!=='foot-ultrasound-followup')return replayPinnedTeaching(api,config,catalog);
 const toe=toePins.entries.find(e=>footPins.entries.some(f=>f.identity.id===e.identity.id));
 assert(toe,'Frozen foot/toe overlap missing');
 if(typeof api?.bodyLesson==='function'&&isDeepStrictEqual(api.bodyLesson(toe.identity,'ultrasound'),toe.previous.ultrasound)){
  exactToeTerminal(api,config,catalog);
  return api;
 }
 return replayPinnedTeaching(api,config,catalog);
}
