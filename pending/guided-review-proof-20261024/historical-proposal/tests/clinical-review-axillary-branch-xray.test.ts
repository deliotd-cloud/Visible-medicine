import {boundLiveAtlasHistory} from './atlas-bound-live-history.mjs';
import {assertRenalTourEpoch} from './renal-tour-epoch-admission.mjs';
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
const baseline='ec9972a60325de147277941e04089e2d4be0baf9';
const baselineTree='ec7d1b759a613e84d79a94bcc18370b1bb885e88';
// Once introduced, these two remain immutable; only liveCommit may advance.
const completedEpoch='787993e4497fe1de282569e3f4f611baff061206';
const introductionTree='3a2e16cf348db759cd7a94f6931bdb5c7f3e2366';
const liveCommit=CURRENT_ATLAS_REVISION;
const pins=['content/shoulder-arm-artery-quiz-pins.json','content/shoulder-arterial-imaging-pins.json',
 'content/thoracoacromial-quiz-pins.json'];
const catalogPaths=['public/models/bodyparts3d/full-body/catalog.json',
 'public/models/bodyparts3d/subscapular-arteries/catalog.json'];
const helperPath='lib/axillary-branch-xray.ts',contentPath='content/axillary-branch-xray.ts';
const cachePath='content/regional-teaching/shoulder-arm.json';
const sourcePaths=[...pins,...catalogPaths,helperPath,contentPath,cachePath,'app/body-content.ts',
 'content/body-review-display-pins.json','content/body-renderer-revision.json'];
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));
const sha=(value:Uint8Array|string)=>createHash('sha256').update(value).digest('hex');
const git=(args:string[])=>execFileSync('git',args,{cwd:atlas,windowsHide:true,maxBuffer:64e6,
 env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
const committed=(revision:string,path:string)=>git(['show',`${revision}:${path}`]);
const visible=(code:string,value:string)=>code.includes(value)||code.includes(JSON.stringify(value).slice(1,-1));
const pathsWhere=(value:any,predicate:(part:any)=>boolean,path:(string|number)[]=[]):
 (string|number)[][]=>[...(predicate(value)?[path]:[]),
 ...(value&&typeof value==='object'?Object.entries(value).flatMap(([key,child])=>
  pathsWhere(child,predicate,[...path,key])):[])];
const at=(value:any,path:(string|number)[])=>path.reduce((part,key)=>part[key],value);

// Independently pinned source identities: FMA, group, side, bundle, ordered files and hashes.
const expected=new Map<string,{group:string;side:string;bundle:string;id:string;sources:{file:string;sha256:string}[];pin:number}>([
 ['FMA22682',{group:'anteriorCircumflexHumeral',side:'right',bundle:'shoulder-arm-vessels-recovery',id:'right-anterior-circumflex-humeral-artery',sources:[{file:'FJ2264',sha256:'a7aaef0dc149e6b481057266ee1b9a41720e0400a70697fbb5c15e7f8dd06187'}],pin:0}],
 ['FMA22683',{group:'anteriorCircumflexHumeral',side:'left',bundle:'shoulder-arm-vessels-recovery',id:'left-anterior-circumflex-humeral-artery',sources:[{file:'FJ2212',sha256:'87ac4531b5551470294420965e60888cae7a4943f767386ab3f40713144850f2'}],pin:0}],
 ['FMA22685',{group:'posteriorCircumflexHumeral',side:'right',bundle:'shoulder-arm-vessels-recovery',id:'right-posterior-circumflex-humeral-artery',sources:[{file:'FJ2291',sha256:'72f4c8d4e8465447611464bfa74df78924ffeaa9fc9829af32a4082518b6c02b'},{file:'FJ2292',sha256:'19ad27ed37b4fdc61653588976e81e138f28b063c52b270e5cdfb93364eac58b'}],pin:0}],
 ['FMA22687',{group:'posteriorCircumflexHumeral',side:'left',bundle:'shoulder-arm-vessels-recovery',id:'left-posterior-circumflex-humeral-artery',sources:[{file:'FJ2239',sha256:'1e88872df7cffa6ccc3c325b2fbd0543279dc9ffc0a75b7e1e1ae14a0dc30d6f'},{file:'FJ2240',sha256:'8d07c946f22777f447e46597283d37a9ad993f8f1f8d194af6ed58dd2475d62c'}],pin:0}],
 ['FMA23180',{group:'circumflexScapular',side:'right',bundle:'shoulder-arm-vessels-recovery',id:'right-circumflex-scapular-artery',sources:[{file:'FJ2273',sha256:'37154eff6530ba3cb17412723850f45c3ee5be9d0d9b78e737c7a1f356c87b3c'}],pin:0}],
 ['FMA23181',{group:'circumflexScapular',side:'left',bundle:'shoulder-arm-vessels-recovery',id:'left-circumflex-scapular-artery',sources:[{file:'FJ2221',sha256:'3387830f0c01f2f98710951a900442fdf6ad7b123ad1202aad4e0390cb0551f4'}],pin:0}],
 ['FMA66321',{group:'thoracodorsal',side:'right',bundle:'shoulder-arm-vessels-recovery',id:'right-thoracodorsal-artery',sources:[{file:'FJ2305',sha256:'b7d085f37da4801db31307961a176357a1d3a11e226c290e9883455376e9e254'}],pin:0}],
 ['FMA66322',{group:'thoracodorsal',side:'left',bundle:'shoulder-arm-vessels-recovery',id:'left-thoracodorsal-artery',sources:[{file:'FJ2253',sha256:'b6f9ae7678bb79b0245d03ea27ceee0a9e3f0cf6b6b0c7613c0830ac40e8989f'}],pin:0}],
 ['FMA22678',{group:'subscapular',side:'right',bundle:'subscapular-arteries',id:'right-subscapular-artery',sources:[{file:'FJ2298',sha256:'41050856a7c2cbb79984a78346a0e3dc13e271758a04012f2283fee2182a2f29'}],pin:1}],
 ['FMA22679',{group:'subscapular',side:'left',bundle:'subscapular-arteries',id:'left-subscapular-artery',sources:[{file:'FJ2246',sha256:'4dc93c063b9d87ab85699bfeb9f856cb39faf12d2859b0e4184ba64de6c9ef87'}],pin:1}],
 ['FMA66563',{group:'trunk',side:'right',bundle:'shoulder-arm-vessels-inventory',id:'trunk-of-right-thoraco-acromial-artery',sources:[{file:'FJ2304',sha256:'b82a47ccca2bb3affd63d8d1f86ad7c79a5a725bcbeb60a25711f1cd3275494e'}],pin:2}],
 ['FMA66564',{group:'trunk',side:'left',bundle:'shoulder-arm-vessels-inventory',id:'trunk-of-left-thoraco-acromial-artery',sources:[{file:'FJ2252',sha256:'2ff1924941e505e62ac394bc8e8087f6903c7dba58826d87dd21cbc254e511c7'}],pin:2}],
 ['FMA23063',{group:'pectoral',side:'right',bundle:'shoulder-arm-vessels-inventory',id:'pectoral-branch-of-right-thoraco-acromial-artery',sources:[{file:'FJ2361',sha256:'341bf21d162b7d1f60261396f397db0d7d4acb5be2295e30dea7f6b9394651e8'}],pin:2}],
 ['FMA23064',{group:'pectoral',side:'left',bundle:'shoulder-arm-vessels-inventory',id:'pectoral-branch-of-left-thoraco-acromial-artery',sources:[{file:'FJ2330',sha256:'3defe0932a0a8948faf7037f0812527864b9ac4e4f8251f45873d7b48ab00977'}],pin:2}],
 ['FMA23068',{group:'acromial',side:'right',bundle:'shoulder-arm-vessels-inventory',id:'acromial-branch-of-right-thoraco-acromial-artery',sources:[{file:'FJ2263',sha256:'d794a35d47638639cd793d357a99312850d6f7b27531cdc10b4b00817f35e170'}],pin:2}],
 ['FMA23069',{group:'acromial',side:'left',bundle:'shoulder-arm-vessels-inventory',id:'acromial-branch-of-left-thoraco-acromial-artery',sources:[{file:'FJ2211',sha256:'bd760839d0c3565e6d2bfe9d40e111116f7965e636053f213b0800b1ccb27537'}],pin:2}],
 ['FMA23072',{group:'deltoid',side:'right',bundle:'shoulder-arm-vessels-inventory',id:'deltoid-branch-of-right-thoraco-acromial-artery',sources:[{file:'FJ2282',sha256:'c5d3cd8addb5e3355d853cd416a599e3a90e6c450adbe08c6aad1d28136dc761'}],pin:2}],
 ['FMA23073',{group:'deltoid',side:'left',bundle:'shoulder-arm-vessels-inventory',id:'deltoid-branch-of-left-thoraco-acromial-artery',sources:[{file:'FJ2230',sha256:'cf6ccdb1b2c827dd096a04457aee6f55d2c95a3400f4dc6254c42fbfbd6bfcd1'}],pin:2}],
]);

async function importedApi(){
 const built=await build({stdin:{contents:[
  "export {axillaryBranchXrayLesson} from './atlas-review/lib/axillary-branch-xray';",
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
 assert.deepEqual(cached.default,json('atlas-review/'+cachePath));
 return api;
}

test('exact axillary branch identities, four exports, Review and emitted drafts',
 {timeout:180000},async()=>{
 const admission=validateCurrentAtlasDelivery();
 assert.equal(admission.source,liveCommit);
 assert.equal(git(['rev-parse','HEAD']).toString().trim(),liveCommit);
 assert.equal(git(['rev-parse',`${baseline}^{tree}`]).toString().trim(),baselineTree);
 assert.equal(git(['rev-parse',`${completedEpoch}^{tree}`]).toString().trim(),introductionTree);
 assert.equal(git(['merge-base',baseline,completedEpoch]).toString().trim(),baseline);
 assert.equal(git(['merge-base',completedEpoch,liveCommit]).toString().trim(),completedEpoch);
 for(const path of [helperPath,contentPath])
  assert.deepEqual(committed(liveCommit,path),committed(completedEpoch,path),`${path}: immutable introduction`);
 for(const path of [...pins,...catalogPaths])
  assert.deepEqual(committed(liveCommit,path),committed(baseline,path),`${path}: source pin retained`);
 assert.deepEqual(new Set(git(['diff','--name-only',baseline,completedEpoch]).toString().trim().split(/\r?\n/)),new Set([
  'LICENSES/THIRD_PARTY_NOTICES.md','app/body-content.ts','content/body-renderer-revision.json',
  'content/body-review-display-pins.json',cachePath,contentPath,'docs/AXILLARY_BRANCH_XRAY.md',
  helperPath,'package.json','scripts/exact-source-history-api.mjs','scripts/test-axillary-branch-xray.mjs',
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
  if([...pins,...catalogPaths,helperPath,contentPath,cachePath].includes(path))
   assert.equal(sha(imported),sha(original),`${path}: exact imported source`);
  for(const {name,base} of learners){
   const input=json(base+'source-inputs.json').find((item:{path:string})=>item.path===path);
   const inLearner=(name==='head-neck'||name==='shoulder')&&
    [...pins,catalogPaths[1],helperPath,contentPath,cachePath,'app/body-content.ts'].includes(path)
    ||name==='head-neck'&&path===catalogPaths[0];
   if(inLearner)assert.equal(input?.sha256,
    sha(committed(admission.runtimeSources[name],path)),`${name}: ${path}`);
   else assert.equal(input,undefined,`${name}: source outside closure ${path}`);
  }
  for(const base of ['public/atlas-review/','public/atlas-review-viewer/',...learners.map(x=>x.base)])
   assert.equal(existsSync(base+path),false,`${base+path}: raw source exposed`);
 }
 const head=learners.find(x=>x.name==='head-neck')!;
 const delivered=catalogPaths[0].replace('public/','');
 const record=head.manifest.files.find((file:{path:string})=>file.path===delivered);
 assert(record,`${delivered}: head-neck delivered catalog`);
 assert.equal(record.sha256,sha(readFileSync(head.base+delivered)));
 assert.equal(record.sha256,sha(committed(baseline,catalogPaths[0])));
 const rawPins=pins.map(path=>json('atlas-review/'+path));
 const rawCatalogs=catalogPaths.map(path=>json('atlas-review/'+path));
 const selected=rawPins.flatMap((data,index)=>data.entries.filter((entry:any)=>
  expected.get(entry.identity.fmaId)?.pin===index));
 assert.equal(expected.size,18);assert.equal(selected.length,18);
 assert.deepEqual(new Set(selected.map((row:any)=>row.identity.fmaId)),new Set(expected.keys()));
 const api=await importedApi(),catalog=api.bodyDisplayCatalog(rawCatalogs[0]);
 assert.equal(catalog.structures.length,1104);
 const emitted=learners.filter(x=>x.name==='head-neck'||x.name==='shoulder')
  .map(x=>emittedTeaching(x.base,x.manifest.files,true));
 const cached=json('atlas-review/'+cachePath);
 const ids=new Set<string>();
 for(const entry of selected){
  const identity=entry.identity,e=expected.get(identity.fmaId)!;
  assert.equal(entry.group??'subscapular',e.group);
  assert.equal(identity.id,`vm:anatomy:body:shoulder-arm:${e.side}:vessel:${e.id}`);
  assert.equal(identity.laterality,e.side);assert.equal(identity.region,'shoulder-arm');
  assert.equal(identity.system,'vessels');assert.equal(identity.category,'vessel');
  assert.equal(identity.bundle,e.bundle);assert.equal(identity.nodeName,identity.fmaId);
  assert.equal(identity.sourceTree,'isa');assert.deepEqual(identity.sources,e.sources);
  assert.equal(identity.validation.status,'unvalidated');
  assert.equal(identity.validation.anatomicalReview,false);
  assert.deepEqual(rawCatalogs.flatMap(c=>c.structures.filter((row:any)=>row.fmaId===identity.fmaId)),[identity]);
  assert.deepEqual(catalog.structures.filter((row:any)=>row.id===identity.id),[identity]);
  ids.add(identity.id);
  const lesson=api.axillaryBranchXrayLesson(identity,'xray');assert(lesson);
  assert.equal(lesson.readiness,'draft');assert.deepEqual(api.bodyLesson(identity,'xray'),lesson);
  const {readiness,...content}=lesson;assert.deepEqual(api.bodyContent(identity,'xray'),content);
  assert(lesson.citations.length>0&&lesson.citations.every((url:string)=>/^https:\/\//.test(url)));
  assert.equal(new Set(lesson.citations).size,lesson.citations.length);
  const prose=[lesson.body,...lesson.bullets,lesson.note].join(' ');
  assert.match(prose,/(?:radiograph|plain film|x-ray)/i);
  assert.match(prose,/arter(?:y|ies|ial)|branch|vessel|vascular|lumen/i);
  assert.match(prose,/(?:not|cannot|does not).*(?:show|resolve|assess|establish|confirm|prove|depict|visuali[sz]e)|(?:cannot|not) be (?:assessed|seen)/i);
  assert.doesNotMatch(prose,/approved for clinical use|registered to a patient|normal arterial patency/i);
  const cache=cached.entries.find((row:any)=>JSON.parse(row.identity).id===identity.id);assert(cache);
  assert.deepEqual(cache.lessons.xray,lesson);
  for(const code of emitted)for(const value of [lesson.title,lesson.body,...lesson.citations])
   assert(visible(code,value),`${identity.id}: emitted teaching ${value.slice(0,40)}`);
  const clean=wire(lesson);lesson.bullets.push('foreign');lesson.citations.push('https://foreign.example');
  assert.deepEqual(api.axillaryBranchXrayLesson(identity,'xray'),clean);
  for(const path of pathsWhere(identity,value=>value===null||typeof value!=='object')){
   const bad=wire(identity),parent=at(bad,path.slice(0,-1)),key=path.at(-1)!;
   const original=parent[key];parent[key]=typeof original==='string'?original+'-foreign'
    :typeof original==='number'?original+0.01:original===null?'foreign':!original;
   assert.equal(api.axillaryBranchXrayLesson(bad,'xray'),undefined,`${identity.id}:${path.join('.')}`);
  }
  for(const path of pathsWhere(identity,Array.isArray)){
   const bad=wire(identity);at(bad,path).push('foreign');
   assert.equal(api.axillaryBranchXrayLesson(bad,'xray'),undefined,`${identity.id}:${path.join('.')} extended`);
  }
  for(const path of pathsWhere(identity,value=>value&&typeof value==='object'&&!Array.isArray(value))){
   const bad=wire(identity);at(bad,path).unexpected=true;
   assert.equal(api.axillaryBranchXrayLesson(bad,'xray'),undefined,`${identity.id}:${path.join('.')||'<root>'} extra`);
   for(const key of Object.keys(at(identity,path))){
    const omitted=wire(identity);delete at(omitted,path)[key];
    assert.equal(api.axillaryBranchXrayLesson(omitted,'xray'),undefined,`${identity.id}:${[...path,key].join('.')} omitted`);
   }
  }
  for(const path of pathsWhere(identity,value=>Array.isArray(value)&&value.length>1)){
   const original=at(identity,path),other=original.findIndex((item:any,index:number)=>index>0&&
    JSON.stringify(item)!==JSON.stringify(original[0]));if(other<0)continue;
   const bad=wire(identity),array=at(bad,path);[array[0],array[other]]=[array[other],array[0]];
   assert.equal(api.axillaryBranchXrayLesson(bad,'xray'),undefined,`${identity.id}:${path.join('.')} reordered`);
  }
  assert.equal(api.axillaryBranchXrayLesson({id:identity.id},'xray'),undefined);
 }
 assert.equal(ids.size,18);
 for(const structure of catalog.structures)if(!ids.has(structure.id))
  assert.equal(api.axillaryBranchXrayLesson(structure,'xray'),undefined);
 const tracked=git(['ls-tree','-r','--name-only',baseline]).toString().split(/\r?\n/).filter(x=>x.endsWith('.glb'));
 assert.equal(tracked.length,146);
 for(const path of tracked)assert.deepEqual(readFileSync(atlas+'/'+path),committed(baseline,path),path);
});

test('immutable 18-topic transition, current 9,936 placements and 1,104 Review packets',
 {timeout:300000},async()=>{
 const current=await importedApi(),live=await boundLiveAtlasHistory(liveCommit);
 const {exactSourceHistoryApi}=await import(pathToFileURL(atlas+'/scripts/exact-source-history-api.mjs').href);
 const old=await exactSourceHistoryApi(baseline,'review-security');
 const epoch=await exactSourceHistoryApi(completedEpoch,'axillary-branch-xray-epoch');
 const catalog=current.bodyDisplayCatalog(json('atlas-review/'+catalogPaths[0]));
 assert.deepEqual(catalog,live.bodyDisplayCatalog(json('atlas-review/'+catalogPaths[0])));
 assert.deepEqual(catalog,old.bodyDisplayCatalog(JSON.parse(committed(baseline,catalogPaths[0]).toString())));
 assert.deepEqual(current.structures,live.structures);assert.deepEqual(epoch.structures,old.structures);
 assert.deepEqual(current.dissectionProfiles,live.dissectionProfiles);
 assert.deepEqual(epoch.dissectionProfiles,old.dissectionProfiles);
 assert.deepEqual(current.regionalTours,live.regionalTours);assertRenalTourEpoch(old.regionalTours,live.regionalTours);
 assert.equal(current.regionalTours.length,53);
 assert.equal(current.regionalTours.reduce((n:number,tour:any)=>n+tour.steps.length,0),317);
 assert.deepEqual(current.contentTabs,live.contentTabs);assert.deepEqual(live.contentTabs,old.contentTabs);
 assert.equal(current.contentTabs.length,9);
 const ids=new Set<string>(pins.flatMap((path,index)=>json('atlas-review/'+path).entries
  .filter((row:any)=>expected.get(row.identity.fmaId)?.pin===index)
  .map((row:any)=>row.identity.id)));
 assert.equal(ids.size,18);
 let placements=0,changed=0,packets=0,changedPackets=0;
 let malformed=0,stale=0,forgedSave=0,forgedApproval=0,storageCalls=0;
 const storage={prepare(){storageCalls++;throw Error('Rejected decision reached synthetic storage');}};
 const request=(value:any)=>new Request('https://review.test/api/body-decisions',{
  method:'POST',headers:{origin:'https://review.test','content-type':'application/json',
   'oai-authenticated-user-id':'SYNTHETIC_AXILLARY_BRANCH_XRAY'},body:JSON.stringify(value),
 });
 for(const structure of catalog.structures){
  for(const tab of current.contentTabs){
   const before=old.bodyLesson(structure,tab),historical=epoch.bodyLesson(structure,tab);
   const after=live.bodyLesson(structure,tab),imported=current.bodyLesson(structure,tab);
   assert.deepEqual(imported,after,`${structure.id}:${tab}: imported versus current source`);
   placements++;
   if(ids.has(structure.id)&&tab==='xray'){
    changed++;assert.equal(before.readiness,'pending');assert.equal(historical.readiness,'draft');
    assert.deepEqual(after,current.axillaryBranchXrayLesson(structure,tab));
    assert.deepEqual(historical,after,`${structure.id}: immutable introduction`);
   }else{
    assert.deepEqual(historical,before,`${structure.id}:${tab}: historical untouched topic`);
    assert.equal(current.axillaryBranchXrayLesson(structure,tab),undefined);
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
  assert.deepEqual(historical.topics.filter((row:any)=>row.tab!=='xray'),
   before.topics.filter((row:any)=>row.tab!=='xray'));
  for(const key of ['source','reasoning','guidedTours','checklist','atlasLink','limits'])
   assert.deepEqual(historical[key],before[key],`${structure.id}: historical ${key} retained`);
  assert.equal(historical.fingerprints.source,before.fingerprints.source);
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
  {placements:9936,changed:18,preserved:9918,packets:1104,changedPackets:18,
   preservedPackets:1086,malformed:72,stale:18,forgedSave:18,forgedApproval:18,storageCalls:0});
});
