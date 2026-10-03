import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {relative,dirname} from 'node:path';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {build} from 'esbuild';
import {emittedTeaching} from './atlas-emitted-teaching.ts';
import test from 'node:test';
const baseline='684874c20f6556d110d3c99862525c86e0bdbb72',root=process.cwd(),old=p=>execFileSync('git',['show',baseline+':'+p],{encoding:'utf8',windowsHide:true,maxBuffer:32e6});
const same=(a,b,m)=>assert.deepEqual(structuredClone(a),structuredClone(b),m),sha=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
async function load(previous=false){
 const paths=new Set(['atlas-review/app/body-content.ts','atlas-review/content/body-review-display-pins.json','atlas-review/content/body-renderer-revision.json']);
 const result=await build({stdin:{contents:"export * from './atlas-review/lib/hand-venous-imaging'; export * from './atlas-review/content/hand-venous-imaging'; export {bodyLesson,bodyContent} from './atlas-review/app/body-content'; export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog'; export {structures} from './atlas-review/app/anatomy-data'; export {dissectionProfiles} from './atlas-review/app/dissection-data'; export {contentTabs} from './atlas-review/lib/content-types'; export * from './atlas-review/lib/body-review-material'; export * from './atlas-review/lib/body-review-context'; export * from './atlas-review/lib/body-review-api'; export * from './atlas-review/lib/body-review-response'; export * from './atlas-review/lib/body-review-decisions';",resolveDir:root},bundle:true,write:false,format:'cjs',platform:'node',packages:'external',plugins:previous?[{name:'exact-pre-glottic-drafts',setup(api){api.onLoad({filter:/\.(?:ts|json)$/},args=>{const path=relative(root,args.path).replaceAll('\\','/');if(!paths.has(path))return;return{contents:old(path),loader:path.endsWith('.json')?'json':'ts',resolveDir:dirname(args.path)};});}}]:[]});
 const module={exports:{}};runInNewContext(result.outputFiles[0].text,{module,exports:module.exports,require:createRequire(root+'/package.json'),crypto,TextEncoder,TextDecoder,Request,Response,structuredClone,URL,URLSearchParams});return module.exports;
}
test('live hand venous notes preserve anatomy and all prior teaching with revision-bound Review',async()=>{
const before=await load(true),now=await load(),pins=JSON.parse(await readFile('atlas-review/content/hand-venous-imaging-pins.json','utf8'));
const catalog=now.bodyDisplayCatalog(JSON.parse(await readFile('atlas-review/public/models/bodyparts3d/full-body/catalog.json','utf8'))),targets=new Set(pins.entries.map(e=>e.identity.id));
assert.equal(catalog.structures.length,1104);assert.equal(targets.size,14);
const snapshot=api=>({catalog,body:catalog.structures.map(s=>({id:s.id,topics:Object.fromEntries(api.contentTabs.map(t=>[t,api.bodyLesson(s,t)]))})),shoulder:api.structures,recipes:api.dissectionProfiles});
assert.equal(sha(snapshot(before)),pins.beforeAllTeachingSnapshotHash,'Pinned actual complete earlier teaching');
same(now.structures,before.structures);same(now.dissectionProfiles,before.dissectionProfiles);
for(const path of ['atlas-review/app/body-explorer.tsx','atlas-review/lib/reasoning-questions.ts','atlas-review/lib/regional-tours.ts','package.json','package-lock.json','LICENSES/THIRD_PARTY_NOTICES.md','atlas-review/public/models/bodyparts3d/full-body/catalog.json'])assert.equal((await readFile(path,'utf8')).replaceAll('\r\n','\n'),old(path).replaceAll('\r\n','\n'),'No engine, UI, anatomy, licence or prior tours changed: '+path);
let changed=0,preserved=0,mutations=0,malformed=0,stale=0;
const recovered=snapshot(now);for(const row of recovered.body)for(const tab of now.contentTabs){const s=catalog.structures.find(s=>s.id===row.id),prior=before.bodyLesson(s,tab),lesson=now.bodyLesson(s,tab);if(targets.has(s.id)&&['ct','mri'].includes(tab)){assert.equal(prior.readiness,'pending');assert.equal(lesson.readiness,'draft');assert.notDeepEqual(lesson,prior);same(lesson,now.handVenousImagingLesson(s,tab));const{readiness,...section}=lesson;same(now.bodyContent(s,tab),section,'Actual learner resolver exports these notes');row.topics[tab]=prior;changed++;}else{same(lesson,prior,'All other displayed topics exact');preserved++;}}
assert.equal(changed,28);assert.equal(preserved,9908);assert.equal(sha(recovered),pins.beforeAllTeachingSnapshotHash,'All outside edits detected by complete snapshot');
for(const s of catalog.structures.filter(s=>!targets.has(s.id)))for(const tab of ['ct','mri'])assert.equal(now.handVenousImagingLesson(s,tab),undefined,'No broadened source admission: '+s.id);
function leaves(v,path=[]){return v===null||typeof v!=='object'?[path]:Object.entries(v).flatMap(([k,x])=>leaves(x,[...path,k]));}
function mutate(v,path){const copy=structuredClone(v);let p=copy;for(const k of path.slice(0,-1))p=p[k];const k=path.at(-1),value=p[k];p[k]=typeof value==='number'?value+0.01:typeof value==='string'?value+'-foreign':value===null?'foreign':!value;return copy;}
for(const e of pins.entries){const s=catalog.structures.find(s=>s.id===e.identity.id);same(s,e.identity);same(catalog.coordinateSystem,pins.coordinateSystem);
 for(const path of leaves(s))for(const tab of ['ct','mri']){assert.equal(now.handVenousImagingLesson(mutate(s,path),tab),undefined,path.join('.'));mutations++;}
 for(const patch of [{sources:[]},{sources:[...s.sources,...s.sources]},{regions:[]},{foreign:'unaccepted'}, {sources:s.sources.slice(1)}])for(const t of ['ct','mri']){assert.equal(now.handVenousImagingLesson({...s,...patch},t),undefined);mutations++;}
 for(const t of now.contentTabs.filter(t=>!['ct','mri'].includes(t)))assert.equal(now.handVenousImagingLesson(s,t),undefined);
 for(const t of ['ct','mri']){same(before.bodyLesson(s,t),e.previous[t]);const detached=now.handVenousImagingLesson(s,t),original=structuredClone(detached);detached.bullets.push('foreign');detached.citations.push('foreign');same(now.handVenousImagingLesson(s,t),original,'Fresh detached lessons');assert.match(original.note,/revision-bound radiologist/);assert.match(original.note,/access remain independent/);}
 const material=await now.bodyReviewMaterial(s.id),priorMaterial=await before.bodyReviewMaterial(s.id);assert(await now.parseBodyReviewResponse(material,s.id));same(material.source,priorMaterial.source);same(material.reasoning,priorMaterial.reasoning);same(material.guidedTours,priorMaterial.guidedTours);assert.equal(material.approval,false);
 for(const t of ['ct','mri']){same(material.topics.find(x=>x.tab===t),{tab:t,...now.bodyLesson(s,t)},'Actual shared Review lesson');for(const edit of [p=>p.topics.find(x=>x.tab===t).body+=' foreign',p=>p.topics.find(x=>x.tab===t).readiness='approved',p=>p.topics.find(x=>x.tab===t).citations=['https://foreign.example'],p=>p.source.structure.sources=[]]){const packet=structuredClone(material);edit(packet);assert.equal(await now.parseBodyReviewResponse(packet,s.id),null);malformed++;}}
 const previous=await before.bodyReviewContext(s.id),current=await now.bodyReviewContext(s.id);assert.notEqual(previous.revisions.teaching,current.revisions.teaching);assert.equal(current.revisions.imaging,null);
 let calls=0;const packet={catalogScope:previous.catalogScope,structureId:s.id,track:'teaching',expectedVersion:0,materialHash:previous.materialHash,revisionHash:previous.revisions.teaching,checklistVersion:previous.checklistVersion,draft:now.blankBodyReview(previous,'teaching')};
 const response=await now.postBodyDecision(new Request('https://atlas.example/api/body-review/decisions',{method:'POST',headers:{'oai-authenticated-user-id':'synthetic-reviewer','content-type':'application/json',origin:'https://atlas.example'},body:JSON.stringify(packet)}),{prepare(){calls++;throw Error('Stale request cannot touch storage');}});assert.equal(response.status,409);assert.equal(calls,0);stale++;
}
let worksheets=0;for(const s of catalog.structures){const prior=await before.bodyReviewMaterial(s.id),current=await now.bodyReviewMaterial(s.id);same(current.source,prior.source);same(current.reasoning,prior.reasoning);same(current.guidedTours,prior.guidedTours);if(targets.has(s.id)){assert.notEqual(current.fingerprints.teaching,prior.fingerprints.teaching);worksheets++;}else{same(current.fingerprints.teaching,prior.fingerprints.teaching,'All1090 unrelated teaching fingerprints exact');same(current.topics,prior.topics);}}
assert.equal(worksheets,14);for(const b of pins.bundles)assert.equal(createHash('sha256').update(await readFile('public/atlas-runtime/head-neck'+b.url.split('?')[0])).digest('hex'),b.sha256);
const authored=Object.values(now.handVenousImagingTopics).flatMap(t=>[t.landmark,t.ct,t.mri,t.limit]).join(' '),referenceWords=authored.trim().split(/\s+/).length;assert(referenceWords<=400,'Bounded original factual synthesis');
for(const ref of Object.values(now.handVenousImagingReferences))assert.equal(new URL(ref).protocol,'https:');
const report={baseline,sources:14,changedTopicPlacements:changed,preservedTopicPlacements:preserved,changedReviewWorksheets:worksheets,preservedTeachingFingerprints:1090,mutatedSourceCases:mutations,malformedPackets:malformed,staleRefusalsBeforeStorage:stale,authoredWords:referenceWords,allEarlierReasoningAndToursPreserved:true,geometryAndUiUnchanged:true,clinicalApproval:false,browserAcceptance:false};
console.log(JSON.stringify(report));
const review=JSON.parse(await readFile('atlas-review/manifest.json','utf8'));
assert.equal(review.revision,'1517521a5ee3eed985fff01bcd8608965b693fae');assert.equal(review.files.length,1002);
assert.deepEqual(review.packages,JSON.parse(old('atlas-review/manifest.json')).packages);
assert.deepEqual(review.files.filter(f=>!JSON.parse(old('atlas-review/manifest.json')).files.some(p=>p.path===f.path)).map(f=>f.path).sort(),['content/hand-venous-imaging-pins.json','content/hand-venous-imaging.ts','lib/hand-venous-imaging.ts']);
for(const f of review.files)assert.equal(createHash('sha256').update(await readFile('atlas-review/'+f.path)).digest('hex'),f.importedSha256);
const inventory=JSON.parse(await readFile('lib/atlas-model-inventory.json','utf8'));assert.equal(inventory.models.length,137);same(inventory.models,JSON.parse(old('lib/atlas-model-inventory.json')).models);
for(const name of ['head-neck','shoulder','female-pelvis','lower-limb','review']){
 const base=name==='review'?'public/atlas-review-viewer/':'public/atlas-runtime/'+name+'/',manifest=JSON.parse(await readFile(base+'manifest.json','utf8')),prior=JSON.parse(old(base+'manifest.json'));
 assert.equal(manifest.sourceCommit,review.revision);
 for(const f of manifest.files)assert.equal(createHash('sha256').update(await readFile(base+f.path)).digest('hex'),f.sha256);
 if(name==='review'){assert.equal(manifest.personalRecordsIncluded,false);assert.equal(manifest.mode,'production');assert.equal(manifest.websiteIntegrationSha256,review.websiteIntegrationSha256);}else{
  for(const flag of ['patientDataIncluded','clinicalApproved','standaloneReviewConnection'])assert.equal(manifest[flag],false);
  same(manifest.imagingConnection,prior.imagingConnection);same(manifest.files.filter(f=>f.path.startsWith('models/')),prior.files.filter(f=>f.path.startsWith('models/')));
  const inputs=JSON.parse(await readFile(base+'source-inputs.json','utf8'));assert.equal(inputs.length,{'head-neck':975,shoulder:649,'female-pelvis':111,'lower-limb':100}[name]);
  for(const p of ['bundled-dependencies.json','BUNDLED_NOTICES.txt'])assert.equal((await readFile(base+p)).toString(),old(base+p));
 }
 if(!['head-neck','review'].includes(name))continue;
 const code=emittedTeaching(base,manifest.files,true);
 for(const family of Object.values(now.handVenousImagingTopics))for(const text of [family.landmark,family.ct,family.mri,family.limit])assert(code.includes(text)||code.includes(JSON.stringify(text).slice(1,-1)),text);
 for(const e of pins.entries)assert(code.includes(e.identity.id),e.identity.id);
}
assert.equal(mutations,1104);assert.equal(malformed,112);assert.equal(stale,14);
for(const p of ['lib/atlas-delivery-access.ts','lib/lecture-repository.ts','atlas-review/lib/atlas-practice.ts','atlas-review/lib/learning-resources.ts'])assert.equal((await readFile(p,'utf8')).replaceAll('\r\n','\n'),old(p).replaceAll('\r\n','\n'),p);

});
