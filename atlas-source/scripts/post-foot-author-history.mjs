// Test-only exact Git author replay. Never import into learner dispatch.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {replayPinnedTeaching} from './pinned-teaching-replay.mjs';
import {beforeLumbarDiscMri} from './lumbar-disc-mri-history.mjs';
import {preCoronaryArterialStudyProfiles} from './coronary-arterial-study-history.mjs';
import {beforeDescendingAortaUltrasound} from './descending-aorta-ultrasound-history.mjs';
import {beforeCorpusSpongiosumXrayV2} from './corpus-spongiosum-xray-v2-history.mjs';
import {beforeCorpusImagingCt} from './corpus-imaging-ct-history.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const recordRoot=root+'/content/post-foot-author-history';
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const sourceHash=x=>createHash('sha256').update(x).digest('hex');
const beforeMra=await exactSourceHistoryApi('6036a7a59dcc1fd75eee4a23af34ca2a568d86b6','inferior-thyroid-mra-legacy');
const afterMra=await exactSourceHistoryApi('87ed7e343260c7df48a40d53503f25bbfd34cfa5','inferior-thyroid-mra-legacy');
const beforeFootSource=await exactSourceHistoryApi('88cea927d48729769b96ad8fe680b0872b7e6687','display-review');
const index=JSON.parse(readFileSync(recordRoot+'/combined-replay-index.json'));
assert.equal(hash(index),'383131b17d7d49fb1464c46564bb7bebb7668a9407c32d6b12ce14c09f6e4bd0');
assert.equal(index.live,'f5097af8493701d64a8e2a2b5797df380f3b348a');
const key=(id,tab)=>JSON.stringify([id,tab]);
function reverseInferiorThyroidMra(api,record,catalog){
 assert.equal(sourceHash(readFileSync(root+'/content/arterial-evidence-limits.ts')),'b746ada70e8f96906cb30289cd2649530f380f942f69b34fbf5e370282c21c24','Exact MRA source changed');
 assert.equal(typeof api.arterialEvidenceLimitLesson,'function','Exact MRA helper required');
 const entries=record.pins.entries.filter(e=>e.previous?.mri);
 assert.equal(entries.length,2,'Exact MRA sides changed');
 const originals=new Map();
 for(const entry of entries){
  const identity=entry.identity,tab='mri',slot=key(identity.id,tab);
  assert.deepEqual(api.bodyDisplayCatalog(catalog).structures.filter(s=>s.id===identity.id),[identity],'Exact MRA identity changed');
  const current=afterMra.bodyLesson(identity,tab),prior=beforeMra.bodyLesson(identity,tab);
  const transition=record.transition.entries.find(e=>e.id===identity.id&&e.tab===tab);
  assert(transition,'Exact MRA transition missing');
  assert.equal(hash(prior),transition.currentHash,'Historical MRA author lesson changed');
  assert.deepEqual(api.bodyLesson(identity,tab),current,'Exact MRA current lesson changed');
  assert.deepEqual(api.arterialEvidenceLimitLesson(identity,tab),current,'Exact MRA helper changed');
  const {readiness:_,...shown}=current;
  assert.deepEqual(api.bodyContent(identity,tab),shown,'Exact MRA displayed content changed');
  originals.set(slot,{identity,prior});
 }
 const old=api;
 const historical=(fn,identity,tab)=>{
  const item=originals.get(key(identity?.id,tab));
  if(!item)return fn(identity,tab);
  assert.deepEqual(identity,item.identity,'Exact MRA source identity changed');
  return structuredClone(item.prior);
 };
 return {...old,
  bodyLesson(identity,tab){return historical(old.bodyLesson,identity,tab);},
  arterialEvidenceLimitLesson(identity,tab){return historical(old.arterialEvidenceLimitLesson,identity,tab);},
  bodyContent(identity,tab){
   const item=originals.get(key(identity?.id,tab));
   if(!item)return old.bodyContent(identity,tab);
   assert.deepEqual(identity,item.identity,'Exact MRA source identity changed');
   const {readiness:_,...shown}=item.prior;return structuredClone(shown);
  },
 };
}
function reversePostFootTeaching(api,catalog){
 const pins=JSON.parse(readFileSync(root+'/content/tongue-palate-quiz-pins.json'));
 assert.equal(hash(pins),'dc00bdd203f349805a83873590188a0a6155aba0ad22643e0ac39a0d8a522403','Tongue/palate pins changed');
 assert.equal(pins.entries.length,8,'Tongue/palate scope changed');
 const ileocolicId='vm:anatomy:body:abdomen:unspecified:vessel:ileocolic-artery';
 const display=api.bodyDisplayCatalog(catalog);
 const ileocolic=display.structures.find(s=>s.id===ileocolicId);
 assert(ileocolic&&ileocolic.fmaId==='FMA14815','Ileocolic identity changed');
 const targets=[...pins.entries.map(e=>({identity:e.identity,tab:'quiz'})),{identity:ileocolic,tab:'ultrasound'}];
 assert.equal(targets.length,9,'Post-foot teaching scope changed');
 const originals=new Map();
 for(const {identity,tab} of targets){
  assert.deepEqual(display.structures.filter(s=>s.id===identity.id),[identity],'Post-foot source identity changed');
  const current=beforeMra.bodyLesson(identity,tab),prior=beforeFootSource.bodyLesson(identity,tab);
  assert(current&&prior&&!isDeepStrictEqual(current,prior),'Post-foot epoch boundary changed');
  assert.deepEqual(api.bodyLesson(identity,tab),current,'Post-foot current lesson changed');
  const {readiness:_,...shown}=current;
  assert.deepEqual(api.bodyContent(identity,tab),shown,'Post-foot displayed content changed');
  originals.set(key(identity.id,tab),{identity,prior});
 }
 const old=api;
 return {...old,
  bodyLesson(identity,tab){
   const item=originals.get(key(identity?.id,tab));
   if(!item)return old.bodyLesson(identity,tab);
   assert.deepEqual(identity,item.identity,'Post-foot exact source identity changed');
   return structuredClone(item.prior);
  },
  bodyContent(identity,tab){
   const item=originals.get(key(identity?.id,tab));
   if(!item)return old.bodyContent(identity,tab);
   assert.deepEqual(identity,item.identity,'Post-foot exact source identity changed');
   const {readiness:_,...shown}=item.prior;return structuredClone(shown);
  },
 };
}
function verifyOriginalPins(record){
 if(!record.originalPinPath)return;
 const original=JSON.parse(readFileSync(root+'/'+record.originalPinPath));
 assert.equal(hash(original),record.originalPinHash,`${record.name}: original pin changed`);
 assert.equal(execFileSync('git',['rev-parse','HEAD:'+record.originalPinPath],{cwd:root,encoding:'utf8',windowsHide:true}).trim(),record.originalPinBlob);
 const byId=new Map(original.entries.map(e=>[e.identity.id,e]));
 for(const row of record.transition.entries){
  const pinned=record.pins.entries.find(e=>e.identity.id===row.id),old=byId.get(row.id);assert(old&&pinned);
  assert.deepEqual(old.identity,pinned.identity,`${record.name}: original identity changed`);
  const previous=old.previous?.readiness!==undefined?old.previous:old.previous?.[row.tab];
  assert.deepEqual(previous,pinned.previous[row.tab],`${record.name}: original prior changed`);
 }
 for(const path of record.originalTransitionPaths||[]){
  const current=readFileSync(root+'/'+path);
  const git=execFileSync('git',['show','HEAD:'+path],{cwd:root,windowsHide:true,maxBuffer:5e6});
  assert.deepEqual(current,git,`${record.name}: original transition changed`);
 }
}
function reverseHelperAware(api,record,catalog){
 const special=record.transition.authorCommit==='f5052a1906bf9b87e5235bda57d367b1103729db'||record.transition.authorCommit==='51de4546a0b33a1ce93bfec4c9c43f760bf82b4e';
 if(!special)return replayPinnedTeaching(api,{...record,optionalHelper:false},catalog);
 const targets=new Map();for(const e of record.pins.entries)for(const[tab,lesson]of Object.entries(e.previous))targets.set(key(e.identity.id,tab),{identity:e.identity,tab,lesson});
 const prior=[...targets.values()].every(({identity,tab,lesson})=>isDeepStrictEqual(api.bodyLesson(identity,tab),lesson)&&isDeepStrictEqual(api[record.helper](identity,tab),lesson));
 if(prior){
  assert.equal(hash(record.pins),record.pinsHash);assert.equal(hash(record.transition),record.transitionHash);
  for(const{identity,tab,lesson}of targets.values()){
   assert.deepEqual(api.bodyDisplayCatalog(catalog).structures.find(s=>s.id===identity.id),identity);
   const{readiness:_,...shown}=lesson;assert.deepEqual(api.bodyContent(identity,tab),shown);
  }
  return api;
 }
 const reversed=replayPinnedTeaching(api,{...record,optionalHelper:false},catalog),original=api[record.helper];
 assert.equal(typeof original,'function');
 return {...reversed,[record.helper](identity,tab){
  const target=targets.get(key(identity?.id,tab));if(!target)return original(identity,tab);
  assert.deepEqual(identity,target.identity,`${record.name}: helper requires exact source identity`);
  return structuredClone(target.lesson);
 }};
}
export function beforePostFootAuthors(input,catalog){
 let api=beforeLumbarDiscMri(beforeCorpusSpongiosumXrayV2(beforeCorpusImagingCt(input,catalog),catalog),catalog);
 api={...api,dissectionProfiles:preCoronaryArterialStudyProfiles(api.dissectionProfiles)};
 api=beforeDescendingAortaUltrasound(api,catalog);
 for(const item of index.configs){
  const record=JSON.parse(readFileSync(recordRoot+'/configs/'+item.file));
  assert.equal(record.name,item.file.slice(0,-5));
  assert.equal(record.pinsHash,item.pinsHash);assert.equal(record.transitionHash,item.transitionHash);
  assert.equal(hash(record.pins),item.pinsHash);assert.equal(hash(record.transition),item.transitionHash);
  const source=JSON.parse(readFileSync(recordRoot+'/author-epochs/'+item.author+'.json'));
  assert.equal(hash(source),item.sourceRecordHash);
  assert.equal(source.author,item.author);assert.equal(source.parent,item.parent);
  verifyOriginalPins(record);
  if(record.name==='git-author-0ac11ca2')api=reverseInferiorThyroidMra(api,record,catalog);
  api=reverseHelperAware(api,record,catalog);
 }
 return reversePostFootTeaching(api,catalog);
}
