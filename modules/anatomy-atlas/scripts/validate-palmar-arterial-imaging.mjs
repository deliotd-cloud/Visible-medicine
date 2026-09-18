import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {context,hash,snapshot} from './pin-pica-clinical.mjs';
import {beforePalmarArterialImaging} from './palmar-arterial-imaging-history.mjs';
import {beforeMetatarsalSurfaceImaging} from './metatarsal-surface-imaging-history.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
import {contentContext,contentValidator} from './content-contract-tools.mjs';
import {build} from './workspace-test-build.mjs';
import pins from '../content/palmar-arterial-imaging-pins.json' with {type:'json'};
import transition from '../content/palmar-arterial-imaging-transition.json' with {type:'json'};
import {palmarArterialSelections,palmarArterialTopics,palmarArterialReferences} from '../content/palmar-arterial-imaging.ts';

const expected={
 FMA22839:'FJ2279',FMA22840:'FJ2227',FMA22835:'FJ2300',FMA22837:'FJ2248',FMA22856:'FJ2343',FMA85118:'FJ2315',FMA85119:'FJ2344',FMA85120:'FJ2316',FMA85121:'FJ2345',FMA85122:'FJ2317',FMA85123:'FJ2370',FMA85124:'FJ2337',FMA22858:'FJ2365',FMA22860:'FJ2334',FMA23050:'FJ2364',FMA23051:'FJ2333',FMA23052:'FJ2369',FMA23054:'FJ2368',FMA23055:'FJ2336',FMA85112:'FJ2367',FMA85115:'FJ2366',FMA85116:'FJ2335',
};
assert.deepEqual(Object.fromEntries(palmarArterialSelections.map(s=>[s.fmaId,s.file])),expected);
assert.equal(palmarArterialSelections.length,22);assert.equal(palmarArterialSelections.filter(s=>s.group==='proper-digital').length,10);
assert.deepEqual(palmarArterialSelections.filter(s=>s.topics.includes('ct')).map(s=>s.fmaId),['FMA22835','FMA22837']);
assert(palmarArterialSelections.every(s=>s.topics.includes('mri')));

const {api:rawApi,display}=await context({current:true}),api=beforeMetatarsalSurfaceImaging(rawApi),before=beforePalmarArterialImaging(api);
assert.equal(hash(snapshot(api,display)),transition.currentAllLessonsAndRecipesHash);assert.equal(hash(snapshot(before,display)),pins.previousAllLessonsAndRecipesHash);
const raw=JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json'));
const savedApi=await exactSourceHistoryApi(pins.sourceCommit),savedDisplay=savedApi.bodyDisplayCatalog(raw);
assert.deepEqual(savedDisplay,display);assert.deepEqual(snapshot(savedApi,savedDisplay),snapshot(before,display));assert.equal(beforePalmarArterialImaging(before),before);
assert.equal(display.sourceVersion,pins.sourceVersion);assert.equal(display.license,pins.license);assert.deepEqual(display.coordinateSystem,pins.coordinateSystem);

const compiled=await build({stdin:{contents:"export {palmarArterialImagingLesson} from './lib/palmar-arterial-imaging';export {bodyReviewMaterial} from './lib/body-review-material';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const {palmarArterialImagingLesson:lesson,bodyReviewMaterial}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const contracts=await contentContext(),body=contracts.api.bodyContentRecords(display),registry=new Map([...contracts.shoulder,...body].map(record=>[record.representationScope+'|'+record.id,record])),validate=await contentValidator(registry);
const selected=new Map(pins.entries.map(entry=>[entry.identity.id,entry]));let changed=0,unchanged=0,rejected=0,reviewed=0;
for(const s of display.structures)for(const topic of api.contentTabs){
 const entry=selected.get(s.id),now=api.bodyLesson(s,topic),prior=before.bodyLesson(s,topic);
 if(!entry?.topics.includes(topic)){assert.equal(lesson(s,topic),undefined);assert.deepEqual(now,prior);unchanged++;continue;}
 changed++;assert.deepEqual(s,entry.identity);assert.deepEqual(prior,entry.previous[topic]);assert.equal(prior.readiness,'pending');assert.equal(now.readiness,'draft');assert.deepEqual(now,lesson(s,topic));
 const rendered=api.bodyContent(s,topic),{readiness:_readiness,...expectedContent}=now;assert.deepEqual(rendered,expectedContent);
 assert.match(now.note,/Tailored angiographic acquisition is not routine MRI/);assert.match(now.note,/revision-bound radiologist/);assert.match(now.note,/Case, Atlas and paid-lecture access remain independent/);
 assert(now.bullets.at(-1).includes('does not establish patency'));assert(now.bullets.at(-1).includes('procedural clearance'));
 if(entry.group==='proper-digital')assert(now.bullets.some(b=>b.includes('not a complete bilateral')));
 assert(now.citations.length>0);for(const citation of now.citations)assert(Object.values(palmarArterialReferences).includes(citation));
 const record=body.find(item=>item.id===s.id);assert(validate(record));assert.deepEqual(record.content[topic],now);assert.equal(record.validation.clinicalApproval,'not-included');
 const copy=structuredClone(now);now.bullets.length=0;now.citations.push('foreign');assert.deepEqual(lesson(s,topic),copy);
}
assert.equal(changed,24);assert.equal(unchanged,9912);

const leaves=(value,path=[])=>value===null||typeof value!=='object'?[path]:Object.entries(value).flatMap(([key,child])=>leaves(child,[...path,key]));
for(const entry of pins.entries){
 for(const path of leaves(entry.identity)){
  const bad=structuredClone(entry.identity);let target=bad;for(const key of path.slice(0,-1))target=target[key];const key=path.at(-1),value=target[key];target[key]=typeof value==='number'?value+.01:typeof value==='string'?value+'-foreign':typeof value==='boolean'?!value:'foreign';
  for(const topic of entry.topics){assert.equal(lesson(bad,topic),undefined);rejected++;}
 }
 for(const mutate of [s=>s.sources.pop(),s=>s.regions.push('foreign'),s=>{delete s.sources;},s=>s.bundle='foreign',s=>s.laterality=s.laterality==='right'?'left':'right',s=>s.sources[0].sha256='0'.repeat(64)]){
  const bad=structuredClone(entry.identity);mutate(bad);for(const topic of entry.topics){assert.equal(lesson(bad,topic),undefined);rejected++;}
 }
 const review=await bodyReviewMaterial(entry.identity.id);assert.equal(review.approval,false);assert.deepEqual(review.source.structure,entry.identity);
 for(const topic of entry.topics){const {tab,...actual}=review.topics.find(item=>item.tab===topic);assert.deepEqual(actual,api.bodyLesson(entry.identity,topic));reviewed++;}
}
const first=pins.entries[0];
assert.throws(()=>beforePalmarArterialImaging({...api,bodyLesson:(s,t)=>s.id===first.identity.id&&t==='mri'?first.previous.mri:api.bodyLesson(s,t)}),/Mixed/);
assert.throws(()=>beforePalmarArterialImaging({...api,bodyLesson:(s,t)=>s.id===first.identity.id&&t==='mri'?{...api.bodyLesson(s,t),body:'foreign'}:api.bodyLesson(s,t)}),/Unrecorded/);
for(const bundle of pins.bundles){assert.deepEqual(display.bundles.find(item=>item.id===bundle.id),bundle);const bytes=await readFile('public'+bundle.url.split('?')[0]);assert.equal(bytes.length,bundle.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),bundle.sha256);}

assert.match(palmarArterialTopics['superficial-arch'].mri.body,/superficial arch/);assert.match(palmarArterialTopics['deep-arch'].mri.body,/deep arch/);
assert.match(palmarArterialTopics['common-digital'].mri.body,/trunk longitudinally toward division/);assert.match(palmarArterialTopics['proper-digital'].mri.body,/distal continuity across sequential slices/);
assert.match(palmarArterialTopics['superficial-arch'].ct.body,/configuration/);assert.match(palmarArterialTopics['superficial-arch'].ct.bullets.join(' '),/does not establish functional collateral adequacy/);
const budgets={};for(const group of Object.values(palmarArterialTopics))for(const topic of Object.values(group)){const words=[topic.body,...topic.bullets].join(' ').trim().split(/\s+/).length;for(const ref of topic.references)budgets[ref]=(budgets[ref]??0)+words;}
for(const [ref,words] of Object.entries(budgets)){assert(words>0);assert(words<=180,ref+': '+words);assert.equal(new URL(palmarArterialReferences[ref]).protocol,'https:');}
assert(budgets.qissMra<=150,'QISS prose reserve exceeded: '+budgets.qissMra);
const report={source:pins.sourceCommit,selections:22,properDigitalSelections:10,mriPlacements:22,ctPlacements:2,draftPlacements:changed,unchangedTopics:unchanged,reviewedTopics:reviewed,rejectedIdentityMutations:rejected,sourceWordBudgets:budgets,beforeHash:pins.previousAllLessonsAndRecipesHash,afterHash:transition.currentAllLessonsAndRecipesHash,geometryChanged:false,recipesChanged:false,clinicalApproval:false,browserAcceptance:false};
console.log(JSON.stringify(report));
