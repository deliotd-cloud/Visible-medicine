import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {build} from './workspace-test-build.mjs';
import {context,hash,snapshot} from './pin-cranial-boundary-clinical.mjs';
import {authoringBeforeCranialBoundaryClinical} from './cranial-boundary-clinical-history.mjs';
import {contentContext,contentValidator} from './content-contract-tools.mjs';
import pins from '../content/cranial-boundary-clinical-pins.json' with {type:'json'};
import after from '../content/cranial-boundary-clinical.transition.json' with {type:'json'};
import {authoringBeforeCostalCartilageImaging} from './costal-cartilage-imaging-history.mjs';
import {beforeLaminaPathology} from './lamina-pathology-history.mjs';
const live=await context(),c={...live,api:authoringBeforeCostalCartilageImaging(live)}, {api,display}=c,before=authoringBeforeCranialBoundaryClinical(c),original=JSON.stringify(display);
assert.equal(hash(snapshot(api,display)),after.currentAllLessonsAndRecipesHash);
assert.equal(hash(snapshot(before,display)),pins.previousAllLessonsAndRecipesHash);
assert.equal(authoringBeforeCranialBoundaryClinical({...c,api:before}),before);
const compiled=await build({stdin:{contents:"export * from './lib/cranial-boundary-clinical';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
const {cranialBoundaryClinicalLesson:lesson}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const targets=new Map(pins.entries.map(e=>[e.identity.id,e.topics]));let changed=0,unchanged=0,rejected=0;
for(const s of display.structures)for(const t of api.contentTabs){
 const now=api.bodyLesson(s,t),old=before.bodyLesson(s,t);
 if(targets.get(s.id)?.includes(t)){
  assert.equal(old.readiness,'pending');assert.equal(now.readiness,'draft');assert.deepEqual(now,lesson(s,t));assert.notDeepEqual(now,old);changed++;
  assert.equal(now.citations.length,1);assert(now.note.includes('revision-bound radiologist'));assert(now.note.includes('paid-lecture access remain independent'));assert(now.bullets.some(b=>b.startsWith('Source limit:')));
  const saved=structuredClone(now);now.bullets.push('mutation');now.citations.push('foreign');assert.deepEqual(api.bodyLesson(s,t),saved);
 }else{assert.deepEqual(now,old);assert.equal(lesson(s,t),undefined);unchanged++;}
}
assert.equal(changed,3);assert.equal(unchanged,9915);
const paths=(v,p=[])=>v===null||typeof v!=='object'?[p]:Object.entries(v).flatMap(([k,x])=>paths(x,[...p,k]));
for(const {identity:s,topics} of pins.entries){
 const reject=bad=>{for(const t of topics){assert.equal(lesson(bad,t),undefined);rejected++;}};
 for(const p of paths(s)){const bad=structuredClone(s);let parent=bad;for(const k of p.slice(0,-1))parent=parent[k];const k=p.at(-1),v=parent[k];parent[k]=typeof v==='number'?v+.01:typeof v==='string'?v+'-foreign':typeof v==='boolean'?!v:'foreign';reject(bad);}
 for(const mutate of [b=>b.sources.pop(),b=>b.sources.push(b.sources[0]),b=>{b.laterality='left';},b=>{delete b.coverageNote;}]){const bad=structuredClone(s);mutate(bad);reject(bad);}
 if(s.sources.length>1){const bad=structuredClone(s);bad.sources.reverse();reject(bad);}
 for(const t of [...api.contentTabs.filter(t=>!topics.includes(t)),'foreign'])assert.equal(lesson(s,t),undefined);
 if(s.fmaId==='FMA61975'){assert.equal(api.bodyLesson(s,'pathology').readiness,'pending');for(const t of ['ct','mri'])assert.deepEqual(api.bodyLesson(s,t),before.bodyLesson(s,t));}
 else for(const t of ['ct','mri','ultrasound','xray'])assert.equal(api.bodyLesson(s,t).readiness,'pending');
}
const first=pins.entries[0],other=display.structures.find(s=>!targets.has(s.id));
const alter=fn=>({...c,api:{...api,bodyLesson:fn}});
assert.throws(()=>authoringBeforeCranialBoundaryClinical(alter((s,t)=>s.id===first.identity.id&&t==='clinical'?{...api.bodyLesson(s,t),body:'unrecorded'}:api.bodyLesson(s,t))),/Unrecorded cranial boundary/);
assert.throws(()=>authoringBeforeCranialBoundaryClinical(alter((s,t)=>s.id===first.identity.id&&t==='clinical'?first.previous.clinical:api.bodyLesson(s,t))),/Mixed cranial boundary/);
assert.throws(()=>authoringBeforeCranialBoundaryClinical(alter((s,t)=>s.id===other.id&&t==='anatomy'?{...api.bodyLesson(s,t),body:'changed unrelated'}:api.bodyLesson(s,t))),/full teaching/);
for(const b of pins.bundles){const bytes=await readFile('public'+b.url.split('?')[0]);assert.equal(bytes.length,b.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),b.sha256);}
const content=await contentContext(),records=content.api.bodyContentRecords(display),registry=new Map([...content.shoulder,...records].map(r=>[r.representationScope+'|'+r.id,r])),validate=await contentValidator(registry);
for(const record of records)assert(validate(record));
for(const e of pins.entries)for(const t of e.topics){const r=records.find(r=>r.id===e.identity.id);assert.deepEqual(r.content[t],content.api.bodyLesson(e.identity,t));assert.deepEqual(beforeLaminaPathology(content.api).bodyLesson(e.identity,t),api.bodyLesson(e.identity,t));assert.equal(r.validation.clinicalApproval,'not-included');}
assert.equal(JSON.stringify(display),original);
const report={source:pins.sourceCommit,sourceSelections:2,changedPlacements:changed,unchangedTopics:unchanged,rejectedChangedIdentityCases:rejected,bodySchemaRecords:records.length,beforeHash:pins.previousAllLessonsAndRecipesHash,afterHash:after.currentAllLessonsAndRecipesHash,geometryChanged:false,clinicalApproval:false,browserAcceptance:false};
await writeFile('docs/cranial-boundary-clinical-validation.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
