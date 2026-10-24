import {boundLiveAtlasHistory} from './atlas-bound-live-history.mjs';
import {assertRenalTourEpoch} from './renal-tour-epoch-admission.mjs';
import {checkedAtlasHistoryRepo} from './atlas-source-repo.mjs';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
import {emittedTeaching} from './atlas-emitted-teaching.ts';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync,readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import test from 'node:test';
import {build} from 'esbuild';

const atlas=currentAtlasDeliveryRoot();
const baseline='eb34afd7f1adc6a9655d3e4f238c9eb2c5288cf1';
const baselineTree='ee0cc791b247104f0d80b4ac8e82464b1c60aeef';
// The introduction and first delivery epochs are immutable Git history.
const completedEpoch='ec9972a60325de147277941e04089e2d4be0baf9';
const introductionTree='ec7d1b759a613e84d79a94bcc18370b1bb885e88';
const historicalCommit='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const liveCommit=CURRENT_ATLAS_REVISION;
const imagingPath='content/shoulder-arm-muscle-imaging-pins.json';
const catalogPath='public/models/bodyparts3d/full-body/catalog.json';
const helperPath='lib/girdle-muscle-xray.ts';
const contentPath='content/girdle-muscle-xray.ts';
const cachePath='content/regional-teaching/shoulder-arm.json';
const sourcePaths=[imagingPath,catalogPath,helperPath,contentPath,cachePath,
 'app/body-content.ts','content/body-review-display-pins.json',
 'content/body-renderer-revision.json'];
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));
const sha=(value:Uint8Array|string)=>createHash('sha256').update(value).digest('hex');
const git=(args:string[])=>execFileSync('git',args,{cwd:atlas,windowsHide:true,maxBuffer:64e6,
 env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
const committed=(revision:string,path:string)=>git(['show',`${revision}:${path}`]);
const visible=(code:string,value:string)=>code.includes(value)||code.includes(JSON.stringify(value).slice(1,-1));
const pathsWhere=(value:any,predicate:(part:any)=>boolean,path:(string|number)[]=[]):
 (string|number)[][]=>[
 ...(predicate(value)?[path]:[]),
 ...(value&&typeof value==='object'?Object.entries(value).flatMap(([key,child])=>
  pathsWhere(child,predicate,[...path,key])):[]),
];
const at=(value:any,path:(string|number)[])=>path.reduce((part,key)=>part[key],value);

// Independently fixed FMA, group, side, model file and source checksum identities.
const expected=new Map<string,[string,string,string,string]>([
 ['FMA37705',['anconeus','right','FJ1485','5c2e838a39547c4cdbb799cd5a54258d4ff76ab54b2859aecbfae2ba4588c5d4']],
 ['FMA37706',['anconeus','left','FJ1485M','4ca0901654d56656e4da354560abefb85bb958b3d786c148b5bb510fea106abf']],
 ['FMA37668',['brachialis','right','FJ1486','be5f40b153fd6ce0c8c274eb4c26be8d1a29b4bbe75dd0e4a0dfe5c4d251fa03']],
 ['FMA37669',['brachialis','left','FJ1486M','cedf106a4917deab99f86f077dde7d34d0672dbbb74f30652a4f81f75d7ef180']],
 ['FMA37665',['coracobrachialis','right','FJ1488','7eb9835056883a0e35954d39ff930c4c8c32d41db000e9f0d656e3c663401e56']],
 ['FMA37666',['coracobrachialis','left','FJ1488M','4004a378ca0d8be2924ce0b614fa19a4819804977e374e7cebcd5faa1cd7aa6b']],
 ['FMA32540',['levator-scapulae','right','FJ1532','ee7897cbc5cde540e9cc29b03617d90f1b3caaebee4489f6590ee9c4632dcd42']],
 ['FMA32541',['levator-scapulae','left','FJ1532M','cd98c83bc88a183c77b3eb10ce396f805843444d6f31053b1e3fb04f34647372']],
 ['FMA13381',['rhomboid-major','right','FJ1536','81b84d6d2e7c859004ee2d71f8fef2768ec422fbace3967d54e3f3b2965bdb89']],
 ['FMA13382',['rhomboid-major','left','FJ1536M','89601e72c95415990585118c08e0fb1b9c388f5bfa2b45ac1de116759f663701']],
 ['FMA13383',['rhomboid-minor','right','FJ1537','acbd2dcd51879085bb2ec7d12b45c0ba2514ce3a2a1bb680bcf78732a1f688ff']],
 ['FMA13384',['rhomboid-minor','left','FJ1537M','c1708ef88207aef30c32673af54b7c3b8cad2863a29a17f1f7a54859f96232a4']],
 ['FMA13398',['serratus-anterior','right','FJ1459','33f4ae8c7a84785e2bc5f4f21432d13de0805e485a29f3e6762bac6f85cb61d5']],
 ['FMA13399',['serratus-anterior','left','FJ1459M','cb0e133829295b809e7dccc072318f335e34ccb3c33c80fbc68b8d6da327b7cb']],
 ['FMA32551',['teres-major','right','FJ1507','217aa2d39fdaa682998c8a1a1ffe9c8b37fed881edbbeb8ed5c633fa1541eaac']],
 ['FMA32552',['teres-major','left','FJ1507M','967a771f0d2e0950adfe251ac14b4878f9b12a3aacb16cbf472dac94db38519d']],
]);

async function importedApi(){
 const built=await build({stdin:{contents:[
  "export {girdleMuscleXrayLesson} from './atlas-review/lib/girdle-muscle-xray';",
  "export {bodyLesson,bodyContent} from './atlas-review/app/body-content';",
  "export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';",
  "export {structures} from './atlas-review/app/anatomy-data';",
  "export {dissectionProfiles} from './atlas-review/app/dissection-data';",
  "export {regionalTours} from './atlas-review/lib/regional-tours';",
  "export {regionalTeachingImports} from './atlas-review/lib/regional-teaching-imports';",
  "export {contentTabs} from './atlas-review/lib/content-types';",
  "export * from './atlas-review/lib/body-review-material';",
  "export * from './atlas-review/lib/body-review-context';",
  "export * from './atlas-review/lib/body-review-response';",
  "export * from './atlas-review/lib/body-review-api';",
  "export * from './atlas-review/lib/body-review-decisions';",
 ].join('\n'),resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,
  platform:'node',format:'esm',metafile:true});
 for(const path of [helperPath,contentPath,'app/body-content.ts','lib/body-review-material.ts'])
  assert(Object.keys(built.metafile.inputs).some(input=>input.replaceAll('\\','/').endsWith(path)),
   `Imported closure omits ${path}`);
 const api=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
 const cached=await api.regionalTeachingImports['shoulder-arm']();
 assert.deepEqual(cached.default,json('atlas-review/'+cachePath),'Actual imported teaching cache');
 return api;
}

test('exact girdle muscle pins, four learner exports, Review and emitted drafts',
 {timeout:180000},async()=>{
 const admission=validateCurrentAtlasDelivery();
 assert.equal(admission.source,liveCommit);
 assert.equal(git(['rev-parse','HEAD']).toString().trim(),liveCommit);
 assert.equal(git(['rev-parse',`${baseline}^{tree}`]).toString().trim(),baselineTree);
 assert.equal(git(['rev-parse',`${completedEpoch}^{tree}`]).toString().trim(),introductionTree);
 assert.equal(git(['merge-base',baseline,completedEpoch]).toString().trim(),baseline);
 assert.equal(checkedAtlasHistoryRepo(historicalCommit),atlas);
 assert.equal(git(['merge-base',completedEpoch,historicalCommit]).toString().trim(),completedEpoch);
 assert.equal(git(['merge-base',historicalCommit,liveCommit]).toString().trim(),historicalCommit);
 assert.equal(git(['merge-base',completedEpoch,liveCommit]).toString().trim(),completedEpoch);
 for(const path of [helperPath,contentPath])
  assert.deepEqual(committed(historicalCommit,path),committed(completedEpoch,path),`${path}: source epoch retained`);
 for(const path of [helperPath,contentPath])
  assert.deepEqual(committed(liveCommit,path),committed(historicalCommit,path),`${path}: current source retained`);
 for(const path of [imagingPath,catalogPath])
  assert.deepEqual(committed(liveCommit,path),committed(baseline,path),`${path}: source pin retained`);
 assert.deepEqual(new Set(git(['diff','--name-only',baseline,completedEpoch]).toString().trim().split(/\r?\n/)),new Set([
  'LICENSES/THIRD_PARTY_NOTICES.md','app/body-content.ts','content/body-renderer-revision.json',
  'content/body-review-display-pins.json',cachePath,contentPath,'docs/GIRDLE_MUSCLE_XRAY.md',
  helperPath,'package.json','scripts/exact-source-history-api.mjs','scripts/test-girdle-muscle-xray.mjs',
 ]));
 const review=json('atlas-review/manifest.json');assert.equal(review.revision,liveCommit);
 const viewer=json('public/atlas-review-viewer/manifest.json');
 assert.equal(viewer.sourceCommit,liveCommit);
 assert.equal(viewer.websiteIntegrationSha256,review.websiteIntegrationSha256);
 assert.equal(viewer.personalRecordsIncluded,false);
 const learners=['head-neck','shoulder','lower-limb','female-pelvis'].map(name=>({
  name,base:`public/atlas-runtime/${name}/`,manifest:json(`public/atlas-runtime/${name}/manifest.json`),
 }));
 for(const {name,manifest} of learners){
  assert.equal(manifest.sourceCommit,admission.runtimeSources[name],name);
  assert.equal(manifest.patientDataIncluded,false,name);
  assert.equal(manifest.clinicalApproved,false,name);
 }
 for(const path of sourcePaths){
  const original=committed(liveCommit,path),imported=readFileSync('atlas-review/'+path);
  const record=review.files.find((file:{path:string})=>file.path===path);assert(record,path);
  assert.equal(record.sourceSha256,sha(original),path);
  assert.equal(record.importedSha256,sha(imported),path);
  if([imagingPath,catalogPath,helperPath,contentPath,cachePath].includes(path))
   assert.equal(sha(imported),sha(original),`${path}: exact imported source`);
  for(const {name,base} of learners){
   const input=json(base+'source-inputs.json').find((item:{path:string})=>item.path===path);
   const inLearner=(name==='head-neck'||name==='shoulder')&&
    [imagingPath,helperPath,contentPath,cachePath,'app/body-content.ts'].includes(path)
    ||name==='head-neck'&&path===catalogPath;
   if(inLearner)assert.equal(input?.sha256,
    sha(committed(admission.runtimeSources[name],path)),`${name}: ${path}`);
   else assert.equal(input,undefined,`${name}: source outside closure ${path}`);
  }
  for(const base of ['public/atlas-review/','public/atlas-review-viewer/',...learners.map(x=>x.base)])
   assert.equal(existsSync(base+path),false,`${base+path}: raw source exposed`);
 }
 const head=learners.find(x=>x.name==='head-neck')!;
 const deliveredCatalog='models/bodyparts3d/full-body/catalog.json';
 const catalogFile=head.manifest.files.find((file:{path:string})=>file.path===deliveredCatalog);
 assert(catalogFile,'Head-neck full-body catalog in delivered manifest');
 assert.equal(catalogFile.sha256,sha(readFileSync(head.base+deliveredCatalog)));
 assert.equal(catalogFile.sha256,sha(committed(baseline,catalogPath)));
 const imaging=json('atlas-review/'+imagingPath);
 const sourceCatalog=json('atlas-review/'+catalogPath);
 const pins=new Map<string,any>();
 for(const entry of imaging.entries.filter((entry:any)=>expected.has(entry.identity.fmaId))){
  assert(!pins.has(entry.identity.fmaId));pins.set(entry.identity.fmaId,entry.identity);
  assert.equal(entry.group,expected.get(entry.identity.fmaId)![0]);
 }
 assert.equal(pins.size,16);
 const api=await importedApi(),catalog=api.bodyDisplayCatalog(sourceCatalog);
 assert.equal(catalog.structures.length,1104);
 const emitted=learners.filter(x=>x.name==='head-neck'||x.name==='shoulder')
  .map(x=>emittedTeaching(x.base,x.manifest.files,true));
 const cached=json('atlas-review/'+cachePath);
 const ids=new Set<string>();
 for(const [fma,[group,side,file,digest]] of expected){
  const identity=pins.get(fma);assert(identity,`${fma}: ${group}`);
  ids.add(identity.id);
  assert.equal(identity.id,`vm:anatomy:body:shoulder-arm:${side}:muscle:${side}-${group}`);
  assert.equal(identity.fmaId,fma);assert.equal(identity.laterality,side);
  assert.equal(identity.region,'shoulder-arm');assert.equal(identity.system,'muscles');
  assert.equal(identity.category,'muscle');assert.equal(identity.bundle,'shoulder-arm-muscles');
  assert.equal(identity.nodeName,fma);assert.equal(identity.sourceTree,'isa');
  assert.deepEqual(identity.sources,[{file,sha256:digest}]);
  assert.equal(identity.validation.status,'unvalidated');
  assert.equal(identity.validation.anatomicalReview,false);
  assert.deepEqual(sourceCatalog.structures.find((row:any)=>row.fmaId===fma),identity);
  assert.deepEqual(catalog.structures.find((row:any)=>row.id===identity.id),identity);
  const lesson=api.girdleMuscleXrayLesson(identity,'xray');assert(lesson);
  assert.equal(lesson.readiness,'draft');assert.deepEqual(api.bodyLesson(identity,'xray'),lesson);
  const {readiness,...content}=lesson;assert.deepEqual(api.bodyContent(identity,'xray'),content);
  assert(lesson.citations.length>0&&lesson.citations.every((url:string)=>/^https:\/\//.test(url)));
  assert.equal(new Set(lesson.citations).size,lesson.citations.length);
  const prose=[lesson.body,...lesson.bullets,lesson.note].join(' ');
  assert.match(prose,/(?:radiograph|plain film|x-ray)/i);
  assert.match(prose,/(?:muscle|tendon)/i);
  assert.match(prose,/(?:not|cannot|does not).*(?:show|resolve|assess|establish|confirm|prove|depict|visuali[sz]e)|(?:cannot|not) be (?:assessed|seen)/i);
  assert.doesNotMatch(prose,/approved for clinical use|registered to a patient|normal muscle and tendon/i);
  const cache=cached.entries.find((entry:any)=>JSON.parse(entry.identity).id===identity.id);
  assert(cache,`${identity.id}: teaching cache entry`);
  assert.deepEqual(cache.lessons.xray,lesson);
  for(const code of emitted)for(const value of [lesson.title,lesson.body,...lesson.citations])
   assert(visible(code,value),`${identity.id}: emitted teaching ${value.slice(0,40)}`);
  const clean=wire(lesson);lesson.bullets.push('foreign');lesson.citations.push('https://foreign.example');
  assert.deepEqual(api.girdleMuscleXrayLesson(identity,'xray'),clean,'Detached draft');
  for(const path of pathsWhere(identity,value=>value===null||typeof value!=='object')){
   const bad=wire(identity),parent=at(bad,path.slice(0,-1)),key=path.at(-1)!;
   const original=parent[key];parent[key]=typeof original==='string'?original+'-foreign'
    :typeof original==='number'?original+0.01:original===null?'foreign':!original;
   assert.equal(api.girdleMuscleXrayLesson(bad,'xray'),undefined,`${identity.id}:${path.join('.')}`);
  }
  for(const path of pathsWhere(identity,Array.isArray)){
   const bad=wire(identity);at(bad,path).push('foreign');
   assert.equal(api.girdleMuscleXrayLesson(bad,'xray'),undefined,`${identity.id}:${path.join('.')} extended`);
  }
  for(const path of pathsWhere(identity,value=>value&&typeof value==='object'&&!Array.isArray(value))){
   const bad=wire(identity);at(bad,path).unexpected=true;
   assert.equal(api.girdleMuscleXrayLesson(bad,'xray'),undefined,`${identity.id}:${path.join('.')||'<root>'} extra`);
   for(const key of Object.keys(at(identity,path))){
    const omitted=wire(identity);delete at(omitted,path)[key];
    assert.equal(api.girdleMuscleXrayLesson(omitted,'xray'),undefined,
     `${identity.id}:${[...path,key].join('.')} omitted`);
   }
  }
  for(const path of pathsWhere(identity,value=>Array.isArray(value)&&value.length>1)){
   const original=at(identity,path);
   const other=original.findIndex((item:any,index:number)=>index>0&&
    JSON.stringify(item)!==JSON.stringify(original[0]));
   if(other<0)continue;
   const bad=wire(identity),array=at(bad,path);
   [array[0],array[other]]=[array[other],array[0]];
   assert.equal(api.girdleMuscleXrayLesson(bad,'xray'),undefined,
    `${identity.id}:${path.join('.')} reordered`);
  }
  assert.equal(api.girdleMuscleXrayLesson({id:identity.id},'xray'),undefined);
 }
 assert.equal(ids.size,16);
 for(const structure of catalog.structures)if(!ids.has(structure.id))
  assert.equal(api.girdleMuscleXrayLesson(structure,'xray'),undefined);
 const tracked=git(['ls-tree','-r','--name-only',baseline]).toString().split(/\r?\n/).filter(x=>x.endsWith('.glb'));
 assert.equal(tracked.length,146);
 for(const path of tracked)assert.deepEqual(readFileSync(atlas+'/'+path),committed(baseline,path),path);
});

test('immutable 16-topic transition, current 9,936 placements and 1,104 Review packets',
 {timeout:300000},async()=>{
 const current=await importedApi(),live=await boundLiveAtlasHistory(liveCommit);
 const {exactSourceHistoryApi}=await import(pathToFileURL(atlas+'/scripts/exact-source-history-api.mjs').href);
 const old=await exactSourceHistoryApi(baseline,'review-security');
 const epoch=await exactSourceHistoryApi(completedEpoch,'review-security');
 const retained=await exactSourceHistoryApi(historicalCommit,'review-security');
 const catalog=current.bodyDisplayCatalog(json('atlas-review/'+catalogPath));
 assert.deepEqual(catalog,live.bodyDisplayCatalog(json('atlas-review/'+catalogPath)));
 assert.deepEqual(catalog,old.bodyDisplayCatalog(JSON.parse(committed(baseline,catalogPath).toString())));
 assert.deepEqual(current.structures,live.structures);assert.deepEqual(epoch.structures,old.structures);
 assert.deepEqual(current.dissectionProfiles,live.dissectionProfiles);
 assert.deepEqual(epoch.dissectionProfiles,old.dissectionProfiles);
 assert.deepEqual(current.regionalTours,live.regionalTours);assertRenalTourEpoch(old.regionalTours,live.regionalTours);
 assert.equal(current.regionalTours.length,53);
 assert.equal(current.regionalTours.reduce((count:number,tour:any)=>count+tour.steps.length,0),317);
 assert.deepEqual(current.contentTabs,live.contentTabs);assert.deepEqual(live.contentTabs,old.contentTabs);
 assert.equal(current.contentTabs.length,9);
 const imaging=json('atlas-review/'+imagingPath);
 const ids=new Set<string>(imaging.entries.filter((row:any)=>expected.has(row.identity.fmaId))
  .map((row:any)=>row.identity.id));
 assert.equal(ids.size,16);
 let placements=0,changed=0,packets=0,changedPackets=0;
 let malformed=0,stale=0,forgedSave=0,forgedApproval=0,storageCalls=0;
 const storage={prepare(){storageCalls++;throw Error('Rejected decision reached synthetic storage');}};
 const request=(value:any)=>new Request('https://review.test/api/body-decisions',{
  method:'POST',headers:{origin:'https://review.test','content-type':'application/json',
   'oai-authenticated-user-id':'SYNTHETIC_GIRDLE_MUSCLE_XRAY'},body:JSON.stringify(value),
 });
 for(const structure of catalog.structures){
  for(const tab of current.contentTabs){
   const before=old.bodyLesson(structure,tab),historical=epoch.bodyLesson(structure,tab);
   const firstDelivery=retained.bodyLesson(structure,tab);
   const after=live.bodyLesson(structure,tab),imported=current.bodyLesson(structure,tab);
   assert.deepEqual(imported,after,`${structure.id}:${tab}: imported versus current source`);
   placements++;
   if(ids.has(structure.id)&&tab==='xray'){
    changed++;assert.equal(before.readiness,'pending');assert.equal(historical.readiness,'draft');
    assert.deepEqual(firstDelivery,historical,`${structure.id}:${tab}: first delivery retains introduction`);
    assert.deepEqual(after,current.girdleMuscleXrayLesson(structure,tab));
    assert.deepEqual(after,firstDelivery,`${structure.id}:${tab}: current girdle lesson retains first delivery`);
   }else{
    assert.deepEqual(historical,before,`${structure.id}:${tab}: historical untouched topic`);
    assert.equal(current.girdleMuscleXrayLesson(structure,tab),undefined);
   }
  }
  const before=wire(await old.bodyReviewMaterial(structure.id));
  const historical=wire(await epoch.bodyReviewMaterial(structure.id));
  const firstDelivery=wire(await retained.bodyReviewMaterial(structure.id));
  const after=wire(await live.bodyReviewMaterial(structure.id));
  assert(before&&historical&&after,structure.id);packets++;
  assert.deepEqual(wire(await current.bodyReviewMaterial(structure.id)),after,
   `${structure.id}: full imported versus current source Review packet`);
  assert.equal(after.approval,false);assert.equal(after.status,'worksheet-not-submitted');
  if(!ids.has(structure.id)){
   assert.deepEqual(historical,before,`${structure.id}: historical untouched packet`);
   continue;
  }
  changedPackets++;
  assert.deepEqual(historical.topics.filter((row:any)=>row.tab!=='xray'),
   before.topics.filter((row:any)=>row.tab!=='xray'));
  for(const key of ['source','reasoning','guidedTours','checklist','atlasLink','limits'])
   assert.deepEqual(historical[key],before[key],`${structure.id}: historical ${key} retained`);
  assert.equal(historical.fingerprints.source,before.fingerprints.source);
  assert.deepEqual(firstDelivery.topics.find((row:any)=>row.tab==='xray'),
   historical.topics.find((row:any)=>row.tab==='xray'),`${structure.id}: first delivery girdle worksheet`);
  assert.notEqual(historical.fingerprints.teaching,before.fingerprints.teaching);
  assert.notEqual(historical.materialHash,before.materialHash);
  assert.deepEqual(historical.topics.find((row:any)=>row.tab==='xray'),
   {tab:'xray',...epoch.bodyLesson(structure,'xray')});
  assert.deepEqual(await current.parseBodyReviewResponse(after,structure.id),after);
  assert.equal(await current.parseBodyReviewResponse(before,structure.id),null);
  for(const mutate of [
   (bad:any)=>{bad.topics.find((row:any)=>row.tab==='xray').body+=' forged';},
   (bad:any)=>{bad.topics.find((row:any)=>row.tab==='xray').citations=['https://forged.example'];},
   (bad:any)=>{bad.topics.find((row:any)=>row.tab==='xray').readiness='approved';},
   (bad:any)=>{bad.source.structure.sources=[];},
  ]){
   const forged=wire(after);mutate(forged);
   assert.equal(await current.parseBodyReviewResponse(forged,structure.id),null);
   malformed++;
  }
  const previous=await old.bodyReviewContext(structure.id);
  const context=await live.bodyReviewContext(structure.id);
  assert.deepEqual(await current.bodyReviewContext(structure.id),context);
  assert.equal(context.sourceHash,previous.sourceHash);
  assert.notEqual(context.revisions.teaching,previous.revisions.teaching);
  const decision={catalogScope:context.catalogScope,structureId:structure.id,
   track:'teaching',expectedVersion:0,materialHash:context.materialHash,
   revisionHash:context.revisions.teaching,checklistVersion:context.checklistVersion,
   draft:current.blankBodyReview(context,'teaching')};
  const staleDecision=wire(decision);staleDecision.materialHash=previous.materialHash;
  staleDecision.revisionHash=previous.revisions.teaching;
  assert.equal((await current.postBodyDecision(request(staleDecision),storage)).status,409);stale++;
  const forged=wire(decision);forged.draft.checks.foreign=true;
  assert.equal((await current.postBodyDecision(request(forged),storage)).status,422);forgedSave++;
  const approval=wire(decision);approval.draft.status='approved';
  assert.equal((await current.postBodyDecision(request(approval),storage)).status,422);forgedApproval++;
 }
 assert.deepEqual({placements,changed,preserved:placements-changed,packets,changedPackets,
  preservedPackets:packets-changedPackets,malformed,stale,forgedSave,forgedApproval,storageCalls},
  {placements:9936,changed:16,preserved:9920,packets:1104,changedPackets:16,
   preservedPackets:1088,malformed:64,stale:16,forgedSave:16,forgedApproval:16,storageCalls:0});
});
