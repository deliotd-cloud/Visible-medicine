import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {join} from 'node:path';
import {runInNewContext} from 'node:vm';
import {build} from 'esbuild';

const source='19f9a7fa02b98b3df8a71a645fe68d3894094178';
const previous='8c4bcccaf9d0bb5ed3da8d974df7e4d6035430c5';
const website='6636b2b82f85c66c0920c5dd8e5ed492c4c8f417';
const fixtureSha='96ae6f742f2a3cc366d788a052f8be544791b9c523951a2337c78e4767ccfc17';
const sha=(v:any)=>createHash('sha256').update(typeof v==='string'||Buffer.isBuffer(v)?v:JSON.stringify(v)).digest('hex');
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const clean=(v:any)=>JSON.parse(JSON.stringify(v));
const fixture=json('tests/atlas-thoracic-spine-tour-baseline.json');
const tourId='thoracic-spine-discs-orientation';
const expectedStops=[
 ['first-thoracic-anterior','FMA9165','anterior',['FMA9165','FMA9187','FMA10458']],
 ['first-thoracic-disc-left','FMA10458','left',['FMA9165','FMA9187','FMA10458']],
 ['fifth-thoracic-disc-left','FMA13502','left',['FMA9922','FMA9945','FMA13502']],
 ['eighth-thoracic-disc-posterior','FMA13505','posterior',['FMA9991','FMA10014','FMA13505']],
 ['eleventh-thoracic-posterior','FMA10059','posterior',['FMA10059','FMA10081']],
 ['twelfth-thoracic-left','FMA10081','left',['FMA10059','FMA10081']],
] as const;

async function load(){
 const built=await build({stdin:{contents:`export * from './atlas-review/lib/body-review-material';
  export * from './atlas-review/lib/body-review-context';
  export * from './atlas-review/lib/body-review-response';
  export * from './atlas-review/lib/body-review-decisions';
  export * from './atlas-review/lib/body-review-client';
  export * from './atlas-review/lib/body-review-api';
  export * from './atlas-review/lib/nested-review-material';
  export * from './atlas-review/lib/regional-tours';
  import raw from './atlas-review/public/models/bodyparts3d/full-body/catalog.json';
  import {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';
  export const catalog=bodyDisplayCatalog(raw as any);`,
  resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'cjs',packages:'external'});
 const module={exports:{} as any},require=createRequire(join(process.cwd(),'package.json'));
 runInNewContext(built.outputFiles[0].text,{module,exports:module.exports,require,crypto,Request,Response,
  URL,URLSearchParams,TextEncoder,TextDecoder,structuredClone,console,setTimeout,clearTimeout});
 return module.exports;
}

test('exact thoracic tour import preserves every unrelated worksheet and requires fresh teaching review',async()=>{
 assert.equal(sha(fixture),fixtureSha,'immutable pre-import fixture');
 assert.deepEqual(fixture.provenance,{atlasSourceCommit:previous,websiteCommit:website,
  manifestSha:'ca15f80f6e208bcf911939b1c05e54a191a7c6fb09e65c6da197a933719fcd7e',
  capture:'verified frozen pre-import atlas-review snapshot; no private histories or patient data'});
 assert.deepEqual([fixture.root.length,fixture.nested.length,fixture.priorTours.length,fixture.participants.length],
  [1104,108,31,11]);
 assert.equal(fixture.priorTours.reduce((n:number,t:any)=>n+t.steps.length,0),183);
 const review=json('atlas-review/manifest.json'),receipt=json('atlas-review/integration-inputs.json');
 assert.equal(review.revision,source);assert.equal(receipt.sourceCommit,source);
 const pins=json('atlas-review/content/thoracic-spine-tour-pins.json');
 assert.equal(sha(readFileSync('atlas-review/content/thoracic-spine-tour-pins.json')),fixture.sourcePinsSha);
 assert.deepEqual(pins.entries.map((e:any)=>e.id),fixture.participants);
 assert.equal(pins.entries.length,11);assert.equal(pins.bundles.length,2);
 for(const path of ['lib/thoracic-spine-tour.ts','lib/regional-tours.ts','content/thoracic-spine-tour-pins.json']){
  const file=review.files.find((f:any)=>f.path===path);assert(file,path);
  assert.equal(sha(readFileSync('atlas-review/'+path)),file.importedSha256,path+': protected bytes');
  assert.equal(file.sourceSha256,fixture.sourceFiles[path],path+': pinned source');
  assert.equal(receipt.inputs.find((i:any)=>i.path==='atlas-review/'+path)?.sha256,file.importedSha256,path+': receipt');
 }
 for(const folder of ['head-neck','shoulder','lower-limb','female-pelvis']){
  const base='public/atlas-runtime/'+folder+'/';
  const manifest=json(base+'manifest.json'),inputs=json(base+'source-inputs.json');
  assert.equal(manifest.sourceCommit,source,folder);
  for(const path of ['lib/thoracic-spine-tour.ts','lib/regional-tours.ts','content/thoracic-spine-tour-pins.json']){
   const input=inputs.find((i:any)=>i.path===path);
   if(folder==='head-neck')assert.equal(input?.sha256,fixture.sourceFiles[path],folder+': shared regional tour source');
   else assert.equal(input,undefined,folder+': independent runtime does not borrow the shared spine tour');
  }
 }
 const viewer=json('public/atlas-review-viewer/manifest.json');
 assert.equal(viewer.sourceCommit,source);
 assert.equal(viewer.websiteIntegrationSha256,receipt.sha256);
 assert.equal(viewer.personalRecordsIncluded,false);
 for(const folder of ['head-neck','protected']){
  const base=folder==='protected'?'public/atlas-review-viewer/':'public/atlas-runtime/'+folder+'/';
  const manifest=json(base+'manifest.json');
  const js=manifest.files.filter((f:any)=>f.path.endsWith('.js')).map((f:any)=>{
   const bytes=readFileSync(base+f.path);assert.equal(sha(bytes),f.sha256,base+f.path);return bytes.toString();
  }).join('\n');
  assert(js.includes('thoracic-spine-discs-orientation'),folder+': tour bundle');
  assert(js.includes('T12–L1 disc is unresolved'),folder+': honest limitation');
 }
 assert.deepEqual(json('lib/atlas-model-inventory.json').models,fixture.modelInventory.models);
 assert.equal(sha(readFileSync('lib/plexus-review-manifest.json')),fixture.privatePlexus.manifestSha);
 assert.equal(sha(json('lib/plexus-review-manifest.json').study),fixture.privatePlexus.studySha);
 const api=await load();
 assert.equal(api.regionalTours.length,32);
 assert.equal(api.regionalTours.reduce((n:number,t:any)=>n+t.steps.length,0),189);
 assert.deepEqual(clean(api.regionalTours.slice(0,31)),fixture.priorTours,'prior tour order and definitions');
 const tour=api.regionalTours[31];assert.equal(tour.id,tourId);
 assert.equal(tour.region,'spine');assert.equal(tour.status,'draft');
 assert.equal(tour.revision,'thoracic-spine-discs-orientation-v1');
 assert.equal(sha(tour),fixture.tourSha,'immutable canonical tour');
 assert.match(tour.limitations,/T12–L1 disc is unresolved/);
 assert.match(tour.limitations,/radiologist sign-off/);
 const byFma=new Map(pins.entries.map((e:any)=>[e.fmaId,e.id]));
 const selected=api.regionalTourStructures(api.catalog,tour);
 assert.deepEqual(clean(selected),pins.entries);
 assert.deepEqual(clean(selected.map((s:any)=>s.id)),fixture.participants);
 const frames=api.regionalTourStepFrames(api.catalog,tour);assert.equal(frames.length,6);
 for(const [i,step]of tour.steps.entries()){
  const [id,fma,view,frameFmas]=expectedStops[i];
  assert.equal(step.id,id);assert.equal(step.selectedId,byFma.get(fma));assert.equal(step.view,view);
  assert.deepEqual(clean(step.frameIds),frameFmas.map((fma:string)=>byFma.get(fma)));
  assert.equal(step.durationMs,14000);assert.equal(step.fadeOthers,true);
  assert(step.caption.length>80);assert(step.references.every((r:string)=>r.startsWith('https://')));
  assert.deepEqual(clean(api.regionalTourFrame(api.catalog,tour,i)),clean(frames[i]));
  for(const sid of step.frameIds){
   const bounds=selected.find((s:any)=>s.id===sid).bounds;
   assert(bounds.min.every((v:number,axis:number)=>v>=frames[i].min[axis]&&bounds.max[axis]<=frames[i].max[axis]));
  }
 }
 let sourceRefusals=0;
 const refuse=(catalog:any,candidate:any=tour)=>{assert.throws(()=>api.regionalTourStructures(catalog,candidate));sourceRefusals++;};
 for(const pin of pins.entries){
  const old=api.catalog.structures.find((s:any)=>s.id===pin.id);
  refuse({...api.catalog,structures:api.catalog.structures.filter((s:any)=>s.id!==pin.id)});
  for(const patch of [{fmaId:'FMA0'},{bundle:'foreign'},{sources:[{...old.sources[0],sha256:'0'.repeat(64)}]},
    {provenance:{...old.provenance,license:'foreign'}},{bounds:{...old.bounds,min:[old.bounds.min[0]+.01,...old.bounds.min.slice(1)]}}])
   refuse({...api.catalog,structures:api.catalog.structures.map((s:any)=>s.id===pin.id?{...s,...patch}:s)});
 }
 for(const mutate of [(v:any)=>v.steps[0].caption+=' forged',(v:any)=>v.steps.reverse(),
  (v:any)=>v.revision+=' forged',(v:any)=>v.steps[0].frameIds=[v.steps[0].selectedId],
  (v:any)=>v.requiredDisplayBundles[fixture.participants[0]]='foreign']){
  const bad=clean(tour);mutate(bad);refuse(api.catalog,bad);
 }
 assert.equal(sourceRefusals,71);
 const root=new Map(fixture.root.map((e:any)=>[e.id,e]));
 const nested=new Map(fixture.nested.map((e:any)=>[e.key,e]));
 let changed=0,unchanged=0,topics=0,stale=0,storageCalls=0;
 const forbidden={prepare(){storageCalls++;throw Error('Stale save reached storage');}};
 for(const row of api.bodyReviewSummaries){
  const packet=await api.bodyReviewMaterial(row.id),context=await api.bodyReviewContext(row.id);
  const before=root.get(row.id) as any;assert(before,row.id);topics+=packet.topics.length;
  assert.equal(packet.approval,false);assert.equal(context.revisions.imaging,null);
  if(!fixture.participants.includes(row.id)){
   assert.equal(sha(packet),before.packetSha,row.id+': complete unrelated packet');
   assert.equal(context.sourceHash,before.sourceHash,row.id+': unrelated source');
   assert.equal(context.teachingHash,before.teachingHash,row.id+': unrelated teaching');
   assert.equal(context.revisions.teaching,before.teachingRevision,row.id+': unrelated teaching revision');
   unchanged++;continue;
  }
  changed++;
  for(const field of ['source','topics','reasoning','atlasLink','limits'])
   assert.equal(sha(packet[field]),before[field+'Sha'],row.id+': '+field);
  assert.equal(sha(packet.guidedTours.filter((e:any)=>e.tour.id!==tourId)),before.guidedToursSha);
  assert.equal(context.sourceHash,before.sourceHash);
  assert.notEqual(context.teachingHash,before.teachingHash);
  assert.notEqual(context.revisions.teaching,before.teachingRevision);
  const evidence=packet.guidedTours.find((e:any)=>e.tour.id===tourId);assert(evidence,row.id);
  assert.deepEqual(clean(evidence.tour),clean(tour));
  assert.deepEqual(clean(evidence.structures),clean(selected));
  assert.deepEqual(clean(evidence.stepFrames),clean(frames));
  assert.equal(evidence.transitionMs,1800);assert.equal(evidence.transition,'quintic-orbit');
  assert.equal(evidence.separation,0);
  assert(await api.parseBodyReviewResponse(packet,row.id),'current packet accepted');
  for(const mutate of [
   (p:any)=>p.guidedTours.splice(p.guidedTours.findIndex((e:any)=>e.tour.id===tourId),1),
   (p:any)=>p.guidedTours.find((e:any)=>e.tour.id===tourId).tour.steps.reverse(),
   (p:any)=>p.guidedTours.find((e:any)=>e.tour.id===tourId).tour.steps[0].caption+=' forged',
   (p:any)=>p.guidedTours.find((e:any)=>e.tour.id===tourId).structures[0].sources[0].sha256='0'.repeat(64),
   (p:any)=>p.guidedTours.find((e:any)=>e.tour.id===tourId).stepFrames[0].min[0]-=1,
  ]){
   const forged=clean(packet);mutate(forged);
   assert.equal(await api.parseBodyReviewResponse(forged,row.id),null,'tampered tour evidence refused');
  }
  const old=before.context;
  const synthetic={...api.blankBodyReview(old,'teaching'),eventSchema:'vm-body-review-event-1',
   catalogScope:old.catalogScope,structureId:row.id,track:'teaching',version:1,
   savedAt:'2026-10-01T00:00:00.000Z',reviewedAt:'2026-10-01T00:00:00.000Z',
   revisionHash:old.revisions.teaching,checklistVersion:old.checklistVersion,checklist:old.checklists.teaching,
   material:{materialHash:old.materialHash,sourceHash:old.sourceHash,teachingHash:old.teachingHash,
    rendererHash:old.rendererHash,teachingTabs:old.teachingTabs},status:'approved',attested:true,
   reviewer:'SYNTHETIC TEST ONLY',qualification:'Synthetic',scope:'Synthetic old tour only',
   evidence:[{title:'Synthetic',url:'https://example.test/evidence',note:'No clinical evidence'}],
   checks:Object.fromEntries(old.checklists.teaching.map((item:any)=>[item.id,true]))};
  const parsed=api.parseSavedBodyReview(synthetic);
  assert(api.bodyReviewStale(parsed,context));assert.equal(api.bodyDecisionLabel(parsed,context),'Re-review required');
  const restored=api.bodyDraftsFromPage({context,reviews:[parsed],history:[],track:'teaching',nextBefore:null}).teaching;
  assert.equal(restored.status,'draft');assert.equal(restored.attested,false);
  assert(Object.values(restored.checks).every(v=>v===false));
  const request=new Request('https://review.test/api/atlas-review/body-decision',{method:'POST',
   headers:{origin:'https://review.test','content-type':'application/json',
    'oai-authenticated-user-id':'SYNTHETIC_THORACIC_TOUR_TEST'},
   body:JSON.stringify({catalogScope:context.catalogScope,structureId:row.id,track:'teaching',expectedVersion:0,
    materialHash:context.materialHash,revisionHash:old.revisions.teaching,
    checklistVersion:context.checklistVersion,draft:api.blankBodyReview(context,'teaching')})});
  assert.equal((await api.postBodyDecision(request,forbidden)).status,409);stale++;
 }
 assert.deepEqual({changed,unchanged,topics,stale,storageCalls},
  {changed:11,unchanged:1093,topics:9936,stale:11,storageCalls:0});
 let nestedCount=0;
 for(const group of api.nestedReviewRows)for(const row of group.surfaces){
  const key=group.key+'|'+row.id,before=nested.get(key) as any;assert(before,key);
  const packet=await api.nestedReviewMaterial(group.key,row.id);assert(packet,key);
  for(const field of ['source','teaching','atlasLink'])
   assert.equal(sha(packet[field]),before[field+'Sha'],key+': '+field);
  // Shared renderer integration changes expire display approval, not nested teaching.
  const stableContext=({rendererHash,materialHash,revisions,...rest}:any)=>
   ({...rest,revisions:{teaching:revisions.teaching,imaging:revisions.imaging}});
  assert.deepEqual(clean(stableContext(packet.context)),stableContext(before.context),key+': stable identity and teaching');
  assert.equal(packet.context.rendererHash,json('atlas-review/content/body-renderer-revision.json').sha256);
  assert.notEqual(packet.context.materialHash,before.context.materialHash,key+': current material binding');
  assert.notEqual(packet.context.revisions.geometry,before.context.revisions.geometry,key+': stale display approval');
  nestedCount++;
 }
 assert.equal(nestedCount,108);
});
