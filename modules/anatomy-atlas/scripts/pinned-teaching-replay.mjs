// Test-only frozen teaching reconstruction. Never import into learner dispatch.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';

const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const digest=value=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
const key=(id,tab)=>JSON.stringify([id,tab]);

export function replayPinnedTeaching(api,config,catalog){
 assert(config&&typeof config==='object','Missing replay config');
 const {name,pins,transition,pinsHash,transitionHash,helper,optionalHelper=false,singleTab}=config;
 assert(typeof name==='string'&&name.length>0,'Missing replay name');
 assert(digest(pinsHash)&&digest(transitionHash),'Missing frozen replay hash');
 assert.equal(hash(pins),pinsHash,`${name}: pins changed`);
 assert.equal(hash(transition),transitionHash,`${name}: transition changed`);
 assert(Array.isArray(pins.entries)&&pins.entries.length>0,`${name}: no pinned entries`);
 assert(Array.isArray(transition.entries),`${name}: no transition entries`);
 assert(singleTab===undefined||typeof singleTab==='string'&&singleTab.length>0,`${name}: invalid single tab`);
 assert(helper===undefined||typeof helper==='string'&&helper.length>0,`${name}: invalid helper name`);
 assert.equal(typeof optionalHelper,'boolean',`${name}: invalid optional helper setting`);
 assert(!optionalHelper||helper!==undefined,`${name}: optional helper requires a helper name`);
 if(transition.pinsHash!==undefined)assert.equal(transition.pinsHash,pinsHash,`${name}: transition pins hash`);
 if(transition.sourcePinsHash!==undefined)assert.equal(transition.sourcePinsHash,pinsHash,`${name}: transition source pins hash`);
 if(transition.parentCommit!==undefined&&pins.parentCommit!==undefined)
  assert.equal(transition.parentCommit,pins.parentCommit,`${name}: transition parent`);
 if(transition.parentCommit!==undefined&&pins.sourceCommit!==undefined)
  assert.equal(transition.parentCommit,pins.sourceCommit,`${name}: transition source commit`);
 if(transition.baseline!==undefined&&pins.baseline!==undefined)
  assert.equal(transition.baseline,pins.baseline,`${name}: transition baseline`);
 assert.equal(typeof api?.bodyLesson,'function',`${name}: missing bodyLesson`);
 const helperValue=helper===undefined?undefined:api[helper];
 assert(helperValue===undefined||typeof helperValue==='function',`${name}: invalid draft helper`);

 const expected=new Map();
 const identities=new Map();
 for(const entry of pins.entries){
  const identity=entry?.identity;
  assert(identity&&typeof identity.id==='string'&&identity.id.length>0,`${name}: invalid identity`);
  assert(!identities.has(identity.id),`${name}: duplicate pinned identity`);
  identities.set(identity.id,identity);
  const previous=singleTab===undefined?entry.previous:{[singleTab]:entry.previous};
  assert(previous&&typeof previous==='object'&&!Array.isArray(previous),`${name}: invalid previous lessons`);
  const tabs=Object.keys(previous);
  assert(tabs.length>0,`${name}: missing previous lessons`);
  for(const tab of tabs){
   const lesson=previous[tab];
   assert(lesson&&typeof lesson==='object'&&!Array.isArray(lesson)&&typeof lesson.readiness==='string',`${name}: invalid previous lesson`);
   const slot=key(identity.id,tab);
   assert(!expected.has(slot),`${name}: duplicate pinned topic`);
   expected.set(slot,{identity,tab,previous:lesson});
  }
 }

 const recorded=new Map();
 for(const record of transition.entries){
  assert(record&&typeof record.id==='string',`${name}: invalid transition record`);
  const sections=record.sections;
  const pairs=sections===undefined?[[record.tab??singleTab,record]]:Object.entries(sections);
  assert(pairs.length>0,`${name}: empty transition record`);
  for(const [tab,value] of pairs){
   assert(typeof tab==='string'&&tab.length>0,`${name}: transition topic missing`);
   const slot=key(record.id,tab);
   assert(expected.has(slot),`${name}: extraneous transition topic`);
   assert(!recorded.has(slot),`${name}: duplicate transition topic`);
   const currentHash=typeof value==='string'?value:value?.currentHash??value?.draftHash;
   assert(digest(currentHash),`${name}: invalid current hash`);
   if(typeof value==='object'&&value?.currentHash!==undefined&&value?.draftHash!==undefined)
    assert.equal(value.currentHash,value.draftHash,`${name}: conflicting current hashes`);
   const pinned=expected.get(slot);
   const previousHash=typeof value==='object'?value.previousHash:record.previousHash;
   if(previousHash!==undefined)assert.equal(previousHash,hash(pinned.previous),`${name}: previous hash mismatch`);
   if(record.fmaId!==undefined)assert.equal(record.fmaId,pinned.identity.fmaId,`${name}: FMA identity mismatch`);
   recorded.set(slot,currentHash);
  }
 }
 assert.equal(recorded.size,expected.size,`${name}: missing transition topic`);

 if(catalog!==undefined){
  const display=typeof api.bodyDisplayCatalog==='function'?api.bodyDisplayCatalog(catalog):catalog;
  assert(Array.isArray(display?.structures),`${name}: missing source catalog structures`);
  for(const [id,identity] of identities){
   const matches=display.structures.filter(s=>s.id===id);
   assert.equal(matches.length,1,`${name}: missing or duplicate source identity`);
   assert.deepEqual(matches[0],identity,`${name}: foreign source identity`);
  }
 }

 // Some older synthetic histories precede both this lesson and display catalog.
 if(catalog===undefined&&typeof api.bodyDisplayCatalog!=='function'&&helperValue===undefined&&
    [...expected.values()].every(({identity,tab})=>api.bodyLesson(identity,tab)===undefined))return api;

 let allCurrent=true,allPrevious=true;
 for(const [slot,{identity,tab,previous}] of expected){
  const now=api.bodyLesson(identity,tab);
  const previousMatch=isDeepStrictEqual(now,previous);
  const currentMatch=now!==undefined&&now!==null&&hash(now)===recorded.get(slot);
  assert(previousMatch||currentMatch,`${name}: foreign teaching`);
  allCurrent&&=currentMatch;allPrevious&&=previousMatch;
  if(helperValue!==undefined)
   assert.equal(hash(helperValue(identity,tab)),recorded.get(slot),`${name}: foreign draft helper`);
  if(typeof api.bodyContent==='function'){
   const {readiness:_,...shown}=now;
   assert.deepEqual(api.bodyContent(identity,tab),shown,`${name}: foreign body content`);
  }
 }
 assert(allCurrent||allPrevious,`${name}: mixed teaching state`);
 if(allPrevious)return api;
 if(helper!==undefined&&!optionalHelper)assert.equal(typeof helperValue,'function',`${name}: missing draft helper`);

 const byId=new Map();
 for(const item of expected.values()){
  let byTab=byId.get(item.identity.id);
  if(!byTab){byTab=new Map();byId.set(item.identity.id,byTab);}
  byTab.set(item.tab,item);
 }
 const bodyLesson=(structure,tab)=>{
  const pinned=byId.get(structure?.id)?.get(tab);
  if(!pinned)return api.bodyLesson(structure,tab);
  assert.deepEqual(structure,pinned.identity,`${name}: exact source identity required`);
  return structuredClone(pinned.previous);
 };
 const replayed={...api,bodyLesson};
 if(typeof api.bodyContent==='function')replayed.bodyContent=(structure,tab)=>{
  if(!byId.get(structure?.id)?.has(tab))return api.bodyContent(structure,tab);
  const {readiness:_,...shown}=bodyLesson(structure,tab);
  return shown;
 };
 return replayed;
}
