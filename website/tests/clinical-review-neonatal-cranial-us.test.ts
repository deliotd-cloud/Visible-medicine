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
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
import {boundLiveAtlasHistory} from './atlas-bound-live-history.mjs';
import {restoreOriginalCranialTourSource,assertCurrentCranialTourCatalog} from './cranial-tour-current-epoch.mjs';
import {readNeonatalInboxContexts} from './neonatal-inbox-contexts.mjs';
import {emittedTeachingSearch} from './atlas-emitted-teaching.ts';
import {restorePreRegionalTourHeadEntry} from './restore-pre-tour-head-entry.mjs';

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
const composedTourSource='7978478992f54ea68e0f53c3d195c459c7b80068';
const composedTourBlob='3c5647f29383ba5699b6d387ff528f6b0f8f57b9';
const composedTourSha='b1a1bc9d9d80b84d4d98aed1aaa08aa4e9d7313e58bdd40f3b8a10ea0bab215d';
const pinPath='content/neonatal-cranial-ultrasound-pins.json';
const sourcePaths=[pinPath,'content/neonatal-cranial-ultrasound.ts','lib/neonatal-cranial-ultrasound.ts'];
const requiredPinsHash='aa126b609b4a816083ac5c52b30905b6eda7f66d43cd31f90521664dfe6da53a';
const oldSnapshotPath='F:/VisibleMedicine/staging/20261013-neonatal-us-integration/old-inbox.json';
const require=createRequire(import.meta.url);
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const runtimeSources=validateCurrentAtlasDelivery().runtimeSources;
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
const laterPlaybackTours=new Map([
  ['vm:anatomy:body:head-neck:midline:organ:corpus-callosum','deep-brain-commissures-limbic-landmarks'],
]);
const laterReasoning=new Map([
  ['vm:anatomy:body:head-neck:midline:organ:choroid-plexus-of-cerebral-hemisphere','ventricular-landmark-choroid-plexus'],
]);
const laterPallidalMri=new Set(selections.filter(([family])=>family==='pallidum')
  .map(([,side,slug])=>`vm:anatomy:body:head-neck:${side}:organ:${slug}`));

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
    "export {hamstringTours} from './atlas-review/lib/hamstring-tours';",
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

test('ten exact infant cranial Ultrasound drafts bind to Review and the scoped learners', async()=>{
  assert.equal(checkedAtlasHistoryRepo(historicalRevision),atlas);
  assert.equal(git(['rev-parse',priorTreeOwner+'^{tree}']).toString().trim(),priorTree,
    'Earlier a84 tree remains bound to its actual 6b6d source epoch');
  assert.equal(git(['merge-base',priorTreeOwner,historicalRevision]).toString().trim(),priorTreeOwner);
  assert.equal(git(['merge-base',portalTourRevision,historicalRevision]).toString().trim(),portalTourRevision);
  assert.equal(git(['merge-base',historicalRevision,revision]).toString().trim(),historicalRevision);
  assert.equal(git(['rev-parse',portalTourRevision+':lib/regional-tours.ts']).toString().trim(),portalTourBlob);
  assert.equal(git(['rev-parse',historicalRevision+':lib/regional-tours.ts']).toString().trim(),currentTourBlob);
  assert.equal(git(['merge-base',composedTourSource,revision]).toString().trim(),composedTourSource,
    'Exact composed 53-tour epoch precedes current source');
  assert.equal(git(['rev-parse',`${composedTourSource}:lib/regional-tours.ts`]).toString().trim(),composedTourBlob);
  const composedTourBytes=committed(composedTourSource,'lib/regional-tours.ts');
  assert.equal(sha(composedTourBytes),composedTourSha,'Exact complete 53-tour source');
  assert.deepEqual(restoreOriginalCranialTourSource(composedTourBytes),committed(historicalRevision,'lib/regional-tours.ts'),
    'Complete original tour source restored from exact composed epoch');
  assert.equal(git(['rev-parse','HEAD']).toString().trim(),revision);
  assert.equal(git(['rev-parse',historicalRevision+'^{tree}']).toString().trim(),historicalTree);
  assert.equal(git(['rev-parse',predecessorSource+'^{tree}']).toString().trim(),predecessorSourceTree,'previous integrated source tree retained');
  assert.equal(git(['rev-parse',completedSource+'^{tree}']).toString().trim(),completedSourceTree,'historical completed source tree retained');
  assert.equal(expected.size,10);
  assert.equal(laterPlaybackTours.size,1);
  assert.equal(laterReasoning.size,1);
  assert.equal(laterPallidalMri.size,2);
  const review=json('atlas-review/manifest.json');assert.equal(review.revision,revision);
  const viewerBase='public/atlas-review-viewer/',viewer=json(viewerBase+'manifest.json');
  assert.equal(viewer.sourceCommit,revision);
  assert.equal(viewer.websiteIntegrationSha256,review.websiteIntegrationSha256);
  assert.equal(viewer.personalRecordsIncluded,false);
  const learners=['head-neck','shoulder','lower-limb','female-pelvis'].map(name=>({name,base:`public/atlas-runtime/${name}/`,
    manifest:json(`public/atlas-runtime/${name}/manifest.json`)}));
  const learnerInputs=new Map<string,File[]>(learners.map(({name,base})=>[name,json(base+'source-inputs.json')]));
  const binding=json('atlas-review/integration-inputs.json');
  const centralPath='content/central-neural-imaging.ts';
  assert.equal(git(['rev-parse',`${completedSource}:${centralPath}`]).toString().trim(),
    '910e4590d6f176dee2502b051b92d3da8abfdf40','Original central imaging source blob');
  assert.equal(git(['rev-parse',`${revision}:${centralPath}`]).toString().trim(),
    '24d68ec4669a01deb7cc1682606b25464188c1eb','Current central imaging source blob');
  const beforeCentral=committed(completedSource,centralPath).toString('utf8');
  const pallidalBefore="      ct: fact('Use the medial lentiform position for orientation. Keep the adjacent internal capsule distinct from the selected pallidal surface.', 'capsule'),\n      mri: limitedMR,";
  const pallidalAfter="      ct: fact('Use the medial lentiform position for orientation. Keep the adjacent internal capsule distinct from the selected pallidal surface.', 'capsule'),\n      mri: fact('On coronal MRI, locate the pallidum between the putamen laterally and the internal capsule medially, then follow its posterior taper. Cross-check the posterior endpoint on axial images when it is unclear on coronal views. The cited manual-segmentation study used 0.7 mm isotropic T1-weighted research scans; internal and external pallidal segments were not consistently distinguishable even in that setting. Routine sequences may provide less detail.', 'subcortex'),";
  assert.equal(beforeCentral.split(pallidalBefore).length,2,'One exact pallidal MRI teaching seam');
  assert.deepEqual(committed(revision,centralPath),Buffer.from(beforeCentral.replace(pallidalBefore,pallidalAfter)),
    'Complete current central imaging source differs only by source-backed pallidal MRI');
  for(const path of [centralPath,'lib/regional-tours.ts','lib/renal-tour.ts','content/renal-tour-pins.json',
    'lib/hamstring-tours.ts','content/hamstring-tour-pins.json']){
    const source=committed(revision,path),digest=sha(source),record:File=review.files.find((f:File)=>f.path===path);
    assert(record,path);assert.equal(record.sourceSha256,digest,`${path}: current source SHA`);
    assert.equal(record.importedSha256,digest,`${path}: imported SHA`);
    assert.equal(sha(readFileSync(atlas+'/'+path)),digest,`${path}: working Atlas source`);
    assert.equal(sha(readFileSync('atlas-review/'+path)),digest,`${path}: imported source bytes`);
    assert.deepEqual(binding.inputs.filter((row:File)=>row.path==='atlas-review/'+path),
      [{path:'atlas-review/'+path,sha256:digest}],`${path}: exact Review integration role`);
    assert.deepEqual(learnerInputs.get('head-neck')!.filter((row:File)=>row.path===path),
      [{path,sha256:digest}],`${path}: exact root learner source role`);
  }
  for(const {name,manifest} of learners){assert.equal(manifest.sourceCommit,runtimeSources[name],name);
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
    const source=committed(revision,path),historicalSource=committed(historicalRevision,path);
    const runtimeSource=committed(runtimeSources[name],path);
    if(name==='head-neck')assert.equal(restorePreRegionalTourHeadEntry(norm(source)),currentHeadEntrypoint(norm(historicalSource)),
      'Current head entrypoint adds only the exact learning-selection channel');
    else assert.deepEqual(source,historicalSource,`${name}: immutable channel entrypoint`);
    assert.deepEqual(runtimeSource,source,`${name}: current source agrees with independent runtime family`);
    assert.equal(learnerInputs.get(name)!.find(f=>f.path===path)?.sha256,sha(runtimeSource),`${name}: entrypoint`);
    assert.match(norm(source),pattern,`${name}: learner scope`);
    const precedingEntrypoint=specimenChannelEntrypoint(norm(committed(parent,path)),name);
    assert.equal(norm(committed(bodyChannelBaseline,path)),precedingEntrypoint,`${name}: original scope plus exact opt-in channel at the preceding source epoch`);
    assert.equal(norm(historicalSource),bodyChannelEntrypoint(precedingEntrypoint,name),`${name}: exact additional root-body channel only`);
  }
  for(const path of ['app/body-content.ts',...sourcePaths]){
    const source=committed(revision,path),copy=readFileSync('atlas-review/'+path),record:File=review.files.find((f:File)=>f.path===path);
    assert(record,path);assert.equal(record.sourceSha256,sha(source),path);
    assert.equal(record.importedSha256,sha(copy),path);
    assert.equal(norm(readFileSync(atlas+'/'+path)),norm(source),`${path}: current Atlas source`);
    if(path!=='app/body-content.ts')assert.equal(norm(copy),norm(source),`${path}: imported source`);
    for(const name of ['head-neck','shoulder'])assert.equal(learnerInputs.get(name)!.find(f=>f.path===path)?.sha256,
      sha(committed(runtimeSources[name],path)),`${name}: ${path} input`);
    for(const base of ['public/atlas-review/',viewerBase,...learners.map(item=>item.base)])
      assert.equal(existsSync(base+path),false,`${base+path}: raw source exposed`);
  }
  for(const [name,path] of [['lower-limb','public/models/um-limb/catalog.json'],
    ['female-pelvis','public/models/hra-pelvis/catalog.json']] as const){
    const source=committed(revision,path),catalog=json('atlas-review/'+path);
    assert.equal(learnerInputs.get(name)!.find(f=>f.path===path)?.sha256,sha(committed(runtimeSources[name],path)),`${name}: independent catalog input`);
    assert.deepEqual(catalog,JSON.parse(norm(source)),`${name}: independent catalog`);
    assert.equal(norm(source),norm(committed(parent,path)),`${name}: original specimen source`);
  }
  const pins=json('atlas-review/'+pinPath);
  assert.equal(sha(JSON.stringify(pins)),requiredPinsHash);
  assert.equal(pins.parentCommit,parent);assert.equal(pins.entries.length,10);
  assert.deepEqual(new Set(pins.entries.map((row:Pin)=>row.identity.id)),new Set(expected.keys()));
  assert.deepEqual(new Set(pins.entries.map((row:Pin)=>row.family)),new Set(selections.map(row=>row[0])));
  const liveApi=await imported(),rawCatalog=json('atlas-review/public/models/bodyparts3d/full-body/catalog.json');
  const prior=await import(pathToFileURL(atlas+'/scripts/exact-source-history-api.mjs').href);
  const currentSource=await boundLiveAtlasHistory(revision);
  const portalTourEpoch=await prior.exactSourceHistoryApi(portalTourRevision,'review-security');
  assert.equal(portalTourEpoch.regionalTours.length,48);
  assert.equal(portalTourEpoch.regionalTours.reduce((n:number,tour:{steps:unknown[]})=>n+tour.steps.length,0),290);
  const firstDelivery=await prior.exactSourceHistoryApi(historicalRevision,'review-security');
  assert.equal(firstDelivery.regionalTours.length,51);
  assert.equal(firstDelivery.regionalTours.reduce((n:number,tour:{steps:unknown[]})=>n+tour.steps.length,0),309);
  const composedTourEpoch=await prior.exactSourceHistoryApi(composedTourSource,'review-security');
  assertCurrentCranialTourCatalog(firstDelivery.regionalTours,composedTourEpoch.regionalTours,
    composedTourEpoch.regionalTours.slice(51));
  const currentTours=new Map(liveApi.regionalTours.map((tour:any)=>[tour.id,tour]));
  assert.equal(currentTours.size,liveApi.regionalTours.length,'Every current tour identity remains unique');
  for(const historical of composedTourEpoch.regionalTours){
    const retained=currentTours.get(historical.id);
    assert(retained,`${historical.id}: historical tour retained`);
    assert.deepEqual(retained,historical,`${historical.id}: complete composed-epoch tour retained`);
  }
  assert.deepEqual(liveApi.hamstringTours.map((tour:any)=>tour.id),['right-hamstring-orientation','left-hamstring-orientation']);
  for(const tour of liveApi.hamstringTours)assert.deepEqual(currentTours.get(tour.id),tour,`${tour.id}: exact source-exported tour`);
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
  const learnerJs=learners.filter(item=>item.name==='head-neck'||item.name==='shoulder').map(({name,base,manifest})=>{
    for(const f of manifest.files.filter((f:File)=>f.path.endsWith('.js')))
      assert.equal(sha(readFileSync(base+f.path)),f.sha256,`${name}: ${f.path}`);
    return {name,text:emittedTeachingSearch(base,manifest.files)};
  });
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
    assert.deepEqual(livePacket,wire(await currentSource.bodyReviewMaterial(s.id)),`${s.id}: complete current190 Review packet`);
    assert.deepEqual(livePacket.source,packet.source,`${s.id}: neonatal source identity retained`);
    assert.deepEqual(livePacket.topics.find((row:any)=>row.tab==='ultrasound'),
      packet.topics.find((row:any)=>row.tab==='ultrasound'),`${s.id}: neonatal teaching retained`);
    const laterTour=laterPlaybackTours.get(s.id);
    const laterQuestion=laterReasoning.get(s.id);
    const laterMri=laterPallidalMri.has(s.id);
    const tourIds=laterTour?[laterTour]:[];
    assert.deepEqual(packet.guidedTours.map((row:any)=>row.tour.id),tourIds,`${s.id}: completed tour membership`);
    assert.deepEqual(livePacket.guidedTours.map((row:any)=>row.tour.id),tourIds,`${s.id}: current tour membership`);
    for(const key of Object.keys(packet).filter(key=>!['guidedTours','fingerprints','materialHash'].includes(key))){
      if(key==='reasoning'&&laterQuestion){
        assert.equal(packet.reasoning,null,`${s.id}: neonatal epoch precedes the current reasoning question`);
        assert.equal(livePacket.reasoning?.key,laterQuestion,`${s.id}: exact current reasoning key`);
        assert.equal(livePacket.reasoning?.readiness,'draft',`${s.id}: reasoning awaits review`);
        assert.equal(livePacket.reasoning?.answerId,s.id,`${s.id}: exact current answer identity`);
      }else if(key==='topics'&&laterMri){
        assert.deepEqual(livePacket.topics.filter((row:any)=>row.tab!=='mri'),
          packet.topics.filter((row:any)=>row.tab!=='mri'),`${s.id}: all other teaching topics retained`);
        assert.deepEqual(livePacket.topics.find((row:any)=>row.tab==='mri'),
          {tab:'mri',...currentSource.bodyLesson(s,'mri')},`${s.id}: exact current source-backed MRI`);
        assert.notDeepEqual(livePacket.topics.find((row:any)=>row.tab==='mri'),
          packet.topics.find((row:any)=>row.tab==='mri'),`${s.id}: later MRI revision is substantive`);
      }else assert.deepEqual(livePacket[key],packet[key],`${s.id}: complete non-tour field ${key}`);
    }
    for(const key of ['source','checklist'])
      assert.equal(livePacket.fingerprints[key],packet.fingerprints[key],`${s.id}: stable ${key} fingerprint`);
    if(laterTour){
      const {continuousPlayback,...prePlayback}=livePacket.guidedTours[0];
      assert.deepEqual(prePlayback,packet.guidedTours[0],`${s.id}: complete pre-playback evidence`);
      assert.equal(continuousPlayback.version,1);
      assert.equal(continuousPlayback.stepDurationsMs.length,prePlayback.tour.steps.length);
      assert.notEqual(livePacket.fingerprints.teaching,packet.fingerprints.teaching);
      assert.notEqual(livePacket.materialHash,packet.materialHash);
    }else if(laterQuestion||laterMri){
      assert.notEqual(livePacket.fingerprints.teaching,packet.fingerprints.teaching,`${s.id}: current question changes teaching`);
      assert.notEqual(livePacket.materialHash,packet.materialHash,`${s.id}: current question changes material`);
    }else assert.deepEqual(livePacket,packet,`${s.id}: complete unchanged current packet`);
    assert.deepEqual(await liveApi.parseBodyReviewResponse(livePacket,s.id),livePacket,`${s.id}: current packet accepted`);
    if(laterQuestion){
      for(const change of ['answerId','explanation','reference','source','readiness']){
        const altered=wire(livePacket);
        if(change==='answerId')altered.reasoning.answerId='vm:foreign-answer';
        if(change==='explanation')altered.reasoning.explanation+=' forged';
        if(change==='reference')altered.reasoning.references[0].url='javascript:alert(1)';
        if(change==='source')altered.reasoning.choices[0].sources[0].sha256='0'.repeat(64);
        if(change==='readiness')altered.reasoning.readiness='approved';
        assert.equal(await liveApi.parseBodyReviewResponse(altered,s.id),null,`${s.id}: current reasoning ${change} refused`);
      }
    }
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
    const laterCurrentTeaching=!!laterTour||!!laterQuestion||laterMri;
    assert.deepEqual(liveContext,await currentSource.bodyReviewContext(s.id),`${s.id}: complete current190 context`);
    for(const key of ['sourceHash','checklistVersion'])
      assert.equal(liveContext[key],context[key],`${s.id}: stable ${key}`);
    for(const key of ['teachingHash','materialHash'])
      if(laterCurrentTeaching)assert.notEqual(liveContext[key],context[key],`${s.id}: playback or reasoning changes ${key}`);
      else assert.equal(liveContext[key],context[key],`${s.id}: no tour preserves ${key}`);
    if(laterCurrentTeaching)assert.notEqual(liveContext.revisions.teaching,context.revisions.teaching,
      `${s.id}: playback or reasoning changes teaching decision revision`);
    else assert.equal(liveContext.revisions.teaching,context.revisions.teaching,
      `${s.id}: no tour preserves teaching decision revision`);
    assert.equal(context.sourceHash,oldContext.sourceHash);
    assert.notEqual(context.revisions.teaching,oldContext.revisions.teaching);
    const decision={catalogScope:context.catalogScope,structureId:s.id,track:'teaching',expectedVersion:0,
      materialHash:context.materialHash,revisionHash:context.revisions.teaching,checklistVersion:context.checklistVersion,
      draft:api.blankBodyReview(context,'teaching')};
    const liveDecision={catalogScope:liveContext.catalogScope,structureId:s.id,track:'teaching',expectedVersion:0,
      materialHash:liveContext.materialHash,revisionHash:liveContext.revisions.teaching,
      checklistVersion:liveContext.checklistVersion,draft:liveApi.blankBodyReview(liveContext,'teaching')};
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
    if(laterCurrentTeaching)assert.equal((await liveSave(decision)).status,409,
      `${s.id}: historical decision is stale after current playback or reasoning`);
    const forged=wire(decision);forged.draft.checks.foreign=true;
    assert.equal((await save(forged)).status,422);
    const approval=wire(decision);approval.draft.status='approved';
    assert.equal((await save(approval)).status,422);
    const liveForged=wire(liveDecision);liveForged.draft.checks.foreign=true;
    assert.equal((await liveSave(liveForged)).status,422);
    const liveApproval=wire(liveDecision);liveApproval.draft.status='approved';
    assert.equal((await liveSave(liveApproval)).status,422);
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
  const {currentContexts,priorContexts}=readNeonatalInboxContexts();
  const {getClinicalReviewInbox,clinicalReviewEntries}=await inbox();
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
  for(const {entry} of selected){
    const key=JSON.stringify([entry.key,'teaching']),matches=batches.filter((row:any)=>row.key===key);
    assert.equal(matches.length,1,key);const row=matches[0];
    const saved=old.rows.find((item:any)=>item.id===entry.id);
    const previous=priorContexts[entry.id],now=currentContexts[entry.id];
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
