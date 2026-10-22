import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync,readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import test from 'node:test';
import {build} from 'esbuild';
import {emittedTeaching} from './atlas-emitted-teaching.ts';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';

const atlasBaseline='bad2f98dfb7813f402ddfcf23bf8552d0655dbb2';
const atlas='F:/VisibleMedicine/atlas';
const pinsPath='content/cardiac-venous-tour-pins.json';
const teachingPaths=['content/cardiac-venous-ultrasound.ts','lib/cardiac-venous-ultrasound.ts'];
const paths=[pinsPath,...teachingPaths];
const groups={'great-cardiac-vein':'FMA4707','middle-cardiac-vein':'FMA4713'} as const;
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const entries=()=>json('atlas-review/'+pinsPath).entries
  .filter((identity:any)=>Object.hasOwn(groups,identity.id.split(':').at(-1)))
  .map((identity:any)=>({identity,group:identity.id.split(':').at(-1)}));
const sha=(bytes:Uint8Array|string)=>createHash('sha256').update(bytes).digest('hex');
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));
const norm=(bytes:Uint8Array)=>Buffer.from(bytes).toString('utf8').replaceAll('\r\n','\n');
const visible=(code:string,value:string)=>code.includes(value)||code.includes(JSON.stringify(value).slice(1,-1));
const git=(args:string[])=>execFileSync('git',args,{cwd:atlas,windowsHide:true,maxBuffer:32e6,
  env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
const committed=(revision:string,path:string)=>git(['show',`${revision}:${path}`]);
async function history(revision:string){
  const api=await import(pathToFileURL(atlas+'/scripts/exact-source-history-api.mjs').href);
  return api.exactSourceHistoryApi(revision,'review-security');
}
async function closure(){
  const built=await build({stdin:{contents:[
    "export {bodyLesson} from './atlas-review/app/body-content';",
    "export {cardiacVenousUltrasoundLesson} from './atlas-review/lib/cardiac-venous-ultrasound';",
    "export {cardiacVenousUltrasoundTopics} from './atlas-review/content/cardiac-venous-ultrasound';",
    "export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';",
    "export {contentTabs} from './atlas-review/lib/content-types';",
    "export * from './atlas-review/lib/body-review-material';",
    "export {guidedPlaybackEvidence} from './atlas-review/lib/guided-playback';",
    "export * from './atlas-review/lib/body-review-context';",
    "export * from './atlas-review/lib/body-review-response';",
    "export * from './atlas-review/lib/body-review-api';",
    "export * from './atlas-review/lib/body-review-decisions';",
  ].join('\n'),resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,
    platform:'node',format:'esm'});
  return import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
}

test('two exact cardiac venous Ultrasound drafts reach body learner and protected Review',async()=>{
  const review=json('atlas-review/manifest.json'),revision=review.revision;
  const deliveryPin=validateCurrentAtlasDelivery();
  assert.equal(revision,deliveryPin.source,'Review remains bound to current Atlas source');
  assert.match(revision,/^[a-f0-9]{40}$/);
  assert.notEqual(revision,atlasBaseline);
  const currentRoot=currentAtlasDeliveryRoot();
  assert.equal(execFileSync('git',['rev-parse','HEAD'],{cwd:currentRoot}).toString().trim(),revision);
  const learners=['head-neck','female-pelvis','lower-limb','shoulder'].map(name=>({name,
    base:`public/atlas-runtime/${name}/`,manifest:json(`public/atlas-runtime/${name}/manifest.json`)}));
  for(const {name,manifest} of learners){
    assert.equal(manifest.sourceCommit,deliveryPin.runtimeSources[name],name);
    assert.equal(manifest.patientDataIncluded,false,name);
    assert.equal(manifest.clinicalApproved,false,name);
  }
  const viewerBase='public/atlas-review-viewer/',viewer=json(viewerBase+'manifest.json');
  assert.equal(viewer.sourceCommit,revision);
  assert.equal(viewer.websiteIntegrationSha256,review.websiteIntegrationSha256);
  assert.equal(viewer.personalRecordsIncluded,false);
  // Thorax and Whole body are delivered by head-neck; independent workbenches
  // retain their pinned family source commits without requiring this teaching in their closure.
  const learner=learners.find(item=>item.name==='head-neck');assert(learner);
  const inputs=json(learner.base+'source-inputs.json');
  for(const path of paths){
    const source=execFileSync('git',['show',`${revision}:${path}`],{cwd:currentRoot,maxBuffer:32e6}),imported=readFileSync('atlas-review/'+path);
    const record=review.files.find((file:{path:string})=>file.path===path);
    assert(record,`Review missing ${path}`);
    assert.equal(record.sourceSha256,sha(source),path);
    assert.equal(record.importedSha256,sha(imported),path);
    assert.equal(norm(imported),norm(source),`${path}: imported source`);
    assert.equal(norm(readFileSync(`${currentRoot}/${path}`)),norm(source),`${path}: Atlas checkout`);
    assert.equal(inputs.find((file:{path:string})=>file.path===path)?.sha256,sha(source),`${path}: learner input`);
  }
  for(const path of teachingPaths)for(const base of ['public/atlas-review/',viewerBase,
    ...learners.map(item=>item.base)])assert.equal(existsSync(base+path),false,`${base+path}: raw source public`);
  const api=await closure(),targets=entries();
  assert.deepEqual(Object.keys(api.cardiacVenousUltrasoundTopics).sort(),Object.keys(groups).sort());
  assert.equal(targets.length,2);
  assert.equal(new Set(targets.map(({identity}:any)=>identity.id)).size,2);
  assert.deepEqual(new Map(targets.map(({identity,group}:any)=>[group,identity.fmaId])),new Map(Object.entries(groups)));
  const catalog=api.bodyDisplayCatalog(json('atlas-review/public/models/bodyparts3d/full-body/catalog.json'));
  const scope=learner.manifest.regionalScopes.find((item:{region:string})=>item.region==='thorax');assert(scope);
  const emitted=[emittedTeaching(learner.base,learner.manifest.files,true),emittedTeaching(viewerBase,viewer.files,true)];
  for(const {identity,group} of targets){
    const id=identity.id,topic=api.cardiacVenousUltrasoundTopics[group];
    assert.equal(id,`vm:anatomy:body:thorax:unspecified:vessel:${group}`);
    assert.equal(identity.nodeName,identity.fmaId);
    assert.equal(identity.region,'thorax');assert.equal(identity.laterality,'unspecified');
    assert.equal(identity.system,'vessels');assert.equal(identity.category,'vessel');
    assert.equal(identity.validation.anatomicalReview,false);
    assert.deepEqual(catalog.structures.find((item:{id:string})=>item.id===id),identity);
    assert(scope.regionalIds.includes(id),`${id}: thorax learner scope`);
    const lesson=api.cardiacVenousUltrasoundLesson(identity,'ultrasound');
    assert.deepEqual(api.bodyLesson(identity,'ultrasound'),lesson);
    assert.equal(lesson.readiness,'draft');
    assert.equal(lesson.title,`${identity.name} · ${topic.title} · draft`);
    assert.equal(lesson.body,topic.body);
    assert.deepEqual(lesson.bullets.slice(0,topic.bullets.length),[...topic.bullets]);
    assert.deepEqual(lesson.citations,[...topic.citations]);
    assert(lesson.citations.includes(group==='great-cardiac-vein'
      ?'https://pubmed.ncbi.nlm.nih.gov/11875389/':'https://pubmed.ncbi.nlm.nih.gov/26009286/'));
    for(const citation of lesson.citations)assert.match(citation,/^https:\/\//);
    const prose=[lesson.body,...lesson.bullets,lesson.note].join(' ');
    if(group==='great-cardiac-vein'){
      assert.match(prose,/21 of 23 human volunteers/);
      assert.match(prose,/transthoracic Doppler/i);
      assert.match(prose,/experimentally in open.chest dogs/i);
      assert.match(prose,/separate from the human/i);
      assert.match(prose,/does not specify the human acquisition plane/i);
      assert.match(prose,/does not guarantee visibility on a routine/i);
      assert.match(prose,/No transducer[^.]*diagnostic threshold/i);
    }else{
      assert.match(prose,/modified bicaval transesophageal/i);
      assert.match(prose,/70 cardiac surgical patients, not a healthy.volunteer/i);
      assert.match(prose,/not middle cardiac vein detection rates/i);
      assert.match(prose,/not depiction of the entire venous course/i);
      assert.match(prose,/14 source components, not 14 individually named veins/i);
      assert.match(prose,/No catheter.placement instructions/i);
    }
    assert.match(lesson.note,/revision-bound radiologist review pending/);
    assert.match(lesson.note,/No[^.]*clinical approval/);
    assert.match(lesson.note,/No[^.]*patient-space registration/);
    assert.match(lesson.note,/independent/);
    assert.match(prose,/no[^.]*blood-flow simulation/i);
    for(const code of emitted)for(const value of [lesson.body,...lesson.bullets,...lesson.citations,lesson.note])
      assert(visible(code,value),`${id}: emitted teaching missing ${value}`);
    for(const tab of api.contentTabs.filter((tab:string)=>tab!=='ultrasound'))
      assert.equal(api.cardiacVenousUltrasoundLesson(identity,tab),undefined,`${id}:${tab}`);
    for(const patch of [{id:id+'-forged'},{name:'Forged'},{fmaId:'FMA0'},
      {laterality:'right'},{sources:[{file:'FJ0',sha256:'0'.repeat(64)}]},
      {bounds:{...identity.bounds,min:[0,0,0]}},{coverageNote:'forged'},
      {validation:{...identity.validation,anatomicalReview:true}},{unexpected:true}])
      assert.equal(api.cardiacVenousUltrasoundLesson({...identity,...patch},'ultrasound'),undefined,
        `${id}: altered identity ${Object.keys(patch)[0]}`);
  }
});

test('exact admission epoch changes only two of 9,936 placements and 1,104 packets; live targets remain bound',async()=>{
  const imported=await closure(),previous=await history(atlasBaseline);
  const featureCommit=git(['log','--diff-filter=A','-1','--format=%H','--',teachingPaths[0]]).toString().trim();
  assert.match(featureCommit,/^[a-f0-9]{40}$/);
  const current=await history(featureCommit);
  const catalogPath='public/models/bodyparts3d/full-body/catalog.json';
  const catalog=current.bodyDisplayCatalog(JSON.parse(committed(featureCommit,catalogPath).toString()));
  assert.deepEqual(catalog,previous.bodyDisplayCatalog(JSON.parse(committed(atlasBaseline,catalogPath).toString())));
  assert.deepEqual(imported.bodyDisplayCatalog(json('atlas-review/'+catalogPath)),catalog);
  assert.deepEqual(json('atlas-review/'+pinsPath),JSON.parse(committed(atlasBaseline,pinsPath).toString()));
  assert.deepEqual(current.regionalTours,previous.regionalTours);
  assert.equal(catalog.structures.length,1104);assert.equal(current.contentTabs.length,9);
  const targets=new Set(entries().map(({identity}:any)=>identity.id));
  for(const id of targets){
    const structure=catalog.structures.find((item:any)=>item.id===id);assert(structure);
    for(const tab of current.contentTabs)
      assert.deepEqual(imported.bodyLesson(structure,tab),current.bodyLesson(structure,tab),`${id}:${tab}: live imported`);
    const live=wire(await imported.bodyReviewMaterial(id)),feature=wire(await current.bodyReviewMaterial(id));
    assert.equal(live.guidedTours.length,feature.guidedTours.length);
    for(const [index,tour] of live.guidedTours.entries()){
      assert.deepEqual(tour.continuousPlayback,imported.guidedPlaybackEvidence(tour.tour.steps),`${id}: exact current playback`);
      const saved=feature.guidedTours[index];
      assert.equal(tour.tour.id,saved.tour.id);
    }
    assert.notEqual(live.fingerprints.teaching,feature.fingerprints.teaching);
    assert.notEqual(live.materialHash,feature.materialHash);
    const comparable=wire(live);
    for(const tour of comparable.guidedTours)delete tour.continuousPlayback;
    comparable.fingerprints.teaching=feature.fingerprints.teaching;
    comparable.materialHash=feature.materialHash;
    assert.deepEqual(comparable,feature,`${id}: only playback and bound hashes differ`);
    assert.deepEqual(await imported.parseBodyReviewResponse(live,id),live,`${id}: live packet accepted`);
    assert.equal(await imported.parseBodyReviewResponse(feature,id),null,`${id}: feature packet is stale`);
  }
  let placements=0,changed=0,packets=0,changedPackets=0,storageCalls=0;
  const storage={prepare(){storageCalls++;throw Error('Rejected request reached private storage');}};
  for(const structure of catalog.structures){
    const target=targets.has(structure.id);
    for(const tab of current.contentTabs){
      const before=previous.bodyLesson(structure,tab),after=current.bodyLesson(structure,tab);placements++;
      if(!target||tab!=='ultrasound'){assert.deepEqual(after,before,`${structure.id}:${tab}`);continue;}
      changed++;assert.equal(before.readiness,'pending');assert.equal(after.readiness,'draft');
      assert.deepEqual(after,imported.cardiacVenousUltrasoundLesson(structure,tab));
    }
    const before=wire(await previous.bodyReviewMaterial(structure.id));
    const after=wire(await current.bodyReviewMaterial(structure.id));packets++;
    assert.equal(after.approval,false);assert.equal(after.status,'worksheet-not-submitted');
    if(!target){assert.deepEqual(after,before,`${structure.id}: preserved packet`);continue;}
    changedPackets++;
    for(const key of ['source','reasoning','guidedTours','checklist','atlasLink','limits'])assert.deepEqual(after[key],before[key]);
    assert.deepEqual(after.topics.filter((row:any)=>row.tab!=='ultrasound'),before.topics.filter((row:any)=>row.tab!=='ultrasound'));
    assert.deepEqual(after.topics.find((row:any)=>row.tab==='ultrasound'),{tab:'ultrasound',...current.bodyLesson(structure,'ultrasound')});
    assert.equal(after.fingerprints.source,before.fingerprints.source);
    assert.notEqual(after.fingerprints.teaching,before.fingerprints.teaching);
    assert.notEqual(after.materialHash,before.materialHash);
    assert.deepEqual(await current.parseBodyReviewResponse(after,structure.id),after);
    assert.equal(await current.parseBodyReviewResponse(before,structure.id),null);
    const context=await imported.bodyReviewContext(structure.id),oldContext=await previous.bodyReviewContext(structure.id);
    assert.equal(context.sourceHash,oldContext.sourceHash);
    assert.notEqual(context.revisions.teaching,oldContext.revisions.teaching);
    assert.equal(context.revisions.imaging,null);assert(context.teachingTabs.includes('ultrasound'));
    assert.equal(imported.bodyReviewStale({catalogScope:context.catalogScope,structureId:structure.id,
      checklistVersion:context.checklistVersion,revisionHash:oldContext.revisions.teaching,track:'teaching'},context),true);
    for(const mutate of [
      (bad:any)=>{bad.topics.find((row:any)=>row.tab==='ultrasound').body+=' forged';},
      (bad:any)=>{bad.topics.find((row:any)=>row.tab==='ultrasound').citations[0]='https://forged.example';},
      (bad:any)=>{bad.source.structure.sources[0].sha256='0'.repeat(64);},
    ]){const forged=wire(after);mutate(forged);assert.equal(await imported.parseBodyReviewResponse(forged,structure.id),null);}
    const decision={catalogScope:context.catalogScope,structureId:structure.id,track:'teaching',expectedVersion:0,
      materialHash:context.materialHash,revisionHash:context.revisions.teaching,checklistVersion:context.checklistVersion,
      draft:imported.blankBodyReview(context,'teaching')};
    const save=(input:any)=>imported.postBodyDecision(new Request('https://review.test/api/body-decisions',{
      method:'POST',headers:{origin:'https://review.test','content-type':'application/json',
        'oai-authenticated-user-id':'synthetic-cardiac-venous-reviewer'},body:JSON.stringify(input),
    }),storage);
    for(const patch of [{materialHash:before.materialHash},{revisionHash:oldContext.revisions.teaching},
      {materialHash:before.materialHash,revisionHash:oldContext.revisions.teaching}])
      assert.equal((await save({...decision,...patch})).status,409,`${structure.id}: stale before storage`);
    const forged=wire(decision);forged.draft.checks.foreign=true;
    assert.equal((await save(forged)).status,422,`${structure.id}: malformed before storage`);
    const approval=wire(decision);approval.draft.status='approved';
    assert.equal((await save(approval)).status,422,`${structure.id}: unreviewed approval before storage`);
  }
  assert.deepEqual({placements,changed,packets,changedPackets,storageCalls},
    {placements:9936,changed:2,packets:1104,changedPackets:2,storageCalls:0});
});


test('current cardiac venous delivery binds exact clean Atlas source',()=>{
 const sourceRoot=currentAtlasDeliveryRoot();
 const review=json('atlas-review/manifest.json');assert.equal(review.revision,CURRENT_ATLAS_REVISION);
 for(const path of paths){
  const entry=review.files.find((file:any)=>file.path===path);assert(entry,path);
  assert.equal(entry.sourceSha256,sha(execFileSync('git',['show',`${CURRENT_ATLAS_REVISION}:${path}`],{cwd:sourceRoot,maxBuffer:32e6})),path+': current source');
  assert.equal(entry.importedSha256,sha(readFileSync('atlas-review/'+path)),path+': current import');
 }
});
