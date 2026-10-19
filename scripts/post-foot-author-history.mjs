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
const root=fileURLToPath(new URL('../',import.meta.url));
const recordRoot=root+'/content/post-foot-author-history';
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const index=JSON.parse(readFileSync(recordRoot+'/combined-replay-index.json'));
assert.equal(hash(index),'383131b17d7d49fb1464c46564bb7bebb7668a9407c32d6b12ce14c09f6e4bd0');
assert.equal(index.live,'f5097af8493701d64a8e2a2b5797df380f3b348a');
const key=(id,tab)=>JSON.stringify([id,tab]);
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
 let api=beforeLumbarDiscMri(beforeCorpusSpongiosumXrayV2(input,catalog),catalog);
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
  api=reverseHelperAware(api,record,catalog);
 }
 return api;
}
