import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {join} from 'node:path';
import {runInNewContext} from 'node:vm';
import {build} from 'esbuild';

const source='b4be1f0f343e54ee0fc021bcebac7bb62e978deb';
const previous='c52c9c690d790e4e921bde7ed5a943ef30a95001';
const fixtureSha='27685dbc29669506f88fd201a02e02ba68379a43c7ac73e8834d90d5b4dbe23d';
const sha=(value:any)=>createHash('sha256').update(typeof value==='string'||Buffer.isBuffer(value)?value:JSON.stringify(value)).digest('hex');
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const clean=(value:any)=>JSON.parse(JSON.stringify(value));
const entries=['cardiac-right-atrium','cardiac-left-atrium','cardiac-right-ventricle','cardiac-left-ventricle'];
const stable=(c:any)=>({catalogScope:c.catalogScope,nestedKey:c.nestedKey,sourceFrame:c.sourceFrame,
 structureId:c.structureId,structureName:c.structureName,sourceHash:c.sourceHash,teachingHash:c.teachingHash,
 checklistVersion:c.checklistVersion,teachingTabs:c.teachingTabs,checklists:c.checklists,blockers:c.blockers,
 teachingRevision:c.revisions.teaching,imagingRevision:c.revisions.imaging});

async function load(){
 const result=await build({stdin:{contents:`export * from './atlas-review/lib/nested-review-material';
 export * from './atlas-review/lib/nested-review';export * from './atlas-review/lib/nested-review-client';
 export * from './atlas-review/lib/nested-review-api';export * from './atlas-review/lib/nested-teaching';
 export * from './atlas-review/content/nested-teaching';export * from './atlas-review/lib/body-review-material';
 export * from './atlas-review/lib/content-types';export * from './atlas-review/content/cardiac-cavity-depth';`,
 resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'cjs',packages:'external'});
 const module={exports:{} as any},require=createRequire(join(process.cwd(),'package.json'));
 runInNewContext(result.outputFiles[0].text,{module,exports:module.exports,require,crypto,Request,Response,
  URL,URLSearchParams,TextEncoder,TextDecoder,structuredClone,console,setTimeout,clearTimeout});
 return module.exports;
}

test('four imported cardiac cavity drafts preserve all other packets and demand fresh Review sign-off',async()=>{
 const fixturePath='tests/atlas-cardiac-cavity-depth-baseline.json';
 const baseline=json(fixturePath);
 assert.equal(sha(baseline),fixtureSha);
 assert.deepEqual(baseline.provenance,{atlasSourceCommit:previous,
  websiteCommit:'ab2b36fe115efffee7d99cee55f3881a2379836c',
  manifestSha:'f9c4534fe4dae724d4d71f9de7d0e8db153491c1b4d11d152f09875b9e32303e',
  capture:'verified frozen pre-import atlas-review snapshot; no private histories or patient data'});
 assert.deepEqual({selected:baseline.selected.length,other:baseline.other.length,root:baseline.root.length},
  {selected:4,other:104,root:1104});
 const review=json('atlas-review/manifest.json'),receipt=json('atlas-review/integration-inputs.json');
 assert.equal(review.revision,source);assert.equal(receipt.sourceCommit,source);
 for(const path of ['content/cardiac-cavity-depth.ts','content/nested-teaching.ts']){
  const file=review.files.find((f:any)=>f.path===path);assert(file,path);
  assert.equal(sha(readFileSync('atlas-review/'+path)),file.importedSha256,path);
  const input=json('public/atlas-runtime/head-neck/source-inputs.json').find((f:any)=>f.path===path);
  assert.equal(input?.sha256,file.sourceSha256,path);
  assert.equal(receipt.inputs.find((i:any)=>i.path==='atlas-review/'+path)?.sha256,file.importedSha256,path);
 }
 for(const folder of ['head-neck','shoulder','lower-limb'])
  assert.equal(json('public/atlas-runtime/'+folder+'/manifest.json').sourceCommit,source,folder);
 const viewer=json('public/atlas-review-viewer/manifest.json');
 assert.equal(viewer.sourceCommit,source);assert.equal(viewer.websiteIntegrationSha256,receipt.sha256);
 assert.equal(viewer.personalRecordsIncluded,false);
 for(const folder of ['head-neck','protected']){
  const base=folder==='protected'?'public/atlas-review-viewer/':'public/atlas-runtime/'+folder+'/';
  const manifest=json(base+'manifest.json');
  const js=manifest.files.filter((f:any)=>f.path.endsWith('.js')).map((f:any)=>{
   const bytes=readFileSync(base+f.path);assert.equal(sha(bytes),f.sha256,base+f.path);return bytes.toString();
  }).join('\n');
  assert(js.includes('The right atrium is the upper receiving chamber'),folder);
 }
 const api=await load();
 assert.deepEqual(Object.keys(api.cardiacCavityDepthSections),entries);
 assert.equal(Object.keys(api.cardiacCavityDepthReferences).length,8);
 assert.equal(new Set(Object.values(api.cardiacCavityDepthReferences).map((r:any)=>r.url)).size,8);
 for(const [key,ref]of Object.entries(api.cardiacCavityDepthReferences) as [string,any][]){
  assert.equal(ref.scopedToConcept,true,key);assert(ref.title.trim());assert.match(ref.url,/^https:\/\//);
 }
 const prior=new Map(baseline.selected.map((e:any)=>[e.key,e.packet]));
 const others=new Map(baseline.other.map((e:any)=>[e.key,e]));
 assert.equal(prior.size,4);assert.equal(others.size,104);
 let revised=0,retained=0,changedTopics=0,unchangedTopics=0,forged=0,stale=0,storageCalls=0;
 const forbidden={prepare(){storageCalls++;throw Error('Stale request reached storage');}};
 for(const group of api.nestedReviewRows)for(const row of group.surfaces){
  const key=group.key+'|'+row.id,current=await api.nestedReviewMaterial(group.key,row.id);assert(current,key);
  const old=prior.get(key) as any,c=current.context;
  assert.equal(c.revisions.imaging,null);
  if(!old){
   const before=others.get(key) as any;assert(before,key);retained++;
   assert.equal(sha(current.source),before.sourceSha,key+':source');
   assert.equal(sha(current.teaching),before.teachingSha,key+':teaching');
   assert.equal(sha(current.atlasLink),before.atlasLinkSha,key+':link');
   assert.equal(sha(stable(c)),before.stableContextSha,key+':context');
   unchangedTopics+=current.teaching.topics.length+1;continue;
  }
  revised++;
  const b=old.context,id=current.teaching.concept.id;
  assert.equal(group.study,'cardiac');assert(entries.includes(id));assert.equal(old.teaching.concept.id,id);
  assert.deepEqual(clean(current.source),old.source);assert.deepEqual(clean(current.atlasLink),old.atlasLink);
  assert.equal(c.sourceHash,b.sourceHash);
  for(const field of ['catalogScope','nestedKey','sourceFrame','structureId','checklistVersion','checklists','blockers','teachingTabs'])
   assert.deepEqual(clean(c[field]),b[field],key+':'+field);
  assert.deepEqual(clean({...current.teaching.concept,sections:{...current.teaching.concept.sections,
   anatomy:old.teaching.concept.sections.anatomy,function:old.teaching.concept.sections.function}}),old.teaching.concept);
  assert.deepEqual(clean({anatomy:current.teaching.concept.sections.anatomy,function:current.teaching.concept.sections.function}),
   clean(api.cardiacCavityDepthSections[id]));
  for(const tab of ['anatomy','function']){
   const lesson=current.teaching.topics.find((t:any)=>t.tab===tab),before=old.teaching.topics.find((t:any)=>t.tab===tab);
   assert.equal(lesson.body,api.cardiacCavityDepthSections[id][tab].body);assert.equal(lesson.readiness,'draft');
   assert.deepEqual(clean(lesson.references),clean(api.cardiacCavityDepthSections[id][tab].references.map((r:string)=>api.nestedTeachingReferences[r].url)));
   assert.notDeepEqual(clean(lesson),before);changedTopics++;
  }
  assert.deepEqual(clean({...current.teaching,topics:old.teaching.topics,concept:old.teaching.concept,
   referenceTitles:old.teaching.referenceTitles}),old.teaching);
  for(const topic of current.teaching.topics)if(!['anatomy','function'].includes(topic.tab)){
   assert.deepEqual(clean(topic),old.teaching.topics.find((t:any)=>t.tab===topic.tab));unchangedTopics++;
  }
  unchangedTopics++; // Quiz is in the complete concept/lesson, outside topics[].
  for(const [url,title]of Object.entries(old.teaching.referenceTitles))
   if(current.teaching.topics.some((topic:any)=>topic.references.includes(url)))assert.equal(current.teaching.referenceTitles[url],title);
  assert.notEqual(c.teachingHash,b.teachingHash);assert.notEqual(c.revisions.teaching,b.revisions.teaching);
  assert.notEqual(c.materialHash,b.materialHash);
  const synthetic={...api.blankNestedReview(b,'teaching'),eventSchema:'vm-nested-review-event-1',
   catalogScope:b.catalogScope,nestedKey:b.nestedKey,sourceFrame:b.sourceFrame,structureId:b.structureId,
   track:'teaching',version:1,savedAt:'2026-10-01T00:00:00.000Z',reviewedAt:'2026-10-01T00:00:00.000Z',
   revisionHash:b.revisions.teaching,checklistVersion:b.checklistVersion,checklist:b.checklists.teaching,
   material:{materialHash:b.materialHash,sourceHash:b.sourceHash,teachingHash:b.teachingHash,
    rendererHash:b.rendererHash,teachingTabs:b.teachingTabs},status:'approved',attested:true,
   reviewer:'SYNTHETIC TEST ONLY',qualification:'Synthetic',scope:'Synthetic prior review only',
   evidence:[{title:'Synthetic',url:'https://example.test/evidence',note:'No clinical evidence'}],
   checks:Object.fromEntries(b.checklists.teaching.map((item:any)=>[item.id,true]))};
  const parsed=api.parseSavedNestedReview(synthetic);
  assert(api.nestedReviewStale(parsed,c));assert.equal(api.nestedDecisionLabel(parsed,c),'Re-review required');
  const restored=api.nestedDraftFromSaved(parsed,c,'teaching');
  assert.equal(restored.status,'draft');assert.equal(restored.attested,false);
  assert(Object.values(restored.checks).every(v=>v===false));
  const request=(materialHash:string,revisionHash:string)=>new Request('https://review.test/api/atlas-review/nested-review',
   {method:'POST',headers:{origin:'https://review.test','content-type':'application/json',
    'oai-authenticated-user-id':'SYNTHETIC_CAVITY_TEST'},body:JSON.stringify({catalogScope:c.catalogScope,
     nestedKey:c.nestedKey,structureId:c.structureId,sourceFrame:c.sourceFrame,checklistVersion:c.checklistVersion,
     track:'teaching',expectedVersion:0,materialHash,revisionHash,draft:api.blankNestedReview(c,'teaching')})});
  for(const [material,revision]of [[b.materialHash,c.revisions.teaching],[c.materialHash,b.revisions.teaching]]){
   assert.equal((await api.postNestedReview(request(material,revision),forbidden)).status,409);stale++;
  }
  for(const [which,identity]of [['parent',current.source.parent],['child',current.source.structure]]as const){
   for(const field of Object.keys(identity))for(const bad of [
    ((v:any)=>{delete v[field];return v;})(clean(identity)),
    ((v:any)=>{v[field]=typeof v[field]==='string'?v[field]+'-foreign':null;return v;})(clean(identity))]){
     assert.equal(api.nestedTeachingFor(which==='parent'?bad:current.source.parent,'cardiac',
      which==='child'?bad:current.source.structure),null);forged++;
   }
   for(const mutate of [(v:any)=>v.unexpected=true,(v:any)=>v.bounds.min[0]+=.01,
     (v:any)=>v.sources[0].sha256='0'.repeat(64),(v:any)=>v.sources[0].file+=' foreign',
     (v:any)=>v.provenance.license='foreign']){
     const bad=clean(identity);mutate(bad);
     assert.equal(api.nestedTeachingFor(which==='parent'?bad:current.source.parent,'cardiac',
      which==='child'?bad:current.source.structure),null);forged++;
   }
  }
 }
 assert.deepEqual({revised,retained,changedTopics,unchangedTopics,stale,storageCalls},
  {revised:4,retained:104,changedTopics:8,unchangedTopics:964,stale:8,storageCalls:0});
 assert(forged>=100);
 const root=new Map(baseline.root.map((e:any)=>[e.id,e.packetSha]));
 let rootTopics=0,rootPackets=0;
 for(const row of api.bodyReviewSummaries){
  const packet=await api.bodyReviewMaterial(row.id);assert(packet);
  assert.equal(sha(packet),root.get(row.id),row.id);rootTopics+=packet.topics.length;rootPackets++;
 }
 assert.deepEqual({rootTopics,rootPackets},{rootTopics:9936,rootPackets:1104});
});
