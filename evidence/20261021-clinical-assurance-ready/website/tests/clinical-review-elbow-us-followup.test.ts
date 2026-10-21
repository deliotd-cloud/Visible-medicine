import assert from 'node:assert/strict';
import test from 'node:test';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync,readFileSync,realpathSync} from 'node:fs';
import {createRequire} from 'node:module';
import {isAbsolute,relative,resolve,sep} from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
import {specimenChannelEntrypoint} from './specimen-channel-entrypoint.ts';
import {bodyChannelBaseline,bodyChannelEntrypoint} from './body-channel-source-epoch.ts';
import {admitPreservedClinicalReview} from './clinical-review-current-admission.mjs';
import {currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';
import {loadElbowAdmissionImport,readElbowAdmissionImport} from './elbow-admission-import-history.mjs';

const atlas=currentAtlasDeliveryRoot();
const historicalRoot='F:/VisibleMedicine/staging/20261016-isolated-atlas-integration/canonical-original';
const revision='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const parent='51de4546a0b33a1ce93bfec4c9c43f760bf82b4e';
const completedEpoch='f74eb2529eccc7c4ad0a0f9bcd3fda95f9958c24';
const oldCatalog='44127395e68f0b14da8220fc7f7f490d243555e378a5e2c20dd21abe5a75464a';
const pinPath='content/elbow-arterial-us-followup-pins.json';
const sourcePaths=[pinPath,'content/elbow-arterial-us-followup.ts','lib/elbow-arterial-us-followup.ts'];
const requiredPinsHash='77a719879c723d8a2a0ae6d14ca2298b5b9d57447af466854eb237bf47872d5b';
const oldSnapshotPath='F:/VisibleMedicine/staging/20261013-elbow-us-integration/old-inbox.json';
const require=createRequire(import.meta.url);
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const historicalRead=(path:string)=>{
  assert(typeof path==='string'&&/^(?:atlas-review|public)\//.test(path),'Historical artifact scope');
  assert(!isAbsolute(path)&&!path.includes('\\')&&!path.split('/').some(part=>!part||part==='.'||part==='..'),'Safe historical relative path');
  const root=realpathSync(historicalRoot),target=realpathSync(resolve(root,path)),inside=relative(root,target);
  assert(inside&&inside!=='..'&&!inside.startsWith('..'+sep)&&!isAbsolute(inside),'Historical artifact outside closed snapshot');
  return readFileSync(target);
};
const historicalJson=(path:string)=>JSON.parse(historicalRead(path).toString());
const sha=(bytes:Uint8Array|string)=>createHash('sha256').update(bytes).digest('hex');
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));
const git=(args:string[])=>execFileSync('git',args,{cwd:atlas,windowsHide:true,maxBuffer:64e6,
  env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
const committed=(commit:string,path:string)=>git(['show',`${commit}:${path}`]);
const norm=(bytes:Uint8Array)=>Buffer.from(bytes).toString('utf8').replaceAll('\r\n','\n');
type File={path:string;sha256:string;sourceSha256?:string;importedSha256?:string};
type Pin={identity:any;family:string;previous:any};

async function imported(){
  const built=await build({stdin:{contents:[
    "export {bodyLesson,bodyContent} from './atlas-review/app/body-content';",
    "export {elbowArterialUsFollowupLesson} from './atlas-review/lib/elbow-arterial-us-followup';",
    "export {elbowArterialUsFollowupReferences,elbowArterialUsFollowupTeaching,elbowArterialUsFollowupNote} from './atlas-review/content/elbow-arterial-us-followup';",
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
  {headers:{'oai-authenticated-user-id':'offline-elbow-us-inbox-fixture'}});

test('six exact elbow arterial ultrasound drafts reach protected Review and two learner modules', {timeout:180000}, async()=>{
  assert.equal(git(['rev-parse',`${revision}^{tree}`]).toString().trim(),'1bd327fb20a52b35bec584675c457173c548e24b');
  const review=historicalJson('atlas-review/manifest.json');assert.equal(review.revision,revision);
  const viewerBase='public/atlas-review-viewer/',viewer=historicalJson(viewerBase+'manifest.json');
  assert.equal(viewer.sourceCommit,revision);
  assert.equal(viewer.websiteIntegrationSha256,review.websiteIntegrationSha256);
  assert.equal(viewer.personalRecordsIncluded,false);
  const learners=['head-neck','shoulder','lower-limb','female-pelvis'].map(name=>({name,base:`public/atlas-runtime/${name}/`,
    manifest:historicalJson(`public/atlas-runtime/${name}/manifest.json`)}));
  for(const {name,manifest} of learners){assert.equal(manifest.sourceCommit,revision,name);
    assert.equal(manifest.patientDataIncluded,false,name);assert.equal(manifest.clinicalApproved,false,name);}
  const learnerInputs=new Map<string,File[]>(learners.map(({name,base})=>[name,historicalJson(base+'source-inputs.json')]));
  for(const [name,path,pattern] of [
    ['head-neck','integration/head-neck/main.tsx',/BodyExplorer initialRegion=/],
    ['shoulder','integration/shoulder/main.tsx',/ShoulderExplorer initialSelectedId=/],
    ['lower-limb','integration/lower-limb/main.tsx',/KneeSpecimenView key=\{scope\} specimen=\{limbDefinitions\[scope\]\}/],
    ['female-pelvis','integration/female-pelvis/main.tsx',/KneeSpecimenView specimen=\{hraPelvisDefinition\}/],
  ] as const){
    const source=committed(revision,path);
    assert.equal(learnerInputs.get(name)!.find(f=>f.path===path)?.sha256,sha(source),`${name}: entrypoint`);
    assert.match(norm(source),pattern,`${name}: learner scope`);
    const precedingEntrypoint=specimenChannelEntrypoint(norm(committed(parent,path)),name);
    assert.equal(norm(committed(bodyChannelBaseline,path)),precedingEntrypoint,`${name}: original entrypoint plus exact opt-in channel at the preceding source epoch`);
    assert.equal(norm(source),bodyChannelEntrypoint(precedingEntrypoint,name),`${name}: exact additional root-body channel only`);
  }
  for(const path of ['app/body-content.ts',...sourcePaths]){
    const source=committed(revision,path),copy=readElbowAdmissionImport('atlas-review/'+path),record:File=review.files.find((f:File)=>f.path===path);
    assert(record,path);assert.equal(record.sourceSha256,sha(source),path);
    assert.equal(record.importedSha256,sha(copy),path);
    assert.equal(norm(copy),norm(source),`${path}: historical Review import equals committed Atlas source`);
    if(path!=='app/body-content.ts')assert.equal(norm(copy),norm(source),`${path}: imported source`);
    for(const name of ['head-neck','shoulder'])assert.equal(learnerInputs.get(name)!.find(f=>f.path===path)?.sha256,
      sha(source),`${name}: ${path} input`);
    for(const base of ['public/atlas-review/',viewerBase,...learners.map(item=>item.base)])
      assert.equal(existsSync(historicalRoot+'/'+base+path),false,`${base+path}: raw source exposed`);
  }
  for(const [name,path] of [['lower-limb','public/models/um-limb/catalog.json'],
    ['female-pelvis','public/models/hra-pelvis/catalog.json']] as const){
    const source=committed(revision,path),catalog=historicalJson('atlas-review/'+path);
    assert.equal(learnerInputs.get(name)!.find(f=>f.path===path)?.sha256,sha(source),`${name}: catalog input`);
    assert.deepEqual(catalog,JSON.parse(norm(source)),`${name}: independent catalog`);
    assert.equal(norm(source),norm(committed(parent,path)),`${name}: original specimen source`);
  }
  const pins=historicalJson('atlas-review/'+pinPath);
  assert.equal(sha(JSON.stringify(pins)),requiredPinsHash);
  assert.equal(pins.parentCommit,parent);assert.equal(pins.entries.length,6);
  assert.equal(new Set(pins.entries.map((row:Pin)=>row.identity.id)).size,6);
  assert.deepEqual(new Set(pins.entries.map((row:Pin)=>row.family)),
    new Set(['recurrentInterosseous','anteriorUlnarRecurrent','radialCollateral']));
  const api=await loadElbowAdmissionImport(),rawCatalog=historicalJson('atlas-review/public/models/bodyparts3d/full-body/catalog.json');
  const catalog=api.bodyDisplayCatalog(rawCatalog),ids=new Set<string>(pins.entries.map((row:Pin)=>row.identity.id));
  assert.equal(catalog.structures.length,1104);assert.equal(api.contentTabs.length,9);
  assert.equal(sha(JSON.stringify(catalog)),pins.catalogHash);
  assert.deepEqual(catalog.coordinateSystem,pins.coordinateSystem);
  for(const bundle of pins.bundles as {id:string;url:string;bytes:number;sha256:string}[]){
    const urlPath=bundle.url.split('?')[0],sourcePath='public'+urlPath;
    assert.match(urlPath,/^\/models\//,bundle.id);
    assert.equal(existsSync(historicalRoot+'/atlas-review/'+sourcePath),false,`${bundle.id}: no GLB in protected Review`);
    const learnerPath=urlPath.slice('/models/'.length),relativePath='models/'+learnerPath;
    const manifestFile:File&{bytes:number}=learners[0].manifest.files.find((f:File)=>f.path===relativePath);
    assert(manifestFile,`${bundle.id}: learner manifest`);
    assert.equal(manifestFile.bytes,bundle.bytes,`${bundle.id}: learner bytes`);
    assert.equal(manifestFile.sha256,bundle.sha256,`${bundle.id}: learner hash`);
    const bytes=historicalRead(learners[0].base+relativePath);
    assert.equal(bytes.length,bundle.bytes,`${bundle.id}: delivered bytes`);
    assert.equal(sha(bytes),bundle.sha256,`${bundle.id}: delivered hash`);
    assert.equal(sha(committed(parent,sourcePath)),bundle.sha256,`${bundle.id}: original source geometry`);
  }
  const learnerJs=learners.filter(item=>item.name==='head-neck'||item.name==='shoulder').map(({name,base,manifest})=>({name,
    text:manifest.files.filter((f:File)=>f.path.endsWith('.js')).map((f:File)=>{
      const bytes=historicalRead(base+f.path);assert.equal(sha(bytes),f.sha256,`${name}: ${f.path}`);
      return bytes.toString();}).join('\n')}));
  const prior=await import(pathToFileURL(atlas+'/scripts/exact-source-history-api.mjs').href);
  const before=await prior.exactSourceHistoryApi(parent,'review-security');
  const completed=await prior.exactSourceHistoryApi(completedEpoch,'review-security');
  assert.equal(api.regionalTours.filter((tour:{id:string})=>tour.id!=='portal-hepatic-venous-relationships').length,47);
  assert.equal(api.regionalTours.length,48);
  assert.equal(api.regionalTours.filter((tour:{id:string})=>tour.id!=='portal-hepatic-venous-relationships').reduce((n:number,tour:{steps:unknown[]})=>n+tour.steps.length,0),282);
  assert.equal(api.regionalTours.reduce((n:number,tour:{steps:unknown[]})=>n+tour.steps.length,0),290);
  assert.deepEqual(api.regionalTours.filter((tour:{id:string})=>tour.id!=='portal-hepatic-venous-relationships'),before.regionalTours,'all original tour steps and camera sequences');
  const oldElbow=historicalJson('atlas-review/content/elbow-arterial-ultrasound-pins.json');
  assert.equal(oldElbow.entries.length,8);
  for(const row of oldElbow.entries)assert.deepEqual(api.bodyLesson(row.identity,'ultrasound'),
    await before.bodyLesson(row.identity,'ultrasound'),`${row.identity.id}: original elbow US`);
  let changed=0,preserved=0,changedPackets=0,preservedPackets=0,storageCalls=0;
  const storage={prepare(){storageCalls++;throw Error('Rejected decision reached storage');}};
  for(const s of catalog.structures){
    for(const tab of api.contentTabs){
      const oldLesson=await before.bodyLesson(s,tab),lesson=await completed.bodyLesson(s,tab);
      if(ids.has(s.id)&&tab==='ultrasound'){
        assert.deepEqual(api.bodyLesson(s,tab),lesson,`${s.id}: completed US persists in current integration`);
        const pin:Pin=pins.entries.find((row:Pin)=>row.identity.id===s.id);
        assert.deepEqual(s,pin.identity,s.id);assert.deepEqual(oldLesson,pin.previous,s.id);
        assert.deepEqual(lesson,api.elbowArterialUsFollowupLesson(s,tab),s.id);
        assert.equal(lesson.readiness,'draft',s.id);
        assert.deepEqual(api.bodyContent(s,tab),((({readiness,...shown}:any)=>shown)(lesson)),s.id);
        assert(lesson.citations.every((url:string)=>Object.values(api.elbowArterialUsFollowupReferences).includes(url)),s.id);
        for(const learner of learnerJs){assert(learner.text.includes(lesson.body),`${learner.name}: ${s.id} body`);
          for(const citation of lesson.citations)assert(learner.text.includes(citation),`${learner.name}: ${s.id} citation`);}
        changed++;
      }else{assert.deepEqual(lesson,oldLesson,`${s.id}:${tab}: prior teaching`);preserved++;}
    }
    const previous=wire(await before.bodyReviewMaterial(s.id)),packet=wire(await completed.bodyReviewMaterial(s.id));
    if(!ids.has(s.id)){assert.deepEqual(packet,previous,`${s.id}: prior packet`);preservedPackets++;continue;}
    assert.deepEqual(wire(await api.bodyReviewMaterial(s.id)),packet,`${s.id}: completed US packet persists in historical integration`);
    assert.equal(packet.approval,false);assert.equal(packet.status,'worksheet-not-submitted');
    const unchangedPacketFields=({topics,fingerprints,materialHash,...rest}:any)=>rest;
    assert.deepEqual(unchangedPacketFields(packet),unchangedPacketFields(previous),`${s.id}: all non-teaching packet fields`);
    assert.deepEqual(packet.source,previous.source,s.id);
    for(const field of ['reasoning','guidedTours','checklist','atlasLink','limits'])
      assert.deepEqual(packet[field],previous[field],`${s.id}:${field}`);
    assert.deepEqual(packet.topics.filter((topic:any)=>topic.tab!=='ultrasound'),
      previous.topics.filter((topic:any)=>topic.tab!=='ultrasound'),s.id);
    assert.deepEqual(packet.topics.find((topic:any)=>topic.tab==='ultrasound'),
      {tab:'ultrasound',...api.bodyLesson(s,'ultrasound')},s.id);
    assert.equal(packet.fingerprints.source,previous.fingerprints.source,s.id);
    assert.notEqual(packet.fingerprints.teaching,previous.fingerprints.teaching,s.id);
    assert.notEqual(packet.materialHash,previous.materialHash,s.id);
    assert.deepEqual(await api.parseBodyReviewResponse(packet,s.id),packet,s.id);
    assert.equal(await api.parseBodyReviewResponse(previous,s.id),null,`${s.id}: stale worksheet`);
    for(const change of ['missing','body','citation','source','readiness','approval']){
      const bad=wire(packet),topic=bad.topics.find((row:any)=>row.tab==='ultrasound');
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
        'oai-authenticated-user-id':'offline-synthetic-elbow-us-reviewer'},body:JSON.stringify(input)}),storage);
    assert.equal((await save({...decision,materialHash:oldContext.materialHash,
      revisionHash:oldContext.revisions.teaching})).status,409,s.id);
    const forged=wire(decision);forged.draft.checks.foreign=true;
    assert.equal((await save(forged)).status,422,s.id);
    const approval=wire(decision);approval.draft.status='approved';
    assert.equal((await save(approval)).status,422,s.id);
    changedPackets++;
  }
  assert.deepEqual([changed,preserved,changedPackets,preservedPackets,storageCalls],[6,9930,6,1098,0]);
  const middle=catalog.structures.filter((s:{id:string})=>s.id.includes('middle-collateral-branch-of-')&&
    s.id.includes('-deep-brachial-artery'));
  assert.equal(middle.length,2);
  for(const s of middle){assert.equal(api.elbowArterialUsFollowupLesson(s,'ultrasound'),undefined);
    assert.equal(api.bodyLesson(s,'ultrasound').readiness,'pending');}
});

test('private inbox binds six new teaching revisions and refuses stale continuation before database reads',async()=>{
  const currentRevision=admitPreservedClinicalReview({revision,sourceHashes:{
    'content/elbow-arterial-us-followup-pins.json':'600b41f1450cff784357c6bea48d2a42e41956daed6b9175b3e4b082609812f4',
    'content/elbow-arterial-us-followup.ts':'e3bb97895a657b6fa84e2d5ef6f5a95daf25f8b981ca9e9d0c0b1c760e51ce87',
    'lib/elbow-arterial-us-followup.ts':'6fe4b9a9d3bbc2adde6cf2e2f2f4a9c8afdc36a0613b422faf80da2568d15437',
  },learnerModules:['head-neck','shoulder']});
  assert.equal(json('atlas-review/manifest.json').revision,currentRevision);
  const {getClinicalReviewInbox,clinicalReviewEntries}=await inbox(),api=await imported();
  const oldSnapshot=json(oldSnapshotPath);
  assert.equal(oldSnapshot.sourceCommit,parent);assert.equal(oldSnapshot.catalogRevision,oldCatalog);
  assert.equal(oldSnapshot.rows.length,6);
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
  assert.equal(selections.length,6);
  const pages=[...new Set<number>(selections.map(({index}:any)=>Math.floor(index/12)+2))];
  const batches:any[]=[];
  for(const page of pages){const response=await getClinicalReviewInbox(request(`?page=${page}&revision=${catalog}`),db);
    assert.equal(response.status,200);batches.push(...(await response.json()).items);}
  const prior=await import(pathToFileURL(atlas+'/scripts/exact-source-history-api.mjs').href);
  const before=await prior.exactSourceHistoryApi(parent,'review-security');
  const completed=await prior.exactSourceHistoryApi(completedEpoch,'review-security');
  for(const {entry} of selections){
    const key=JSON.stringify([entry.key,'teaching']),matches=batches.filter((row:any)=>row.key===key);
    assert.equal(matches.length,1,key);const row=matches[0];
    const old=oldSnapshot.rows.find((item:any)=>item.id===entry.id);
    const previous=await before.bodyReviewContext(entry.id),now=await api.bodyReviewContext(entry.id);
    const identity=(pins.entries as Pin[]).find(pin=>pin.identity.id===entry.id)?.identity;assert(identity,entry.id);
    const deliveredLesson=api.bodyLesson(identity,'ultrasound');
    const completedLesson=await completed.bodyLesson(identity,'ultrasound');
    assert.deepEqual(deliveredLesson,completedLesson,`${entry.id}: unchanged six-draft teaching`);
    assert.equal(deliveredLesson.readiness,'draft',entry.id);
    const deliveredPacket=wire(await api.bodyReviewMaterial(entry.id));
    const completedPacket=wire(await completed.bodyReviewMaterial(entry.id));
    assert.deepEqual(deliveredPacket.topics.find((topic:any)=>topic.tab==='ultrasound'),
      completedPacket.topics.find((topic:any)=>topic.tab==='ultrasound'),`${entry.id}: current Review teaching topic`);
    assert.deepEqual(deliveredPacket.source.structure,identity,`${entry.id}: current Review source identity`);
    assert.equal(deliveredPacket.approval,false,entry.id);
    assert.equal(deliveredPacket.status,'worksheet-not-submitted',entry.id);
    assert.deepEqual(await api.parseBodyReviewResponse(deliveredPacket,entry.id),deliveredPacket,
      `${entry.id}: current Review worksheet parses`);
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
