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
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';

const atlas=currentAtlasDeliveryRoot();
const revision='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const completedEpoch='c57449c1107a912442c6b0af23e270df41032522';
const portalTourEpoch='47a851db0fb3369ad056fb8a8fcc3f3ba73656ea';
const parent='d81bbe14def4249d9d081de6a9f9f823e4fad69a';
const oldCatalog='1191faa89cb7e314200aaa1c935629b7f634842d772b2ae81ce12d24f55bbcb2';
const pinPath='content/median-cubital-xray-pins.json';
const sourcePaths=[pinPath,'content/median-cubital-xray.ts','lib/median-cubital-xray.ts'];
const requiredPinsHash='51d7af412398ac05921db91cd74b9c70dafae26428c2f2825d0fb8135a921459';
const oldSnapshotPath='F:/VisibleMedicine/staging/20261013-median-vein-integration/old-inbox.json';
const require=createRequire(import.meta.url);
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const sha=(bytes:Uint8Array|string)=>createHash('sha256').update(bytes).digest('hex');
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));
const git=(args:string[])=>execFileSync('git',args,{cwd:atlas,windowsHide:true,maxBuffer:64e6,
  env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
const committed=(commit:string,path:string)=>git(['show',`${commit}:${path}`]);
const norm=(bytes:Uint8Array)=>Buffer.from(bytes).toString('utf8').replaceAll('\r\n','\n');
const currentHeadEntrypoint=(historical:string)=>{
  const once=(source:string,before:string,after:string)=>{
    assert.equal(source.split(before).length,2,'Exactly one current head learning-channel seam');
    return source.replace(before,after);
  };
  let source=once(historical,"import {BodySelectionChannel} from '../../app/body-selection-channel';",
    "import {BodySelectionChannel} from '../../app/body-selection-channel';\nimport {AtlasLearningSelectionChannel} from '../../app/atlas-learning-selection-channel';");
  source=once(source,": <HeadSelectionChannel revision={region==='head-neck'?__VM_HEAD_SOURCE_REVISION__:''}><BodySelectionChannel",
    ": <AtlasLearningSelectionChannel revision={__VM_HEAD_SOURCE_REVISION__} region={region}><HeadSelectionChannel revision={region==='head-neck'?__VM_HEAD_SOURCE_REVISION__:''}><BodySelectionChannel");
  return once(source,'assetBase="/atlas-runtime/head-neck"/></BodySelectionChannel></HeadSelectionChannel>',
    'assetBase="/atlas-runtime/head-neck"/></BodySelectionChannel></HeadSelectionChannel></AtlasLearningSelectionChannel>');
};
type File={path:string;sha256:string;sourceSha256?:string;importedSha256?:string};
type Pin={identity:any;family:string;previous:any};

async function imported(){
  const built=await build({stdin:{contents:[
    "export {bodyLesson,bodyContent} from './atlas-review/app/body-content';",
    "export {medianCubitalXrayLesson} from './atlas-review/lib/median-cubital-xray';",
    "export {medianCubitalXrayReferences,medianCubitalXrayTeaching,medianCubitalXrayNote} from './atlas-review/content/median-cubital-xray';",
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
  {headers:{'oai-authenticated-user-id':'offline-median-cubital-inbox-fixture'}});

test('two exact median cubital X-ray drafts reach protected Review and two learner modules', {timeout:180000}, async()=>{
  const current=validateCurrentAtlasDelivery();
  assert.equal(current.source,CURRENT_ATLAS_REVISION);
  assert.equal(current.runtimeSources.shoulder,'190a63238eadcf906abe89dcbb6a67c88afe70b9');
  assert.equal(git(['rev-parse','HEAD']).toString().trim(),current.source);
  assert.equal(git(['merge-base',revision,current.source]).toString().trim(),revision);
  const review=json('atlas-review/manifest.json');assert.equal(review.revision,current.source);
  const viewerBase='public/atlas-review-viewer/',viewer=json(viewerBase+'manifest.json');
  assert.equal(viewer.sourceCommit,current.source);
  assert.equal(viewer.websiteIntegrationSha256,review.websiteIntegrationSha256);
  assert.equal(viewer.personalRecordsIncluded,false);
  const learners=['head-neck','shoulder','lower-limb','female-pelvis'].map(name=>({name,base:`public/atlas-runtime/${name}/`,
    manifest:json(`public/atlas-runtime/${name}/manifest.json`)}));
  for(const {name,manifest} of learners){assert.equal(manifest.sourceCommit,current.runtimeSources[name],name);
    assert.equal(manifest.patientDataIncluded,false,name);assert.equal(manifest.clinicalApproved,false,name);}
  const learnerInputs=new Map<string,File[]>(learners.map(({name,base})=>[name,json(base+'source-inputs.json')]));
  for(const [name,path,pattern] of [
    ['head-neck','integration/head-neck/main.tsx',/BodyExplorer initialRegion=/],
    ['shoulder','integration/shoulder/main.tsx',/ShoulderExplorer initialSelectedId=/],
    ['lower-limb','integration/lower-limb/main.tsx',/KneeSpecimenView key=\{scope\} specimen=\{limbDefinitions\[scope\]\}/],
    ['female-pelvis','integration/female-pelvis/main.tsx',/KneeSpecimenView specimen=\{hraPelvisDefinition\}/],
  ] as const){
    const historicalSource=committed(revision,path),runtimeSource=committed(current.runtimeSources[name],path);
    assert.equal(learnerInputs.get(name)!.find(f=>f.path===path)?.sha256,sha(runtimeSource),`${name}: current runtime entrypoint`);
    assert.match(norm(runtimeSource),pattern,`${name}: learner scope`);
    const precedingEntrypoint=specimenChannelEntrypoint(norm(committed(parent,path)),name);
    assert.equal(norm(committed(bodyChannelBaseline,path)),precedingEntrypoint,`${name}: original entrypoint plus exact opt-in channel at the preceding source epoch`);
    assert.equal(norm(historicalSource),bodyChannelEntrypoint(precedingEntrypoint,name),`${name}: exact additional root-body channel only`);
    if(name==='head-neck')assert.equal(norm(runtimeSource),currentHeadEntrypoint(norm(historicalSource)),
      'Current head entrypoint adds only the exact learning-selection channel');
    else assert.deepEqual(runtimeSource,historicalSource,`${name}: independent runtime preserves historical entrypoint`);
  }
  for(const path of ['app/body-content.ts',...sourcePaths]){
    const source=committed(revision,path),currentSource=committed(current.source,path);
    const copy=readFileSync('atlas-review/'+path),record:File=review.files.find((f:File)=>f.path===path);
    if(path==='app/body-content.ts'){
      assert.notDeepEqual(currentSource,source,'later teaching source is a declared current epoch');
      assert.equal(sha(currentSource),'26320b064b5648f4f5b6ca8c123806a02dedefb761b894935707559d530882fc');
      assert.equal(sha(committed(current.runtimeSources.shoulder,path)),
        '3deda6b748ed897afcd980ff24256aa20b165f8c1615fdc1e2f887211d69c1d2',
        'Earlier shoulder family keeps the prior exact teaching source');
    }else assert.deepEqual(currentSource,source,`${path}: historical feature source held exactly`);
    assert(record,path);assert.equal(record.sourceSha256,sha(currentSource),path);
    assert.equal(record.importedSha256,sha(copy),path);
    assert.equal(norm(readFileSync(atlas+'/'+path)),norm(currentSource),`${path}: Atlas source`);
    if(path!=='app/body-content.ts')assert.equal(norm(copy),norm(currentSource),`${path}: imported source`);
    for(const name of ['head-neck','shoulder'])assert.equal(learnerInputs.get(name)!.find(f=>f.path===path)?.sha256,
      sha(currentSource),`${name}: ${path} input`);
    for(const base of ['public/atlas-review/',viewerBase,...learners.map(item=>item.base)])
      assert.equal(existsSync(base+path),false,`${base+path}: raw source exposed`);
  }
  for(const [name,path] of [['lower-limb','public/models/um-limb/catalog.json'],
    ['female-pelvis','public/models/hra-pelvis/catalog.json']] as const){
    const source=committed(revision,path),catalog=json('atlas-review/'+path);
    assert.equal(learnerInputs.get(name)!.find(f=>f.path===path)?.sha256,sha(source),`${name}: catalog input`);
    assert.deepEqual(catalog,JSON.parse(norm(source)),`${name}: independent catalog`);
    assert.equal(norm(source),norm(committed(parent,path)),`${name}: original specimen source`);
  }
  const pins=json('atlas-review/'+pinPath);
  assert.equal(sha(JSON.stringify(pins)),requiredPinsHash);
  assert.equal(pins.parentCommit,parent);assert.equal(pins.entries.length,2);
  assert.equal(new Set(pins.entries.map((row:Pin)=>row.identity.id)).size,2);
  assert.deepEqual(new Set(pins.entries.map((row:Pin)=>row.family)),
    new Set(['medianCubital']));
  for(const family of ['medianCubital']){
    const pair=pins.entries.filter((row:Pin)=>row.family===family);
    assert.equal(pair.length,2,`${family}: bilateral pair`);
    assert.deepEqual(new Set(pair.map((row:Pin)=>row.identity.laterality)),new Set(['left','right']),family);
  }
  assert.deepEqual(new Set(pins.entries.map((row:Pin)=>row.identity.fmaId)),new Set(['FMA22964','FMA22965']));
  assert.deepEqual(new Set(pins.entries.map((row:Pin)=>row.identity.bundle)),new Set(['cubital-veins']));
  assert.equal(pins.bundles.length,1);
  assert.equal(pins.bundles[0].id,'cubital-veins');
  const live=await imported();
  const history=await import(pathToFileURL(atlas+'/scripts/exact-source-history-api.mjs').href);
  const api=await history.exactSourceHistoryApi(completedEpoch,'median-cubital-xray-epoch');
  const portalTours=await history.exactSourceHistoryApi(portalTourEpoch,'review-security');
  assert.equal(portalTours.regionalTours.length,48,'genuine portal-tour epoch count');
  assert.equal(portalTours.regionalTours.reduce((n:number,tour:{steps:unknown[]})=>n+tour.steps.length,0),290,
    'genuine portal-tour epoch stop count');
  const addedPortalTour=portalTours.regionalTours.find((tour:{id:string})=>
    tour.id==='portal-hepatic-venous-relationships');
  assert(addedPortalTour,'the eight-stop portal tour exists in its pinned epoch');
  assert.equal(addedPortalTour.steps.length,8);
  assert.deepEqual(portalTours.regionalTours.filter((tour:{id:string})=>tour.id!==addedPortalTour.id),
    api.regionalTours,'the portal epoch retains the complete completed-era tour registry');
  assert.equal(live.regionalTours.length,51,'checked current Review tour count');
  for(const pin of pins.entries)
    assert.deepEqual(live.bodyLesson(pin.identity,'xray'),api.bodyLesson(pin.identity,'xray'),
      `${pin.identity.id}: completed median cubital draft retained in current import`);
  const rawCatalog=json('atlas-review/public/models/bodyparts3d/full-body/catalog.json');
  const catalog=api.bodyDisplayCatalog(rawCatalog),ids=new Set<string>(pins.entries.map((row:Pin)=>row.identity.id));
  assert.equal(catalog.structures.length,1104);assert.equal(api.contentTabs.length,9);
  assert.equal(api.regionalTours.length,47);
  assert.equal(api.regionalTours.reduce((n:number,tour:{steps:unknown[]})=>n+tour.steps.length,0),282);
  assert.equal(sha(JSON.stringify(catalog)),pins.catalogHash);
  assert.deepEqual(catalog.coordinateSystem,pins.coordinateSystem);
  for(const bundle of pins.bundles as {id:string;url:string;bytes:number;sha256:string}[]){
    const urlPath=bundle.url.split('?')[0],sourcePath='public'+urlPath;
    assert.match(urlPath,/^\/models\//,bundle.id);
    assert.equal(existsSync('atlas-review/'+sourcePath),false,`${bundle.id}: no GLB in protected Review`);
    const learnerPath=urlPath.slice('/models/'.length),relativePath='models/'+learnerPath;
    const manifestFile:File&{bytes:number}=learners[0].manifest.files.find((f:File)=>f.path===relativePath);
    assert(manifestFile,`${bundle.id}: learner manifest`);
    assert.equal(manifestFile.bytes,bundle.bytes,`${bundle.id}: learner bytes`);
    assert.equal(manifestFile.sha256,bundle.sha256,`${bundle.id}: learner hash`);
    const bytes=readFileSync(learners[0].base+relativePath);
    assert.equal(bytes.length,bundle.bytes,`${bundle.id}: delivered bytes`);
    assert.equal(sha(bytes),bundle.sha256,`${bundle.id}: delivered hash`);
    assert.equal(sha(committed(parent,sourcePath)),bundle.sha256,`${bundle.id}: original source geometry`);
  }
  const learnerJs=learners.filter(item=>item.name==='head-neck'||item.name==='shoulder').map(({name,base,manifest})=>({name,
    text:manifest.files.filter((f:File)=>f.path.endsWith('.js')).map((f:File)=>{
      const bytes=readFileSync(base+f.path);assert.equal(sha(bytes),f.sha256,`${name}: ${f.path}`);
      return bytes.toString();}).join('\n')}));
  const prior=await import(pathToFileURL(atlas+'/scripts/exact-source-history-api.mjs').href);
  const before=await prior.exactSourceHistoryApi(parent,'review-security');
  assert.deepEqual(api.regionalTours,before.regionalTours,'all original tour steps and camera sequences');
  const oldElbow=json('atlas-review/content/elbow-arterial-ultrasound-pins.json');
  assert.equal(oldElbow.entries.length,8);
  for(const row of oldElbow.entries)assert.deepEqual(api.bodyLesson(row.identity,'ultrasound'),
    await before.bodyLesson(row.identity,'ultrasound'),`${row.identity.id}: original elbow US`);
  let changed=0,preserved=0,changedPackets=0,preservedPackets=0,storageCalls=0;
  const storage={prepare(){storageCalls++;throw Error('Rejected decision reached storage');}};
  for(const s of catalog.structures){
    for(const tab of api.contentTabs){
      const oldLesson=await before.bodyLesson(s,tab),lesson=api.bodyLesson(s,tab);
      if(ids.has(s.id)&&tab==='xray'){
        const pin:Pin=pins.entries.find((row:Pin)=>row.identity.id===s.id);
        assert.deepEqual(s,pin.identity,s.id);assert.deepEqual(oldLesson,pin.previous,s.id);
        assert.deepEqual(lesson,api.medianCubitalXrayLesson(s,tab),s.id);
        assert.equal(lesson.readiness,'draft',s.id);
        assert.deepEqual(api.bodyContent(s,tab),((({readiness,...shown}:any)=>shown)(lesson)),s.id);
        assert(lesson.citations.every((url:string)=>Object.values(api.medianCubitalXrayReferences).includes(url)),s.id);
        for(const learner of learnerJs){
          for(const value of [api.medianCubitalXrayTeaching.medianCubital.title,
            lesson.body,...lesson.bullets,lesson.note,...lesson.citations])
            assert(learner.text.includes(value),`${learner.name}: ${s.id} lesson text`);
        }
        assert.match(lesson.body,/two selected haemodialysis access-creation cases/);
        assert.match(lesson.body,/injection access site/);
        assert.match(lesson.body,/does not establish that the selected median cubital segment is depicted/);
        assert(lesson.bullets.some((line:string)=>line.includes('Ukoha')&&line.includes('surface venous configurations')));
        assert(lesson.bullets.some((line:string)=>line.includes('not X-ray or venographic identification')));
        assert(lesson.bullets.some((line:string)=>line.includes('No contrast choice, cannulation route')));
        assert.match(lesson.note,/revision-bound radiologist review/);
        const forgedStructure=wire(s);forgedStructure.sources[0].sha256='0'.repeat(64);
        assert.equal(api.medianCubitalXrayLesson(forgedStructure,'xray'),undefined,
          `${s.id}: source identity required`);
        assert.equal(api.medianCubitalXrayLesson(s,'ultrasound'),undefined,`${s.id}: X-ray only`);
        changed++;
      }else{assert.deepEqual(lesson,oldLesson,`${s.id}:${tab}: prior teaching`);preserved++;}
    }
    const previous=wire(await before.bodyReviewMaterial(s.id)),packet=wire(await api.bodyReviewMaterial(s.id));
    if(!ids.has(s.id)){assert.deepEqual(packet,previous,`${s.id}: prior packet`);preservedPackets++;continue;}
    assert.equal(packet.approval,false);assert.equal(packet.status,'worksheet-not-submitted');
    const unchangedPacketFields=({topics,fingerprints,materialHash,...rest}:any)=>rest;
    assert.deepEqual(unchangedPacketFields(packet),unchangedPacketFields(previous),`${s.id}: all non-teaching packet fields`);
    assert.deepEqual(packet.source,previous.source,s.id);
    for(const field of ['reasoning','guidedTours','checklist','atlasLink','limits'])
      assert.deepEqual(packet[field],previous[field],`${s.id}:${field}`);
    assert.deepEqual(packet.topics.filter((topic:any)=>topic.tab!=='xray'),
      previous.topics.filter((topic:any)=>topic.tab!=='xray'),s.id);
    assert.deepEqual(packet.topics.find((topic:any)=>topic.tab==='xray'),
      {tab:'xray',...api.bodyLesson(s,'xray')},s.id);
    assert.equal(packet.fingerprints.source,previous.fingerprints.source,s.id);
    assert.notEqual(packet.fingerprints.teaching,previous.fingerprints.teaching,s.id);
    assert.notEqual(packet.materialHash,previous.materialHash,s.id);
    assert.deepEqual(await api.parseBodyReviewResponse(packet,s.id),packet,s.id);
    assert.equal(await api.parseBodyReviewResponse(previous,s.id),null,`${s.id}: stale worksheet`);
    for(const change of ['missing','body','citation','source','readiness','approval']){
      const bad=wire(packet),topic=bad.topics.find((row:any)=>row.tab==='xray');
      if(change==='missing')bad.topics.splice(bad.topics.indexOf(topic),1);
      if(change==='body')topic.body+=' forged';
      if(change==='citation')topic.citations[0]='https://forged.invalid';
      if(change==='source')bad.source.structure.sources[0].sha256='0'.repeat(64);
      if(change==='readiness')topic.readiness='approved';
      if(change==='approval')bad.approval=true;
      assert.equal(await api.parseBodyReviewResponse(bad,s.id),null,`${s.id}: ${change}`);
    }
    const oldContext=await before.bodyReviewContext(s.id),context=await api.bodyReviewContext(s.id);
    assert.equal(context.sourceHash,oldContext.sourceHash,s.id);
    assert.notEqual(context.revisions.teaching,oldContext.revisions.teaching,s.id);
    const decision={catalogScope:context.catalogScope,structureId:s.id,track:'teaching',expectedVersion:0,
      materialHash:context.materialHash,revisionHash:context.revisions.teaching,checklistVersion:context.checklistVersion,
      draft:api.blankBodyReview(context,'teaching')};
    const save=(input:unknown)=>api.postBodyDecision(new Request('https://review.test/api/body-decisions',{
      method:'POST',headers:{origin:'https://review.test','content-type':'application/json',
        'oai-authenticated-user-id':'offline-synthetic-median-cubital-reviewer'},body:JSON.stringify(input)}),storage);
    assert.equal((await save({...decision,materialHash:oldContext.materialHash,
      revisionHash:oldContext.revisions.teaching})).status,409,s.id);
    const forged=wire(decision);forged.draft.checks.foreign=true;
    assert.equal((await save(forged)).status,422,s.id);
    const approval=wire(decision);approval.draft.status='approved';
    assert.equal((await save(approval)).status,422,s.id);
    changedPackets++;
  }
  assert.deepEqual([changed,preserved,changedPackets,preservedPackets,storageCalls],[2,9934,2,1102,0]);
  const previousXray=json('atlas-review/content/forearm-vascular-xray-pins.json');
  assert.equal(previousXray.entries.length,8);
  const previousIds=new Set<string>(previousXray.entries.map((entry:Pin)=>entry.identity.id));
  for(const entry of previousXray.entries){
    assert.deepEqual(api.bodyLesson(entry.identity,'xray'),await before.bodyLesson(entry.identity,'xray'),
      `${entry.identity.id}: earlier forearm X-ray preserved`);
  }
  const pendingForearm=catalog.structures.filter((s:{id:string;region:string;category:string})=>
    s.region==='forearm'&&s.category==='vessel'&&!ids.has(s.id)&&!previousIds.has(s.id));
  assert.equal(pendingForearm.length,14);
  for(const s of pendingForearm)assert.equal(api.bodyLesson(s,'xray').readiness,'pending',s.id);
  const middle=catalog.structures.filter((s:{id:string})=>s.id.includes('middle-collateral-branch-of-')&&
    s.id.includes('-deep-brachial-artery'));
  assert.equal(middle.length,2);
  for(const s of middle){assert.equal(api.medianCubitalXrayLesson(s,'ultrasound'),undefined);
    assert.equal(api.bodyLesson(s,'ultrasound').readiness,'pending');}
});

test('private inbox binds two new teaching revisions and refuses stale continuation before database reads',async()=>{
  const {getClinicalReviewInbox,clinicalReviewEntries}=await inbox(),api=await imported();
  const oldSnapshot=json(oldSnapshotPath);
  assert.equal(oldSnapshot.sourceCommit,parent);assert.equal(oldSnapshot.catalogRevision,oldCatalog);
  assert.equal(oldSnapshot.rows.length,2);
  const pins=json('atlas-review/'+pinPath),ids=new Set<string>(pins.entries.map((row:Pin)=>row.identity.id));
  const db=database(),first=await getClinicalReviewInbox(request(),db);
  assert.equal(first.status,200);assert.equal(first.headers.get('Cache-Control'),'private, no-store');
  const catalog=(await first.json()).catalogRevision as string;assert.match(catalog,/^[a-f0-9]{64}$/);
  assert.notEqual(catalog,oldCatalog);
  db.reads.length=0;
  const stale=await getClinicalReviewInbox(request('?page=2&revision='+oldCatalog),db);
  assert.equal(stale.status,409);assert.equal(db.reads.length,0,'stale continuation reached DB reads');
  const selections=clinicalReviewEntries.map((entry:any,index:number)=>({entry,index}))
    .filter(({entry}:any)=>entry.scope==='body'&&ids.has(entry.id));
  assert.equal(selections.length,2);
  const pages=[...new Set<number>(selections.map(({index}:any)=>Math.floor(index/12)+2))];
  const batches:any[]=[];
  for(const page of pages){const response=await getClinicalReviewInbox(request(`?page=${page}&revision=${catalog}`),db);
    assert.equal(response.status,200);batches.push(...(await response.json()).items);}
  const prior=await import(pathToFileURL(atlas+'/scripts/exact-source-history-api.mjs').href);
  const before=await prior.exactSourceHistoryApi(parent,'review-security');
  for(const {entry} of selections){
    const key=JSON.stringify([entry.key,'teaching']),matches=batches.filter((row:any)=>row.key===key);
    assert.equal(matches.length,1,key);const row=matches[0];
    const old=oldSnapshot.rows.find((item:any)=>item.id===entry.id);
    const previous=await before.bodyReviewContext(entry.id),now=await api.bodyReviewContext(entry.id);
    assert(old&&previous&&now,entry.id);assert.equal(old.key,key);assert.equal(old.status,'not-started');
    assert.equal(old.revision,previous.revisions.teaching,entry.id);
    assert.equal(row.href,'/workspace/atlas-review/body?structure='+encodeURIComponent(entry.id)+'&t=teaching');
    assert.equal(row.revision,now.revisions.teaching,entry.id);assert.equal(row.status,'not-started',entry.id);
    assert.equal(now.sourceHash,previous.sourceHash,entry.id);
    assert.notEqual(now.revisions.teaching,previous.revisions.teaching,entry.id);
    assert.notEqual(row.revision,old.revision,entry.id);
  }
  const failed=await getClinicalReviewInbox(request(`?page=${pages[0]}&revision=${catalog}`),database({success:false,results:[]}));
  assert.equal(failed.status,200);
  assert((await failed.json()).items.every((row:any)=>row.status==='unavailable'));
});
