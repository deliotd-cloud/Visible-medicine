import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {build} from './workspace-test-build.mjs';
import {context,hash,snapshot} from './pin-sca-mca-clinical.mjs';
import {authoringBeforeScaMcaClinical} from './sca-mca-clinical-history.mjs';
import {contentContext,contentValidator} from './content-contract-tools.mjs';
import pins from '../content/sca-mca-clinical-pins.json' with {type:'json'};
import after from '../content/sca-mca-clinical.transition.json' with {type:'json'};
import {authoringBeforeUpperVenousClinical} from './upper-venous-clinical-history.mjs';
const latest=await context(),c={...latest,api:authoringBeforeUpperVenousClinical(latest)},{api,display}=c,before=authoringBeforeScaMcaClinical(c),original=JSON.stringify(display);
assert.equal(hash(snapshot(api,display)),after.currentAllLessonsAndRecipesHash);
assert.equal(hash(snapshot(before,display)),pins.previousAllLessonsAndRecipesHash);
assert.equal(authoringBeforeScaMcaClinical({...c,api:before}),before);
const compiled=await build({stdin:{contents:"export * from './lib/sca-mca-clinical';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
const {scaMcaClinicalLesson}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const targets=new Set(pins.entries.map(e=>e.identity.id));let changed=0,unchanged=0,rejected=0;
for(const s of display.structures)for(const t of api.contentTabs){
 const now=api.bodyLesson(s,t),old=before.bodyLesson(s,t);
 if(targets.has(s.id)&&['clinical','pathology'].includes(t)){
  assert.equal(old.readiness,'pending');assert.equal(now.readiness,'draft');assert.deepEqual(now,scaMcaClinicalLesson(s,t));assert.notDeepEqual(now,old);changed++;
  assert.equal(now.citations.length,s.fmaId==='FMA50082'?4:3);assert(now.note.includes('revision-bound radiologist'));assert(now.note.includes('paid-lecture access remain independent'));assert(now.bullets.some(b=>s.fmaId==='FMA50082'?b.includes('six disconnected')&&b.includes('PART-OF'):b.includes('one connected component')&&b.includes('midline crossing')));
  const expected=structuredClone(now);now.bullets.push('mutated');now.citations.push('foreign');assert.deepEqual(api.bodyLesson(s,t),expected);
 }else{assert.deepEqual(now,old);assert.equal(scaMcaClinicalLesson(s,t),undefined);unchanged++;}
}
assert.equal(changed,6);assert.equal(unchanged,9912);
const paths=(v,p=[])=>v===null||typeof v!=='object'?[p]:Object.entries(v).flatMap(([k,x])=>paths(x,[...p,k]));
for(const {identity:s} of pins.entries){
 const reject=bad=>{for(const tab of ['clinical','pathology']){assert.equal(scaMcaClinicalLesson(bad,tab),undefined);rejected++;}};
 for(const p of paths(s)){const bad=structuredClone(s);let parent=bad;for(const k of p.slice(0,-1))parent=parent[k];const k=p.at(-1),v=parent[k];parent[k]=typeof v==='number'?v+0.01:typeof v==='string'?v+'-foreign':typeof v==='boolean'?!v:'foreign';reject(bad);}
 for(const mutate of [b=>b.sources.pop(),...(s.sources.length>1?[b=>b.sources.reverse()]:[]),b=>b.sources.push(b.sources[0]),b=>b.sources.splice(0,1),b=>{b.laterality=b.laterality==='left'?'right':'left';}]){const bad=structuredClone(s);mutate(bad);reject(bad);}
 for(const t of [...api.contentTabs.filter(t=>!['clinical','pathology'].includes(t)),'foreign'])assert.equal(scaMcaClinicalLesson(s,t),undefined);
}
const first=pins.entries[0];
assert.throws(()=>authoringBeforeScaMcaClinical({...c,api:{...api,bodyLesson(s,t){const v=api.bodyLesson(s,t);return s.id===first.identity.id&&t==='clinical'?{...v,body:'unrecorded'}:v;}}}),/Unrecorded SCA\/MCA/);
assert.throws(()=>authoringBeforeScaMcaClinical({...c,api:{...api,bodyLesson(s,t){return s.id===first.identity.id&&t==='clinical'?first.previous.clinical:api.bodyLesson(s,t);}}}),/Mixed SCA\/MCA/);
const other=display.structures.find(s=>!targets.has(s.id));
assert.throws(()=>authoringBeforeScaMcaClinical({...c,api:{...api,bodyLesson(s,t){const v=api.bodyLesson(s,t);return s.id===other.id&&t==='anatomy'?{...v,body:'changed unrelated'}:v;}}}),/full teaching/);
for(const b of pins.bundles){const bytes=await readFile('public'+b.url.split('?')[0]);assert.equal(bytes.length,b.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),b.sha256);}
const content=await contentContext(),records=content.api.bodyContentRecords(display),registry=new Map([...content.shoulder,...records].map(r=>[r.representationScope+'|'+r.id,r])),validate=await contentValidator(registry);
for(const record of records)assert(validate(record));
for(const e of pins.entries)for(const t of e.topics){const record=records.find(r=>r.id===e.identity.id);assert.deepEqual(record.content[t],api.bodyLesson(e.identity,t));assert.equal(record.validation.clinicalApproval,'not-included');}
assert.equal(JSON.stringify(display),original);
const report={source:pins.sourceCommit,sourceSelections:3,changedPlacements:changed,unchangedTopics:unchanged,rejectedChangedIdentityCases:rejected,bodySchemaRecords:records.length,beforeHash:pins.previousAllLessonsAndRecipesHash,afterHash:after.currentAllLessonsAndRecipesHash,geometryChanged:false,clinicalApproval:false,browserAcceptance:false};
await writeFile('docs/sca-mca-clinical-validation.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
