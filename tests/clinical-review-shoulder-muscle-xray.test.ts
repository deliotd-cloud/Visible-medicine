import {boundLiveAtlasHistory} from './atlas-bound-live-history.mjs';
import {emittedTeaching} from './atlas-emitted-teaching.ts';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync,readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import test from 'node:test';
import {build} from 'esbuild';

const atlas='F:/VisibleMedicine/atlas';
const baseline='c978ecee3bdddfeaf2995ecbf62d5178e719c4fb';
const completedEpoch='eb34afd7f1adc6a9655d3e4f238c9eb2c5288cf1';
// A later integration may repin this only; the introduction epoch above stays immutable.
const liveCommit='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const imagingPath='content/shoulder-arm-muscle-imaging-pins.json';
const motorPath='content/upper-limb-motor-pins.json';
const catalogPath='public/models/bodyparts3d/full-body/catalog.json';
const helperPath='lib/shoulder-muscle-xray.ts';
const contentPath='content/shoulder-muscle-xray.ts';
const cachePath='content/regional-teaching/shoulder-arm.json';
const sourcePaths=[imagingPath,motorPath,catalogPath,helperPath,contentPath,cachePath,
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

// Fixed independently from the immutable source transition's selected source pins.
// The first twelve are imaging-pin identities; the four indicated below are raw motor pins.
const expected=new Map<string,[string,string,string,string,string]>([
 ['FMA34680',['deltoid-clavicular','right','clavicular-part-of-right-deltoid','FJ1468','09eebb4a8d72c91936b0bfde7f35829a58f56103ac158f559186698458bcc616']],
 ['FMA34681',['deltoid-clavicular','left','clavicular-part-of-left-deltoid','FJ1468M','75340ac9157ea6c64baaa74c0bbfd6173114dcff0d30ea814702c288b002f104']],
 ['FMA34682',['deltoid-acromial','right','acromial-part-of-right-deltoid','FJ1467','2f69f1a13c836539abca85d9b77f55f96319ad3fdd75c62f498eabe49b266bfe']],
 ['FMA34683',['deltoid-acromial','left','acromial-part-of-left-deltoid','FJ1467M','a523b5f2ab862ad6505787f4936098fbcfe3f28a3742b57aac34307fe752f8eb']],
 ['FMA34684',['deltoid-spinal','right','spinal-part-of-right-deltoid','FJ1513','ef8308c92fd0d01d8c0d7ffd9238305eefc2f28710d7bb58f451512abdc08e99']],
 ['FMA34685',['deltoid-spinal','left','spinal-part-of-left-deltoid','FJ1513M','a806a9a20b68009f0071c22411b009f4baef3de118f00a37cc4a3be8cdf7ce2e']],
 ['FMA37686',['biceps-long-head','right','long-head-of-right-biceps-brachii','FJ1478','2442d2b5ac30c5da42e72eeff83d143df51c7617001cbc6552096a504f29bc07']],
 ['FMA37687',['biceps-long-head','left','long-head-of-left-biceps-brachii','FJ1478M','10189f1d7b5220df3baef2b259ae9855ed301c1afaadfc2de25af3222c5a08fc']],
 ['FMA37684',['biceps-short-head','right','short-head-of-right-biceps-brachii','FJ1512','2173b7cce29f11036907b80e068e9bd6c16f22359d6e7994af9684454b99b4d5']],
 ['FMA37685',['biceps-short-head','left','short-head-of-left-biceps-brachii','FJ1512M','6b0ed7b70973b3a2e08de4ea5ce59c05a4ddce2b90212ff734326be2726d1293']],
 ['FMA37695',['triceps-medial-head','right','medial-head-of-right-triceps-brachii','FJ1480','1ea653667afa5ff0bf0e01d71ac648819655241c130e8dd1778ed2f9561c34c5']],
 ['FMA37696',['triceps-medial-head','left','medial-head-of-left-triceps-brachii','FJ1480M','fc35854102a057ca85a201eeff4c18f03722b1ceab52c311ce1b87abf4fa2ff8']],
 ['FMA37697',['triceps-lateral-head','right','lateral-head-of-right-triceps-brachii','FJ1477','1d1c3b42eec0dffe696bd25cffa81784c87c15f16c9605050fdf1cb2f47698dd']],
 ['FMA37698',['triceps-lateral-head','left','lateral-head-of-left-triceps-brachii','FJ1477M','96d9859e983736f53864e53fa0579b8f6a18006067967df42e4fe7ea2d2b9e6f']],
 ['FMA37699',['triceps-long-head','right','long-head-of-right-triceps-brachii','FJ1479','acc48f746bd07a117357a9c49a1a9850c96b85d7c63cf90a662a45717875a315']],
 ['FMA37700',['triceps-long-head','left','long-head-of-left-triceps-brachii','FJ1479M','4b8315f9134a213f45c3af830270f4526e705d0a149894516d3f5fba98878f15']],
]);
const motorIds=['FMA34680','FMA34682','FMA34684','FMA37686'];

async function importedApi(){
 const built=await build({stdin:{contents:[
  "export {shoulderMuscleXrayLesson} from './atlas-review/lib/shoulder-muscle-xray';",
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

test('exact muscle source pins, four learner exports, Review and emitted drafts',
 {timeout:180000},async()=>{
 assert.equal(git(['rev-parse','HEAD']).toString().trim(),liveCommit);
 assert.equal(git(['merge-base',baseline,completedEpoch]).toString().trim(),baseline);
 assert.equal(git(['merge-base',completedEpoch,liveCommit]).toString().trim(),completedEpoch);
 assert.equal(git(['rev-parse',`${completedEpoch}^{tree}`]).toString().trim(),
  'ee0cc791b247104f0d80b4ac8e82464b1c60aeef');
 for(const path of [helperPath,contentPath])
  assert.deepEqual(committed(liveCommit,path),committed(completedEpoch,path),`${path}: source epoch retained`);
 for(const path of [imagingPath,motorPath,catalogPath])
  assert.deepEqual(committed(liveCommit,path),committed(baseline,path),`${path}: source pin retained`);
 assert.deepEqual(new Set(git(['diff','--name-only',baseline,completedEpoch]).toString().trim().split(/\r?\n/)),new Set([
  'LICENSES/THIRD_PARTY_NOTICES.md','app/body-content.ts','content/body-renderer-revision.json',
  'content/body-review-display-pins.json',cachePath,contentPath,'docs/SHOULDER_MUSCLE_XRAY.md',
  helperPath,'package.json','scripts/exact-source-history-api.mjs','scripts/test-shoulder-muscle-xray.mjs',
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
  assert.equal(manifest.sourceCommit,liveCommit,name);
  assert.equal(manifest.patientDataIncluded,false,name);
  assert.equal(manifest.clinicalApproved,false,name);
 }
 for(const path of sourcePaths){
  const original=committed(liveCommit,path),imported=readFileSync('atlas-review/'+path);
  const record=review.files.find((file:{path:string})=>file.path===path);assert(record,path);
  assert.equal(record.sourceSha256,sha(original),path);
  assert.equal(record.importedSha256,sha(imported),path);
  if([imagingPath,motorPath,catalogPath,helperPath,contentPath,cachePath].includes(path))
   assert.equal(sha(imported),sha(original),`${path}: exact imported source`);
  for(const {name,base} of learners){
   const input=json(base+'source-inputs.json').find((item:{path:string})=>item.path===path);
   const inLearner=(name==='head-neck'||name==='shoulder')&&
    [imagingPath,motorPath,helperPath,contentPath,cachePath,'app/body-content.ts'].includes(path)
    ||name==='head-neck'&&path===catalogPath;
   if(inLearner)assert.equal(input?.sha256,sha(original),`${name}: ${path}`);
   else assert.equal(input,undefined,`${name}: source outside closure ${path}`);
  }
  for(const base of ['public/atlas-review/','public/atlas-review-viewer/',...learners.map(x=>x.base)])
   assert.equal(existsSync(base+path),false,`${base+path}: raw source exposed`);
 }
 for(const {name,base} of learners.filter(x=>x.name==='lower-limb'||x.name==='female-pelvis'))
  for(const input of json(base+'source-inputs.json'))
   // The exact original milestone diff above proves the teaching-only scope.
   // Later shared-player improvements must bind to their current committed source.
   assert.equal(input.sha256,sha(committed(liveCommit,input.path)),`${name}: current exact source ${input.path}`);
 const head=learners.find(x=>x.name==='head-neck')!;
 const deliveredCatalog='models/bodyparts3d/full-body/catalog.json';
 const catalogFile=head.manifest.files.find((file:{path:string})=>file.path===deliveredCatalog);
 assert(catalogFile,'Head-neck full-body catalog in delivered manifest');
 assert.equal(catalogFile.sha256,sha(readFileSync(head.base+deliveredCatalog)));
 assert.equal(catalogFile.sha256,sha(committed(baseline,catalogPath)));
 const imaging=json('atlas-review/'+imagingPath),motor=json('atlas-review/'+motorPath);
 const sourceCatalog=json('atlas-review/'+catalogPath);
 const pins=new Map<string,any>();
 for(const entry of imaging.entries.filter((entry:any)=>expected.has(entry.identity.fmaId))){
  assert(!pins.has(entry.identity.fmaId));pins.set(entry.identity.fmaId,entry.identity);
  assert.equal(entry.group,expected.get(entry.identity.fmaId)![0]);
 }
 assert.equal(pins.size,12);
 for(const fma of motorIds){
  const rows=motor.entries.filter((entry:any)=>entry.fmaId===fma);
  assert.equal(rows.length,1,`${fma}: one raw motor pin`);pins.set(fma,rows[0]);
 }
 assert.deepEqual(new Set(pins.keys()),new Set(expected.keys()));
 const api=await importedApi(),catalog=api.bodyDisplayCatalog(sourceCatalog);
 assert.equal(catalog.structures.length,1104);
 const emitted=learners.filter(x=>x.name==='head-neck'||x.name==='shoulder')
  .map(x=>emittedTeaching(x.base,x.manifest.files,true));
 const cached=json('atlas-review/'+cachePath);
 const ids=new Set<string>();
 for(const [fma,[group,side,slug,file,digest]] of expected){
  const identity=pins.get(fma);assert(identity,`${fma}: ${group}`);
  ids.add(identity.id);
  assert.equal(identity.id,`vm:anatomy:body:shoulder-arm:${side}:muscle:${slug}`);
  assert.equal(identity.fmaId,fma);assert.equal(identity.laterality,side);
  assert.equal(identity.region,'shoulder-arm');assert.equal(identity.system,'muscles');
  assert.equal(identity.category,'muscle');assert.equal(identity.bundle,'shoulder-arm-muscles-dissection');
  assert.equal(identity.nodeName,fma);assert.equal(identity.sourceTree,'isa');
  assert.deepEqual(identity.sources,[{file,sha256:digest}]);
  assert.equal(identity.validation.status,'unvalidated');
  assert.equal(identity.validation.anatomicalReview,false);
  assert.deepEqual(sourceCatalog.structures.find((row:any)=>row.fmaId===fma),identity);
  assert.deepEqual(catalog.structures.find((row:any)=>row.id===identity.id),identity);
  const lesson=api.shoulderMuscleXrayLesson(identity,'xray');assert(lesson);
  assert.equal(lesson.readiness,'draft');assert.deepEqual(api.bodyLesson(identity,'xray'),lesson);
  const {readiness,...content}=lesson;assert.deepEqual(api.bodyContent(identity,'xray'),content);
  assert(lesson.citations.length>0&&lesson.citations.every((url:string)=>/^https:\/\//.test(url)));
  assert.equal(new Set(lesson.citations).size,lesson.citations.length);
  const prose=[lesson.body,...lesson.bullets,lesson.note].join(' ');
  assert.match(prose,/(?:radiograph|plain film|X-ray)/i);
  assert.match(prose,/(?:muscle|tendon)/i);
  assert.doesNotMatch(prose,/approved for clinical use|registered to a patient|normal muscle and tendon/i);
  const cache=cached.entries.find((entry:any)=>JSON.parse(entry.identity).id===identity.id);
  assert(cache,`${identity.id}: teaching cache entry`);
  assert.deepEqual(cache.lessons.xray,lesson);
  for(const code of emitted)for(const value of [lesson.title,lesson.body,...lesson.citations])
   assert(visible(code,value),`${identity.id}: emitted teaching ${value.slice(0,40)}`);
  const clean=wire(lesson);lesson.bullets.push('foreign');lesson.citations.push('https://foreign.example');
  assert.deepEqual(api.shoulderMuscleXrayLesson(identity,'xray'),clean,'Detached draft');
  for(const path of pathsWhere(identity,value=>value===null||typeof value!=='object')){
   const bad=wire(identity),parent=at(bad,path.slice(0,-1)),key=path.at(-1)!;
   const original=parent[key];parent[key]=typeof original==='string'?original+'-foreign'
    :typeof original==='number'?original+0.01:original===null?'foreign':!original;
   assert.equal(api.shoulderMuscleXrayLesson(bad,'xray'),undefined,`${identity.id}:${path.join('.')}`);
  }
  for(const path of pathsWhere(identity,Array.isArray)){
   const bad=wire(identity);at(bad,path).push('foreign');
   assert.equal(api.shoulderMuscleXrayLesson(bad,'xray'),undefined,`${identity.id}:${path.join('.')} extended`);
  }
  for(const path of pathsWhere(identity,value=>value&&typeof value==='object'&&!Array.isArray(value))){
   const bad=wire(identity);at(bad,path).unexpected=true;
   assert.equal(api.shoulderMuscleXrayLesson(bad,'xray'),undefined,`${identity.id}:${path.join('.')} extra`);
   for(const key of Object.keys(at(identity,path))){
    const omitted=wire(identity);delete at(omitted,path)[key];
    assert.equal(api.shoulderMuscleXrayLesson(omitted,'xray'),undefined,
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
   assert.equal(api.shoulderMuscleXrayLesson(bad,'xray'),undefined,
    `${identity.id}:${path.join('.')} reordered`);
  }
  assert.equal(api.shoulderMuscleXrayLesson({id:identity.id},'xray'),undefined);
 }
 assert.equal(ids.size,16);
 for(const structure of catalog.structures)if(!ids.has(structure.id))
  assert.equal(api.shoulderMuscleXrayLesson(structure,'xray'),undefined);
 assert.deepEqual(readFileSync(atlas+'/public/models/bodyparts3d/full-body/shoulder-arm-muscles-dissection.glb'),
  committed(baseline,'public/models/bodyparts3d/full-body/shoulder-arm-muscles-dissection.glb'));
 const tracked=git(['ls-tree','-r','--name-only',baseline]).toString().split(/\r?\n/).filter(x=>x.endsWith('.glb'));
 assert.equal(tracked.length,146);
 for(const path of tracked)assert.deepEqual(readFileSync(atlas+'/'+path),committed(baseline,path),path);
});

test('historical 16-topic transition, current 9,936 placements and 1,104 Review packets',
 {timeout:300000},async()=>{
 const current=await importedApi(),live=await boundLiveAtlasHistory(liveCommit);
 const {exactSourceHistoryApi}=await import(pathToFileURL(atlas+'/scripts/exact-source-history-api.mjs').href);
 const old=await exactSourceHistoryApi(baseline,'review-security');
 const epoch=await exactSourceHistoryApi(completedEpoch,'review-security');
 const catalog=current.bodyDisplayCatalog(json('atlas-review/'+catalogPath));
 assert.deepEqual(catalog,live.bodyDisplayCatalog(json('atlas-review/'+catalogPath)));
 assert.deepEqual(catalog,old.bodyDisplayCatalog(JSON.parse(committed(baseline,catalogPath).toString())));
 assert.deepEqual(current.structures,live.structures);assert.deepEqual(live.structures,old.structures);
 assert.deepEqual(current.dissectionProfiles,live.dissectionProfiles);
 assert.deepEqual(live.dissectionProfiles,old.dissectionProfiles);
 assert.deepEqual(current.regionalTours,live.regionalTours);assert.deepEqual(live.regionalTours,old.regionalTours);
 assert.equal(current.regionalTours.length,51);
 assert.equal(current.regionalTours.reduce((count:number,tour:any)=>count+tour.steps.length,0),309);
 assert.deepEqual(current.contentTabs,live.contentTabs);assert.deepEqual(live.contentTabs,old.contentTabs);
 assert.equal(current.contentTabs.length,9);
 const imaging=json('atlas-review/'+imagingPath),motor=json('atlas-review/'+motorPath);
 const ids=new Set<string>([
  ...imaging.entries.filter((row:any)=>expected.has(row.identity.fmaId)).map((row:any)=>row.identity.id),
  ...motor.entries.filter((row:any)=>motorIds.includes(row.fmaId)).map((row:any)=>row.id),
 ]);
 assert.equal(ids.size,16);
 let placements=0,changed=0,packets=0,changedPackets=0;
 let malformed=0,stale=0,forgedSave=0,forgedApproval=0,storageCalls=0;
 const storage={prepare(){storageCalls++;throw Error('Rejected decision reached synthetic storage');}};
 const request=(value:any)=>new Request('https://review.test/api/body-decisions',{
  method:'POST',headers:{origin:'https://review.test','content-type':'application/json',
   'oai-authenticated-user-id':'SYNTHETIC_SHOULDER_MUSCLE_XRAY'},body:JSON.stringify(value),
 });
 for(const structure of catalog.structures){
  for(const tab of current.contentTabs){
   const before=old.bodyLesson(structure,tab),historical=epoch.bodyLesson(structure,tab);
   const after=live.bodyLesson(structure,tab),imported=current.bodyLesson(structure,tab);
   assert.deepEqual(imported,after,`${structure.id}:${tab}: imported versus current source`);
   placements++;
   if(ids.has(structure.id)&&tab==='xray'){
    changed++;assert.equal(before.readiness,'pending');assert.equal(historical.readiness,'draft');
    assert.deepEqual(after,historical,`${structure.id}:${tab}: immutable introduction`);
    assert.deepEqual(after,current.shoulderMuscleXrayLesson(structure,tab));
   }else{
    assert.deepEqual(historical,before,`${structure.id}:${tab}: historical untouched topic`);
    assert.equal(current.shoulderMuscleXrayLesson(structure,tab),undefined);
   }
  }
  const before=wire(await old.bodyReviewMaterial(structure.id));
  const historical=wire(await epoch.bodyReviewMaterial(structure.id));
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
  assert.deepEqual(after,historical,`${structure.id}: immutable introduced Review packet`);
  assert.deepEqual(await current.parseBodyReviewResponse(after,structure.id),after);
  assert.equal(await current.parseBodyReviewResponse(before,structure.id),null);
  for(const key of ['source','reasoning','guidedTours','checklist','atlasLink','limits'])
   assert.deepEqual(after[key],before[key],`${structure.id}: ${key} retained`);
  assert.deepEqual(after.topics.filter((row:any)=>row.tab!=='xray'),
   before.topics.filter((row:any)=>row.tab!=='xray'));
  assert.deepEqual(after.topics.find((row:any)=>row.tab==='xray'),
   {tab:'xray',...live.bodyLesson(structure,'xray')});
  assert.equal(after.fingerprints.source,before.fingerprints.source);
  assert.notEqual(after.fingerprints.teaching,before.fingerprints.teaching);
  assert.notEqual(after.materialHash,before.materialHash);
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
