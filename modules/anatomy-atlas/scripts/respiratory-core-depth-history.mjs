// Frozen offline terminal junction guard. Never learner dispatch or approval authority.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {replayPinnedTeaching} from './pinned-teaching-replay.mjs';
import pins from '../content/respiratory-core-depth-pins.json' with {type:'json'};
import transition from '../content/respiratory-core-depth.transition.json' with {type:'json'};
import majorPins from '../content/major-organ-function-pins.json' with {type:'json'};
import majorTransition from '../content/major-organ-function.transition.json' with {type:'json'};

const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const name='respiratory-core-depth';
const pinsHash='c903690d5756f9bee82ce110cb62fd44afacdf960e85e8015fd24af0f68fbd4c';
const transitionHash='65880a32a320f6bb2a867f41519da5cd1d65acc1ee4ea85a20f95df915b9c6e9';
const majorPinsHash='655f7f276e3a5dac43811378ffc8036380ac91420a54d01c78c5fa2b26ee208a';
const majorTransitionHash='3635c886868ee3eeeea1d7f4f167737cb03cbeb2a16c4884b2afbe6a25546726';
const targetId='vm:anatomy:body:thorax:unpaired:organ:trachea';
const key=(id,tab)=>JSON.stringify([id,tab]);
const shown=lesson=>{const{readiness:_readiness,...content}=lesson;return content;};

function exactTerminalMajorComposite(api,catalog){
 assert.equal(hash(pins),pinsHash,`${name}: pins changed`);
 assert.equal(hash(transition),transitionHash,`${name}: transition changed`);
 assert.equal(hash(majorPins),majorPinsHash,'major-organ-function: pins changed');
 assert.equal(hash(majorTransition),majorTransitionHash,'major-organ-function: transition changed');
 assert.equal(transition.pinsHash,pinsHash,`${name}: transition pins hash`);
 assert.equal(majorTransition.parentCommit,majorPins.sourceCommit,'major-organ-function: parent commit');
 const major=majorPins.entries.filter(e=>e.identity.id===targetId);
 const majorRecord=majorTransition.entries.filter(e=>e.id===targetId);
 assert.equal(major.length,1,'One frozen major-organ trachea');
 assert.equal(majorRecord.length,1,'One frozen major-organ trachea transition');
 assert.deepEqual(major[0].topics,['function'],'Exact major-organ overlap');
 const older=major[0].previous.function;
 assert.equal(hash(older),'d98905034626518760d35987cf20ab3c258e42dd9b14c3e263b34c40851d3fd4','Frozen major-organ predecessor');

 const rows=new Map();
 for(const entry of pins.entries)for(const[tab,previous]of Object.entries(entry.previous)){
  const slot=key(entry.identity.id,tab);
  assert(!rows.has(slot),`${name}: duplicate pin`);
  rows.set(slot,{identity:entry.identity,tab,previous});
 }
 assert.equal(rows.size,8,`${name}: exact eight-slot bridge`);
 const recorded=new Map();
 for(const row of transition.entries){
  const slot=key(row.id,row.tab),pinned=rows.get(slot);
  assert(pinned&&!recorded.has(slot),`${name}: duplicate or foreign transition`);
  assert.equal(row.fmaId,pinned.identity.fmaId,`${name}: transition FMA`);
  assert.equal(row.previousHash,hash(pinned.previous),`${name}: transition previous`);
  recorded.set(slot,row.currentHash);
 }
 assert.equal(recorded.size,8,`${name}: complete transition`);
 const overlap=rows.get(key(targetId,'function'));
 assert(overlap,`${name}: missing trachea Function`);
 assert.deepEqual(overlap.identity,major[0].identity,`${name}: overlap source identity`);
 assert.equal(majorRecord[0].sections.function,hash(overlap.previous),`${name}: major/respiratory junction`);
 assert.equal(hash(overlap.previous),'0d93342e3f12df565ce4225b3ae1858acbdc68aae0c2e3524e78272a9e7a7542','Frozen respiratory predecessor');

 if(catalog!==undefined){
  const display=typeof api.bodyDisplayCatalog==='function'?api.bodyDisplayCatalog(catalog):catalog;
  assert(Array.isArray(display?.structures),`${name}: missing source catalog`);
  for(const entry of pins.entries){
   const matches=display.structures.filter(s=>s.id===entry.identity.id);
   assert.equal(matches.length,1,`${name}: duplicate or missing source identity`);
   assert.deepEqual(matches[0],entry.identity,`${name}: foreign source identity`);
  }
 }
 assert.equal(typeof api.bodyContent,'function',`${name}: terminal composite requires learner content`);
 assert.equal(typeof api.respiratoryCoreDepthLesson,'function',`${name}: terminal composite requires draft helper`);
 for(const[slot,{identity,tab,previous}]of rows){
  const lesson=api.bodyLesson(identity,tab);
  assert.deepEqual(lesson,slot===key(targetId,'function')?older:previous,`${name}: foreign terminal teaching`);
  assert.equal(hash(api.respiratoryCoreDepthLesson(identity,tab)),recorded.get(slot),`${name}: foreign draft helper`);
  assert.deepEqual(api.bodyContent(identity,tab),shown(lesson),`${name}: foreign body content`);
 }
 return api;
}

export function beforeRespiratoryCoreDepth(api,catalog){
 if(catalog===undefined&&typeof api?.bodyLesson!=='function')return api;
 const overlap=pins.entries.find(e=>e.identity.id===targetId);
 const major=majorPins.entries.find(e=>e.identity.id===targetId);
 if(typeof api?.bodyLesson==='function'&&overlap&&major&&
    isDeepStrictEqual(api.bodyLesson(overlap.identity,'function'),major.previous.function))
  return exactTerminalMajorComposite(api,catalog);
 return replayPinnedTeaching(api,{
  name,pins,transition,pinsHash,transitionHash,
  helper:'respiratoryCoreDepthLesson',optionalHelper:true,
 },catalog);
}
