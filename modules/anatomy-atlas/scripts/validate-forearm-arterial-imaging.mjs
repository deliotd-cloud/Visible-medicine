import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {context,hash,snapshot} from './pin-pica-clinical.mjs';
import {beforeForearmArterialImaging} from './forearm-arterial-imaging-history.mjs';
import {contentContext,contentValidator} from './content-contract-tools.mjs';
import {build} from './workspace-test-build.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
import pins from '../content/forearm-arterial-imaging-pins.json' with {type:'json'};
import after from '../content/forearm-arterial-imaging.transition.json' with {type:'json'};
import {forearmArterialSelections,forearmArterialTopics,forearmArterialReferences} from '../content/forearm-arterial-imaging.ts';
const {api,display}=await context({current:true}),before=beforeForearmArterialImaging(api);
assert.equal(hash(snapshot(api,display)),after.currentAllLessonsAndRecipesHash);
assert.equal(hash(snapshot(before,display)),pins.previousAllLessonsAndRecipesHash);
// Independent application replay from the saved parent, not just self-consistent fixtures.
const savedApi=await exactSourceHistoryApi(pins.sourceCommit);
const savedCatalog=JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json'));
assert.deepEqual(savedApi.bodyDisplayCatalog(savedCatalog),display);
assert.deepEqual(snapshot(savedApi,display),snapshot(before,display));
assert.equal(beforeForearmArterialImaging(before),before);
assert.equal(display.sourceVersion,pins.sourceVersion);assert.deepEqual(display.coordinateSystem,pins.coordinateSystem);assert.equal(display.license,pins.license);
const compiled=await build({stdin:{contents:"export {forearmArterialImagingLesson} from './lib/forearm-arterial-imaging';export {bodyReviewMaterial} from './lib/body-review-material';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const {forearmArterialImagingLesson:lesson,bodyReviewMaterial}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const contracts=await contentContext(),body=contracts.api.bodyContentRecords(display),registry=new Map([...contracts.shoulder,...body].map(r=>[r.representationScope+'|'+r.id,r])),validate=await contentValidator(registry);
const selected=new Map(pins.entries.map(e=>[e.identity.id,e]));let changed=0,unchanged=0,rejected=0,reviewed=0;
for(const s of display.structures)for(const t of api.contentTabs){
 const e=selected.get(s.id),now=api.bodyLesson(s,t),prior=before.bodyLesson(s,t);
 if(!e?.topics.includes(t)){assert.equal(lesson(s,t),undefined);assert.deepEqual(now,prior);unchanged++;continue;}
 changed++;assert.deepEqual(s,e.identity);assert.equal(prior.readiness,'pending');assert.equal(now.readiness,'draft');assert.deepEqual(now,lesson(s,t));
 assert.match(now.note,/revision-bound radiologist/);assert.match(now.note,/No patient images/);assert.match(now.note,/paid-lecture access remain independent/);assert(now.bullets.some(b=>b.startsWith('Source limit:')));
 assert(now.citations.length>0);for(const citation of now.citations)assert(Object.values(forearmArterialReferences).includes(citation));
 const record=body.find(r=>r.id===s.id);assert(validate(record));assert.deepEqual(record.content[t],now);assert.equal(record.validation.clinicalApproval,'not-included');
 const saved=structuredClone(now);now.bullets.length=0;now.citations.push('foreign');assert.deepEqual(lesson(s,t),saved);
}
assert.equal(changed,16);assert.equal(unchanged,9911);
const leaves=(v,p=[])=>v===null||typeof v!=='object'?[p]:Object.entries(v).flatMap(([k,x])=>leaves(x,[...p,k]));
for(const e of pins.entries){
 for(const p of leaves(e.identity)){
  const bad=structuredClone(e.identity);let target=bad;for(const k of p.slice(0,-1))target=target[k];const k=p.at(-1),v=target[k];target[k]=typeof v==='number'?v+.01:typeof v==='string'?v+'-foreign':typeof v==='boolean'?!v:'foreign';
  for(const t of e.topics){assert.equal(lesson(bad,t),undefined);rejected++;}
 }
 for(const mutate of [s=>s.sources.pop(),s=>s.regions.push('foreign'),s=>{delete s.sources;},...(e.identity.sources.length>1?[s=>s.sources.reverse()]:[])]){
  const bad=structuredClone(e.identity);mutate(bad);for(const t of e.topics){assert.equal(lesson(bad,t),undefined);rejected++;}
 }
 const review=await bodyReviewMaterial(e.identity.id);assert.equal(review.approval,false);assert.deepEqual(review.source.structure,e.identity);
 for(const t of e.topics){const {tab,...actual}=review.topics.find(p=>p.tab===t);assert.deepEqual(actual,api.bodyLesson(e.identity,t));reviewed++;}
}
const first=pins.entries[0];
assert.throws(()=>beforeForearmArterialImaging({...api,bodyLesson:(s,t)=>s.id===first.identity.id&&t==='ct'?{...api.bodyLesson(s,t),body:'foreign'}:api.bodyLesson(s,t)}),/Unrecorded/);
assert.throws(()=>beforeForearmArterialImaging({...api,bodyLesson:(s,t)=>s.id===first.identity.id&&t==='ct'?first.previous[t]:api.bodyLesson(s,t)}),/Mixed/);
for(const b of pins.bundles){assert.deepEqual(display.bundles.find(x=>x.id===b.id),b);const bytes=await readFile('public'+b.url.split('?')[0]);assert.equal(bytes.length,b.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),b.sha256);}
// Count unique authored text, not repeated bilateral placements, conservatively per cited source.
const budgets={};const count=(refs,text)=>{for(const ref of refs)budgets[ref]=(budgets[ref]??0)+text.split(/\s+/).length;};
for(const s of forearmArterialSelections)count(s.references,s.landmark);
for(const group of Object.values(forearmArterialTopics))for(const t of Object.values(group))count(t.references,[t.body,...t.bullets].join(' '));
for(const [key,words] of Object.entries(budgets)){assert(words<=200,key+': '+words);assert.equal(new URL(forearmArterialReferences[key]).protocol,'https:');}
const report={source:pins.sourceCommit,selections:6,uniqueModalityTexts:8,draftPlacements:changed,unchangedTopics:unchanged,reviewedTopics:reviewed,rejectedIdentityMutations:rejected,sourceWordBudgets:budgets,beforeHash:pins.previousAllLessonsAndRecipesHash,afterHash:after.currentAllLessonsAndRecipesHash,geometryChanged:false,clinicalApproval:false,browserAcceptance:false};
await writeFile('docs/forearm-arterial-imaging-validation.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
