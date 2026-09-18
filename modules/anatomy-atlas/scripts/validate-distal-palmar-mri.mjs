import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {context,hash,snapshot} from './pin-pica-clinical.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
import {beforeDistalPalmarMri} from './distal-palmar-mri-history.mjs';
import {build} from './workspace-test-build.mjs';
import {contentContext,contentValidator} from './content-contract-tools.mjs';
import pins from '../content/distal-palmar-mri-pins.json' with {type:'json'};
import transition from '../content/distal-palmar-mri-transition.json' with {type:'json'};
import {distalPalmarMriTopics,distalPalmarMriSelections,distalPalmarMriReference} from '../content/distal-palmar-mri.ts';
const {api,display}=await context({current:true}),before=beforeDistalPalmarMri(api);
assert.equal(hash(snapshot(api,display)),transition.currentAllLessonsAndRecipesHash);
assert.equal(hash(snapshot(before,display)),pins.previousAllLessonsAndRecipesHash);
const saved=await exactSourceHistoryApi(pins.sourceCommit),raw=JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json'));
assert.deepEqual(saved.bodyDisplayCatalog(raw),display);assert.deepEqual(snapshot(saved,display),snapshot(before,display));
assert.equal(beforeDistalPalmarMri(before),before);
const built=await build({stdin:{contents:"export {distalPalmarMriLesson} from './lib/distal-palmar-mri';export {bodyReviewMaterial} from './lib/body-review-material';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
const {distalPalmarMriLesson:lesson,bodyReviewMaterial}=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
const expected={FMA22864:['FJ2289'],FMA22865:['FJ2237'],FMA22905:['FJ2371','FJ2372'],FMA22907:['FJ2338','FJ2339'],FMA22777:['FJ2342','FJ2363'],FMA22778:['FJ2314','FJ2332']};
assert.deepEqual(Object.fromEntries(distalPalmarMriSelections.map(e=>[e.fmaId,e.files])),expected);
assert.equal(pins.entries.length,6);const selected=new Map(pins.entries.map(e=>[e.identity.id,e]));
const contracts=await contentContext(),records=contracts.api.bodyContentRecords(display);
const validate=await contentValidator(new Map([...contracts.shoulder,...records].map(r=>[r.representationScope+'|'+r.id,r])));
let changed=0,unchanged=0,rejected=0;
for(const s of display.structures)for(const tab of api.contentTabs){
 const e=selected.get(s.id),now=api.bodyLesson(s,tab),prior=before.bodyLesson(s,tab);
 if(!e||tab!=='mri'){assert.deepEqual(now,prior);assert.equal(lesson(s,tab),undefined);unchanged++;continue;}
 changed++;assert.deepEqual(s,e.identity);assert.equal(prior.readiness,'pending');assert.equal(now.readiness,'draft');
 assert.deepEqual(now,lesson(s,tab));assert.deepEqual(prior,e.previous.mri);assert.equal(hash(now),transition.entries.find(x=>x.id===s.id).sections.mri);
 assert.equal(now.body,distalPalmarMriTopics[e.group].body);assert.deepEqual(now.citations,[distalPalmarMriReference]);
 assert(now.bullets.includes(distalPalmarMriTopics[e.group].scope));assert.match(now.note,/revision-bound radiologist/);
 assert.match(now.note,/paid-lecture access remain independent/);assert.match(now.note,/not routine MRI/);
 const {readiness:_readiness,...rendered}=now;assert.deepEqual(api.bodyContent(s,tab),rendered);
 const record=records.find(r=>r.id===s.id);assert(validate(record));assert.equal(record.validation.clinicalApproval,'not-included');assert.deepEqual(record.content.mri,now);
 const savedLesson=structuredClone(now);now.bullets.length=0;now.citations.push('foreign');assert.deepEqual(lesson(s,tab),savedLesson);
 const review=await bodyReviewMaterial(s.id);assert.equal(review.approval,false);assert.deepEqual(review.source.structure,s);
 const {tab:_tab,...reviewLesson}=review.topics.find(t=>t.tab==='mri');assert.deepEqual(reviewLesson,savedLesson);
}
assert.equal(changed,6);assert.equal(unchanged,9930);
const leaves=(v,p=[])=>v===null||typeof v!=='object'?[p]:Object.entries(v).flatMap(([k,x])=>leaves(x,[...p,k]));
for(const e of pins.entries){
 for(const path of leaves(e.identity)){
  const bad=structuredClone(e.identity);let t=bad;for(const k of path.slice(0,-1))t=t[k];const k=path.at(-1),v=t[k];t[k]=typeof v==='number'?v+.01:typeof v==='string'?v+'-foreign':typeof v==='boolean'?!v:'foreign';
  assert.equal(lesson(bad,'mri'),undefined);rejected++;
 }
 for(const mutate of [s=>s.sources.pop(),s=>{delete s.sources;},s=>s.regions.push('foreign'),s=>s.sources.push(s.sources[0])]){const bad=structuredClone(e.identity);mutate(bad);assert.equal(lesson(bad,'mri'),undefined);rejected++;}
 if(e.identity.sources.length>1){const bad=structuredClone(e.identity);bad.sources.reverse();assert.equal(lesson(bad,'mri'),undefined);rejected++;}
}
const first=pins.entries[0];assert.throws(()=>beforeDistalPalmarMri({...api,bodyLesson:(s,t)=>s.id===first.identity.id&&t==='mri'?first.previous.mri:api.bodyLesson(s,t)}),/Mixed/);
assert.throws(()=>beforeDistalPalmarMri({...api,bodyLesson:(s,t)=>s.id===first.identity.id&&t==='mri'?{...api.bodyLesson(s,t),body:'foreign'}:api.bodyLesson(s,t)}),/Unrecorded/);
// Count duplicated left/right factual prose conservatively. Scope warnings are
// original statements of this atlas's own source/representation limits.
const researchWords=pins.entries.reduce((n,e)=>n+distalPalmarMriTopics[e.group].body.trim().split(/\s+/).length,0);
assert(researchWords<=170);assert.equal(new URL(distalPalmarMriReference).protocol,'https:');
console.log(JSON.stringify({changed,unchanged,rejectedIdentityMutations:rejected,researchWords,geometryChanged:false,recipesChanged:false,clinicalApproval:false}));
