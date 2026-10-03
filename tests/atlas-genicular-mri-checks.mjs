import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync} from './atlas-pre-elbow-arterial-mri-history.ts';
import {createHash} from 'node:crypto';
import {relative,dirname} from 'node:path';
import {build} from './atlas-pre-elbow-arterial-mri-history.ts';
import test from 'node:test';
import {emittedTeaching} from './atlas-pre-elbow-arterial-mri-history.ts';
const baseline='72a7e809eb4394f268394d40e455c2239ae1ea0f',root=process.cwd(),cache=new Map();
const old=p=>{if(!cache.has(p))cache.set(p,execFileSync('git',['show',baseline+':'+p],{maxBuffer:32e6,windowsHide:true}));return cache.get(p);},sha=b=>createHash('sha256').update(b).digest('hex');
const entry="export * from './atlas-review/lib/genicular-mri';export * from './atlas-review/content/genicular-mri';export {bodyLesson,bodyContent} from './atlas-review/app/body-content';export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';export {contentTabs} from './atlas-review/lib/content-types';export {structures} from './atlas-review/app/anatomy-data';export {dissectionProfiles} from './atlas-review/app/dissection-data';export {regionalTours} from './atlas-review/lib/regional-tours';export {reasoningConcepts} from './atlas-review/lib/reasoning-questions';export * from './atlas-review/lib/body-review-material';export * from './atlas-review/lib/body-review-context';export * from './atlas-review/lib/body-review-response';export * from './atlas-review/lib/body-review-api';export * from './atlas-review/lib/body-review-decisions';";
async function load(previous=false){const paths=new Set(['atlas-review/app/body-content.ts','atlas-review/content/body-review-display-pins.json','atlas-review/content/body-renderer-revision.json']);const r=await build({stdin:{contents:entry,resolveDir:root,loader:'ts'},bundle:true,write:false,format:'esm',platform:'node',plugins:previous?[{name:'exact-before-genicular-mri',setup(api){api.onLoad({filter:/.*/,},args=>{const path=relative(root,args.path).replaceAll('\\','/');if(!paths.has(path))return;return{contents:old(path).toString(),loader:path.endsWith('.json')?'json':'ts',resolveDir:dirname(args.path)};});}}]:[]});return import('data:text/javascript;base64,'+Buffer.from(r.outputFiles[0].text).toString('base64'));}
test('actual-current genicular MRI teaching and protected Review import',async()=>{
const now=await load(),before=await load(true),pins=JSON.parse(readFileSync('atlas-review/content/genicular-mri-pins.json')),catalog=now.bodyDisplayCatalog(JSON.parse(readFileSync('atlas-review/public/models/bodyparts3d/full-body/catalog.json'))),targets=new Set(pins.entries.map(e=>e.identity.id));
assert.equal(catalog.structures.length,1104);assert.equal(targets.size,8);assert.equal(new Set(pins.entries.map(e=>e.family)).size,4);
assert.deepEqual(catalog,before.bodyDisplayCatalog(JSON.parse(old('atlas-review/public/models/bodyparts3d/full-body/catalog.json'))));assert.deepEqual(now.structures,before.structures);assert.deepEqual(now.dissectionProfiles,before.dissectionProfiles);assert.deepEqual(now.regionalTours,before.regionalTours);assert.deepEqual(now.reasoningConcepts,before.reasoningConcepts);
const snapshot=api=>({catalog,body:catalog.structures.map(s=>({id:s.id,topics:Object.fromEntries(api.contentTabs.map(t=>[t,api.bodyLesson(s,t)]))})),shoulder:api.structures,recipes:api.dissectionProfiles});
assert.equal(sha(JSON.stringify(snapshot(before))),pins.beforeAllTeachingSnapshotHash);let changed=0,preserved=0,mutations=0,malformed=0,stale=0,worksheets=0,storageCalls=0;
const recovered=snapshot(now);for(const row of recovered.body)for(const tab of now.contentTabs){const s=catalog.structures.find(s=>s.id===row.id),prior=before.bodyLesson(s,tab),lesson=now.bodyLesson(s,tab);if(targets.has(s.id)&&tab==='mri'){assert.equal(prior.readiness,'pending');assert.equal(lesson.readiness,'draft');assert.deepEqual(lesson,now.genicularMriLesson(s,tab));const{readiness,...section}=lesson;assert.deepEqual(now.bodyContent(s,tab),section);row.topics[tab]=prior;changed++;}else{assert.deepEqual(lesson,prior,s.id+':'+tab);preserved++;}}
assert.equal(changed,8);assert.equal(preserved,9928);assert.equal(sha(JSON.stringify(recovered)),pins.beforeAllTeachingSnapshotHash);
function leaves(v,path=[]){return v===null||typeof v!=='object'?[path]:Object.entries(v).flatMap(([k,x])=>leaves(x,[...path,k]));}
function mutate(v,path){const copy=structuredClone(v);let p=copy;for(const k of path.slice(0,-1))p=p[k];const key=path.at(-1),value=p[key];p[key]=typeof value==='string'?value+'-foreign':typeof value==='number'?value+0.01:value===null?'foreign':!value;return copy;}
for(const e of pins.entries){const s=catalog.structures.find(s=>s.id===e.identity.id);assert.deepEqual(s,e.identity);assert.deepEqual(before.bodyLesson(s,'mri'),e.previous);assert.equal(s.sources.length,1);assert.equal(s.sourceTree,'isa');assert.equal(s.system,'vessels');
 for(const path of leaves(s)){assert.equal(now.genicularMriLesson(mutate(s,path),'mri'),undefined,path.join('.'));mutations++;}
 for(const edit of [x=>x.sources=[],x=>x.sources.push(structuredClone(x.sources[0])),x=>x.unexpected=true,x=>x.regions.reverse()]){const copy=structuredClone(s);edit(copy);assert.equal(now.genicularMriLesson(copy,'mri'),undefined);mutations++;}
 for(const tab of now.contentTabs.filter(t=>t!=='mri'))assert.equal(now.genicularMriLesson(s,tab),undefined);
 const detached=now.genicularMriLesson(s,'mri'),original=structuredClone(detached);detached.bullets.push('foreign');detached.citations.push('foreign');assert.deepEqual(now.genicularMriLesson(s,'mri'),original);assert.match(original.note,/revision-bound radiologist/);assert.match(original.note,/access remain independent/);assert.match(original.body,/routine knee MRI/);if(e.family==='middle')assert.match(original.bullets[0],/two disconnected/);
 const current=await now.bodyReviewMaterial(s.id),prior=await before.bodyReviewMaterial(s.id);assert(await now.parseBodyReviewResponse(current,s.id));assert.equal(current.approval,false);assert.deepEqual(current.source,prior.source);assert.deepEqual(current.reasoning,prior.reasoning);assert.deepEqual(current.guidedTours,prior.guidedTours);assert.deepEqual(current.topics.find(t=>t.tab==='mri'),{tab:'mri',...original});
 for(const edit of [p=>p.topics.find(t=>t.tab==='mri').body+=' foreign',p=>p.topics.find(t=>t.tab==='mri').readiness='approved',p=>p.topics.find(t=>t.tab==='mri').citations=['https://foreign.example'],p=>p.source.structure.sources=[],p=>p.topics.splice(p.topics.findIndex(t=>t.tab==='mri'),1)]){const packet=structuredClone(current);edit(packet);assert.equal(await now.parseBodyReviewResponse(packet,s.id),null);malformed++;}
 const a=await before.bodyReviewContext(s.id),b=await now.bodyReviewContext(s.id);assert.equal(a.sourceHash,b.sourceHash);assert.notEqual(a.revisions.teaching,b.revisions.teaching);assert.equal(b.revisions.imaging,null);
 const packet={catalogScope:a.catalogScope,structureId:s.id,track:'teaching',expectedVersion:0,materialHash:a.materialHash,revisionHash:a.revisions.teaching,checklistVersion:a.checklistVersion,draft:now.blankBodyReview(a,'teaching')};const response=await now.postBodyDecision(new Request('https://atlas.test/api/body-decisions',{method:'POST',headers:{origin:'https://atlas.test','content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_GENICULAR_MRI'},body:JSON.stringify(packet)}),{prepare(){storageCalls++;throw Error('Stale submission reached storage');}});assert.equal(response.status,409);stale++;
}
for(const s of catalog.structures){if(!targets.has(s.id))assert.equal(now.genicularMriLesson(s,'mri'),undefined);const a=await before.bodyReviewMaterial(s.id),b=await now.bodyReviewMaterial(s.id);assert.deepEqual(a.source,b.source);assert.deepEqual(a.reasoning,b.reasoning);assert.deepEqual(a.guidedTours,b.guidedTours);assert.equal(b.approval,false);if(targets.has(s.id)){assert.notEqual(a.fingerprints.teaching,b.fingerprints.teaching);worksheets++;}else{assert.deepEqual(a.topics,b.topics);assert.equal(a.fingerprints.teaching,b.fingerprints.teaching);}}
assert.equal(worksheets,8);assert.equal(malformed,40);assert.equal(stale,8);assert.equal(storageCalls,0);for(const b of pins.bundles){const bytes=readFileSync('public/atlas-runtime/head-neck'+b.url.split('?')[0]);assert.equal(sha(bytes),b.sha256);assert.deepEqual(bytes,old('public/atlas-runtime/head-neck'+b.url.split('?')[0]));}
for(const path of ['atlas-review/app/body-explorer.tsx','atlas-review/app/regional-guided-learning.tsx','atlas-review/app/whole-body-guided-learning.tsx','atlas-review/lib/tour-camera.ts','atlas-review/lib/regional-tours.ts','atlas-review/lib/reasoning-questions.ts','atlas-review/app/anatomy-data.ts','atlas-review/app/dissection-data.ts','atlas-review/lib/body-display-catalog.ts','atlas-review/lib/imaging-sync.ts','atlas-review/lib/didanix-atlas-adapter.ts','atlas-review/lib/independent-study-links.ts','package.json','package-lock.json','LICENSES/THIRD_PARTY_NOTICES.md'])assert.equal(readFileSync(path,'utf8').replaceAll('\r\n','\n'),old(path).toString().replaceAll('\r\n','\n'),path);
assert.equal(execFileSync('git',['diff','--name-only',baseline,'--','public/atlas-runtime/**/models/**'],{encoding:'utf8'}).trim(),'');
const authoredWords=(Object.values(now.genicularMriLandmarks).join(' ')+' '+now.genicularMriContext).trim().split(/\s+/).length;assert(authoredWords<=200);for(const url of Object.values(now.genicularMriReferences))assert.equal(new URL(url).protocol,'https:');
const report={baseline,sourceTargets:8,newMriPlacements:changed,otherTopicPlacementsPreserved:preserved,changedTeachingWorksheets:worksheets,preservedTeachingWorksheets:1096,mutatedSourceRefusals:mutations,malformedPacketsRefused:malformed,staleRefusalsBeforeStorage:stale,storageCalls,authoredWords,allEarlierReasoningAndToursPreserved:true,geometryAndUiUnchanged:true,clinicalApproval:false,browserAcceptance:false};console.log(JSON.stringify(report));

const revision='f97ea55ee2e7b57865c012650b40fc44041f45da';
const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
assert.equal(review.revision,revision);assert.equal(review.files.length,1006);
assert.deepEqual(review.packages,JSON.parse(old('atlas-review/manifest.json')).packages);
assert(!review.files.some(f=>f.path==='content/learning-resources.v1.json'));
assert.deepEqual(review.files.filter(f=>!JSON.parse(old('atlas-review/manifest.json')).files.some(p=>p.path===f.path)).map(f=>f.path).sort(),['content/genicular-mri-pins.json','content/genicular-mri.ts','lib/genicular-mri.ts']);
for(const f of review.files)assert.equal(sha(readFileSync('atlas-review/'+f.path)),f.importedSha256);
const inventory=JSON.parse(readFileSync('lib/atlas-model-inventory.json'));assert.equal(inventory.models.length,137);assert.deepEqual(inventory.models,JSON.parse(old('lib/atlas-model-inventory.json')).models);
for(const name of ['head-neck','shoulder','female-pelvis','lower-limb','review']){
 const base=name==='review'?'public/atlas-review-viewer/':'public/atlas-runtime/'+name+'/',manifest=JSON.parse(readFileSync(base+'manifest.json')),prior=JSON.parse(old(base+'manifest.json'));
 assert.equal(manifest.sourceCommit,review.revision);for(const f of manifest.files)assert.equal(sha(readFileSync(base+f.path)),f.sha256);
 if(name==='review'){assert.equal(manifest.personalRecordsIncluded,false);assert.equal(manifest.mode,'production');assert.equal(manifest.websiteIntegrationSha256,review.websiteIntegrationSha256);}else{
  for(const flag of ['patientDataIncluded','clinicalApproved','standaloneReviewConnection'])assert.equal(manifest[flag],false);
  assert.deepEqual(manifest.imagingConnection,prior.imagingConnection);assert.deepEqual(manifest.files.filter(f=>f.path.startsWith('models/')),prior.files.filter(f=>f.path.startsWith('models/')));
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json'));assert.equal(inputs.length,{'head-neck':979,shoulder:652,'female-pelvis':111,'lower-limb':100}[name]);
  for(const path of ['bundled-dependencies.json','BUNDLED_NOTICES.txt'])assert.equal(readFileSync(base+path,'utf8').replaceAll('\r\n','\n'),old(base+path).toString().replaceAll('\r\n','\n'));
 }
 if(!['head-neck','review'].includes(name))continue;
 const code=emittedTeaching(base,manifest.files,true);
 for(const text of [...Object.values(now.genicularMriLandmarks),now.genicularMriContext])assert(code.includes(text)||code.includes(JSON.stringify(text).slice(1,-1)),text);
 for(const id of targets)assert(code.includes(id),id);for(const url of Object.values(now.genicularMriReferences))assert(code.includes(url),url);
}
assert.equal(mutations,304);assert.equal(malformed,40);assert.equal(stale,8);assert.equal(worksheets,8);
for(const path of ['lib/atlas-delivery-access.ts','lib/lecture-repository.ts','atlas-review/lib/atlas-practice.ts','atlas-review/lib/learning-resources.ts'])assert.equal(readFileSync(path,'utf8').replaceAll('\r\n','\n'),old(path).toString().replaceAll('\r\n','\n'),path);
const source='C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/outputs';
assert.equal(JSON.parse(readFileSync('atlas-review/manifest.json','utf8')).revision,revision);
assert.deepEqual(execFileSync('git',['show','f97ea55ee2e7b57865c012650b40fc44041f45da:content/learning-resources.v1.json'],{cwd:source,maxBuffer:32e6,windowsHide:true}),execFileSync('git',['show','2c6d1f3eedc067c48203bed0639f67a9fc7fd3c5:content/learning-resources.v1.json'],{cwd:source,maxBuffer:32e6,windowsHide:true}));

});
