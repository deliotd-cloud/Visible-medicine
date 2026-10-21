import {boundLiveAtlasHistory} from './atlas-bound-live-history.mjs';
import {checkedAtlasHistoryRepo} from './atlas-source-repo.mjs';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';
import {emittedTeaching} from './atlas-emitted-teaching.ts';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync,readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import test from 'node:test';
import {build} from 'esbuild';

const atlas=currentAtlasDeliveryRoot();
const historicalRevision='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const portalTourRevision='47a851db0fb3369ad056fb8a8fcc3f3ba73656ea';
const portalTourBlob='c832b8cafa2a53a79d244dfa223288b7fd255be6';
const currentTourBlob='fb65a9c68d8753fc1789c7e6281e36c2889e0136';
const revision=CURRENT_ATLAS_REVISION;
const baseline='ab8f5594df9ff55132d3d8754e9d229a806dc325';
const completed='a70b6f640c5511330f250882f525b63a4a21117b';
const completedIntegration='64c0eee7fbb6eb334364a4afc6fcb383fa218081a6e09f342455e3bcc3184f44';
const completedRenderer='1c622768fe7f6756b265a6c7b784e07f8ac37884f140352d55e15b74b207d92b';
const pinPath='content/orbital-nerve-mri-pins.json';
const catalogPath='public/models/bodyparts3d/full-body/catalog.json';
const sourcePaths=[pinPath,'content/orbital-apex-ct.ts','lib/orbital-apex-ct.ts'];
const prefix='vm:anatomy:body:head-neck:';
const slots=[
  ['left:nerve:superior-branch-of-left-oculomotor-nerve','FMA52575','FJ1321','superior-oculomotor'],
  ['right:nerve:superior-branch-of-right-oculomotor-nerve','FMA52574','FJ1372','superior-oculomotor'],
  ['left:nerve:inferior-branch-of-left-oculomotor-nerve','FMA52577','FJ1293','inferior-oculomotor'],
  ['right:nerve:inferior-branch-of-right-oculomotor-nerve','FMA52576','FJ1344','inferior-oculomotor'],
  ['left:nerve:left-trochlear-nerve','FMA50882','FJ1330','trochlear'],
  ['right:nerve:right-trochlear-nerve','FMA50881','FJ1381','trochlear'],
  ['left:nerve:left-frontal-nerve','FMA52640','FJ1290','frontal'],
  ['right:nerve:right-frontal-nerve','FMA52639','FJ1341','frontal'],
  ['left:nerve:left-lacrimal-nerve','FMA52630','FJ1300','lacrimal'],
  ['right:nerve:right-lacrimal-nerve','FMA52629','FJ1351','lacrimal'],
  ['left:nerve:left-nasociliary-nerve','FMA52670','FJ1310','nasociliary'],
  ['right:nerve:right-nasociliary-nerve','FMA52669','FJ1361','nasociliary'],
  ['left:organ:left-ciliary-ganglion','FMA53550','FJ1288','ciliary-ganglion'],
  ['right:organ:right-ciliary-ganglion','FMA53549','FJ1339','ciliary-ganglion'],
] as const;
const expected=new Map(slots.map(([suffix,fma,file,group])=>[
  prefix+suffix,{fma,file,group,side:suffix.split(':')[0],category:suffix.split(':')[1]},
]));
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));
const sha=(bytes:Uint8Array|string)=>createHash('sha256').update(bytes).digest('hex');
const norm=(bytes:Uint8Array)=>Buffer.from(bytes).toString('utf8').replaceAll('\r\n','\n');
const visible=(code:string,value:string)=>code.includes(value)||code.includes(JSON.stringify(value).slice(1,-1));
const git=(args:string[])=>execFileSync('git',args,{cwd:atlas,windowsHide:true,maxBuffer:32e6,
  env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
const committed=(commit:string,path:string)=>git(['show',`${commit}:${path}`]);
async function history(commit:string,overrides:Record<string,string|Uint8Array>={}){
  const api=await import(pathToFileURL(atlas+'/scripts/exact-source-history-api.mjs').href);
  return api.exactSourceHistoryApi(commit,'review-security',overrides);
}
async function completedHistory(){
  const path='content/body-renderer-revision.json';
  const original=JSON.parse(committed(completed,path).toString());
  assert.equal(sha(JSON.stringify({source:original.sha256,website:completedIntegration})),completedRenderer);
  const bound={...original,sha256:completedRenderer,
    sourceRendererSha256:original.sha256,websiteIntegrationSha256:completedIntegration};
  return history(completed,{[path]:JSON.stringify(bound)});
}
async function importedClosure(){
  const built=await build({stdin:{contents:[
    "export {bodyLesson} from './atlas-review/app/body-content';",
    "export {orbitalApexCtLesson} from './atlas-review/lib/orbital-apex-ct';",
    "export {orbitalApexCtTopics,orbitalApexCtReferences,orbitalApexCtScope,orbitalApexCtNote} from './atlas-review/content/orbital-apex-ct';",
    "export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';",
    "export {structures} from './atlas-review/app/anatomy-data';",
    "export {dissectionProfiles} from './atlas-review/app/dissection-data';",
    "export {regionalTours} from './atlas-review/lib/regional-tours';",
    "export {contentTabs} from './atlas-review/lib/content-types';",
    "export * from './atlas-review/lib/body-review-material';",
    "export * from './atlas-review/lib/body-review-context';",
    "export * from './atlas-review/lib/body-review-response';",
    "export * from './atlas-review/lib/body-review-api';",
    "export * from './atlas-review/lib/body-review-decisions';",
  ].join('\n'),resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,
    platform:'node',format:'esm'});
  return import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
}

test('twelve exact orbital-apex CT drafts reach the learner and protected Review exports',async()=>{
  assert.equal(checkedAtlasHistoryRepo(historicalRevision),atlas);
  assert.equal(git(['merge-base',historicalRevision,revision]).toString().trim(),historicalRevision);
  assert.equal(git(['merge-base',portalTourRevision,historicalRevision]).toString().trim(),portalTourRevision);
  assert.equal(git(['rev-parse',portalTourRevision+':lib/regional-tours.ts']).toString().trim(),portalTourBlob);
  assert.equal(git(['rev-parse',historicalRevision+':lib/regional-tours.ts']).toString().trim(),currentTourBlob);
  assert.equal(git(['rev-parse',revision+':lib/regional-tours.ts']).toString().trim(),currentTourBlob);
  assert.equal(expected.size,14);
  const manifest=json('atlas-review/manifest.json');
  assert.equal(manifest.revision,revision);
  assert.equal(git(['rev-parse','HEAD']).toString().trim(),revision);
  const viewerBase='public/atlas-review-viewer/',viewer=json(viewerBase+'manifest.json');
  assert.equal(viewer.sourceCommit,revision);
  assert.equal(viewer.websiteIntegrationSha256,manifest.websiteIntegrationSha256);
  assert.equal(viewer.personalRecordsIncluded,false);
  const learners=['head-neck','female-pelvis','lower-limb','shoulder'].map(name=>({name,
    base:`public/atlas-runtime/${name}/`,manifest:json(`public/atlas-runtime/${name}/manifest.json`)}));
  for(const {name,manifest:built} of learners){
    assert.equal(built.sourceCommit,revision,name);
    assert.equal(built.patientDataIncluded,false,name);
    assert.equal(built.clinicalApproved,false,name);
  }
  const head=learners[0],inputs=json(head.base+'source-inputs.json');
  for(const path of sourcePaths){
    const source=committed(revision,path),imported=readFileSync('atlas-review/'+path);
    assert.deepEqual(source,committed(historicalRevision,path),`${path}: retained from first delivery`);
    const record=manifest.files.find((file:{path:string})=>file.path===path);assert(record,path);
    assert.equal(record.sourceSha256,sha(source),path);
    assert.equal(record.importedSha256,sha(imported),path);
    assert.equal(norm(imported),norm(source),`${path}: imported source`);
    assert.equal(norm(readFileSync(`${atlas}/${path}`)),norm(source),`${path}: Atlas source`);
    assert.equal(inputs.find((file:{path:string})=>file.path===path)?.sha256,sha(source),`${path}: learner input`);
    for(const base of ['public/atlas-review/',viewerBase,...learners.map(item=>item.base)])
      assert.equal(existsSync(base+path),false,`${base+path}: raw source public`);
  }
  assert.deepEqual(committed(revision,pinPath),committed(baseline,pinPath),'MRI geometry pins preserved');
  const pins=json('atlas-review/'+pinPath);
  assert.equal(pins.entries.length,14);
  assert.deepEqual(new Set(pins.entries.map((entry:any)=>entry.identity.id)),new Set(expected.keys()));
  const api=await importedClosure();
  const catalog=api.bodyDisplayCatalog(json('atlas-review/'+catalogPath));
  const scope=head.manifest.regionalScopes.find((item:{region:string})=>item.region==='head-neck');assert(scope);
  const emitted=[emittedTeaching(head.base,head.manifest.files,true),emittedTeaching(viewerBase,viewer.files,true)];
  let active=0,pending=0;
  for(const {identity,group} of pins.entries){
    const row=expected.get(identity.id);assert(row,identity.id);
    assert.equal(group,row.group);assert.equal(identity.fmaId,row.fma);assert.equal(identity.nodeName,row.fma);
    assert.equal(identity.laterality,row.side);assert.equal(identity.category,row.category);
    assert.equal(identity.region,'head-neck');assert.equal(identity.system,'nerves');
    assert.deepEqual(identity.sources.map((source:{file:string})=>source.file),[row.file]);
    assert.equal(identity.validation.status,'unvalidated');
    assert.equal(identity.validation.anatomicalReview,false);
    assert.deepEqual(catalog.structures.find((item:{id:string})=>item.id===identity.id),identity);
    assert(scope.regionalIds.includes(identity.id),identity.id);
    if(group==='ciliary-ganglion'){
      pending++;
      assert.equal(api.orbitalApexCtLesson(identity,'ct'),undefined);
      assert.equal(api.bodyLesson(identity,'ct').readiness,'pending');
      continue;
    }
    active++;
    const topic=api.orbitalApexCtTopics[group],lesson=api.orbitalApexCtLesson(identity,'ct');
    assert.equal(topic.readiness,'draft');
    assert.deepEqual(api.bodyLesson(identity,'ct'),lesson);
    assert.equal(lesson.readiness,'draft');
    assert.equal(lesson.title,`${identity.name} · CT orientation · draft`);
    assert.equal(lesson.body,topic.body);
    assert.deepEqual(lesson.bullets,[api.orbitalApexCtScope,...topic.bullets]);
    assert.deepEqual(lesson.citations,topic.citations);
    assert.equal(lesson.note,api.orbitalApexCtNote);
    const prose=[lesson.title,lesson.body,...lesson.bullets,lesson.note].join(' ');
    assert.match(prose,/optic strut/i);assert.match(prose,/optic canal/i);
    assert.match(prose,/superior orbital fissure/i);assert.match(prose,/annul/i);
    assert.match(prose,/revision-bound radiologist review and sign-off are pending/i);
    assert.match(prose,/Atlas, imaging-case and paid-lecture access remain independent/i);
    for(const code of emitted)for(const value of [identity.name,lesson.title,lesson.body,
      ...lesson.bullets,...lesson.citations,lesson.note])
      assert(visible(code,value),`${identity.id}: emitted teaching missing ${value}`);
    for(const tab of api.contentTabs.filter((tab:string)=>tab!=='ct'))
      assert.equal(api.orbitalApexCtLesson(identity,tab),undefined,`${identity.id}:${tab}`);
    for(const edit of [(bad:any)=>{bad.fmaId='FMA0';},(bad:any)=>{bad.bundle='forged';},
      (bad:any)=>{bad.sources[0].file='FJ0';},(bad:any)=>{bad.bounds.min[0]+=0.01;}]){
      const forged=wire(identity);edit(forged);
      assert.equal(api.orbitalApexCtLesson(forged,'ct'),undefined,`${identity.id}: forged identity`);
    }
  }
  assert.deepEqual({active,pending},{active:12,pending:2});
  assert.equal(api.orbitalApexCtReferences.daniels1985,'https://pubmed.ncbi.nlm.nih.gov/3877415/');
  assert.equal(api.orbitalApexCtReferences.martins2011,'https://pmc.ncbi.nlm.nih.gov/articles/PMC3335518/');
});

test('completed orbital CT epoch changes exactly twelve lessons and packets, with historical refusal gates',async()=>{
  const live=await completedHistory(),previous=await history(baseline);
  const sourceCatalog=JSON.parse(committed(completed,catalogPath).toString());
  const catalog=live.bodyDisplayCatalog(sourceCatalog);
  assert.deepEqual(committed(completed,catalogPath),committed(baseline,catalogPath));
  assert.equal(catalog.structures.length,1104);assert.equal(live.contentTabs.length,9);
  const active=new Set(slots.filter(row=>row[3]!=='ciliary-ganglion').map(row=>prefix+row[0]));
  let placements=0,changed=0,packets=0,changedPackets=0,storageCalls=0;
  const storage={prepare(){storageCalls++;throw Error('Rejected decision reached storage');}};
  for(const structure of catalog.structures){
    const selected=active.has(structure.id);
    for(const tab of live.contentTabs){
      const before=previous.bodyLesson(structure,tab),after=live.bodyLesson(structure,tab);placements++;
      if(!selected||tab!=='ct'){assert.deepEqual(after,before,`${structure.id}:${tab}`);continue;}
      changed++;assert.equal(before.readiness,'pending');assert.equal(after.readiness,'draft');
    }
    const before=wire(await previous.bodyReviewMaterial(structure.id));
    const after=wire(await live.bodyReviewMaterial(structure.id));packets++;
    if(!selected){assert.deepEqual(after,before,`${structure.id}: unchanged Review packet`);continue;}
    changedPackets++;
    assert.equal(after.approval,false);assert.equal(after.status,'worksheet-not-submitted');
    for(const key of ['source','reasoning','guidedTours','checklist','atlasLink','limits'])
      assert.deepEqual(after[key],before[key],`${structure.id}:${key}`);
    assert.deepEqual(after.topics.filter((row:any)=>row.tab!=='ct'),before.topics.filter((row:any)=>row.tab!=='ct'));
    assert.deepEqual(after.topics.find((row:any)=>row.tab==='ct'),{tab:'ct',...live.bodyLesson(structure,'ct')});
    assert.equal(after.fingerprints.source,before.fingerprints.source);
    assert.notEqual(after.fingerprints.teaching,before.fingerprints.teaching);
    assert.notEqual(after.materialHash,before.materialHash);
    assert.deepEqual(await live.parseBodyReviewResponse(after,structure.id),after);
    assert.equal(await live.parseBodyReviewResponse(before,structure.id),null);
    for(const edit of [(bad:any)=>{bad.topics.find((row:any)=>row.tab==='ct').body+=' forged';},
      (bad:any)=>{bad.topics.find((row:any)=>row.tab==='ct').bullets[0]+=' forged';},
      (bad:any)=>{bad.topics.find((row:any)=>row.tab==='ct').citations[0]='https://forged.example';},
      (bad:any)=>{bad.topics.find((row:any)=>row.tab==='ct').readiness='approved';},
      (bad:any)=>{bad.source.structure.sources[0].sha256='0'.repeat(64);}] ){
      const forged=wire(after);edit(forged);
      assert.equal(await live.parseBodyReviewResponse(forged,structure.id),null);
    }
    const oldContext=await previous.bodyReviewContext(structure.id);
    const context=await live.bodyReviewContext(structure.id);
    assert.equal(context.sourceHash,oldContext.sourceHash);
    assert.notEqual(context.revisions.teaching,oldContext.revisions.teaching);
    assert.equal(context.revisions.imaging,null);
    assert(context.teachingTabs.includes('ct'));
    const decision={catalogScope:context.catalogScope,structureId:structure.id,track:'teaching',expectedVersion:0,
      materialHash:context.materialHash,revisionHash:context.revisions.teaching,
      checklistVersion:context.checklistVersion,draft:live.blankBodyReview(context,'teaching')};
    const save=(input:any)=>live.postBodyDecision(new Request('https://review.test/api/body-decisions',{
      method:'POST',headers:{origin:'https://review.test','content-type':'application/json',
        'oai-authenticated-user-id':'synthetic-orbital-apex-reviewer'},body:JSON.stringify(input),
    }),storage);
    for(const patch of [{materialHash:before.materialHash},
      {revisionHash:oldContext.revisions.teaching}])
      assert.equal((await save({...decision,...patch})).status,409,`${structure.id}: stale before storage`);
    const forged=wire(decision);forged.draft.checks.foreign=true;
    assert.equal((await save(forged)).status,422);
    const approval=wire(decision);approval.draft.status='approved';
    assert.equal((await save(approval)).status,422);
  }
  assert.deepEqual({placements,changed,packets,changedPackets,storageCalls},
    {placements:9936,changed:12,packets:1104,changedPackets:12,storageCalls:0});
});

test('current imported Review retains exact orbital CT material under the live tour registry',async()=>{
  const imported=await importedClosure(),live=await boundLiveAtlasHistory(revision),historical=await completedHistory();
  const portalTourEpoch=await history(portalTourRevision);
  const firstDelivery=await history(historicalRevision);
  const catalog=live.bodyDisplayCatalog(JSON.parse(committed(revision,catalogPath).toString()));
  assert.deepEqual(committed(revision,catalogPath),committed(completed,catalogPath));
  assert.deepEqual(imported.bodyDisplayCatalog(json('atlas-review/'+catalogPath)),catalog);
  assert.deepEqual(imported.structures,live.structures);
  assert.deepEqual(imported.dissectionProfiles,live.dissectionProfiles);
  assert.deepEqual(imported.regionalTours,live.regionalTours);
  assert.deepEqual(imported.contentTabs,live.contentTabs);
  assert.equal(catalog.structures.length,1104);assert.equal(live.contentTabs.length,9);
  assert.equal(portalTourEpoch.regionalTours.filter((tour:{id:string})=>tour.id!=='portal-hepatic-venous-relationships').length,47);
  assert.equal(portalTourEpoch.regionalTours.length,48);
  assert.equal(firstDelivery.regionalTours.filter((tour:{id:string})=>tour.id!=='portal-hepatic-venous-relationships').length,50);
  assert.equal(firstDelivery.regionalTours.length,51);
  assert.equal(live.regionalTours.filter((tour:{id:string})=>tour.id!=='portal-hepatic-venous-relationships').length,50);
  assert.equal(live.regionalTours.length,51);
  const active=slots.filter(row=>row[3]!=='ciliary-ganglion').map(row=>prefix+row[0]);
  assert.equal(active.length,12);
  let packets=0,storageCalls=0;
  const storage={prepare(){storageCalls++;throw Error('Rejected current decision reached storage');}};
  for(const id of active){
    const structure=catalog.structures.find((item:{id:string})=>item.id===id);
    assert(structure,id);
    for(const tab of live.contentTabs)
      assert.deepEqual(imported.bodyLesson(structure,tab),live.bodyLesson(structure,tab),`${id}:${tab}`);
    assert.deepEqual(live.bodyLesson(structure,'ct'),historical.bodyLesson(structure,'ct'),id);
    const actual=wire(await imported.bodyReviewMaterial(id));
    const current=wire(await live.bodyReviewMaterial(id));
    const prior=wire(await historical.bodyReviewMaterial(id));packets++;
    assert.deepEqual(actual,current,id);
    assert.equal(actual.approval,false);assert.equal(actual.status,'worksheet-not-submitted');
    assert.equal(actual.topics.length,9);
    for(const key of ['source','topics','reasoning','guidedTours','checklist','atlasLink','limits'])
      assert.deepEqual(actual[key],prior[key],`${id}:${key}`);
    assert.deepEqual(actual.topics.find((row:any)=>row.tab==='ct'),
      {tab:'ct',...live.bodyLesson(structure,'ct')});
    assert.deepEqual(await imported.parseBodyReviewResponse(actual,id),actual);
    for(const edit of [(bad:any)=>{bad.topics.find((row:any)=>row.tab==='ct').body+=' forged';},
      (bad:any)=>{bad.topics.find((row:any)=>row.tab==='ct').bullets[0]+=' forged';},
      (bad:any)=>{bad.topics.find((row:any)=>row.tab==='ct').citations[0]='https://forged.example';},
      (bad:any)=>{bad.topics.find((row:any)=>row.tab==='ct').readiness='approved';},
      (bad:any)=>{bad.source.structure.sources[0].sha256='0'.repeat(64);}]){
      const forged=wire(actual);edit(forged);
      assert.equal(await imported.parseBodyReviewResponse(forged,id),null);
    }
    const context=await imported.bodyReviewContext(id),liveContext=await live.bodyReviewContext(id);
    const historicalContext=await historical.bodyReviewContext(id);
    assert.deepEqual(context,liveContext,id);
    assert.equal(context.sourceHash,historicalContext.sourceHash);
    assert.equal(context.revisions.imaging,null);
    assert(context.teachingTabs.includes('ct'));
    assert.equal(context.materialHash,historicalContext.materialHash);
    assert.equal(context.revisions.teaching,historicalContext.revisions.teaching);
    const decision={catalogScope:context.catalogScope,structureId:id,track:'teaching',expectedVersion:0,
      materialHash:context.materialHash,revisionHash:context.revisions.teaching,
      checklistVersion:context.checklistVersion,draft:imported.blankBodyReview(context,'teaching')};
    const save=(input:any)=>imported.postBodyDecision(new Request('https://review.test/api/body-decisions',{
      method:'POST',headers:{origin:'https://review.test','content-type':'application/json',
        'oai-authenticated-user-id':'synthetic-orbital-apex-reviewer'},body:JSON.stringify(input),
    }),storage);
    for(const patch of [{materialHash:'0'.repeat(64)},
      {revisionHash:'0'.repeat(64)}])
      assert.equal((await save({...decision,...patch})).status,409,`${id}: stale before storage`);
    const forged=wire(decision);forged.draft.checks.foreign=true;
    assert.equal((await save(forged)).status,422);
    const approval=wire(decision);approval.draft.status='approved';
    assert.equal((await save(approval)).status,422);
  }
  assert.deepEqual({packets,storageCalls},{packets:12,storageCalls:0});
});
