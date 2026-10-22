import {boundLiveAtlasHistory} from './atlas-bound-live-history.mjs';
import {emittedTeaching} from './atlas-emitted-teaching.ts';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync,readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import test from 'node:test';
import {build} from 'esbuild';
import {currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';

const atlas=currentAtlasDeliveryRoot();
const currentPin=validateCurrentAtlasDelivery();
const baseline='9e229803af93cdb12c711ba738771ce92ee51191';
const catalogPath='public/models/bodyparts3d/full-body/catalog.json';
const pinPaths=['content/abdominal-branch-imaging-pins.json','content/abdominal-connective-quiz-pins.json'];
const teachingPaths=[
  'content/gastric-venous-xray.ts','lib/gastric-venous-xray.ts',
  'content/abdominal-detail-vascular-xray.ts','content/abdominal-detail-connective-xray.ts',
  'lib/abdominal-detail-xray.ts',
];
// Exact identities are taken from the two Atlas source regression suites. The
// paired side/FMA/file checks below prevent a slug alone from binding a draft.
const targets=[
  ['left:vessel:left-gastric-vein','FMA15399','portal-veins','FJ3500'],
  ['right:vessel:right-gastric-vein','FMA15400','portal-veins','FJ3595'],
  ['left:vessel:left-gastroepiploic-vein','FMA15390','portal-veins','FJ3502'],
  ['right:vessel:right-gastroepiploic-vein','FMA15397','portal-veins','FJ3597'],
  ['unspecified:vessel:appendicular-artery','FMA14818','abdomen-vessels-mesenteric','FJ3410'],
  ['unspecified:vessel:ascending-branch-of-inferior-branch-of-ileocolic-artery','FMA14820','abdomen-vessels-mesenteric','FJ3414'],
  ['unspecified:vessel:ileal-vein','FMA15405','abdomen-vessels-mesenteric','FJ3438'],
  ['left:vessel:left-inferior-epigastric-artery','FMA20689','inferior-epigastric-vessels','FJ3511'],
  ['left:vessel:left-inferior-epigastric-vein','FMA21164','inferior-epigastric-vessels','FJ3512'],
  ['midline:vessel:middle-colic-vein','FMA15406','abdomen-vessels-mesenteric','FJ3543'],
  ['unspecified:vessel:pancreaticoduodenal-vein','FMA15398','abdomen-vessels-visceral-detail','FJ3545','FJ3646','FJ3655'],
  ['right:vessel:right-colic-vein','FMA15407','abdomen-vessels-mesenteric','FJ3591'],
  ['right:vessel:right-inferior-epigastric-artery','FMA20688','inferior-epigastric-vessels','FJ3604'],
  ['right:vessel:right-inferior-epigastric-vein','FMA21163','inferior-epigastric-vessels','FJ3605'],
  ['left:vessel:tributary-of-left-hepatic-vein','FMA15794','hepatic-veins','FJ3097','FJ3098','FJ3099','FJ3100','FJ3101'],
  ['right:vessel:tributary-of-right-hepatic-vein','FMA15791','hepatic-veins','FJ3118','FJ3119','FJ3120','FJ3121'],
  ['midline:fascia:linea-alba','FMA11336','abdomen-connective-axial-detail','FJ1448'],
  ['midline:membrane:mesentery-of-small-intestine','FMA14643','abdomen-connective-mesenteric','FJ3396'],
  ['unspecified:membrane:mesoappendix','FMA16549','abdomen-connective-mesenteric','FJ3397'],
  ['midline:membrane:transverse-mesocolon','FMA14647','abdomen-connective-mesenteric','FJ3398'],
] as const;
const expected=new Map(targets.map(([suffix,fma,bundle,...files])=>[
  'vm:anatomy:body:abdomen:'+suffix,{fma,bundle,files,side:suffix.split(':')[0],category:suffix.split(':')[1]},
]));
const gastricIds=new Set(targets.slice(0,4).map(([suffix])=>'vm:anatomy:body:abdomen:'+suffix));
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
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
    "export {bodyLesson,bodyContent} from './atlas-review/app/body-content';",
    "export {gastricVenousXrayLesson} from './atlas-review/lib/gastric-venous-xray';",
    "export {abdominalDetailXrayLesson} from './atlas-review/lib/abdominal-detail-xray';",
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

test('twenty source-bound abdominal X-ray drafts reach learner and bound Review',async()=>{
  const manifest=json('atlas-review/manifest.json'),revision=manifest.revision;
  assert.match(revision,/^[a-f0-9]{40}$/);assert.notEqual(revision,baseline);
  assert.equal(revision,currentPin.source);
  assert.equal(git(['rev-parse','HEAD']).toString().trim(),revision);
  const viewerBase='public/atlas-review-viewer/',viewer=json(viewerBase+'manifest.json');
  assert.equal(viewer.sourceCommit,revision);
  assert.equal(viewer.websiteIntegrationSha256,manifest.websiteIntegrationSha256);
  assert.equal(viewer.personalRecordsIncluded,false);
  const learners=['head-neck','female-pelvis','lower-limb','shoulder'].map(name=>({name,
    base:`public/atlas-runtime/${name}/`,manifest:json(`public/atlas-runtime/${name}/manifest.json`)}));
  const inventory=json('lib/atlas-model-inventory.json');
  for(const {name,base,manifest:built} of learners){
    const runtimeSource=currentPin.runtimeSources[name];
    assert.equal(built.sourceCommit,runtimeSource,name);
    const inventorySource=inventory.sources.find((row:{module:string})=>row.module===name);assert(inventorySource,name);
    assert.equal(inventorySource.sourceCommit,runtimeSource,`${name}: inventory source`);
    assert.equal(inventorySource.manifestSha256,sha(readFileSync(base+'manifest.json')),`${name}: inventory manifest`);
    const familyInputs=json(base+'source-inputs.json');
    for(const input of familyInputs.filter((row:{path:string})=>
      ['app/body-content.ts',...pinPaths,...teachingPaths].includes(row.path)))
      assert.equal(input.sha256,sha(committed(runtimeSource,input.path)),`${name}: family input ${input.path}`);
    for(const file of built.files.filter((row:{path:string})=>
      /(?:^|\/)(?:LICENSE(?:S)?(?:\/|$)|[^/]*NOTICE[^/]*)/i.test(row.path)))
      assert.equal(sha(readFileSync(base+file.path)),file.sha256,`${name}: notice ${file.path}`);
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
    assert.equal(inputs.find((file:{path:string})=>file.path===path)?.sha256,
      sha(readFileSync(`${atlas}/${path}`)),`${path}: learner input`);
    for(const base of ['public/atlas-review/',viewerBase,...learners.map(item=>item.base)])
      assert.equal(existsSync(base+path),false,`${base+path}: raw source public`);
  }
  const api=await closure(),catalog=api.bodyDisplayCatalog(json('atlas-review/'+catalogPath));
  const identities=pinPaths.flatMap(path=>json('atlas-review/'+path).entries.map((row:any)=>row.identity)
    .filter((identity:any)=>expected.has(identity.id)));
  assert.equal(expected.size,20);assert.equal(identities.length,20);
  assert.equal(new Set(identities.map((identity:any)=>identity.id)).size,20);
  const scope=head.manifest.regionalScopes.find((item:{region:string})=>item.region==='abdomen');assert(scope);
  const emitted=[emittedTeaching(head.base,head.manifest.files,true),emittedTeaching(viewerBase,viewer.files,true)];
  for(const identity of identities){
    const id=identity.id,binding=expected.get(id)!;
    assert.equal(identity.fmaId,binding.fma);assert.equal(identity.nodeName,binding.fma);
    assert.equal(identity.region,'abdomen');assert.equal(identity.laterality,binding.side);
    assert.equal(identity.category,binding.category);
    assert.equal(identity.system,binding.category==='vessel'?'vessels':'connective');
    assert.equal(identity.bundle,binding.bundle);
    assert.deepEqual(identity.sources.map((source:{file:string})=>source.file),binding.files);
    assert.equal(identity.validation.status,'unvalidated');
    assert.equal(identity.validation.anatomicalReview,false);
    assert.deepEqual(catalog.structures.find((item:{id:string})=>item.id===id),identity);
    assert(scope.regionalIds.includes(id),`${id}: abdomen learner scope`);
    const helper=gastricIds.has(id)
      ? api.gastricVenousXrayLesson:api.abdominalDetailXrayLesson;
    const lesson=helper(identity,'xray');
    assert.deepEqual(api.bodyLesson(identity,'xray'),lesson);
    assert.equal(lesson.readiness,'draft');
    assert(lesson.bullets.length>=2&&lesson.bullets.every((bullet:string)=>bullet.trim()));
    assert(lesson.citations.length>=2&&lesson.citations.every((url:string)=>/^https:\/\//.test(url)));
    for(const code of emitted)
      for(const value of [identity.name,lesson.title,lesson.body,...lesson.bullets,...lesson.citations,lesson.note])
        assert(visible(code,value),`${id}: emitted teaching missing ${value}`);
    for(const tab of api.contentTabs.filter((tab:string)=>tab!=='xray'))
      assert.equal(helper(identity,tab),undefined,`${id}:${tab}`);
  }
  for(const structure of catalog.structures)if(!expected.has(structure.id))
    for(const tab of api.contentTabs){
      assert.equal(api.gastricVenousXrayLesson(structure,tab),undefined,`${structure.id}:${tab}: unrelated gastric`);
      assert.equal(api.abdominalDetailXrayLesson(structure,tab),undefined,`${structure.id}:${tab}: unrelated detail`);
    }
});

test('historical admission changes exactly twenty placements and Review packets; live bound review rejects forgeries',async()=>{
  const manifest=json('atlas-review/manifest.json'),revision=manifest.revision;
  const imported=await closure(),live=await boundLiveAtlasHistory(revision),previous=await history(baseline);
  const featureCommit=git(['log','--diff-filter=A','-1','--format=%H','--',
    'content/abdominal-detail-vascular-xray.ts']).toString().trim();
  assert.match(featureCommit,/^[a-f0-9]{40}$/);
  const feature=await history(featureCommit);
  const catalog=feature.bodyDisplayCatalog(JSON.parse(committed(featureCommit,catalogPath).toString()));
  assert.deepEqual(catalog,previous.bodyDisplayCatalog(JSON.parse(committed(baseline,catalogPath).toString())));
  assert.deepEqual(imported.bodyDisplayCatalog(json('atlas-review/'+catalogPath)),catalog);
  for(const path of pinPaths){
    assert.deepEqual(committed(featureCommit,path),committed(baseline,path),`${path}: unchanged admission pin`);
    assert.equal(norm(readFileSync(`${atlas}/${path}`)),norm(committed(baseline,path)),`${path}: current source pin`);
  }
  for(const path of ['app/anatomy-data.ts','app/dissection-data.ts','lib/regional-tours.ts'])
    assert.deepEqual(committed(featureCommit,path),committed(baseline,path),`${path}: admission source/guide`);
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
      if(!target||tab!=='xray'){assert.deepEqual(after,before,`${structure.id}:${tab}`);continue;}
      changed++;assert.equal(before.readiness,'pending');assert.equal(after.readiness,'draft');
      assert.deepEqual(imported.bodyLesson(structure,tab),live.bodyLesson(structure,tab),`${structure.id}: live bound lesson`);
      assert.deepEqual(imported.bodyLesson(structure,tab),after,`${structure.id}: admission lesson`);
    }
    const before=wire(await previous.bodyReviewMaterial(structure.id));
    const after=wire(await feature.bodyReviewMaterial(structure.id));packets++;
    assert.equal(after.approval,false);assert.equal(after.status,'worksheet-not-submitted');
    if(!target){assert.deepEqual(after,before,`${structure.id}: preserved packet`);continue;}
    changedPackets++;
    for(const key of ['source','reasoning','guidedTours','checklist','atlasLink','limits'])
      assert.deepEqual(after[key],before[key],`${structure.id}:${key}`);
    assert.deepEqual(after.topics.filter((row:any)=>row.tab!=='xray'),before.topics.filter((row:any)=>row.tab!=='xray'));
    assert.deepEqual(after.topics.find((row:any)=>row.tab==='xray'),
      {tab:'xray',...feature.bodyLesson(structure,'xray')});
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
    assert.deepEqual(context,await live.bodyReviewContext(structure.id),`${structure.id}: bound context`);
    assert.equal(context.sourceHash,previousContext.sourceHash);
    assert.equal(context.revisions.imaging,null);assert(context.teachingTabs.includes('xray'));
    for(const edit of [
      (bad:any)=>{bad.topics.find((row:any)=>row.tab==='xray').body+=' forged';},
      (bad:any)=>{bad.topics.find((row:any)=>row.tab==='xray').bullets[0]+=' forged';},
      (bad:any)=>{bad.topics.find((row:any)=>row.tab==='xray').citations[0]='https://forged.example';},
      (bad:any)=>{bad.topics.find((row:any)=>row.tab==='xray').readiness='approved';},
      (bad:any)=>{bad.topics.splice(bad.topics.findIndex((row:any)=>row.tab==='xray'),1);},
      (bad:any)=>{bad.source.structure.sources[0].sha256='0'.repeat(64);},
    ]){const forged=wire(livePacket);edit(forged);
      assert.equal(await imported.parseBodyReviewResponse(forged,structure.id),null);}
    const decision={catalogScope:context.catalogScope,structureId:structure.id,track:'teaching',expectedVersion:0,
      materialHash:context.materialHash,revisionHash:context.revisions.teaching,checklistVersion:context.checklistVersion,
      draft:imported.blankBodyReview(context,'teaching')};
    const save=(input:any)=>imported.postBodyDecision(new Request('https://review.test/api/body-decisions',{
      method:'POST',headers:{origin:'https://review.test','content-type':'application/json',
        'oai-authenticated-user-id':'synthetic-abdominal-detail-reviewer'},body:JSON.stringify(input),
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
    {placements:9936,changed:20,packets:1104,changedPackets:20,storageCalls:0});
  assert.equal(placements-changed,9916);assert.equal(packets-changedPackets,1084);
});
