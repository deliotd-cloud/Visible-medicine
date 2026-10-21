import assert from 'node:assert/strict';
import test from 'node:test';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync,readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
import {specimenChannelEntrypoint} from './specimen-channel-entrypoint.ts';
import {bodyChannelBaseline,bodyChannelEntrypoint} from './body-channel-source-epoch.ts';
import {checkedAtlasHistoryRepo} from './atlas-source-repo.mjs';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';

const atlas=currentAtlasDeliveryRoot();
const historicalRevision='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const portalTourRevision='47a851db0fb3369ad056fb8a8fcc3f3ba73656ea';
const portalTourBlob='c832b8cafa2a53a79d244dfa223288b7fd255be6';
const currentTourBlob='fb65a9c68d8753fc1789c7e6281e36c2889e0136';
const revision=CURRENT_ATLAS_REVISION;
const parent='c57449c1107a912442c6b0af23e270df41032522';
const priorTreeOwner='6b6d9bba99985dfc5ca8deb52ca9e2632b837d25';
const priorTree='a84ecc18997c80b7f68917425164ea24993020dd';
const historicalTree='1bd327fb20a52b35bec584675c457173c548e24b';
const predecessorSource='2fd700948dfa10ec6b5a03c4ed4c6ff9443c387e';
const predecessorSourceTree='f91376f263edb4298871232341e7e402c725cbd7';
const completedSource='2dba5dc346748e9ce94a5dab7308689deb6dfc95';
const completedSourceTree='982a5893262d906122064575703d7290c4da2248';
const pinPath='content/neonatal-cranial-ultrasound-pins.json';
const sourcePaths=[pinPath,'content/neonatal-cranial-ultrasound.ts','lib/neonatal-cranial-ultrasound.ts'];
const requiredPinsHash='aa126b609b4a816083ac5c52b30905b6eda7f66d43cd31f90521664dfe6da53a';
const oldSnapshotPath='F:/VisibleMedicine/staging/20261013-neonatal-us-integration/old-inbox.json';
const require=createRequire(import.meta.url);
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const sha=(bytes:Uint8Array|string)=>createHash('sha256').update(bytes).digest('hex');
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));
const git=(args:string[])=>execFileSync('git',args,{cwd:atlas,windowsHide:true,maxBuffer:64e6,
  env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
const committed=(commit:string,path:string)=>git(['show',`${commit}:${path}`]);
const norm=(bytes:Uint8Array)=>Buffer.from(bytes).toString('utf8').replaceAll('\r\n','\n');
type File={path:string;sha256:string;sourceSha256?:string;importedSha256?:string;bytes?:number};
type Pin={identity:any;family:string;previous:any};
const selections=[
  ['caudate','left','left-caudate-nucleus','FMA72827'],
  ['caudate','right','right-caudate-nucleus','FMA72826'],
  ['thalamus','left','left-thalamus','FMA258716'],
  ['thalamus','right','right-thalamus','FMA258714'],
  ['putamen','left','left-putamen','FMA72829'],
  ['putamen','right','right-putamen','FMA72828'],
  ['pallidum','left','left-globus-pallidus','FMA72831'],
  ['pallidum','right','right-globus-pallidus','FMA72830'],
  ['callosum','midline','corpus-callosum','FMA86464'],
  ['plexus','midline','choroid-plexus-of-cerebral-hemisphere','FMA61934'],
] as const;
const expected=new Map(selections.map(([family,side,slug,fma])=>[
  `vm:anatomy:body:head-neck:${side}:organ:${slug}`,{family,side,fma}]));

async function imported(){
  const built=await build({stdin:{contents:[
    "export {bodyLesson,bodyContent} from './atlas-review/app/body-content';",
    "export {neonatalCranialUltrasoundLesson} from './atlas-review/lib/neonatal-cranial-ultrasound';",
    "export {neonatalCranialUltrasoundReferences,neonatalCranialUltrasoundTeaching,neonatalCranialUltrasoundNote} from './atlas-review/content/neonatal-cranial-ultrasound';",
    "export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';",
    "export {contentTabs} from './atlas-review/lib/content-types';",
    "export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';",
    "export {bodyReviewContext} from './atlas-review/lib/body-review-context';",
    "export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';",
    "export {blankBodyReview} from './atlas-review/lib/body-review-decisions';",
    "export {postBodyDecision} from './atlas-review/lib/body-review-api';",
    "export {regionalTours} from './atlas-review/lib/regional-tours';",
  ].join('\n'),resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
  return import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
}
async function inbox(){
  const built=await build({stdin:{contents:[
    "export {getClinicalReviewInbox} from './lib/clinical-review-inbox';",
    "export {clinicalReviewEntries} from './atlas-review/lib/clinical-review-index';",
  ].join('\n'),resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'cjs',platform:'node',packages:'external'});
  const mod={exports:{} as Record<string,any>};
  new Function('require','module','exports',built.outputFiles[0].text)((name:string)=>name==='server-only'?{}:require(name),mod,mod.exports);
  return mod.exports;
}
function database(result:unknown={success:true,results:[]}){
  const reads:{sql:string;args:unknown[]}[]=[];
  return {reads,prepare(sql:string){assert.match(sql,/^\s*SELECT\b/i);let args:unknown[]=[];
    const statement={bind(...values:unknown[]){args=values;return statement;},async all(){reads.push({sql,args});return result;},
      async run(){throw Error('The inbox is read-only.');}};return statement;}};
}
const request=(query='')=>new Request('https://review.invalid/api/atlas-review/inbox'+query,
  {headers:{'oai-authenticated-user-id':'offline-neonatal-cranial-us-inbox-fixture'}});

test('ten exact infant cranial Ultrasound drafts bind to Review and the scoped learners', {timeout:240000}, async()=>{
  assert.equal(checkedAtlasHistoryRepo(historicalRevision),atlas);
  assert.equal(git(['rev-parse',priorTreeOwner+'^{tree}']).toString().trim(),priorTree,
    'Earlier a84 tree remains bound to its actual 6b6d source epoch');
  assert.equal(git(['merge-base',priorTreeOwner,historicalRevision]).toString().trim(),priorTreeOwner);
  assert.equal(git(['merge-base',portalTourRevision,historicalRevision]).toString().trim(),portalTourRevision);
  assert.equal(git(['merge-base',historicalRevision,revision]).toString().trim(),historicalRevision);
  assert.equal(git(['rev-parse',portalTourRevision+':lib/regional-tours.ts']).toString().trim(),portalTourBlob);
  assert.equal(git(['rev-parse',historicalRevision+':lib/regional-tours.ts']).toString().trim(),currentTourBlob);
  assert.equal(git(['rev-parse',revision+':lib/regional-tours.ts']).toString().trim(),currentTourBlob);
  assert.equal(git(['rev-parse','HEAD']).toString().trim(),revision);
  assert.equal(git(['rev-parse',historicalRevision+'^{tree}']).toString().trim(),historicalTree);
  assert.equal(git(['rev-parse',predecessorSource+'^{tree}']).toString().trim(),predecessorSourceTree,'previous integrated source tree retained');
  assert.equal(git(['rev-parse',completedSource+'^{tree}']).toString().trim(),completedSourceTree,'historical completed source tree retained');
  assert.equal(expected.size,10);
  const review=json('atlas-review/manifest.json');assert.equal(review.revision,revision);
  const viewerBase='public/atlas-review-viewer/',viewer=json(viewerBase+'manifest.json');
  assert.equal(viewer.sourceCommit,revision);
  assert.equal(viewer.websiteIntegrationSha256,review.websiteIntegrationSha256);
  assert.equal(viewer.personalRecordsIncluded,false);
  const learners=['head-neck','shoulder','lower-limb','female-pelvis'].map(name=>({name,base:`public/atlas-runtime/${name}/`,
    manifest:json(`public/atlas-runtime/${name}/manifest.json`)}));
  const learnerInputs=new Map<string,File[]>(learners.map(({name,base})=>[name,json(base+'source-inputs.json')]));
  for(const {name,manifest} of learners){assert.equal(manifest.sourceCommit,revision,name);
    assert.equal(manifest.patientDataIncluded,false,name);assert.equal(manifest.clinicalApproved,false,name);}
  assert.equal(learners[0].manifest.region,'head-neck');
  assert.equal(learners[1].manifest.region,'shoulder-right');assert.equal(learners[1].manifest.structures,9);
  assert.equal(learners[2].manifest.region,'independent-right-lower-limb');
  assert.equal(learners[2].manifest.structures,67);assert.equal(learners[2].manifest.scopes,5);
  assert.equal(learners[3].manifest.region,'independent-female-pelvis');
  assert.equal(learners[3].manifest.structures,43);
  for(const name of ['lower-limb','female-pelvis'])for(const path of sourcePaths)
    assert.equal(learnerInputs.get(name)!.some(f=>f.path===path),false,`${name}: no root-body infant US input`);
  for(const [name,path,pattern] of [
    ['head-neck','integration/head-neck/main.tsx',/BodyExplorer initialRegion=/],
    ['shoulder','integration/shoulder/main.tsx',/ShoulderExplorer initialSelectedId=/],
    ['lower-limb','integration/lower-limb/main.tsx',/KneeSpecimenView key=\{scope\} specimen=\{limbDefinitions\[scope\]\}/],
    ['female-pelvis','integration/female-pelvis/main.tsx',/KneeSpecimenView specimen=\{hraPelvisDefinition\}/],
  ] as const){
    const source=committed(revision,path);
    assert.deepEqual(source,committed(historicalRevision,path),`${name}: immutable channel entrypoint`);
    assert.equal(learnerInputs.get(name)!.find(f=>f.path===path)?.sha256,sha(source),`${name}: entrypoint`);
    assert.match(norm(source),pattern,`${name}: learner scope`);
    const precedingEntrypoint=specimenChannelEntrypoint(norm(committed(parent,path)),name);
    assert.equal(norm(committed(bodyChannelBaseline,path)),precedingEntrypoint,`${name}: original scope plus exact opt-in channel at the preceding source epoch`);
    assert.equal(norm(source),bodyChannelEntrypoint(precedingEntrypoint,name),`${name}: exact additional root-body channel only`);
  }
  for(const path of ['app/body-content.ts',...sourcePaths]){
    const source=committed(revision,path),copy=readFileSync('atlas-review/'+path),record:File=review.files.find((f:File)=>f.path===path);
    assert(record,path);assert.equal(record.sourceSha256,sha(source),path);
    assert.equal(record.importedSha256,sha(copy),path);
    assert.equal(norm(readFileSync(atlas+'/'+path)),norm(source),`${path}: current Atlas source`);
    if(path!=='app/body-content.ts')assert.equal(norm(copy),norm(source),`${path}: imported source`);
    for(const name of ['head-neck','shoulder'])assert.equal(learnerInputs.get(name)!.find(f=>f.path===path)?.sha256,
      sha(source),`${name}: ${path} input`);
    for(const base of ['public/atlas-review/',viewerBase,...learners.map(item=>item.base)])
      assert.equal(existsSync(base+path),false,`${base+path}: raw source exposed`);
  }
  for(const [name,path] of [['lower-limb','public/models/um-limb/catalog.json'],
    ['female-pelvis','public/models/hra-pelvis/catalog.json']] as const){
    const source=committed(revision,path),catalog=json('atlas-review/'+path);
    assert.equal(learnerInputs.get(name)!.find(f=>f.path===path)?.sha256,sha(source),`${name}: independent catalog input`);
    assert.deepEqual(catalog,JSON.parse(norm(source)),`${name}: independent catalog`);
    assert.equal(norm(source),norm(committed(parent,path)),`${name}: original specimen source`);
  }
  const pins=json('atlas-review/'+pinPath);
  assert.equal(sha(JSON.stringify(pins)),requiredPinsHash);
  assert.equal(pins.parentCommit,parent);assert.equal(pins.entries.length,10);
  assert.deepEqual(new Set(pins.entries.map((row:Pin)=>row.identity.id)),new Set(expected.keys()));
  assert.deepEqual(new Set(pins.entries.map((row:Pin)=>row.family)),new Set(selections.map(row=>row[0])));
  const liveApi=await imported(),rawCatalog=json('atlas-review/public/models/bodyparts3d/full-body/catalog.json');
  assert.equal(liveApi.regionalTours.length,51);assert.equal(liveApi.regionalTours.reduce((n:number,tour:{steps:unknown[]})=>n+tour.steps.length,0),309);
  const prior=await import(pathToFileURL(atlas+'/scripts/exact-source-history-api.mjs').href);
  const portalTourEpoch=await prior.exactSourceHistoryApi(portalTourRevision,'review-security');
  assert.equal(portalTourEpoch.regionalTours.length,48);
  assert.equal(portalTourEpoch.regionalTours.reduce((n:number,tour:{steps:unknown[]})=>n+tour.steps.length,0),290);
  const firstDelivery=await prior.exactSourceHistoryApi(historicalRevision,'review-security');
  assert.equal(firstDelivery.regionalTours.length,51);
  assert.equal(firstDelivery.regionalTours.reduce((n:number,tour:{steps:unknown[]})=>n+tour.steps.length,0),309);
  // Replay the original complete transition matrix at its completed source epoch.
  // Later unrelated teaching must not be compared with this older parent.
  for(const path of sourcePaths)
    assert.equal(sha(committed(historicalRevision,path)),sha(committed(completedSource,path)),`${path}: neonatal source preserved at first delivery`);
  for(const path of sourcePaths)
    assert.deepEqual(committed(revision,path),committed(historicalRevision,path),`${path}: neonatal source retained at current delivery`);
  const epoch=await prior.exactSourceHistoryApi(completedSource,'review-security');
  // These neonatal-only exports are byte-identical above; all generic resolvers,
  // packets and decision guards in the full matrix come from the exact epoch.
  const api={...liveApi,...epoch};
  const catalog=api.bodyDisplayCatalog(rawCatalog),ids=new Set<string>(expected.keys());
  assert.equal(catalog.structures.length,1104);assert.equal(api.contentTabs.length,9);
  assert.equal(catalog.structures.length*api.contentTabs.length,9936);
  assert.equal(api.regionalTours.length,47);
  assert.equal(api.regionalTours.reduce((n:number,tour:{steps:unknown[]})=>n+tour.steps.length,0),282);
  assert.equal(sha(JSON.stringify(catalog)),pins.catalogHash);
  assert.deepEqual(catalog.coordinateSystem,pins.coordinateSystem);
  const before=await prior.exactSourceHistoryApi(parent,'review-security');
  assert.deepEqual(api.regionalTours,before.regionalTours,'tour and stop catalogue preserved');
  assert.deepEqual(catalog,before.bodyDisplayCatalog(JSON.parse(committed(parent,'public/models/bodyparts3d/full-body/catalog.json').toString())));
  assert.deepEqual(new Set(pins.bundles.map((bundle:any)=>bundle.id)),new Set(['head-neck-nerves-deep-brain']));
  assert.equal(pins.bundles.length,1);
  for(const bundle of pins.bundles as {id:string;url:string;bytes:number;sha256:string}[]){
    const urlPath=bundle.url.split('?')[0],sourcePath='public'+urlPath;
    assert.equal(existsSync('atlas-review/'+sourcePath),false,`${bundle.id}: no GLB in protected Review`);
    const relativePath='models/'+urlPath.slice('/models/'.length);
    const delivered:File=learners[0].manifest.files.find((f:File)=>f.path===relativePath);
    assert(delivered,`${bundle.id}: learner model`);assert.equal(delivered.bytes,bundle.bytes);
    assert.equal(delivered.sha256,bundle.sha256);
    const bytes=readFileSync(learners[0].base+relativePath);
    assert.equal(bytes.length,bundle.bytes);assert.equal(sha(bytes),bundle.sha256);
    assert.equal(sha(committed(parent,sourcePath)),bundle.sha256,'original geometry preserved');
  }
  const learnerJs=learners.filter(item=>item.name==='head-neck'||item.name==='shoulder').map(({name,base,manifest})=>({name,
    text:manifest.files.filter((f:File)=>f.path.endsWith('.js')).map((f:File)=>{
      const bytes=readFileSync(base+f.path);assert.equal(sha(bytes),f.sha256,`${name}: ${f.path}`);
      return bytes.toString();}).join('\n')}));
  let changed=0,preserved=0,changedPackets=0,preservedPackets=0,storageCalls=0;
  for(const s of catalog.structures){
    for(const tab of api.contentTabs){
      const oldLesson=await before.bodyLesson(s,tab),lesson=api.bodyLesson(s,tab);
      if(ids.has(s.id)&&tab==='ultrasound'){
        const pin:Pin=pins.entries.find((row:Pin)=>row.identity.id===s.id),spec=expected.get(s.id)!;
        assert.deepEqual(s,pin.identity,s.id);assert.deepEqual(oldLesson,pin.previous,s.id);
        assert.equal(pin.family,spec.family);assert.equal(s.laterality,spec.side);
        assert.equal(s.fmaId,spec.fma);assert.equal(s.region,'head-neck');
        assert.equal(s.bundle,'head-neck-nerves-deep-brain');
        assert.equal(s.validation.status,'unvalidated');assert.equal(s.validation.anatomicalReview,false);
        assert.deepEqual(lesson,api.neonatalCranialUltrasoundLesson(s,tab),s.id);
        assert.equal(lesson.readiness,'draft',s.id);
        assert.deepEqual(api.bodyContent(s,tab),((({readiness,...shown}:any)=>shown)(lesson)),s.id);
        const teaching=api.neonatalCranialUltrasoundTeaching[pin.family];
        assert.equal(lesson.body,teaching.body);assert.deepEqual(lesson.bullets,teaching.bullets);
        assert.deepEqual(lesson.citations,teaching.citations.map((key:string)=>api.neonatalCranialUltrasoundReferences[key]));
        for(const learner of learnerJs)for(const value of [teaching.body,...lesson.bullets,lesson.note,...lesson.citations])
          assert(learner.text.includes(value),`${learner.name}: ${s.id} lesson text`);
        assert.match(lesson.note,/open acoustic window/i);
        assert.match(lesson.note,/not a validated neonatal model/i);
        assert.match(lesson.note,/adult transcranial ultrasound map/i);
        assert.match(lesson.note,/registration/i);
        assert.match(lesson.note,/revision.bound radiologist sign.off/i);
        assert.match(lesson.note,/independent/i);
        if(pin.family==='plexus')assert.match(lesson.body,/generic source group.*not a pair of separately validated/i);
        if(pin.family==='pallidum')assert.match(lesson.body,/neither an infant.specific reconstruction nor separate validated internal and external pallidal segmentations/i);
        const forged=wire(s);forged.sources[0].sha256='0'.repeat(64);
        assert.equal(api.neonatalCranialUltrasoundLesson(forged,'ultrasound'),undefined,`${s.id}: exact source identity`);
        assert.equal(api.neonatalCranialUltrasoundLesson(s,'xray'),undefined,`${s.id}: Ultrasound only`);
        changed++;
      }else{assert.deepEqual(lesson,oldLesson,`${s.id}:${tab}: prior teaching`);preserved++;}
    }
    const previous=wire(await before.bodyReviewMaterial(s.id)),packet=wire(await api.bodyReviewMaterial(s.id));
    if(!ids.has(s.id)){assert.deepEqual(packet,previous,`${s.id}: prior packet`);preservedPackets++;continue;}
    assert.deepEqual(liveApi.bodyLesson(s,'ultrasound'),api.bodyLesson(s,'ultrasound'),`${s.id}: current neonatal lesson preserved`);
    const livePacket=wire(await liveApi.bodyReviewMaterial(s.id));
    assert.deepEqual(livePacket,packet,`${s.id}: current neonatal Review packet preserved`);
    assert.deepEqual(await liveApi.parseBodyReviewResponse(livePacket,s.id),livePacket,`${s.id}: current packet accepted`);
    assert.equal(await liveApi.parseBodyReviewResponse(previous,s.id),null,`${s.id}: current client rejects pre-neonatal packet`);
    assert.equal(packet.approval,false);assert.equal(packet.status,'worksheet-not-submitted');
    const unchanged=({topics,fingerprints,materialHash,...rest}:any)=>rest;
    assert.deepEqual(unchanged(packet),unchanged(previous),`${s.id}: non-teaching fields`);
    assert.deepEqual(packet.topics.filter((topic:any)=>topic.tab!=='ultrasound'),
      previous.topics.filter((topic:any)=>topic.tab!=='ultrasound'));
    assert.deepEqual(packet.topics.find((topic:any)=>topic.tab==='ultrasound'),
      {tab:'ultrasound',...api.bodyLesson(s,'ultrasound')});
    assert.equal(packet.fingerprints.source,previous.fingerprints.source);
    assert.notEqual(packet.fingerprints.teaching,previous.fingerprints.teaching);
    assert.notEqual(packet.materialHash,previous.materialHash);
    assert.deepEqual(await api.parseBodyReviewResponse(packet,s.id),packet);
    assert.equal(await api.parseBodyReviewResponse(previous,s.id),null,`${s.id}: stale packet`);
    for(const edit of ['body','citation','source','readiness','missing']){
      const bad=wire(packet),topic=bad.topics.find((row:any)=>row.tab==='ultrasound');
      if(edit==='body')topic.body+=' forged';
      if(edit==='citation')topic.citations[0]='https://forged.invalid';
      if(edit==='source')bad.source.structure.sources[0].sha256='0'.repeat(64);
      if(edit==='readiness')topic.readiness='approved';
      if(edit==='missing')bad.topics.splice(bad.topics.indexOf(topic),1);
      assert.equal(await api.parseBodyReviewResponse(bad,s.id),null,`${s.id}: ${edit}`);
      assert.equal(await liveApi.parseBodyReviewResponse(bad,s.id),null,`${s.id}: current ${edit} refused`);
    }
    const oldContext=await before.bodyReviewContext(s.id),context=await api.bodyReviewContext(s.id);
    const liveContext=await liveApi.bodyReviewContext(s.id);
    for(const key of ['sourceHash','teachingHash','materialHash','checklistVersion'])
      assert.equal(liveContext[key],context[key],`${s.id}: current ${key} preserved`);
    assert.equal(liveContext.revisions.teaching,context.revisions.teaching,`${s.id}: current teaching decision revision preserved`);
    assert.equal(context.sourceHash,oldContext.sourceHash);
    assert.notEqual(context.revisions.teaching,oldContext.revisions.teaching);
    const decision={catalogScope:context.catalogScope,structureId:s.id,track:'teaching',expectedVersion:0,
      materialHash:context.materialHash,revisionHash:context.revisions.teaching,checklistVersion:context.checklistVersion,
      draft:api.blankBodyReview(context,'teaching')};
    const save=(input:unknown)=>api.postBodyDecision(new Request('https://review.test/api/body-decisions',{
      method:'POST',headers:{origin:'https://review.test','content-type':'application/json',
        'oai-authenticated-user-id':'offline-synthetic-neonatal-us-reviewer'},body:JSON.stringify(input)}),
      {prepare(){storageCalls++;throw Error('Rejected decision reached storage');}});
    const liveSave=(input:unknown)=>liveApi.postBodyDecision(new Request('https://review.test/api/body-decisions',{
      method:'POST',headers:{origin:'https://review.test','content-type':'application/json',
        'oai-authenticated-user-id':'offline-synthetic-neonatal-us-reviewer'},body:JSON.stringify(input)}),
      {prepare(){storageCalls++;throw Error('Rejected current decision reached storage');}});
    for(const hashes of [
      {materialHash:oldContext.materialHash,revisionHash:oldContext.revisions.teaching},
      {materialHash:oldContext.materialHash},
      {revisionHash:oldContext.revisions.teaching},
    ])assert.equal((await save({...decision,...hashes})).status,409);
    for(const hashes of [
      {materialHash:oldContext.materialHash,revisionHash:oldContext.revisions.teaching},
      {materialHash:oldContext.materialHash},
      {revisionHash:oldContext.revisions.teaching},
    ])assert.equal((await liveSave({...decision,...hashes})).status,409);
    const forged=wire(decision);forged.draft.checks.foreign=true;
    assert.equal((await save(forged)).status,422);
    const approval=wire(decision);approval.draft.status='approved';
    assert.equal((await save(approval)).status,422);
    assert.equal((await liveSave(forged)).status,422);
    assert.equal((await liveSave(approval)).status,422);
    changedPackets++;
  }
  assert.deepEqual([changed,preserved,changedPackets,preservedPackets,storageCalls],[10,9926,10,1094,0]);
  for(const id of ['vm:anatomy:body:head-neck:midline:organ:septum-of-telencephalon',
    'vm:anatomy:body:head-neck:midline:organ:brain']){
    const s=catalog.structures.find((item:any)=>item.id===id);assert(s,id);
    assert.deepEqual(api.bodyLesson(s,'ultrasound'),await before.bodyLesson(s,'ultrasound'));
    assert.equal(api.bodyLesson(s,'ultrasound').readiness,'pending');
  }
});

test('private inbox shows ten new teaching revisions and rejects stale continuation before reads', {timeout:180000}, async()=>{
  const {getClinicalReviewInbox,clinicalReviewEntries}=await inbox(),api=await imported();
  const old=json(oldSnapshotPath),pins=json('atlas-review/'+pinPath);
  assert.equal(old.sourceCommit,parent);assert.equal(old.rows.length,10);
  assert.equal(old.database,'empty read-only offline fixture; no real account history');
  const ids=new Set<string>(pins.entries.map((row:Pin)=>row.identity.id));
  const db=database(),first=await getClinicalReviewInbox(request(),db);
  assert.equal(first.status,200);assert.equal(first.headers.get('Cache-Control'),'private, no-store');
  const catalog=(await first.json()).catalogRevision as string;assert.match(catalog,/^[a-f0-9]{64}$/);
  assert.notEqual(catalog,old.catalogRevision);
  db.reads.length=0;
  const stale=await getClinicalReviewInbox(request('?page=2&revision='+old.catalogRevision),db);
  assert.equal(stale.status,409);assert.equal(db.reads.length,0,'old catalogue reached DB reads');
  const selected=clinicalReviewEntries.map((entry:any,index:number)=>({entry,index}))
    .filter(({entry}:any)=>entry.scope==='body'&&ids.has(entry.id));
  assert.equal(selected.length,10);
  const pages=[...new Set<number>(selected.map(({index}:any)=>Math.floor(index/12)+2))];
  const batches:any[]=[];
  for(const page of pages){const response=await getClinicalReviewInbox(request(`?page=${page}&revision=${catalog}`),db);
    assert.equal(response.status,200);batches.push(...(await response.json()).items);}
  const prior=await import(pathToFileURL(atlas+'/scripts/exact-source-history-api.mjs').href);
  const before=await prior.exactSourceHistoryApi(parent,'review-security');
  for(const {entry} of selected){
    const key=JSON.stringify([entry.key,'teaching']),matches=batches.filter((row:any)=>row.key===key);
    assert.equal(matches.length,1,key);const row=matches[0];
    const saved=old.rows.find((item:any)=>item.id===entry.id);
    const previous=await before.bodyReviewContext(entry.id),now=await api.bodyReviewContext(entry.id);
    assert(saved&&previous&&now,entry.id);assert.equal(saved.key,key);
    assert.equal(saved.status,'not-started');assert.equal(saved.revision,previous.revisions.teaching);
    assert.equal(saved.href,'/workspace/atlas-review/body?structure='+encodeURIComponent(entry.id),
      `${entry.id}: immutable historical inbox URL`);
    assert.equal(row.href,'/workspace/atlas-review/body?structure='+encodeURIComponent(entry.id)+'&t=teaching',
      `${entry.id}: current teaching-track selection`);
    assert.equal(row.revision,now.revisions.teaching);assert.equal(row.status,'not-started');
    assert.equal(now.sourceHash,previous.sourceHash);
    assert.notEqual(now.revisions.teaching,previous.revisions.teaching);
    assert.notEqual(row.revision,saved.revision);
  }
  const failed=await getClinicalReviewInbox(request(`?page=${pages[0]}&revision=${catalog}`),database({success:false,results:[]}));
  assert.equal(failed.status,200);
  assert((await failed.json()).items.every((row:any)=>row.status==='unavailable'));
});
