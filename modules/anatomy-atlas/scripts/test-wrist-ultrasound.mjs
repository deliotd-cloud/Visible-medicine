import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {contentContext,contentValidator} from './content-contract-tools.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
import {wristUltrasoundLesson} from '../lib/wrist-ultrasound.ts';
import {wristUltrasoundGroups,wristUltrasoundTopics,wristUltrasoundReferences} from '../content/wrist-ultrasound.ts';
import pins from '../content/wrist-ultrasound-pins.json' with {type:'json'};
import {hash,snapshot} from './wrist-ultrasound-transition.mjs';
import {beforeCarpalBoneQuiz} from './carpal-bone-quiz-history.mjs';
const {api:current,catalog,registry}=await contentContext(),display=current.bodyDisplayCatalog(catalog),api=beforeCarpalBoneQuiz(current,display),parent=await exactSourceHistoryApi(pins.parentCommit);
assert.equal(hash(pins),'4e447dda0e16ed3a9255c701240b1b65de5678493969ddc6d833142ad40dc426');
assert.equal(hash(snapshot(parent,display)),pins.previousAllLessonsAndRecipesHash);
assert.deepEqual(display,parent.bodyDisplayCatalog(catalog));assert.deepEqual(api.structures,parent.structures);assert.deepEqual(api.dissectionProfiles,parent.dissectionProfiles);
assert.deepEqual(pins.entries.map(e=>e.identity.fmaId),Object.values(wristUltrasoundGroups).flat());
assert.equal(new Set(pins.entries.map(e=>e.identity.id)).size,8);
for(const bundle of pins.bundles){
 assert.deepEqual(display.bundles.find(b=>b.id===bundle.id),bundle);
 const bytes=await readFile('public'+bundle.url.split('?')[0]);assert.equal(bytes.length,bundle.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),bundle.sha256);
}
const targets=new Map(pins.entries.map(e=>[e.identity.id,e])),records=api.bodyContentRecords(display),validate=await contentValidator(registry);
let changed=0,unchanged=0,rejected=0;
for(const s of display.structures)for(const tab of api.contentTabs){
 const direct=wristUltrasoundLesson(s,tab),current=api.bodyLesson(s,tab),prior=parent.bodyLesson(s,tab),target=targets.get(s.id);
 if(!target||tab!=='ultrasound'){assert.equal(direct,undefined);assert.deepEqual(current,prior,s.id+'|'+tab);unchanged++;continue;}
 assert.deepEqual(s,target.identity);assert.equal(s.validation.status,'unvalidated');assert.equal(s.validation.anatomicalReview,false);
 assert.equal(prior.readiness,'pending');assert.equal(current.readiness,'draft');assert.deepEqual(current,direct);
 assert.deepEqual(current.citations,wristUltrasoundReferences);assert.match(current.note,/Radiologist review pending/);
 assert.match(current.note,/access remain independent/);assert.match(current.bullets.join(' '),/cannot exclude a fracture/);
 const record=records.find(r=>r.id===s.id);assert(validate(record));assert.equal(record.validation.clinicalApproval,'not-included');assert.deepEqual(record.content.ultrasound,current);
 const packet=await api.bodyReviewMaterial(s.id);assert.equal(packet.approval,false);
 const {tab:_tab,...shown}=packet.topics.find(t=>t.tab==='ultrasound');assert.deepEqual(shown,current);
 const {readiness:_r,...section}=current;assert.deepEqual(api.bodyContent(s,tab),section);
 const copy=structuredClone(direct);direct.bullets.push('foreign');direct.citations.length=0;assert.deepEqual(wristUltrasoundLesson(s,tab),copy);changed++;
}
const leaves=(v,path=[])=>v===null||typeof v!=='object'?[path]:Object.entries(v).flatMap(([k,c])=>leaves(c,[...path,k]));
for(const {identity} of pins.entries){
 for(const path of leaves(identity)){
  const bad=structuredClone(identity);let obj=bad;for(const key of path.slice(0,-1))obj=obj[key];
  const key=path.at(-1),old=obj[key];obj[key]=typeof old==='number'?old+.01:typeof old==='boolean'?!old:String(old)+'-foreign';
  assert.equal(wristUltrasoundLesson(bad,'ultrasound'),undefined);rejected++;
 }
 assert.equal(wristUltrasoundLesson({...identity,unexpected:true},'ultrasound'),undefined);rejected++;
 const missing=structuredClone(identity);delete missing.sources;assert.equal(wristUltrasoundLesson(missing,'ultrasound'),undefined);rejected++;
}
// All unique source-derived anatomical prose is kept below this reading source's
// 200-word summarisation allowance. Repeated model-scope caveats are original.
assert(Object.values(wristUltrasoundTopics).map(t=>t.body).join(' ').split(/\s+/).length<200);
assert.equal(changed,8);assert.equal(unchanged,9928);
console.log(JSON.stringify({changed,unchanged,rejected,sourceBundles:pins.bundles.length,clinicalApproval:false}));
