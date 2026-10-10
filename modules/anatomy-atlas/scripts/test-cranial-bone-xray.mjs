import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {build} from './workspace-test-build.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
const baseline='c78e383a37976e2e459fd41504eac6281241af1d',root=process.cwd();
// Completed eight-topic epoch, independent of later authoring. The current
// suprascapular suite proves live preservation against the entire saved baseline.
const milestone='da1c7f692fcaf318a9c059aa5cb4ef0db8bbd6e8';
const old=p=>execFileSync('git',['show',baseline+':'+p],{maxBuffer:32e6,windowsHide:true});
const hash=b=>createHash('sha256').update(b).digest('hex');
// Keep direct lesson/identity mutation checks tied to their unchanged original
// module, while every application import is read from its exact Git epoch.
for(const path of ['lib/cranial-bone-xray.ts','content/cranial-bone-xray.ts'])
 assert.equal(readFileSync(path,'utf8').replaceAll('\r\n','\n'),execFileSync('git',['show',milestone+':'+path],{encoding:'utf8',windowsHide:true}).replaceAll('\r\n','\n'),path);
const lessonBuild=await build({stdin:{contents:"export * from './lib/cranial-bone-xray';export * from './content/cranial-bone-xray';",resolveDir:root,loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
const lessonApi=await import('data:text/javascript;base64,'+Buffer.from(lessonBuild.outputFiles[0].text).toString('base64'));
async function load(previous=false){
 return {...lessonApi,...await exactSourceHistoryApi(previous?baseline:milestone,'review-security')};
}
const now=await load(),before=await load(true),pins=JSON.parse(readFileSync('content/cranial-bone-xray-pins.json'));
assert.equal(pins.baseline,baseline);assert.equal(pins.entries.length,8);
const catalog=now.bodyDisplayCatalog(JSON.parse(readFileSync('public/models/bodyparts3d/full-body/catalog.json')));
assert.equal(catalog.structures.length,1104);
assert.deepEqual(catalog,before.bodyDisplayCatalog(JSON.parse(old('public/models/bodyparts3d/full-body/catalog.json'))));
assert.deepEqual(now.structures,before.structures);assert.deepEqual(now.dissectionProfiles,before.dissectionProfiles);assert.deepEqual(now.regionalTours,before.regionalTours);
const ids=new Set(pins.entries.map(e=>e.identity.id));assert.equal(ids.size,8);
const snapshot=api=>({catalog,body:catalog.structures.map(s=>({id:s.id,topics:Object.fromEntries(api.contentTabs.map(t=>[t,api.bodyLesson(s,t)]))})),shoulder:api.structures,recipes:api.dissectionProfiles});
assert.equal(hash(JSON.stringify(snapshot(before))),pins.beforeAllTeachingSnapshotHash);
const reconstructed=snapshot(now);let changed=0,preserved=0,refusals=0,malformed=0,stale=0,storageCalls=0,worksheetChanges=0;
for(const row of reconstructed.body)for(const tab of now.contentTabs){
 const s=catalog.structures.find(s=>s.id===row.id),prior=before.bodyLesson(s,tab),lesson=now.bodyLesson(s,tab);
 if(ids.has(s.id)&&tab==='xray'){
  assert.equal(prior.readiness,'pending');assert.equal(lesson.readiness,'draft');assert.deepEqual(prior,pins.entries.find(e=>e.identity.id===s.id).previous);
  assert.deepEqual(lesson,now.cranialBoneXrayLesson(s,tab));const {readiness,...shown}=lesson;assert.deepEqual(now.bodyContent(s,tab),shown);
  row.topics[tab]=prior;changed++;
 }else{assert.deepEqual(lesson,prior,s.id+':'+tab);preserved++;}
}
assert.equal(changed,8);assert.equal(preserved,9928);assert.equal(hash(JSON.stringify(reconstructed)),pins.beforeAllTeachingSnapshotHash);
function leaves(value,path=[]){return value===null||typeof value!=='object'?[path]:Object.entries(value).flatMap(([k,v])=>leaves(v,[...path,k]));}
for(const {identity:s,family}of pins.entries){
 assert.deepEqual(catalog.structures.find(r=>r.id===s.id),s);
 for(const path of leaves(s)){
  const foreign=structuredClone(s);let parent=foreign;for(const k of path.slice(0,-1))parent=parent[k];const k=path.at(-1),v=parent[k];parent[k]=typeof v==='string'?v+'-foreign':typeof v==='number'?v+.01:v===null?'foreign':!v;
  assert.equal(now.cranialBoneXrayLesson(foreign,'xray'),undefined,path.join('.'));refusals++;
 }
 for(const edit of [s=>s.sources=[],s=>s.sources.push(structuredClone(s.sources[0])),s=>s.unexpected=true,s=>s.regions.unshift('foreign')]){const foreign=structuredClone(s);edit(foreign);assert.equal(now.cranialBoneXrayLesson(foreign,'xray'),undefined);refusals++;}
 for(const t of now.contentTabs.filter(t=>t!=='xray'))assert.equal(now.cranialBoneXrayLesson(s,t),undefined);
 const lesson=now.cranialBoneXrayLesson(s,'xray'),original=structuredClone(lesson);
 assert.match(original.note,/revision-bound radiologist/i);assert.match(original.note,/pending/i);
 assert.equal(original.body,now.cranialBoneXrayTeaching[family].body);
 assert.deepEqual(original.citations,now.cranialBoneXrayTeaching[family].citations.map(key=>now.cranialBoneXrayReferences[key]));
 lesson.bullets.push('foreign');lesson.citations.push('https://foreign.example');assert.deepEqual(now.cranialBoneXrayLesson(s,'xray'),original);
 const material=await now.bodyReviewMaterial(s.id);assert(await now.parseBodyReviewResponse(material,s.id));assert.equal(material.approval,false);assert.deepEqual(material.topics.find(t=>t.tab==='xray'),{tab:'xray',...original});
 for(const edit of [p=>p.topics.find(t=>t.tab==='xray').body+=' foreign',p=>p.topics.find(t=>t.tab==='xray').readiness='approved',p=>p.topics.find(t=>t.tab==='xray').citations=['https://foreign.example'],p=>p.source.structure.sources=[],p=>p.topics.splice(p.topics.findIndex(t=>t.tab==='xray'),1)]){const foreign=structuredClone(material);edit(foreign);assert.equal(await now.parseBodyReviewResponse(foreign,s.id),null);malformed++;}
 const prior=await before.bodyReviewContext(s.id),current=await now.bodyReviewContext(s.id);
 assert.equal(current.sourceHash,prior.sourceHash);assert.notEqual(current.revisions.teaching,prior.revisions.teaching);assert.equal(current.revisions.imaging,null);
 const packet={catalogScope:prior.catalogScope,structureId:s.id,track:'teaching',expectedVersion:0,materialHash:prior.materialHash,revisionHash:prior.revisions.teaching,checklistVersion:prior.checklistVersion,draft:now.blankBodyReview(prior,'teaching')};
 const response=await now.postBodyDecision(new Request('https://atlas.test/api/body-decisions',{method:'POST',headers:{origin:'https://atlas.test','content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_CRANIAL_BONE_XRAY'},body:JSON.stringify(packet)}),{prepare(){storageCalls++;throw Error('Stale review reached storage');}});
 assert.equal(response.status,409);stale++;
}
for(const s of catalog.structures){
 if(!ids.has(s.id))assert.equal(now.cranialBoneXrayLesson(s,'xray'),undefined);
 const prior=await before.bodyReviewMaterial(s.id),current=await now.bodyReviewMaterial(s.id);
 assert.deepEqual(current.source,prior.source);assert.deepEqual(current.reasoning,prior.reasoning);assert.deepEqual(current.guidedTours,prior.guidedTours);assert.equal(current.approval,false);
 if(ids.has(s.id)){assert.notEqual(current.fingerprints.teaching,prior.fingerprints.teaching);worksheetChanges++;}
 else{assert.deepEqual(current.topics,prior.topics);assert.equal(current.fingerprints.teaching,prior.fingerprints.teaching);}
}
assert.equal(worksheetChanges,8);assert.equal(malformed,40);assert.equal(stale,8);assert.equal(storageCalls,0);
for(const bundle of pins.bundles){const p='public'+bundle.url.split('?')[0],bytes=readFileSync(p);assert.equal(hash(bytes),bundle.sha256);assert.deepEqual(bytes,old(p));}
for(const p of ['package-lock.json','LICENSES/dependency-license-audit.json','LICENSES/BODYPARTS3D_FULL_BODY.md','app/body-explorer.tsx','lib/imaging-sync.ts','lib/didanix-atlas-adapter.ts','lib/independent-study-links.ts']){
 assert.equal(readFileSync(p,'utf8').replaceAll('\r\n','\n'),old(p).toString().replaceAll('\r\n','\n'),p);
}
assert.equal(execFileSync('git',['diff','--name-only',baseline,'--','public/models'],{encoding:'utf8'}).trim(),'');
console.log(JSON.stringify({baseline,changed,preserved,sourceMutationRefusals:refusals,malformedPacketsRefused:malformed,staleRefusalsBeforeStorage:stale,storageCalls,changedTeachingWorksheets:worksheetChanges,clinicalApproval:false,websiteIntegrated:false}));
