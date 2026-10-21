import assert from 'node:assert/strict';
import test from 'node:test';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync,readFileSync,realpathSync} from 'node:fs';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {resolve,relative,isAbsolute} from 'node:path';
import {build} from 'esbuild';
import {specimenChannelEntrypoint} from './specimen-channel-entrypoint.ts';
import {bodyChannelBaseline,bodyChannelEntrypoint} from './body-channel-source-epoch.ts';
import {admitPreservedClinicalReview} from './clinical-review-current-admission.mjs';
import {currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';
import {loadForearmAdmissionImport,readForearmAdmissionImport} from './forearm-admission-import-history.mjs';

const atlas=currentAtlasDeliveryRoot();
const historicalRoot='F:/VisibleMedicine/staging/20261016-isolated-atlas-integration/canonical-original';
const revision='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const completedEpoch='d81bbe14def4249d9d081de6a9f9f823e4fad69a';
const parent='f74eb2529eccc7c4ad0a0f9bcd3fda95f9958c24';
const oldCatalog='a3f7444136dc9c8dee883f1f868fda4a544cbb2b6b5d71633e4b683fb28a94a9';
const pinPath='content/forearm-vascular-xray-pins.json';
const sourcePaths=[pinPath,'content/forearm-vascular-xray.ts','lib/forearm-vascular-xray.ts'];
const requiredPinsHash='df3e3a88aae6c514fb4677ddd64d35e17e3af8e15f9fd91e9b2d8f06e1887785';
const oldSnapshotPath='F:/VisibleMedicine/staging/20261013-forearm-xray-integration/old-inbox.json';
const require=createRequire(import.meta.url);
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const historicalRead=(path:string)=>{
  assert(typeof path==='string'&&/^(?:atlas-review|public)\//.test(path),'Historical artifact scope');
  assert(!isAbsolute(path)&&!path.includes('\\')&&!path.split('/').some(part=>!part||part==='.'||part==='..'),'Safe historical relative path');
  const root=realpathSync(historicalRoot),target=realpathSync(resolve(root,path)),inside=relative(root,target);
  assert(inside&&!inside.startsWith('..')&&!isAbsolute(inside),'Historical artifact outside snapshot');
  const bytes=readFileSync(target);
  if(path.startsWith('atlas-review/')&&path!=='atlas-review/manifest.json')assert.deepEqual(bytes,readForearmAdmissionImport(path));
  return bytes;
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
    "export {forearmVascularXrayLesson} from './atlas-review/lib/forearm-vascular-xray';",
    "export {forearmVascularXrayReferences,forearmVascularXrayTeaching,forearmVascularXrayNote} from './atlas-review/content/forearm-vascular-xray';",
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
  {headers:{'oai-authenticated-user-id':'offline-forearm-xray-inbox-fixture'}});

test('eight exact forearm vascular X-ray drafts reach protected Review and two learner modules', {timeout:180000}, async()=>{
  assert.equal(git(['rev-parse',revision+'^{commit}']).toString().trim(),revision);
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
    const source=committed(revision,path),copy=historicalRead('atlas-review/'+path),record:File=review.files.find((f:File)=>f.path===path);
    assert(record,path);assert.equal(record.sourceSha256,sha(source),path);
    assert.equal(record.importedSha256,sha(copy),path);
    assert.equal(norm(copy),norm(source),`${path}: historical imported source equals committed Atlas source`);
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
  assert.equal(pins.parentCommit,parent);assert.equal(pins.entries.length,8);
  assert.equal(new Set(pins.entries.map((row:Pin)=>row.identity.id)).size,8);
  assert.deepEqual(new Set(pins.entries.map((row:Pin)=>row.family)),
    new Set(['radial','ulnar','cephalic','basilic']));
  for(const family of ['radial','ulnar','cephalic','basilic']){
    const pair=pins.entries.filter((row:Pin)=>row.family===family);
    assert.equal(pair.length,2,`${family}: bilateral pair`);
    assert.deepEqual(new Set(pair.map((row:Pin)=>row.identity.laterality)),new Set(['left','right']),family);
  }
  assert.equal(pins.bundles.length,1);
  assert.equal(pins.bundles[0].id,'forearm-vessels-recovery');
  const live=await loadForearmAdmissionImport();
  const history=await import(pathToFileURL(atlas+'/scripts/exact-source-history-api.mjs').href);
  const api=await history.exactSourceHistoryApi(completedEpoch,'forearm-vascular-xray-epoch');
  for(const pin of pins.entries)
    assert.deepEqual(live.bodyLesson(pin.identity,'xray'),api.bodyLesson(pin.identity,'xray'),
      `${pin.identity.id}: completed forearm draft retained in current import`);
  const rawCatalog=historicalJson('atlas-review/public/models/bodyparts3d/full-body/catalog.json');
  const catalog=api.bodyDisplayCatalog(rawCatalog),ids=new Set<string>(pins.entries.map((row:Pin)=>row.identity.id));
  assert.equal(catalog.structures.length,1104);assert.equal(api.contentTabs.length,9);
  assert.equal(api.regionalTours.length,47);
  assert.equal(api.regionalTours.reduce((n:number,tour:{steps:unknown[]})=>n+tour.steps.length,0),282);
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
  assert.deepEqual(api.regionalTours,before.regionalTours,'all original tour steps and camera sequences');
  assert.equal(git(['rev-parse',`${completedEpoch}^{tree}`]).toString().trim(),'59c5d9b75ebec50fb093648e9ec5a6832055f074');
  const tourEpochs=[
    ['portal','47a851db0fb3369ad056fb8a8fcc3f3ba73656ea','753a220221084bfc5dab89b94e0db917719a8ddc','c832b8cafa2a53a79d244dfa223288b7fd255be6'],
    ['cervical','c26ef4bf570f05e4b0e078a620db49ca67922ed9','72c74532612b9f93705a968fbdd2d7bfd944b2b0','4413e022e1370502a1fad6ae6253858c2abef57b'],
    ['medial','469b2f6874cc3f8209c2f7b36fd830cae18dce9e','ba18dce64f922757ecc6179aa773dfd9e00ba79c','ce6c5c5fac960b06a02687269e232ba82146ca41'],
    ['venous','628102945520c98aaca1c9fd9e539839caa1f324','c505b43fe67a1d9b468fadfd40756f3b158ddb58','2970f4a9f5a4349bdd32cbdcdc2c12af145fa7a2'],
    ['calf','840fcbf73e29a9c146a84ca8c232ca5c762c1672','a9dd6a3a34a391c59e5fc0d4051abb2c2eccec98','21491364533fde93c8f389e0d6339578f91d2048'],
    ['playback','c978ecee3bdddfeaf2995ecbf62d5178e719c4fb','5b468123c407a2ffc8eeacd88a42b9a56ef7f688','fb65a9c68d8753fc1789c7e6281e36c2889e0136'],
  ] as const;
  const epochs=new Map<string,any>([['completed',api]]);
  for(const [name,commit,tree,blob] of tourEpochs){
    assert.equal(git(['rev-parse',`${commit}^{tree}`]).toString().trim(),tree,`${name}: genuine tree`);
    assert.equal(git(['merge-base',commit,revision]).toString().trim(),commit,`${name}: ancestor of closed import`);
    assert.equal(git(['rev-parse',`${commit}:lib/regional-tours.ts`]).toString().trim(),blob,`${name}: exact source blob`);
    epochs.set(name,await history.exactSourceHistoryApi(commit,'review-security'));
  }
  const tours=(name:string)=>epochs.get(name).regionalTours as {id:string;steps:{id:string}[]}[];
  const addition=(earlier:string,later:string,id:string,count:number)=>{
    const old=tours(earlier),next=tours(later);
    assert.equal(old.length,count-1,`${earlier}: complete population`);
    assert.equal(next.length,count,`${later}: complete population`);
    assert.deepEqual(next.map(t=>t.id),[...old.map(t=>t.id),id],`${later}: only named addition`);
    assert.deepEqual(next.slice(0,old.length),old,`${later}: old steps and cameras unchanged`);
    assert(next.at(-1)?.steps.length,`${later}: new tour has stops`);
  };
  addition('completed','portal','portal-hepatic-venous-relationships',48);
  assert.equal(tours('portal').reduce((n,t)=>n+t.steps.length,0),290);
  addition('portal','cervical','cervical-whole-discs-orientation',49);
  addition('cervical','medial','right-medial-thigh-orientation',50);
  const medial=tours('medial'),venous=tours('venous'),venousId='right-lower-limb-venous-orientation';
  assert.deepEqual(venous.map(t=>t.id),medial.map(t=>t.id),'venous v2 preserves tour identities');
  for(const old of medial)if(old.id!==venousId)assert.deepEqual(venous.find(t=>t.id===old.id),old,`${old.id}: unchanged by venous v2`);
  const oldVeins=medial.find(t=>t.id===venousId),newVeins=venous.find(t=>t.id===venousId);
  assert(oldVeins&&newVeins);
  assert.deepEqual(oldVeins.steps.map(s=>s.id),['small','popliteal','femoral','great','external','common']);
  assert.deepEqual(newVeins.steps.map(s=>s.id),['small','popliteal','anterior','posterior','femoral','deep','great','external','common']);
  for(const old of oldVeins.steps)assert.notDeepEqual(newVeins.steps.find(s=>s.id===old.id),old,`${old.id}: v2 stop revised`);
  addition('venous','calf','right-posterior-calf-achilles-orientation',51);
  assert.deepEqual(tours('playback'),tours('calf'),'playback preserves all tours and cameras');
  assert.equal(git(['rev-parse',`${revision}:lib/regional-tours.ts`]).toString().trim(),'fb65a9c68d8753fc1789c7e6281e36c2889e0136');
  assert.deepEqual(live.regionalTours,tours('playback'),'closed 9f import has all 51 genuine later tours');
  assert.equal(git(['rev-parse','HEAD']).toString().trim(),'485df97c2530e8e81a8d39a5ee61073ce76d93db');
  assert.equal(git(['rev-parse','HEAD:lib/regional-tours.ts']).toString().trim(),'fb65a9c68d8753fc1789c7e6281e36c2889e0136');
  const regionalRecord:File=json('atlas-review/manifest.json').files.find((f:File)=>f.path==='lib/regional-tours.ts');
  assert(regionalRecord);
  assert.equal(regionalRecord.sourceSha256,'88f195fd9dbfcd4033a5012eeb760f358cca16da7f48cbca8671ef92c69bea97');
  assert.equal(regionalRecord.importedSha256,regionalRecord.sourceSha256);
  assert.equal(sha(committed('HEAD','lib/regional-tours.ts')),regionalRecord.sourceSha256);
  assert.equal(sha(readFileSync('atlas-review/lib/regional-tours.ts')),regionalRecord.importedSha256);
  assert.deepEqual((await imported()).regionalTours,live.regionalTours,'current delivery retains closed 9f tours');
  const oldElbow=historicalJson('atlas-review/content/elbow-arterial-ultrasound-pins.json');
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
        assert.deepEqual(lesson,api.forearmVascularXrayLesson(s,tab),s.id);
        assert.equal(lesson.readiness,'draft',s.id);
        assert.deepEqual(api.bodyContent(s,tab),((({readiness,...shown}:any)=>shown)(lesson)),s.id);
        assert(lesson.citations.every((url:string)=>Object.values(api.forearmVascularXrayReferences).includes(url)),s.id);
        for(const learner of learnerJs){assert(learner.text.includes(lesson.body),`${learner.name}: ${s.id} body`);
          for(const citation of lesson.citations)assert(learner.text.includes(citation),`${learner.name}: ${s.id} citation`);}
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
        'oai-authenticated-user-id':'offline-synthetic-forearm-xray-reviewer'},body:JSON.stringify(input)}),storage);
    assert.equal((await save({...decision,materialHash:oldContext.materialHash,
      revisionHash:oldContext.revisions.teaching})).status,409,s.id);
    const forged=wire(decision);forged.draft.checks.foreign=true;
    assert.equal((await save(forged)).status,422,s.id);
    const approval=wire(decision);approval.draft.status='approved';
    assert.equal((await save(approval)).status,422,s.id);
    changedPackets++;
  }
  assert.deepEqual([changed,preserved,changedPackets,preservedPackets,storageCalls],[8,9928,8,1096,0]);
  const pendingForearm=catalog.structures.filter((s:{id:string;region:string;category:string})=>
    s.region==='forearm'&&s.category==='vessel'&&!ids.has(s.id));
  assert.equal(pendingForearm.length,16);
  for(const s of pendingForearm)assert.equal(api.bodyLesson(s,'xray').readiness,'pending',s.id);
  const middle=catalog.structures.filter((s:{id:string})=>s.id.includes('middle-collateral-branch-of-')&&
    s.id.includes('-deep-brachial-artery'));
  assert.equal(middle.length,2);
  for(const s of middle){assert.equal(api.forearmVascularXrayLesson(s,'ultrasound'),undefined);
    assert.equal(api.bodyLesson(s,'ultrasound').readiness,'pending');}
});

test('private inbox binds eight new teaching revisions and refuses stale continuation before database reads',async()=>{
  const currentRevision=admitPreservedClinicalReview({revision,sourceHashes:{
    'content/forearm-vascular-xray-pins.json':'0591e069fd112b58f7494c2ed940da5ae8d5bb57b467d0569d2710faf53d423e',
    'content/forearm-vascular-xray.ts':'2ab07c989461e6c0a4edba71014e3217a521c98abcd79e08368cdc3ff32a3e22',
    'lib/forearm-vascular-xray.ts':'92c1fc6681bafb0df4668f29b2dc72f2e269c1759e0b22d7c830264dcbcf266c',
  },learnerModules:['head-neck','shoulder']});
  assert.equal(json('atlas-review/manifest.json').revision,currentRevision);
  const {getClinicalReviewInbox,clinicalReviewEntries}=await inbox(),api=await imported();
  const oldSnapshot=json(oldSnapshotPath);
  assert.equal(oldSnapshot.sourceCommit,parent);assert.equal(oldSnapshot.catalogRevision,oldCatalog);
  assert.equal(oldSnapshot.rows.length,8);
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
  assert.equal(selections.length,8);
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
    const deliveredLesson=api.bodyLesson(identity,'xray');
    const completedLesson=await completed.bodyLesson(identity,'xray');
    assert.deepEqual(deliveredLesson,completedLesson,`${entry.id}: unchanged eight-draft teaching`);
    assert.equal(deliveredLesson.readiness,'draft',entry.id);
    const deliveredPacket=wire(await api.bodyReviewMaterial(entry.id));
    const completedPacket=wire(await completed.bodyReviewMaterial(entry.id));
    assert.deepEqual(deliveredPacket.topics.find((topic:any)=>topic.tab==='xray'),
      completedPacket.topics.find((topic:any)=>topic.tab==='xray'),`${entry.id}: current Review teaching topic`);
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

