import {boundLiveAtlasHistory} from './atlas-bound-live-history.mjs';
import {emittedTeaching} from './atlas-emitted-teaching.ts';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync,readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import test from 'node:test';
import {build} from 'esbuild';
import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';

const atlas='F:/VisibleMedicine/atlas';
const baseline='c3593e6664e8572d882bd19d4525dea0f3d00d17';
const catalogPath='public/models/bodyparts3d/full-body/catalog.json';
const pinPaths=['content/thoracic-small-vessel-mri-pins.json',
  'content/thoracic-branch-imaging-pins.json','content/systemic-venous-pins.json'];
const teachingPaths=['content/thoracic-mediastinal-ultrasound.ts',
  'content/thoracic-cardiac-chestwall-ultrasound.ts','lib/thoracic-detail-ultrasound.ts'];
const targets=[
  ['small','midline:vessel:esophageal-artery','FMA4149','thorax-vessels-thoracic-detail','FJ1934'],
  ['small','midline:vessel:variant-bronchial-artery','FMA10704','thorax-vessels-thoracic-detail','FJ3418'],
  ['small','midline:vessel:bronchial-artery','FMA68109','thorax-vessels-thoracic-detail','FJ1933'],
  ['small','midline:vessel:set-of-oesophageal-branches-of-thoracic-aorta','FMA71537','thorax-vessels-thoracic-detail','FJ3431'],
  ['small','unspecified:vessel:anterior-cardiac-vein','FMA76767','anterior-cardiac-vein','FJ2725','FJ2730'],
  ['branch','right:vessel:right-musculophrenic-artery','FMA10692','thorax-vessels-inventory','FJ1969'],
  ['branch','left:vessel:left-musculophrenic-artery','FMA4077','thorax-vessels-inventory','FJ1979'],
  ['branch','right:vessel:right-musculophrenic-vein','FMA4772','thorax-vessels-inventory','FJ1996'],
  ['branch','left:vessel:left-musculophrenic-vein','FMA4786','thorax-vessels-inventory','FJ1988'],
  ['venous','midline:vessel:hemiazygos-vein','FMA4944','thorax-vessels-recovery','FJ3434'],
] as const;
const expected=new Map(targets.map(([pin,suffix,fma,bundle,...files])=>[
  'vm:anatomy:body:thorax:'+suffix,{pin,fma,bundle,files,side:suffix.split(':')[0],slug:suffix.split(':')[2]},
]));
const mediastinal=new Set(['bronchial-artery','variant-bronchial-artery','esophageal-artery',
  'set-of-oesophageal-branches-of-thoracic-aorta','hemiazygos-vein']);
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const runtimeSources=validateCurrentAtlasDelivery().runtimeSources;
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));
const sha=(bytes:Uint8Array|string)=>createHash('sha256').update(bytes).digest('hex');
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
    "export {thoracicDetailUltrasoundLesson} from './atlas-review/lib/thoracic-detail-ultrasound';",
    "export {thoracicMediastinalUltrasoundTopics} from './atlas-review/content/thoracic-mediastinal-ultrasound';",
    "export {thoracicCardiacChestwallUltrasoundTopics} from './atlas-review/content/thoracic-cardiac-chestwall-ultrasound';",
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
function identities(){
  const [small,branch,venous]=pinPaths.map(path=>json('atlas-review/'+path));
  const rows={small:small.entries.map((entry:any)=>entry.identity),
    branch:branch.entries.map((entry:any)=>entry.identity),venous:venous.entries};
  return targets.map(([pin,suffix])=>{
    const id='vm:anatomy:body:thorax:'+suffix;
    const matches=rows[pin].filter((identity:any)=>identity.id===id);
    assert.equal(matches.length,1,id);
    return matches[0];
  });
}

test('ten exact thoracic Ultrasound drafts reach learner and protected Review',async()=>{
  const manifest=json('atlas-review/manifest.json'),revision=manifest.revision;
  assert.match(revision,/^[a-f0-9]{40}$/);assert.notEqual(revision,baseline);
  assert.equal(git(['rev-parse','HEAD']).toString().trim(),revision);
  const viewerBase='public/atlas-review-viewer/',viewer=json(viewerBase+'manifest.json');
  assert.equal(viewer.sourceCommit,revision);
  assert.equal(viewer.websiteIntegrationSha256,manifest.websiteIntegrationSha256);
  assert.equal(viewer.personalRecordsIncluded,false);
  const learners=['head-neck','female-pelvis','lower-limb','shoulder'].map(name=>({name,
    base:`public/atlas-runtime/${name}/`,manifest:json(`public/atlas-runtime/${name}/manifest.json`)}));
  for(const {name,manifest:built} of learners){
    assert.equal(built.sourceCommit,runtimeSources[name],name);
    assert.equal(built.patientDataIncluded,false,name);
    assert.equal(built.clinicalApproved,false,name);
  }
  const head=learners[0],inputs=json(head.base+'source-inputs.json');
  for(const path of [...pinPaths,...teachingPaths]){
    const source=committed(revision,path),imported=readFileSync('atlas-review/'+path);
    const record=manifest.files.find((file:{path:string})=>file.path===path);assert(record,path);
    assert.equal(record.sourceSha256,sha(source),path);
    assert.equal(record.importedSha256,sha(imported),path);
    assert.equal(norm(imported),norm(source),`${path}: imported source`);
    assert.equal(norm(readFileSync(`${atlas}/${path}`)),norm(source),`${path}: Atlas checkout`);
    assert.equal(inputs.find((file:{path:string})=>file.path===path)?.sha256,sha(source),`${path}: learner input`);
    for(const base of ['public/atlas-review/',viewerBase,...learners.map(item=>item.base)])
      assert.equal(existsSync(base+path),false,`${base+path}: raw source public`);
  }
  const api=await closure(),catalog=api.bodyDisplayCatalog(json('atlas-review/'+catalogPath));
  const rows=identities();assert.equal(rows.length,10);
  assert.equal(new Set(rows.map((identity:any)=>identity.id)).size,10);
  const topics={...api.thoracicMediastinalUltrasoundTopics,...api.thoracicCardiacChestwallUltrasoundTopics};
  assert.equal(Object.keys(topics).length,10);
  const scope=head.manifest.regionalScopes.find((item:{region:string})=>item.region==='thorax');assert(scope);
  const emitted=[emittedTeaching(head.base,head.manifest.files,true),emittedTeaching(viewerBase,viewer.files,true)];
  for(const identity of rows){
    const id=identity.id,binding=expected.get(id)!;
    assert.equal(identity.fmaId,binding.fma);assert.equal(identity.nodeName,binding.fma);
    assert.equal(identity.region,'thorax');assert.equal(identity.laterality,binding.side);
    assert.equal(identity.category,'vessel');assert.equal(identity.system,'vessels');
    assert.equal(identity.bundle,binding.bundle);
    assert.deepEqual(identity.sources.map((source:{file:string})=>source.file),binding.files);
    assert.equal(identity.validation.status,'unvalidated');
    assert.equal(identity.validation.anatomicalReview,false);
    assert.deepEqual(catalog.structures.find((item:{id:string})=>item.id===id),identity);
    assert(scope.regionalIds.includes(id),`${id}: thorax learner scope`);
    const topic=topics[binding.slug];assert(topic,id);
    assert.equal(mediastinal.has(binding.slug),Object.hasOwn(api.thoracicMediastinalUltrasoundTopics,binding.slug));
    const lesson=api.thoracicDetailUltrasoundLesson(identity,'ultrasound');
    assert.deepEqual(api.bodyLesson(identity,'ultrasound'),lesson);
    assert.equal(lesson.readiness,'draft');
    assert.equal(lesson.title,`${identity.name} · ${topic.title} · draft`);
    assert.equal(lesson.body,topic.body);
    assert.deepEqual(lesson.bullets.slice(0,topic.bullets.length),[...topic.bullets]);
    assert.deepEqual(lesson.citations,[...topic.citations]);
    assert(lesson.bullets.length>=4&&lesson.bullets.every((bullet:string)=>bullet.trim()));
    assert(lesson.citations.length>=2&&lesson.citations.every((url:string)=>/^https:\/\//.test(url)));
    assert.match(lesson.note,/radiologist review pending/i);
    for(const code of emitted)
      for(const value of [identity.name,lesson.title,lesson.body,...lesson.bullets,...lesson.citations,lesson.note])
        assert(visible(code,value),`${id}: emitted teaching missing ${value}`);
    for(const tab of api.contentTabs.filter((tab:string)=>tab!=='ultrasound'))
      assert.equal(api.thoracicDetailUltrasoundLesson(identity,tab),undefined,`${id}:${tab}`);
    for(const mutation of [
      (bad:any)=>{bad.fmaId='FMA0';},
      (bad:any)=>{bad.laterality=bad.laterality==='midline'?'left':'midline';},
      (bad:any)=>{bad.bundle='forged-bundle';},
      (bad:any)=>{bad.sources[0].file='FORGED';},
    ]){const bad=wire(identity);mutation(bad);
      assert.equal(api.thoracicDetailUltrasoundLesson(bad,'ultrasound'),undefined,`${id}: forged source`);}
  }
  for(const structure of catalog.structures)if(!expected.has(structure.id))
    assert.equal(api.thoracicDetailUltrasoundLesson(structure,'ultrasound'),undefined,
      `${structure.id}: unrelated identity`);
});

test('historical admission changes ten Ultrasound placements and Review packets; stale and forged material is refused before storage',async()=>{
  const manifest=json('atlas-review/manifest.json'),revision=manifest.revision;
  const imported=await closure(),live=await boundLiveAtlasHistory(revision),previous=await history(baseline);
  const featureCommit=git(['log','--diff-filter=A','-1','--format=%H','--',
    'content/thoracic-mediastinal-ultrasound.ts']).toString().trim();
  assert.match(featureCommit,/^[a-f0-9]{40}$/);
  const feature=await history(featureCommit);
  const catalog=feature.bodyDisplayCatalog(JSON.parse(committed(featureCommit,catalogPath).toString()));
  assert.deepEqual(catalog,previous.bodyDisplayCatalog(JSON.parse(committed(baseline,catalogPath).toString())));
  assert.deepEqual(imported.bodyDisplayCatalog(json('atlas-review/'+catalogPath)),catalog);
  for(const path of pinPaths){
    assert.deepEqual(committed(featureCommit,path),committed(baseline,path),`${path}: unchanged pin`);
    assert.equal(norm(readFileSync(`${atlas}/${path}`)),norm(committed(baseline,path)),`${path}: current pin`);
  }
  for(const path of ['app/anatomy-data.ts','app/dissection-data.ts','lib/regional-tours.ts'])
    assert.deepEqual(committed(featureCommit,path),committed(baseline,path),`${path}: source/guide`);
  assert.deepEqual(feature.structures,previous.structures);
  assert.deepEqual(feature.dissectionProfiles,previous.dissectionProfiles);
  assert.deepEqual(feature.regionalTours,previous.regionalTours);
  assert.deepEqual(feature.contentTabs,previous.contentTabs);
  assert.deepEqual(imported.structures,live.structures);
  assert.deepEqual(imported.dissectionProfiles,live.dissectionProfiles);
  assert.deepEqual(imported.regionalTours,live.regionalTours);
  for(const bundle of catalog.bundles){
    const path='public'+bundle.url.split('?')[0],source=committed(featureCommit,path);
    assert.equal(sha(source),bundle.sha256,path);
    assert.deepEqual(source,committed(baseline,path),`${path}: retained mesh`);
    assert.deepEqual(readFileSync(`${atlas}/${path}`),source,`${path}: current mesh`);
  }
  assert.equal(catalog.structures.length,1104);assert.equal(feature.contentTabs.length,9);
  let placements=0,changed=0,packets=0,changedPackets=0,storageCalls=0;
  const storage={prepare(){storageCalls++;throw Error('Rejected decision reached storage');}};
  for(const structure of catalog.structures){
    const target=expected.has(structure.id);
    for(const tab of feature.contentTabs){
      const before=previous.bodyLesson(structure,tab),after=feature.bodyLesson(structure,tab);placements++;
      if(!target||tab!=='ultrasound'){assert.deepEqual(after,before,`${structure.id}:${tab}`);continue;}
      changed++;assert.equal(before.readiness,'pending');assert.equal(after.readiness,'draft');
      assert.deepEqual(imported.bodyLesson(structure,tab),live.bodyLesson(structure,tab));
      assert.deepEqual(imported.bodyLesson(structure,tab),after);
    }
    const before=wire(await previous.bodyReviewMaterial(structure.id));
    const after=wire(await feature.bodyReviewMaterial(structure.id));packets++;
    assert.equal(after.approval,false);assert.equal(after.status,'worksheet-not-submitted');
    if(!target){assert.deepEqual(after,before,`${structure.id}: preserved packet`);continue;}
    changedPackets++;
    for(const key of ['source','reasoning','guidedTours','checklist','atlasLink','limits'])
      assert.deepEqual(after[key],before[key],`${structure.id}:${key}`);
    assert.deepEqual(after.topics.filter((row:any)=>row.tab!=='ultrasound'),
      before.topics.filter((row:any)=>row.tab!=='ultrasound'));
    assert.deepEqual(after.topics.find((row:any)=>row.tab==='ultrasound'),
      {tab:'ultrasound',...feature.bodyLesson(structure,'ultrasound')});
    assert.equal(after.fingerprints.source,before.fingerprints.source);
    assert.notEqual(after.fingerprints.teaching,before.fingerprints.teaching);
    assert.notEqual(after.materialHash,before.materialHash);
    assert.deepEqual(await feature.parseBodyReviewResponse(after,structure.id),after);
    assert.equal(await feature.parseBodyReviewResponse(before,structure.id),null);
    const previousContext=await previous.bodyReviewContext(structure.id);
    const featureContext=await feature.bodyReviewContext(structure.id);
    assert.equal(featureContext.sourceHash,previousContext.sourceHash);
    assert.notEqual(featureContext.revisions.teaching,previousContext.revisions.teaching);
    const livePacket=wire(await live.bodyReviewMaterial(structure.id));
    assert.deepEqual(wire(await imported.bodyReviewMaterial(structure.id)),livePacket);
    assert.deepEqual(await imported.parseBodyReviewResponse(livePacket,structure.id),livePacket);
    assert.equal(await imported.parseBodyReviewResponse(before,structure.id),null);
    const context=await imported.bodyReviewContext(structure.id);
    assert.deepEqual(context,await live.bodyReviewContext(structure.id));
    assert.equal(context.sourceHash,previousContext.sourceHash);
    assert.equal(context.revisions.imaging,null);assert(context.teachingTabs.includes('ultrasound'));
    for(const edit of [
      (bad:any)=>{bad.topics.find((row:any)=>row.tab==='ultrasound').body+=' forged';},
      (bad:any)=>{bad.topics.find((row:any)=>row.tab==='ultrasound').bullets[0]+=' forged';},
      (bad:any)=>{bad.topics.find((row:any)=>row.tab==='ultrasound').citations[0]='https://forged.example';},
      (bad:any)=>{bad.topics.find((row:any)=>row.tab==='ultrasound').readiness='approved';},
      (bad:any)=>{bad.topics.splice(bad.topics.findIndex((row:any)=>row.tab==='ultrasound'),1);},
      (bad:any)=>{bad.source.structure.sources[0].sha256='0'.repeat(64);},
    ]){const forged=wire(livePacket);edit(forged);
      assert.equal(await imported.parseBodyReviewResponse(forged,structure.id),null);}
    const decision={catalogScope:context.catalogScope,structureId:structure.id,track:'teaching',expectedVersion:0,
      materialHash:context.materialHash,revisionHash:context.revisions.teaching,checklistVersion:context.checklistVersion,
      draft:imported.blankBodyReview(context,'teaching')};
    const save=(input:any)=>imported.postBodyDecision(new Request('https://review.test/api/body-decisions',{
      method:'POST',headers:{origin:'https://review.test','content-type':'application/json',
        'oai-authenticated-user-id':'synthetic-thoracic-ultrasound-reviewer'},body:JSON.stringify(input),
    }),storage);
    for(const patch of [{materialHash:before.materialHash},{revisionHash:previousContext.revisions.teaching},
      {materialHash:before.materialHash,revisionHash:previousContext.revisions.teaching}])
      assert.equal((await save({...decision,...patch})).status,409,`${structure.id}: stale before storage`);
    const forged=wire(decision);forged.draft.checks.foreign=true;
    assert.equal((await save(forged)).status,422,`${structure.id}: malformed before storage`);
    const approval=wire(decision);approval.draft.status='approved';
    assert.equal((await save(approval)).status,422,`${structure.id}: unreviewed approval before storage`);
  }
  assert.deepEqual({placements,changed,packets,changedPackets,storageCalls},
    {placements:9936,changed:10,packets:1104,changedPackets:10,storageCalls:0});
  assert.equal(placements-changed,9926);assert.equal(packets-changedPackets,1094);
});
