import assert from 'node:assert/strict';
import {authoringBeforeNeckTeaching} from './neck-teaching-history.mjs';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {build} from './workspace-test-build.mjs';
import {context,hash,snapshot} from './pin-regional-vascular-clinical.mjs';
import {authoringBeforeRegionalVascularClinical} from './regional-vascular-clinical-history.mjs';
import {contentContext,contentValidator} from './content-contract-tools.mjs';
import pins from '../content/regional-vascular-clinical-pins.json' with {type:'json'};
import after from '../content/regional-vascular-clinical.transition.json' with {type:'json'};
const live=await context(),c={...live,api:authoringBeforeNeckTeaching(live)}, {api,display}=c,before=authoringBeforeRegionalVascularClinical(c),original=JSON.stringify(display);
assert.equal(hash(snapshot(api,display)),after.currentAllLessonsAndRecipesHash);
assert.equal(hash(snapshot(before,display)),pins.previousAllLessonsAndRecipesHash);
assert.equal(authoringBeforeRegionalVascularClinical({...c,api:before}),before);
const compiled=await build({stdin:{contents:"export * from './lib/regional-vascular-clinical';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
const {regionalVascularClinicalLesson}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const targets=new Map(pins.entries.map(e=>[e.identity.id,e.topics]));let changed=0,unchanged=0,rejected=0;
for(const s of display.structures)for(const t of api.contentTabs){
 const now=api.bodyLesson(s,t),old=before.bodyLesson(s,t);
 if(targets.get(s.id)?.includes(t)){
  assert.equal(old.readiness,'pending');assert.equal(now.readiness,'draft');assert.deepEqual(now,regionalVascularClinicalLesson(s,t));assert.notDeepEqual(now,old);changed++;
  assert.equal(now.citations.length,1);assert(now.note.includes('revision-bound radiologist'));assert(now.note.includes('paid-lecture access remain independent'));assert(now.bullets.some(b=>b.startsWith('Source limit: one source-labelled')));
  const expected=structuredClone(now);now.bullets.push('mutated');now.citations.push('foreign');assert.deepEqual(api.bodyLesson(s,t),expected);
 }else{assert.deepEqual(now,old);assert.equal(regionalVascularClinicalLesson(s,t),undefined);unchanged++;}
}
assert.equal(changed,10);assert.equal(unchanged,9908);
const paths=(v,p=[])=>v===null||typeof v!=='object'?[p]:Object.entries(v).flatMap(([k,x])=>paths(x,[...p,k]));
for(const {identity:s,topics} of pins.entries){
 const reject=bad=>{for(const tab of topics){assert.equal(regionalVascularClinicalLesson(bad,tab),undefined);rejected++;}};
 for(const p of paths(s)){const bad=structuredClone(s);let parent=bad;for(const k of p.slice(0,-1))parent=parent[k];const k=p.at(-1),v=parent[k];parent[k]=typeof v==='number'?v+0.01:typeof v==='string'?v+'-foreign':typeof v==='boolean'?!v:'foreign';reject(bad);}
 for(const mutate of [b=>b.sources.pop(),...(s.sources.length>1?[b=>b.sources.reverse()]:[]),b=>b.sources.push(b.sources[0]),b=>b.sources.splice(0,1),b=>{b.laterality=b.laterality==='left'?'right':'left';}]){const bad=structuredClone(s);mutate(bad);reject(bad);}
 for(const t of [...api.contentTabs.filter(t=>!topics.includes(t)),'foreign'])assert.equal(regionalVascularClinicalLesson(s,t),undefined);
}
const first=pins.entries[0];
assert.throws(()=>authoringBeforeRegionalVascularClinical({...c,api:{...api,bodyLesson(s,t){const v=api.bodyLesson(s,t);return s.id===first.identity.id&&t==='clinical'?{...v,body:'unrecorded'}:v;}}}),/Unrecorded regional vascular/);
assert.throws(()=>authoringBeforeRegionalVascularClinical({...c,api:{...api,bodyLesson(s,t){return s.id===first.identity.id&&t==='clinical'?first.previous.clinical:api.bodyLesson(s,t);}}}),/Mixed regional vascular/);
const other=display.structures.find(s=>!targets.has(s.id));
assert.throws(()=>authoringBeforeRegionalVascularClinical({...c,api:{...api,bodyLesson(s,t){const v=api.bodyLesson(s,t);return s.id===other.id&&t==='anatomy'?{...v,body:'changed unrelated'}:v;}}}),/full teaching/);
for(const b of pins.bundles){const bytes=await readFile('public'+b.url.split('?')[0]);assert.equal(bytes.length,b.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),b.sha256);}
const content=await contentContext(),records=content.api.bodyContentRecords(display),registry=new Map([...content.shoulder,...records].map(r=>[r.representationScope+'|'+r.id,r])),validate=await contentValidator(registry);
for(const record of records)assert(validate(record));
for(const e of pins.entries)for(const t of e.topics){const record=records.find(r=>r.id===e.identity.id);assert.deepEqual(record.content[t],api.bodyLesson(e.identity,t));assert.equal(record.validation.clinicalApproval,'not-included');}
assert.equal(JSON.stringify(display),original);
const report={source:pins.sourceCommit,sourceSelections:6,changedPlacements:changed,unchangedTopics:unchanged,rejectedChangedIdentityCases:rejected,bodySchemaRecords:records.length,beforeHash:pins.previousAllLessonsAndRecipesHash,afterHash:after.currentAllLessonsAndRecipesHash,geometryChanged:false,clinicalApproval:false,browserAcceptance:false};
await writeFile('docs/regional-vascular-clinical-validation.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
