import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {replayPinnedTeaching} from './pinned-teaching-replay.mjs';

const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const lesson=(body,readiness='draft')=>({readiness,title:body,body,note:`${body} note`});
const identity=(id)=>({id,fmaId:`FMA-${id}`,sources:[{file:`${id}-a`,sha256:`${id}-hash-a`},{file:`${id}-b`,sha256:`${id}-hash-b`}],bounds:{min:[0,1,2],max:[3,4,5]}});
const freeze=(config)=>({...config,pinsHash:hash(config.pins),transitionHash:hash(config.transition)});
function fixture(shape='single'){
 const entries=[identity('one'),identity('two')];
 const tabs=shape==='single'?['ultrasound']:['ct','ultrasound'];
 const previous=new Map(),current=new Map();
 const pins={baseline:'fixed-epoch',entries:entries.map(s=>{
  const prior=Object.fromEntries(tabs.map(tab=>[tab,lesson(`${s.id}-${tab}-old`,'pending')]));
  const now=Object.fromEntries(tabs.map(tab=>[tab,lesson(`${s.id}-${tab}-new`)]));
  previous.set(s.id,prior);current.set(s.id,now);
  return {identity:s,previous:shape==='single'?prior.ultrasound:prior};
 })};
 const transition={baseline:pins.baseline,entries:entries.flatMap(s=>{
  if(shape==='sections')return [{id:s.id,fmaId:s.fmaId,sections:Object.fromEntries(tabs.map(tab=>[tab,hash(current.get(s.id)[tab])]))}];
  return tabs.map(tab=>({id:s.id,...(shape==='single'?{}:{tab}),fmaId:s.fmaId,
   previousHash:hash(previous.get(s.id)[tab]),
   ...(shape==='single'?{draftHash:hash(current.get(s.id)[tab])}:{currentHash:hash(current.get(s.id)[tab])})}));
 })};
 const config=freeze({name:`fixture-${shape}`,pins,transition,helper:'draftLesson',...(shape==='single'?{singleTab:'ultrasound'}:{})});
 const unrelated=identity('unrelated');
 const structures=[...entries,unrelated];
 const state={value:'unchanged'};
 const api={structures,dissectionProfiles:state,
  bodyDisplayCatalog(catalog){return {structures:catalog.structures};},
  bodyLesson(s,tab){return current.get(s.id)?.[tab]??lesson('unrelated-current');},
  bodyContent(s,tab){const {readiness:_,...shown}=this.bodyLesson(s,tab);return shown;},
  draftLesson(s,tab){return current.get(s.id)?.[tab];},
 };
 // Avoid using `this` so adapters can preserve or wrap individual functions.
 api.bodyContent=(s,tab)=>{const {readiness:_,...shown}=api.bodyLesson(s,tab);return shown;};
 return {config,api,catalog:{structures},entries,tabs,previous,current,unrelated,state};
}

for(const shape of ['single','map','sections'])test(`${shape}: complete replay, clone, identity and unrelated preservation`,()=>{
 const f=fixture(shape),raw=f.api;
 const result=replayPinnedTeaching(raw,f.config,f.catalog);
 assert.notEqual(result,raw);
 assert.equal(result.structures,raw.structures);assert.equal(result.dissectionProfiles,f.state);
 for(const s of f.entries)for(const tab of f.tabs){
  assert.deepEqual(result.bodyLesson(s,tab),f.previous.get(s.id)[tab]);
  const returned=result.bodyLesson(s,tab);returned.body='mutated';
  assert.deepEqual(result.bodyLesson(s,tab),f.previous.get(s.id)[tab]);
  const {readiness:_,...shown}=f.previous.get(s.id)[tab];assert.deepEqual(result.bodyContent(s,tab),shown);
  assert.deepEqual(raw.bodyLesson(s,tab),f.current.get(s.id)[tab]);
  const forged=structuredClone(s);forged.sources.reverse();
  assert.throws(()=>result.bodyLesson(forged,tab),/exact source identity/);
  assert.throws(()=>result.bodyContent(forged,tab),/exact source identity/);
 }
 assert.deepEqual(result.bodyLesson(f.unrelated,'ct'),raw.bodyLesson(f.unrelated,'ct'));
 assert.deepEqual(result.bodyContent(f.unrelated,'ct'),raw.bodyContent(f.unrelated,'ct'));
 assert.equal(replayPinnedTeaching(result,f.config,f.catalog),result);
});

test('actual all-prior shape without exported helper is accepted; foreign helper is not',()=>{
 const f=fixture('single');
 const prior={...f.api,bodyLesson(s,tab){return f.previous.get(s.id)?.[tab]??lesson('unrelated-current');}};
 prior.bodyContent=(s,tab)=>{const {readiness:_,...shown}=prior.bodyLesson(s,tab);return shown;};
 delete prior.draftLesson;
 assert.equal(replayPinnedTeaching(prior,f.config,f.catalog),prior);
 assert.throws(()=>replayPinnedTeaching({...prior,draftLesson(){return lesson('forged');}},f.config,f.catalog),/foreign draft helper/);
 const synthetic={bodyLesson(){return undefined;}};
 assert.equal(replayPinnedTeaching(synthetic,f.config),synthetic);
 assert.throws(()=>replayPinnedTeaching({...synthetic,bodyDisplayCatalog(){return {structures:[]};}},f.config),/foreign teaching/);
});

test('optional helper permits absent current export but still validates every exported helper',()=>{
 const f=fixture('single');
 const absent={...f.api};delete absent.draftLesson;
 assert.throws(()=>replayPinnedTeaching(absent,f.config,f.catalog),/missing draft helper/);
 const optional={...f.config,optionalHelper:true};
 const restored=replayPinnedTeaching(absent,optional,f.catalog);
 assert.deepEqual(restored.bodyLesson(f.entries[0],'ultrasound'),f.previous.get(f.entries[0].id).ultrasound);
 assert.throws(()=>replayPinnedTeaching({...absent,draftLesson:'forged'},optional,f.catalog),/invalid draft helper/);
 assert.throws(()=>replayPinnedTeaching({...absent,draftLesson(){return lesson('forged');}},optional,f.catalog),/foreign draft helper/);
 assert.throws(()=>replayPinnedTeaching(absent,{...f.config,optionalHelper:'yes'},f.catalog),/invalid optional helper setting/);
 assert.throws(()=>replayPinnedTeaching(absent,{...f.config,helper:undefined,optionalHelper:true},f.catalog),/optional helper requires a helper name/);
});

test('mixed or foreign drafts and content never pass',()=>{
 const f=fixture('map'),[first]=f.entries;
 const mixed={...f.api,bodyLesson(s,tab){return s.id===first.id&&tab==='ct'?f.previous.get(s.id)[tab]:f.api.bodyLesson(s,tab);}};
 mixed.bodyContent=(s,tab)=>{const {readiness:_,...shown}=mixed.bodyLesson(s,tab);return shown;};
 assert.throws(()=>replayPinnedTeaching(mixed,f.config,f.catalog),/mixed teaching state/);
 const foreign={...f.api,bodyLesson(s,tab){return s.id===first.id&&tab==='ct'?lesson('forged'):f.api.bodyLesson(s,tab);}};
 assert.throws(()=>replayPinnedTeaching(foreign,f.config,f.catalog),/foreign teaching/);
 assert.throws(()=>replayPinnedTeaching({...f.api,draftLesson(){return lesson('forged');}},f.config,f.catalog),/foreign draft helper/);
 assert.throws(()=>replayPinnedTeaching({...f.api,draftLesson:'forged'},f.config,f.catalog),/invalid draft helper/);
 assert.throws(()=>replayPinnedTeaching({...f.api,bodyContent(){return lesson('forged');}},f.config,f.catalog),/foreign body content/);
});

test('unchanged placement may match both current and prior without creating a false mixed state',()=>{
 const f=fixture('map'),first=f.entries[0],tab='ct';
 f.current.get(first.id)[tab]=structuredClone(f.previous.get(first.id)[tab]);
 const transition=structuredClone(f.config.transition);
 transition.entries.find(row=>row.id===first.id&&row.tab===tab).currentHash=hash(f.current.get(first.id)[tab]);
 const config=freeze({...f.config,transition});
 const result=replayPinnedTeaching(f.api,config,f.catalog);
 assert.notEqual(result,f.api);
 assert.deepEqual(result.bodyLesson(f.entries[1],'ultrasound'),f.previous.get(f.entries[1].id).ultrasound);
});

test('full frozen hashes, topic records, previous and FMA identities are strict',()=>{
 const f=fixture('map');
 const alteredPins=structuredClone(f.config.pins);alteredPins.entries[0].identity.sources[0].sha256='forged';
 assert.throws(()=>replayPinnedTeaching(f.api,{...f.config,pins:alteredPins},f.catalog),/pins changed/);
 const alteredTransition=structuredClone(f.config.transition);alteredTransition.entries[0].currentHash='forged';
 assert.throws(()=>replayPinnedTeaching(f.api,{...f.config,transition:alteredTransition},f.catalog),/transition changed/);
 const cases=[
  [t=>t.entries.pop(),/missing transition topic/],
  [t=>t.entries.push(structuredClone(t.entries[0])),/duplicate transition topic/],
  [t=>t.entries.push({...t.entries[0],id:'not-pinned'}),/extraneous transition topic/],
  [t=>{t.entries[0].previousHash='0'.repeat(64);},/previous hash mismatch/],
  [t=>{t.entries[0].fmaId='foreign';},/FMA identity mismatch/],
 ];
 for(const [mutate,pattern] of cases){
  const transition=structuredClone(f.config.transition);mutate(transition);
  assert.throws(()=>replayPinnedTeaching(f.api,freeze({...f.config,transition}),f.catalog),pattern);
 }
 const sections=fixture('sections');
 const sectionTransition=structuredClone(sections.config.transition);
 sectionTransition.entries[0].sections.foreign=hash(lesson('foreign'));
 assert.throws(()=>replayPinnedTeaching(sections.api,freeze({...sections.config,transition:sectionTransition}),sections.catalog),/extraneous transition topic/);
});

test('catalog validation refuses changed source leaves and duplicate IDs',()=>{
 const f=fixture('single');
 const foreign=structuredClone(f.catalog);foreign.structures[0].sources[0].sha256='foreign';
 assert.throws(()=>replayPinnedTeaching(f.api,f.config,foreign),/foreign source identity/);
 const duplicate=structuredClone(f.catalog);duplicate.structures.push(structuredClone(duplicate.structures[0]));
 assert.throws(()=>replayPinnedTeaching(f.api,f.config,duplicate),/missing or duplicate source identity/);
 const raw={...f.api};delete raw.bodyDisplayCatalog;
 assert.throws(()=>replayPinnedTeaching(raw,f.config,foreign),/foreign source identity/);
 assert.throws(()=>replayPinnedTeaching(raw,f.config,{wrong:[]}),/missing source catalog structures/);
});
