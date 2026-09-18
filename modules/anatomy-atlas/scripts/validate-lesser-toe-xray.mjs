import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {context,hash,snapshot} from './pin-pica-clinical.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
import {beforeLesserToeXray} from './lesser-toe-xray-history.mjs';
import {beforeDistalPalmarMri} from './distal-palmar-mri-history.mjs';
import {build} from './workspace-test-build.mjs';
import {contentContext,contentValidator} from './content-contract-tools.mjs';
import pins from '../content/lesser-toe-xray-pins.json' with {type:'json'};
import transition from '../content/lesser-toe-xray-transition.json' with {type:'json'};
import {lesserToeXraySelections,lesserToeXrayTopics,lesserToeXrayReferences,lesserToeXrayScopeNote} from '../content/lesser-toe-xray.ts';

const {api:rawApi,display}=await context({current:true}),api=beforeDistalPalmarMri(rawApi),before=beforeLesserToeXray(api);
assert.equal(hash(snapshot(api,display)),transition.currentAllLessonsAndRecipesHash);
assert.equal(hash(snapshot(before,display)),pins.previousAllLessonsAndRecipesHash);
const saved=await exactSourceHistoryApi(pins.sourceCommit),raw=JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json'));
assert.deepEqual(saved.bodyDisplayCatalog(raw),display);
assert.deepEqual(snapshot(saved,display),snapshot(before,display));assert.equal(beforeLesserToeXray(before),before);
const compiled=await build({stdin:{contents:"export {lesserToeXrayLesson} from './lib/lesser-toe-xray';export {bodyReviewMaterial} from './lib/body-review-material';export {acralBoneImagingGroups} from './content/acral-bone-imaging';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const {lesserToeXrayLesson:lesson,bodyReviewMaterial,acralBoneImagingGroups}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
assert.equal(pins.entries.length,24);assert.equal(lesserToeXraySelections.length,24);
const selected=new Map(pins.entries.map(e=>[e.identity.id,e]));
const contracts=await contentContext(),body=contracts.api.bodyContentRecords(display);
const validate=await contentValidator(new Map([...contracts.shoulder,...body].map(r=>[r.representationScope+'|'+r.id,r])));
let changed=0,unchanged=0,rejected=0;
for(const s of display.structures)for(const tab of api.contentTabs){
 const e=selected.get(s.id),now=api.bodyLesson(s,tab),prior=before.bodyLesson(s,tab);
 if(!e||tab!=='xray'){assert.deepEqual(now,prior);assert.equal(lesson(s,tab),undefined);unchanged++;continue;}
 changed++;assert.deepEqual(s,e.identity);assert.equal(prior.readiness,'pending');assert.equal(now.readiness,'draft');
 assert.deepEqual(now,lesson(s,tab));assert.deepEqual(prior,e.previous.xray);
 const topic=lesserToeXrayTopics[e.group],group=acralBoneImagingGroups[e.imagingGroup];
 assert.equal(group.region,'foot');assert([2,3,4,5].includes(group.digit));assert.equal(group.segment,e.group);
 assert(group.fmaIds.includes(s.fmaId));assert.equal(s.sources.length,1);
 assert.equal(s.sources[0].file,lesserToeXraySelections.find(v=>v.fmaId===s.fmaId).file);
 assert.equal(now.body,topic.body);assert.equal(now.note,lesserToeXrayScopeNote);
 assert.deepEqual(now.bullets,[...topic.bullets,group.landmark,group.limitation]);
 assert.deepEqual(now.citations,[...new Set([...topic.references.map(k=>lesserToeXrayReferences[k]),...group.anatomyReferences])]);
 const {readiness,...rendered}=now;assert.deepEqual(api.bodyContent(s,tab),rendered);
 const record=body.find(r=>r.id===s.id);assert(validate(record));assert.deepEqual(record.content.xray,now);assert.equal(record.validation.clinicalApproval,'not-included');
 const copy=structuredClone(now);now.bullets.length=0;now.citations.push('foreign');assert.deepEqual(lesson(s,tab),copy);
}
assert.equal(changed,24);assert.equal(unchanged,9912);
const leaves=(value,path=[])=>value===null||typeof value!=='object'?[path]:Object.entries(value).flatMap(([k,v])=>leaves(v,[...path,k]));
for(const e of pins.entries){
 for(const path of leaves(e.identity)){
  const bad=structuredClone(e.identity);let cursor=bad;for(const key of path.slice(0,-1))cursor=cursor[key];
  const key=path.at(-1),value=cursor[key];cursor[key]=typeof value==='number'?value+.01:typeof value==='string'?value+'-foreign':typeof value==='boolean'?!value:'foreign';
  assert.equal(lesson(bad,'xray'),undefined);rejected++;
 }
 for(const mutate of [s=>s.sources.pop(),s=>s.regions.push('foreign'),s=>{delete s.sources;}]){
  const bad=structuredClone(e.identity);mutate(bad);assert.equal(lesson(bad,'xray'),undefined);rejected++;
 }
 assert.equal(api.bodyLesson(e.identity,'ct').readiness,'draft');assert.equal(api.bodyLesson(e.identity,'mri').readiness,'draft');assert.equal(api.bodyLesson(e.identity,'ultrasound').readiness,'pending');
 const review=await bodyReviewMaterial(e.identity.id);assert.equal(review.approval,false);assert.deepEqual(review.source.structure,e.identity);
 const {tab,...reviewLesson}=review.topics.find(t=>t.tab==='xray');assert.deepEqual(reviewLesson,api.bodyLesson(e.identity,'xray'));
}
for(const fma of ['FMA45097','FMA45098']){
 const s=display.structures.find(s=>s.fmaId===fma);assert(s);assert.equal(api.bodyLesson(s,'xray').readiness,'pending');assert.equal(lesson(s,'xray'),undefined);
}
const first=pins.entries[0];
assert.throws(()=>beforeLesserToeXray({...api,bodyLesson:(s,t)=>s.id===first.identity.id&&t==='xray'?first.previous.xray:api.bodyLesson(s,t)}),/Mixed/);
assert.throws(()=>beforeLesserToeXray({...api,bodyLesson:(s,t)=>s.id===first.identity.id&&t==='xray'?{...api.bodyLesson(s,t),body:'foreign'}:api.bodyLesson(s,t)}),/Unrecorded/);
for(const b of pins.bundles){assert.deepEqual(display.bundles.find(v=>v.id===b.id),b);const bytes=await readFile('public'+b.url.split('?')[0]);assert.equal(bytes.length,b.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),b.sha256);}
const budgets={};for(const topic of Object.values(lesserToeXrayTopics)){const n=[topic.body,...topic.bullets].join(' ').split(/\s+/).length;for(const ref of topic.references)budgets[ref]=(budgets[ref]??0)+n;}
for(const [ref,n] of Object.entries(budgets)){assert(n<=180,ref+': '+n);assert.equal(new URL(lesserToeXrayReferences[ref]).protocol,'https:');}
console.log(JSON.stringify({source:pins.sourceCommit,selections:24,xrayDrafts:changed,unchangedTopics:unchanged,rejectedIdentityMutations:rejected,reviewPayloads:24,referenceWordBudgets:budgets,geometryChanged:false,recipesChanged:false,clinicalApproval:false}));
