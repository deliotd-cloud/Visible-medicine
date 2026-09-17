import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {build} from './workspace-test-build.mjs';
import {context,hash,snapshot} from './pin-corpus-imaging.mjs';
import {authoringBeforeCorpusImaging} from './corpus-imaging-history.mjs';
import {contentContext,contentValidator} from './content-contract-tools.mjs';
import pins from '../content/corpus-imaging-pins.json' with {type:'json'};
import after from '../content/corpus-imaging.transition.json' with {type:'json'};
import clinicalPins from '../content/corpus-clinical-pins.json' with {type:'json'};
const c=await context(),{api,display}=c,before=authoringBeforeCorpusImaging(c),original=JSON.stringify(display);
assert.equal(hash(snapshot(api,display)),after.currentAllLessonsAndRecipesHash);
assert.equal(hash(snapshot(before,display)),pins.previousAllLessonsAndRecipesHash);
assert.equal(authoringBeforeCorpusImaging({...c,api:before}),before);
const compiled=await build({stdin:{contents:"export * from './lib/corpus-imaging';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
const {corpusImagingLesson:lesson}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const targets=new Map(pins.entries.map(e=>[e.identity.id,e.topics]));let changed=0,unchanged=0,rejected=0;
for(const s of display.structures)for(const t of api.contentTabs){
 const now=api.bodyLesson(s,t),old=before.bodyLesson(s,t);
 if(targets.get(s.id)?.includes(t)){
  assert.equal(old.readiness,'pending');assert.equal(now.readiness,'draft');assert.deepEqual(now,lesson(s,t));assert.notDeepEqual(now,old);changed++;
  assert(now.citations.length>=1&&now.citations.length<=2);assert(now.note.includes('revision-bound radiologist'));assert(now.note.includes('paid-lecture access remain independent'));assert(now.bullets.some(b=>b.startsWith('Source limit:')));
  const saved=structuredClone(now);now.bullets.push('mutation');now.citations.push('foreign');assert.deepEqual(api.bodyLesson(s,t),saved);
 }else{assert.deepEqual(now,old);assert.equal(lesson(s,t),undefined);unchanged++;}
}
assert.equal(changed,2);assert.equal(unchanged,9916);
const canonical=pins.entries[0].identity;
assert.equal(canonical.fmaId,'FMA19617');assert.deepEqual(canonical.sources.map(s=>s.file),['FJ3133']);
assert.deepEqual(pins.entries[0].topics,['mri','ultrasound']);
for(const [tab,url] of [['mri','https://pubmed.ncbi.nlm.nih.gov/2918824/'],['ultrasound','https://doi.org/10.1002/jum.16235']]){
 const actual=lesson(canonical,tab);
 assert.deepEqual(actual.citations,[url,'https://training.seer.cancer.gov/anatomy/reproductive/male/penis.html']);
 assert(actual.bullets.includes('Source limit: '+canonical.coverageNote));
 assert(actual.note.includes('No patient registration, scan or clinical approval'));
}
assert(lesson(canonical,'mri').bullets.some(b=>b.includes('historical technical study')&&b.includes('every routine examination')));
assert(lesson(canonical,'mri').bullets.some(b=>b.includes('no glans, paired cavernosal bodies, tunical layers or validated lumen')));
assert(lesson(canonical,'ultrasound').bullets.some(b=>b.includes('no lumen, acoustic response, Doppler waveform or erectile function is simulated')));
const paths=(v,p=[])=>v===null||typeof v!=='object'?[p]:Object.entries(v).flatMap(([k,x])=>paths(x,[...p,k]));
for(const {identity:s,topics} of pins.entries){
 const reject=bad=>{for(const t of topics){assert.equal(lesson(bad,t),undefined);rejected++;}};
 for(const p of paths(s)){const bad=structuredClone(s);let parent=bad;for(const k of p.slice(0,-1))parent=parent[k];const k=p.at(-1),v=parent[k];parent[k]=typeof v==='number'?v+.01:typeof v==='string'?v+'-foreign':typeof v==='boolean'?!v:'foreign';reject(bad);}
 for(const mutate of [b=>b.sources.pop(),b=>b.sources.push(b.sources[0]),b=>{b.laterality=b.laterality==='left'?'right':'left';},b=>{delete b.coverageNote;}]){const bad=structuredClone(s);mutate(bad);reject(bad);}
 if(s.sources.length>1){const bad=structuredClone(s);bad.sources.reverse();reject(bad);}
 for(const t of [...api.contentTabs.filter(t=>!topics.includes(t)),'foreign'])assert.equal(lesson(s,t),undefined);
}
const first=pins.entries[0],other=display.structures.find(s=>!targets.has(s.id));
const alter=fn=>({...c,api:{...api,bodyLesson:fn}});
assert.throws(()=>authoringBeforeCorpusImaging(alter((s,t)=>s.id===first.identity.id&&t==='mri'?{...api.bodyLesson(s,t),body:'unrecorded'}:api.bodyLesson(s,t))),/Unrecorded corpus imaging/);
assert.throws(()=>authoringBeforeCorpusImaging(alter((s,t)=>s.id===first.identity.id&&t==='mri'?first.previous.mri:api.bodyLesson(s,t))),/Mixed corpus imaging/);
assert.throws(()=>authoringBeforeCorpusImaging(alter((s,t)=>s.id===other.id&&t==='anatomy'?{...api.bodyLesson(s,t),body:'changed unrelated'}:api.bodyLesson(s,t))),/full teaching/);
assert.throws(()=>authoringBeforeCorpusImaging({...c,api:{...before,bodyLesson:(s,t)=>s.id===other.id&&t==='anatomy'?{...before.bodyLesson(s,t),body:'changed unrelated before'}:before.bodyLesson(s,t)}}),/Prior full teaching/);
const predecessor=clinicalPins.entries.find(e=>e.identity.id===first.identity.id);
const legacy=(s,t)=>s.id===first.identity.id&&first.topics.includes(t)?structuredClone(predecessor.previous[t]):before.bodyLesson(s,t);
const legacyContext=alter(legacy);
assert.equal(authoringBeforeCorpusImaging(legacyContext,{deferWholeSnapshot:true}),legacyContext.api);
assert.throws(()=>authoringBeforeCorpusImaging(legacyContext),/predecessor requires deferred/);
for(const replacement of [first.previous.mri,api.bodyLesson(first.identity,'mri')])
 assert.throws(()=>authoringBeforeCorpusImaging(alter((s,t)=>s.id===first.identity.id&&t==='mri'?replacement:legacy(s,t)),{deferWholeSnapshot:true}),/Mixed corpus imaging/);
assert.throws(()=>authoringBeforeCorpusImaging(alter((s,t)=>s.id===first.identity.id&&t==='mri'?{...legacy(s,t),body:legacy(s,t).body+'x'}:legacy(s,t)),{deferWholeSnapshot:true}),/Unrecorded corpus imaging/);
for(const b of pins.bundles){const bytes=await readFile('public'+b.url.split('?')[0]);assert.equal(bytes.length,b.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),b.sha256);}
const content=await contentContext(),records=content.api.bodyContentRecords(display),registry=new Map([...content.shoulder,...records].map(r=>[r.representationScope+'|'+r.id,r])),validate=await contentValidator(registry);
for(const record of records)assert(validate(record));
for(const e of pins.entries)for(const t of e.topics){const r=records.find(r=>r.id===e.identity.id);assert.deepEqual(r.content[t],api.bodyLesson(e.identity,t));assert.equal(r.validation.clinicalApproval,'not-included');}
assert.equal(JSON.stringify(display),original);
const report={source:pins.sourceCommit,sourceSelections:1,changedPlacements:changed,unchangedTopics:unchanged,rejectedChangedIdentityCases:rejected,bodySchemaRecords:records.length,beforeHash:pins.previousAllLessonsAndRecipesHash,afterHash:after.currentAllLessonsAndRecipesHash,geometryChanged:false,clinicalApproval:false,browserAcceptance:false};
await writeFile('docs/corpus-imaging-validation.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
