import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {context,hash,snapshot} from './pin-pica-clinical.mjs';
import {beforeShortCiliaryTeaching} from './short-ciliary-history.mjs';
import {build} from './workspace-test-build.mjs';
import baseline from '../content/short-ciliary-transition.json' with {type:'json'};
import after from '../content/short-ciliary-teaching.transition.json' with {type:'json'};
const {api,display}=await context({current:true}),before=beforeShortCiliaryTeaching(api),identity=baseline.structure;
assert.equal(hash(display),baseline.currentCatalogHash);assert.equal(hash(snapshot(api,display)),after.currentAllLessonsAndRecipesHash);
assert.equal(hash(snapshot(before,display)),baseline.currentAllLessonsAndRecipesHash);assert.equal(beforeShortCiliaryTeaching(before),before);
const compiled=await build({stdin:{contents:"export {shortCiliaryLesson} from './lib/short-ciliary';export {bodyReviewMaterial} from './lib/body-review-material';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const {shortCiliaryLesson:lesson,bodyReviewMaterial}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
let changed=0,unchanged=0,rejected=0,pendingClarifications=0;
for(const s of display.structures)for(const t of api.contentTabs){
 const now=api.bodyLesson(s,t),prior=before.bodyLesson(s,t);
 if(s.id===identity.id&&['function','clinical'].includes(t)){
  changed++;assert.equal(prior.readiness,'pending');assert.equal(now.readiness,'draft');assert.deepEqual(now,lesson(s,t));
  assert.equal(now.citations.length,2);assert(now.note.includes('revision-bound radiologist'));assert(now.note.includes('paid-lecture access remain independent'));
  assert(now.bullets.includes('Source limit: '+s.coverageNote));const saved=structuredClone(now);now.bullets.push('foreign');now.citations.push('foreign');assert.deepEqual(api.bodyLesson(s,t),saved);
 }else if(s.id===identity.id&&t!=='anatomy'){
  assert.equal(now.readiness,'pending');assert.equal(prior.readiness,'pending');assert.equal(now.body,'Structure-specific teaching for this topic remains to be authored and reviewed.');assert.deepEqual({...now,body:prior.body},prior);pendingClarifications++;
 }else{assert.deepEqual(now,prior);unchanged++;}
}
assert.equal(changed,2);assert.equal(pendingClarifications,6);assert.equal(unchanged,9919);
for(const t of ['ct','mri','xray','ultrasound','pathology','quiz'])assert.equal(lesson(identity,t).readiness,'pending');
assert(lesson(identity,'function').body.includes('reduces zonular tension'));
assert(lesson(identity,'clinical').bullets.some(b=>b.includes('did not establish diagnostic accuracy')));
const leaves=(v,p=[])=>v===null||typeof v!=='object'?[p]:Object.entries(v).flatMap(([k,x])=>leaves(x,[...p,k]));
for(const p of leaves(identity)){
 const bad=structuredClone(identity);let target=bad;for(const k of p.slice(0,-1))target=target[k];const k=p.at(-1),v=target[k];target[k]=typeof v==='number'?v+.01:typeof v==='string'?v+'-foreign':typeof v==='boolean'?!v:'foreign';
 for(const t of ['function','clinical']){assert.equal(lesson(bad,t),undefined);rejected++;}
}
for(const mutate of [s=>s.sources.reverse(),s=>s.sources.pop(),s=>s.presentationParts.reverse(),s=>{delete s.presentationParts;}]){
 const bad=structuredClone(identity);mutate(bad);for(const t of ['function','clinical']){assert.equal(lesson(bad,t),undefined);rejected++;}
}
assert.throws(()=>beforeShortCiliaryTeaching({...api,bodyLesson:(s,t)=>t==='function'&&s.id===identity.id?{...api.bodyLesson(s,t),body:'unrecorded'}:api.bodyLesson(s,t)}),/Unrecorded/);
assert.throws(()=>beforeShortCiliaryTeaching({...api,bodyLesson:(s,t)=>t==='function'&&s.id===identity.id?baseline.topics[t]:api.bodyLesson(s,t)}),/Mixed/);
const bundle=baseline.bundle,bytes=await readFile('public'+bundle.url.split('?')[0]);assert.equal(bytes.length,bundle.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),bundle.sha256);
const review=await bodyReviewMaterial(identity.id);assert.equal(review.approval,false);assert.deepEqual(review.source.structure,identity);
for(const t of ['function','clinical']){const {tab,...topic}=review.topics.find(p=>p.tab===t);assert.deepEqual(topic,api.bodyLesson(identity,t));}
const report={source:after.parentCommit,draftedTopics:changed,pendingWordingClarifications:pendingClarifications,unchangedTopics:unchanged,rejectedIdentityMutations:rejected,beforeHash:after.previousAllLessonsAndRecipesHash,afterHash:after.currentAllLessonsAndRecipesHash,geometryChanged:false,reviewIncludesDrafts:true,clinicalApproval:false,browserAcceptance:false};
await writeFile('docs/short-ciliary-teaching-validation.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
