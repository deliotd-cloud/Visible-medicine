// Exact offline predecessor for four source-bound pulmonary veins. No runtime authority.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import pins from '../content/pulmonary-venous-teaching-pins.json' with {type:'json'};
import centralPins from '../content/central-vessel-imaging-pins.json' with {type:'json'};
import {beforeRenalXray} from './renal-xray-history.mjs';

export const hashPulmonaryVenousTeaching=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const hash=hashPulmonaryVenousTeaching;
const pinsHash='3f35fb9b9be6cfc7379946607fe9232377cdbd3c7f67cd0e2ffcb143bc4be176';
const parentCommit='b3fa10a344a82c597377ec9a76c6cda8cd53a5be';
// Filled from the one-time recorder after independent review of its exact output.
const transitionHash='5620e0dd7fd38b4928615ff3b7811654c248eeb5e2ecfab8191e0eacd4c14361';
const hooks=['pulmonaryVenousTeachingLesson','pulmonaryVenousTeachingConcepts','pulmonaryVenousTeachingReferences'];
const shown=lesson=>{const {readiness:_readiness,...content}=lesson;return content;};

export function beforePulmonaryVenousTeaching(api,catalog){
  api=beforeRenalXray(api,catalog);
  assert(api&&typeof api==='object','Pulmonary venous replay requires an API');
  const present=hooks.map(key=>api[key]!==undefined);
  assert(present.every(Boolean)||present.every(value=>!value),'Partial pulmonary venous helper contract');
  if(api.bodyLesson===undefined){
    assert(catalog===undefined&&api.bodyContent===undefined&&api.bodyDisplayCatalog===undefined&&present.every(value=>!value),
      'Only early synthetic APIs may omit pulmonary venous lessons');
    return api;
  }
  assert.equal(typeof api.bodyLesson,'function');
  if(api.bodyContent!==undefined)assert.equal(typeof api.bodyContent,'function');
  if(present.every(Boolean))assert.equal(typeof api.pulmonaryVenousTeachingLesson,'function');
  assert.equal(hash(pins),pinsHash,'Immutable pulmonary venous pins changed');
  assert.equal(pins.parentCommit,parentCommit);
  assert.equal(pins.entries.length,4);
  assert.deepEqual(pins.tabs,['ct','mri','quiz']);
  assert.equal(hash(centralPins),'a857867b80d31d01ab55c688264010759dce0a0a802a6a7cd76b9f7d68b467c4','Original central-vessel pins changed');
  const pending=new Map();
  for(const pin of pins.entries){
    const original=centralPins.entries.find(entry=>entry.identity.id===pin.identity.id);
    assert(original,'Original pulmonary venous imaging identity required');
    assert.deepEqual(original.identity,pin.identity,'Original pulmonary venous identity changed');
    for(const tab of ['ct','mri']){assert.equal(original.previous[tab].readiness,'pending');pending.set(pin.identity.id+'|'+tab,original.previous[tab]);}
  }
  const transition=JSON.parse(readFileSync(new URL('../content/pulmonary-venous-teaching.transition.json',import.meta.url),'utf8'));
  assert.equal(hash(transition),transitionHash,'Unrecorded pulmonary venous transition');
  assert.equal(transition.parentCommit,parentCommit);
  assert.equal(transition.pinsHash,pinsHash);
  assert.equal(transition.catalogHash,pins.catalogHash);
  assert.equal(transition.previousSnapshotHash,pins.previousSnapshotHash);
  assert.equal(transition.entries.length,12);
  const targetIds=new Set(pins.entries.map(entry=>entry.identity.id));
  const fmas=new Set(pins.entries.map(entry=>entry.identity.fmaId));
  assert.equal(targetIds.size,4);assert.equal(fmas.size,4);
  const targets=new Map();
  for(const [index,entry] of transition.entries.entries()){
    const pin=pins.entries[Math.floor(index/3)],tab=pins.tabs[index%3];
    assert.deepEqual(entry.identity,pin.identity,'Transition source identity/order changed');
    assert.equal(entry.group,pin.group);assert.equal(entry.tab,tab);
    assert.deepEqual(entry.previous,pin.previous[tab],'Pinned predecessor changed');
    assert.equal(entry.previousHash,hash(entry.previous));
    assert.equal(entry.previous.readiness,tab==='quiz'?'generated-identification':'draft');
    const key=entry.identity.id+'|'+tab;assert(!targets.has(key));targets.set(key,entry);
  }
  if(present.every(Boolean)){
    assert.equal(hash(api.pulmonaryVenousTeachingConcepts),transition.conceptsHash,'Foreign pulmonary venous concepts');
    assert.equal(hash(api.pulmonaryVenousTeachingReferences),transition.referencesHash,'Foreign pulmonary venous references');
  }
  if(catalog!==undefined){
    let display=catalog;
    if(hash(display)!==transition.catalogHash){
      assert.equal(typeof api.bodyDisplayCatalog,'function','Raw catalog requires a display projection');
      display=api.bodyDisplayCatalog(catalog);
    }
    assert.equal(hash(display),transition.catalogHash,'Pulmonary venous source catalog changed');
    const selected=display.structures.filter(s=>targetIds.has(s.id)||fmas.has(s.fmaId));
    assert.equal(selected.length,4,'Pulmonary venous catalog identity set changed');
    for(const pin of pins.entries)assert.deepEqual(selected.filter(s=>s.id===pin.identity.id),[pin.identity],
      'Pulmonary venous catalog identity changed');
  }
  const epochs=[];
  for(const entry of transition.entries){
    const actual=api.bodyLesson(entry.identity,entry.tab),digest=actual===undefined?undefined:hash(actual);
    const originalPending=pending.get(entry.identity.id+'|'+entry.tab);
    const epoch=actual===undefined?'absent':digest===entry.currentHash?'current':digest===entry.previousHash?'old':
      originalPending&&digest===hash(originalPending)?'pending':'foreign';
    assert.notEqual(epoch,'foreign','Unrecorded pulmonary venous lesson');
    if(epoch==='old')assert.deepEqual(actual,entry.previous);
    if(api.bodyContent!==undefined)assert.deepEqual(api.bodyContent(entry.identity,entry.tab),actual===undefined?undefined:shown(actual),'Foreign learner content');
    if(present.every(Boolean))assert.deepEqual(api.pulmonaryVenousTeachingLesson(entry.identity,entry.tab),
      epoch==='current'?actual:undefined,'Foreign pulmonary venous helper lesson');
    epochs.push(epoch);
  }
  const originalPending=epochs.every((epoch,index)=>pins.tabs[index%3]==='quiz'?epoch==='old':epoch==='pending');
  assert(epochs.every(epoch=>epoch===epochs[0])||originalPending,'Mixed pulmonary venous teaching history');
  if(epochs[0]==='absent'){
    assert(catalog===undefined&&api.bodyDisplayCatalog===undefined&&present.every(value=>!value),
      'Absent pulmonary venous lessons require a minimal early synthetic API');
    return api;
  }
  if(originalPending){assert(present.every(value=>!value),'Original pending epoch must omit new pulmonary hooks');return api;}
  if(epochs[0]==='old'){
    assert(present.every(value=>!value),'Earlier pulmonary venous API must omit new hooks');
    return api;
  }
  assert(present.every(Boolean),'Current pulmonary venous lessons require all three hooks');
  assert.equal(typeof api.bodyContent,'function','Current pulmonary venous helper requires learner content');
  const previousFor=(s,tab)=>{
    const selected=targetIds.has(s?.id)||fmas.has(s?.fmaId);
    if(!selected)return undefined;
    const pin=pins.entries.find(candidate=>candidate.identity.id===s.id);
    assert(pin,'Foreign pulmonary venous identity');assert.deepEqual(s,pin.identity,'Foreign pulmonary venous source identity');
    if(!pins.tabs.includes(tab))return undefined;
    return structuredClone(targets.get(s.id+'|'+tab).previous);
  };
  const {pulmonaryVenousTeachingLesson:_lesson,pulmonaryVenousTeachingConcepts:_concepts,
    pulmonaryVenousTeachingReferences:_references,...priorApi}=api;
  return {...priorApi,
    bodyLesson(s,tab){return previousFor(s,tab)??api.bodyLesson(s,tab);},
    ...(api.bodyContent?{bodyContent(s,tab){const previous=previousFor(s,tab);return previous?shown(previous):api.bodyContent(s,tab);}}:{}),
  };
}
