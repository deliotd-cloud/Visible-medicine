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
const baseline='d819cd556d990e4100534aa2ceab3c20cc181d8e';
const baselineTree='7f895c706276c587a1c0f1e61ee357034dc7c1d6';
// Main pins these after the Atlas source commit and normal website import.
const introductionCommit='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
// git rev-parse '9fba9a1e24b6669aafd48e945d55fc0939d50ab2^{tree}' with replace objects disabled.
const introductionTree='1bd327fb20a52b35bec584675c457173c548e24b';
const liveCommit=CURRENT_ATLAS_REVISION;
const historicalFamilyCommit='190a63238eadcf906abe89dcbb6a67c88afe70b9';
const shoulderCitationEpoch='7978478992f54ea68e0f53c3d195c459c7b80068';
const pinPaths=['content/shoulder-girdle-artery-quiz-pins.json','content/systemic-venous-pins.json',
 'content/suprascapular-vessel-ultrasound-pins.json','content/upper-venous-clinical-pins.json'];
const authored=['lib/shoulder-vessel-xray.ts','content/shoulder-girdle-xray.ts',
 'content/shoulder-venous-xray.ts'];
const catalogPath='public/models/bodyparts3d/full-body/catalog.json';
const sourcePaths=[...pinPaths,...authored,catalogPath,'content/regional-teaching/shoulder-arm.json',
 'app/body-content.ts','content/body-review-display-pins.json','content/body-renderer-revision.json'];
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));
const sha=(value:Uint8Array|string)=>createHash('sha256').update(value).digest('hex');
const git=(...args:string[])=>execFileSync('git',args,{cwd:atlas,windowsHide:true,maxBuffer:64e6,
 env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}).toString().trim();
const committed=(revision:string,path:string)=>execFileSync('git',['show',`${revision}:${path}`],
 {cwd:atlas,windowsHide:true,maxBuffer:64e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
const visible=(code:string,value:string)=>code.includes(value)||code.includes(JSON.stringify(value).slice(1,-1));
const pathsWhere=(value:any,predicate:(part:any)=>boolean,path:(string|number)[]=[]):
 (string|number)[][]=>[...(predicate(value)?[path]:[]),
 ...(value&&typeof value==='object'?Object.entries(value).flatMap(([key,child])=>
  pathsWhere(child,predicate,[...path,key])):[])];
const at=(value:any,path:(string|number)[])=>path.reduce((part,key)=>part[key],value);

// Separate fixture, copied from four committed pin sets; no helper-owned identity list is trusted.
const rows=[
 ['FMA3992','right','right-thyrocervical-trunk','thyrocervical',0,'shoulder-arm-vessels-inventory','FJ2307','b81b463eeedf5999f8cd9e072d445799e9c3dcd23a618cda3fb867af39cfe123'],
 ['FMA4084','left','left-thyrocervical-trunk','thyrocervical',0,'shoulder-arm-vessels-inventory','FJ2255','15a93e07812a3d1aeed4d8be392335496fb024ab0d8bb1d4e30e281c3d93c810'],
 ['FMA5039','right','right-costocervical-trunk','costocervical',0,'shoulder-arm-vessels-inventory','FJ2276','607905f3c66e08d10c3362c702d0ca13bebd55a71fd83667a61f6738d1a66210'],
 ['FMA4086','left','left-costocervical-trunk','costocervical',0,'shoulder-arm-vessels-inventory','FJ2224','32df22be6cdf4200ad69dc439e7b6be7cf6e9ebcc44579526819bbcdf75fc106'],
 ['FMA4057','right','right-dorsal-scapular-artery','dorsalScapular',0,'shoulder-arm-vessels-inventory','FJ2284','1790c89e2535c2831726f71c88ab9f918e113cf20fef742b56d928c108b337aa'],
 ['FMA10552','left','left-dorsal-scapular-artery','dorsalScapular',0,'shoulder-arm-vessels-inventory','FJ2232','729363384679145bcaf83868d792dd3dff3f42c56a809d3a3d6cc1e09261e5be'],
 ['FMA10698','right','right-suprascapular-artery','suprascapular',0,'shoulder-arm-vessels-inventory','FJ2303','7f065a02471a2664b8d258786de9eaa0a5923bdb3c346cc818908ba07faf243d'],
 ['FMA10681','left','left-suprascapular-artery','suprascapular',0,'shoulder-arm-vessels-inventory','FJ2251','89f37b85c44d82a11482e56365078b40d8a542c1ad0bcfb4ccd823574645173f'],
 ['FMA13330','right','right-axillary-vein','axillary',1,'shoulder-arm-vessels-inventory','FJ2269','24438422321aa6665de6394aa39e79fdeabdf2bc56427a3419da4dc630546464'],
 ['FMA13331','left','left-axillary-vein','axillary',1,'shoulder-arm-vessels-inventory','FJ2217','7b448d1f2a071e88d1a2ebe54e7e5d417719663a5b01d1226f492b71ebdc19cd'],
 ['FMA50859','right','right-suprascapular-vein','suprascapularVein',2,'shoulder-arm-vessels-inventory','FJ2302','05a1af2bdafa5d179753ce923971e3300a4451ce71788d9fc3bf115897dc92db'],
 ['FMA50860','left','left-suprascapular-vein','suprascapularVein',2,'shoulder-arm-vessels-inventory','FJ2250','50bcc347434326f06d5db0054036b90215f78f964c3d00c0c94cd0b981dd558b'],
 ['FMA22935','right','right-medial-brachial-vein','medialBrachial',3,'brachial-veins','FJ2341','0468a157795c7346d964d1884627464d5cfe9c4c8bcc84661aefdb2bc2d18259'],
 ['FMA22936','left','left-medial-brachial-vein','medialBrachial',3,'brachial-veins','FJ2313','3707bf67b5959e140fea0eca643bc31db00e97620e63afbe48ed10357af44ec8'],
] as const;
const expected=new Map(rows.map(([fma,side,suffix,group,pin,bundle,file,hash])=>
 [fma,{side,suffix,group,pin,bundle,file,hash}]));

async function importedApi(){
 const built=await build({stdin:{contents:[
  "export {shoulderVesselXrayLesson} from './atlas-review/lib/shoulder-vessel-xray';",
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
 for(const path of [...authored,'app/body-content.ts'])
  assert(Object.keys(built.metafile.inputs).some(input=>input.replaceAll('\\','/').endsWith(path)),path);
 const api=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
 assert.deepEqual((await api.regionalTeachingImports['shoulder-arm']()).default,
  json('atlas-review/content/regional-teaching/shoulder-arm.json'));
 return api;
}

test('exact 14 source identities, imported closure and four generated exports',{timeout:180000},async()=>{
 const pin=validateCurrentAtlasDelivery();
 assert.equal(pin.source,liveCommit);assert.equal(pin.runtimeSources.shoulder,liveCommit);
 assert.equal(git('merge-base',historicalFamilyCommit,liveCommit),historicalFamilyCommit);
 assert.equal(git('rev-parse','HEAD'),liveCommit);
 assert.equal(git('rev-parse',`${baseline}^{tree}`),baselineTree);
 assert.equal(git('rev-parse',`${introductionCommit}^{tree}`),introductionTree);
 assert.equal(git('merge-base',baseline,introductionCommit),baseline);
 assert.equal(git('merge-base',introductionCommit,liveCommit),introductionCommit);
 assert.equal(git('merge-base',shoulderCitationEpoch,liveCommit),shoulderCitationEpoch);
 for(const path of ['app/anatomy-data.ts','lib/legacy-shoulder-references.ts'])
  assert.deepEqual(committed(liveCommit,path),committed(shoulderCitationEpoch,path),
   `${path}: exact later shoulder citation source`);
 for(const path of pinPaths)assert.deepEqual(committed(liveCommit,path),committed(baseline,path),path);
 for(const path of authored)assert.deepEqual(committed(liveCommit,path),committed(introductionCommit,path),
  `${path}: original shoulder vessel lesson source retained`);
 const review=json('atlas-review/manifest.json');assert.equal(review.revision,liveCommit);
 assert.equal(review.files.length,pin.reviewSourceFiles);
 const viewer=json('public/atlas-review-viewer/manifest.json');
 assert.equal(viewer.sourceCommit,liveCommit);
 assert.equal(viewer.websiteIntegrationSha256,review.websiteIntegrationSha256);
 assert.equal(viewer.personalRecordsIncluded,false);
 const learners=['head-neck','shoulder','lower-limb','female-pelvis'].map(name=>({
  name,base:`public/atlas-runtime/${name}/`,manifest:json(`public/atlas-runtime/${name}/manifest.json`)}));
 for(const {name,manifest} of learners){
  assert.equal(manifest.sourceCommit,pin.runtimeSources[name],name);
  assert.equal(manifest.patientDataIncluded,false,name);
  assert.equal(manifest.clinicalApproved,false,name);
 }
 for(const path of sourcePaths){
  const original=committed(liveCommit,path),imported=readFileSync('atlas-review/'+path);
  const record=review.files.find((file:{path:string})=>file.path===path);assert(record,path);
  assert.equal(record.sourceSha256,sha(original),path);
  assert.equal(record.importedSha256,sha(imported),path);
  if([...pinPaths,...authored,catalogPath,'content/regional-teaching/shoulder-arm.json'].includes(path))
   assert.equal(sha(imported),sha(original),path);
  for(const {name,base} of learners){
   const input=json(base+'source-inputs.json').find((item:{path:string})=>item.path===path);
   if(input)assert.equal(input.sha256,sha(committed(pin.runtimeSources[name],path)),`${base}${path}`);
  }
  for(const base of ['public/atlas-review/','public/atlas-review-viewer/',...learners.map(x=>x.base)])
   assert.equal(existsSync(base+path),false,`${base+path}: raw source exposed`);
 }
 const pins=pinPaths.map(path=>json('atlas-review/'+path));
 const selected=pins.flatMap((data,index)=>data.entries.filter((item:any)=>
  expected.get((item.identity??item).fmaId)?.pin===index));
 assert.equal(selected.length,14);assert.equal(expected.size,14);
 const api=await importedApi(),catalog=api.bodyDisplayCatalog(json('atlas-review/'+catalogPath));
 assert.equal(api.structures.length,9);assert.equal(catalog.structures.length,1104);
 const emitted=learners.filter(x=>['head-neck','shoulder'].includes(x.name))
  .map(x=>emittedTeaching(x.base,x.manifest.files,true));
 const ids=new Set<string>();
 for(const item of selected){
  const identity=item.identity??item,e=expected.get(identity.fmaId)!;
  assert.equal(identity.id,`vm:anatomy:body:shoulder-arm:${e.side}:vessel:${e.suffix}`);
  assert.equal(identity.laterality,e.side);assert.equal(identity.region,'shoulder-arm');
  assert.equal(identity.system,'vessels');assert.equal(identity.category,'vessel');
  assert.equal(identity.bundle,e.bundle);assert.equal(identity.nodeName,identity.fmaId);
  assert.equal(identity.sourceTree,'isa');
  assert.deepEqual(identity.sources,[{file:e.file,sha256:e.hash}]);
  assert.equal(identity.validation.status,'unvalidated');
  assert.equal(identity.validation.anatomicalReview,false);
  assert.equal(item.group??item.family??'axillary',e.pin===2?'vein':e.pin===3?'brachial':e.group);
  assert.deepEqual(catalog.structures.filter((row:any)=>row.id===identity.id),[identity]);
  ids.add(identity.id);
  const lesson=api.shoulderVesselXrayLesson(identity,'xray');assert(lesson);
  assert.equal(lesson.readiness,'draft');assert.deepEqual(api.bodyLesson(identity,'xray'),lesson);
  const {readiness,...content}=lesson;assert.deepEqual(api.bodyContent(identity,'xray'),content);
  assert(lesson.citations.length>0&&lesson.citations.every((url:string)=>/^https:\/\//.test(url)));
  assert.equal(new Set(lesson.citations).size,lesson.citations.length);
  const prose=[lesson.body,...lesson.bullets,lesson.note].join(' ');
  assert.match(prose,/plain radiograph(?:y)?|plain film|x-ray/i);
  assert.match(prose,/(?:not|cannot|does not).*(?:outline|establish|confirm|prove|visuali[sz]e)/i);
  assert.doesNotMatch(prose,/approved for clinical use|registered to a patient|normal venous patency/i);
  const cached=json('atlas-review/content/regional-teaching/shoulder-arm.json').entries
   .find((row:any)=>JSON.parse(row.identity).id===identity.id);assert(cached);
  assert.deepEqual(cached.lessons.xray,lesson);
  for(const code of emitted)for(const value of [lesson.title,lesson.body,...lesson.citations])
   assert(visible(code,value),`${identity.id}: emitted ${value.slice(0,40)}`);
  const clean=wire(lesson);lesson.bullets.push('foreign');lesson.citations.push('https://foreign.example');
  assert.deepEqual(api.shoulderVesselXrayLesson(identity,'xray'),clean);
  for(const path of pathsWhere(identity,value=>value===null||typeof value!=='object')){
   const bad=wire(identity),parent=at(bad,path.slice(0,-1)),key=path.at(-1)!;
   const original=parent[key];parent[key]=typeof original==='string'?original+'-foreign'
    :typeof original==='number'?original+0.01:original===null?'foreign':!original;
   assert.equal(api.shoulderVesselXrayLesson(bad,'xray'),undefined,`${identity.id}:${path.join('.')}`);
  }
  for(const path of pathsWhere(identity,Array.isArray)){
   const bad=wire(identity);at(bad,path).push('foreign');
   assert.equal(api.shoulderVesselXrayLesson(bad,'xray'),undefined,`${identity.id}:${path.join('.')} extended`);
  }
  for(const path of pathsWhere(identity,value=>value&&typeof value==='object'&&!Array.isArray(value))){
   const bad=wire(identity);at(bad,path).unexpected=true;
   assert.equal(api.shoulderVesselXrayLesson(bad,'xray'),undefined,`${identity.id}:${path.join('.')} extra`);
   for(const key of Object.keys(at(identity,path))){
    const omitted=wire(identity);delete at(omitted,path)[key];
    assert.equal(api.shoulderVesselXrayLesson(omitted,'xray'),undefined,`${identity.id}:${path.join('.')} ${key} omitted`);
   }
  }
  assert.equal(api.shoulderVesselXrayLesson({id:identity.id},'xray'),undefined);
 }
 assert.equal(ids.size,14);
 for(const structure of catalog.structures)if(!ids.has(structure.id))
  assert.equal(api.shoulderVesselXrayLesson(structure,'xray'),undefined);
});

test('historical 14-topic change, 9,936 placements and Review decision refusal',
 {timeout:300000},async()=>{
 const current=await importedApi(),live=await boundLiveAtlasHistory(liveCommit,'shoulder-vessel-xray-epoch');
 const {exactSourceHistoryApi}=await import(pathToFileURL(atlas+'/scripts/exact-source-history-api.mjs').href);
 const old=await exactSourceHistoryApi(baseline,'review-security');
 const epoch=await exactSourceHistoryApi(introductionCommit,'shoulder-vessel-xray-epoch');
 const catalog=current.bodyDisplayCatalog(json('atlas-review/'+catalogPath));
 assert.deepEqual(catalog,live.catalog);
 assert.deepEqual(catalog,old.bodyDisplayCatalog(JSON.parse(committed(baseline,catalogPath).toString())));
 assert.deepEqual(current.structures,live.structures);assert.deepEqual(epoch.structures,old.structures);
 assert.deepEqual(current.dissectionProfiles,live.dissectionProfiles);
 assert.deepEqual(epoch.dissectionProfiles,old.dissectionProfiles);
 assert.deepEqual(current.regionalTours,live.regionalTours);
 assert.deepEqual(epoch.regionalTours,old.regionalTours);
 assertRenalTourEpoch(old.regionalTours,live.regionalTours);
 assert.equal(epoch.regionalTours.length,51);
 assert.equal(epoch.regionalTours.reduce((n:number,tour:any)=>n+tour.steps.length,0),309);
 assert.equal(current.regionalTours.length,55);
 assert.equal(current.regionalTours.reduce((n:number,tour:any)=>n+tour.steps.length,0),327);
 assert.deepEqual(current.contentTabs,live.contentTabs);assert.deepEqual(epoch.contentTabs,old.contentTabs);
 assert.equal(current.contentTabs.length,9);
 const ids=new Set<string>(pinPaths.flatMap((path,index)=>json('atlas-review/'+path).entries
  .filter((item:any)=>expected.get((item.identity??item).fmaId)?.pin===index)
  .map((item:any)=>(item.identity??item).id)));
 assert.equal(ids.size,14);
 let placements=0,changed=0,packets=0,changedPackets=0,malformed=0,stale=0,forged=0,storageCalls=0;
 const storage={prepare(){storageCalls++;throw Error('Rejected decision reached synthetic storage');}};
 const request=(value:any)=>new Request('https://review.test/api/body-decisions',{
  method:'POST',headers:{origin:'https://review.test','content-type':'application/json',
   'oai-authenticated-user-id':'SYNTHETIC_SHOULDER_VESSEL_XRAY'},body:JSON.stringify(value)});
 for(const structure of catalog.structures){
  for(const tab of current.contentTabs){
   const before=old.bodyLesson(structure,tab),historical=epoch.bodyLesson(structure,tab);
   const after=live.bodyLesson(structure,tab),imported=current.bodyLesson(structure,tab);
   assert.deepEqual(imported,after,`${structure.id}:${tab}: imported/current`);placements++;
   if(ids.has(structure.id)&&tab==='xray'){
    changed++;assert.equal(before.readiness,'pending');assert.equal(historical.readiness,'draft');
    assert.deepEqual(historical,epoch.shoulderVesselXrayLesson(structure,tab));
    assert.deepEqual(after,current.shoulderVesselXrayLesson(structure,tab));
   }else{
    assert.deepEqual(historical,before,`${structure.id}:${tab}: introduction preserved`);
    assert.equal(current.shoulderVesselXrayLesson(structure,tab),undefined);
   }
  }
  const before=wire(await old.bodyReviewMaterial(structure.id));
  const historical=wire(await epoch.bodyReviewMaterial(structure.id));
  const after=wire(await live.bodyReviewMaterial(structure.id));
  assert(before&&historical&&after,structure.id);packets++;
  assert.deepEqual(wire(await current.bodyReviewMaterial(structure.id)),after);
  assert.equal(after.approval,false);assert.equal(after.status,'worksheet-not-submitted');
  if(!ids.has(structure.id)){
   assert.deepEqual(historical,before,`${structure.id}: introduction packet preserved`);continue;
  }
  changedPackets++;
  assert.deepEqual(await epoch.parseBodyReviewResponse(historical,structure.id),historical,
   `${structure.id}: exact introduced Review packet`);
  assert.deepEqual(historical.topics.filter((row:any)=>row.tab!=='xray'),
   before.topics.filter((row:any)=>row.tab!=='xray'));
  for(const key of ['source','reasoning','guidedTours','checklist','atlasLink','limits'])
   assert.deepEqual(historical[key],before[key],`${structure.id}:${key}`);
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
  ]){const bad=wire(after);mutate(bad);
   assert.equal(await current.parseBodyReviewResponse(bad,structure.id),null);malformed++;}
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
  const forgedDecision=wire(decision);forgedDecision.draft.checks.foreign=true;
  assert.equal((await current.postBodyDecision(request(forgedDecision),storage)).status,422);forged++;
  const approval=wire(decision);approval.draft.status='approved';
  assert.equal((await current.postBodyDecision(request(approval),storage)).status,422);forged++;
 }
 assert.deepEqual({placements,changed,preserved:placements-changed,packets,changedPackets,
  preservedPackets:packets-changedPackets,malformed,stale,forged,storageCalls},
  {placements:9936,changed:14,preserved:9922,packets:1104,changedPackets:14,
   preservedPackets:1090,malformed:56,stale:14,forged:28,storageCalls:0});
});
