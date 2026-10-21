import {boundLiveAtlasHistory} from './atlas-bound-live-history.mjs';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';
import {emittedTeaching} from './atlas-emitted-teaching.ts';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync,readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import test from 'node:test';
import {build} from 'esbuild';

const atlas=currentAtlasDeliveryRoot();
const baseline='325fc6aa50c4221691a1ee87de0d0ca91264ff04';
// This is the immutable introduction epoch; liveCommit may advance after a future repin.
const completedEpoch='38f225ff2d4b6cd0f2e4434c0a2d3a759f1af875';
const liveCommit=CURRENT_ATLAS_REVISION;
const pinsPath='content/salivary-stylohyoid-quiz-pins.json';
const questionsPath='content/salivary-stylohyoid-quiz.ts';
const helperPath='lib/salivary-stylohyoid-quiz.ts';
const teachingPath='content/regional-teaching/head-neck.json';
const catalogPath='public/models/bodyparts3d/full-body/catalog.json';
const sourcePaths=[pinsPath,questionsPath,helperPath,'app/body-content.ts',teachingPath];
const introducedPaths=[
 'LICENSES/THIRD_PARTY_NOTICES.md','app/body-content.ts','content/body-renderer-revision.json',
 'content/body-review-display-pins.json',teachingPath,pinsPath,questionsPath,
 'docs/SALIVARY_STYLOHYOID_QUIZ.md',helperPath,'package.json',
 'scripts/pin-salivary-stylohyoid-quiz.mjs','scripts/test-salivary-stylohyoid-quiz.mjs',
];
// Independent expected selections, rather than values derived from the production helper.
const expected=new Map<string,[string,string,string,string,string,string]>([
 ['FMA59802',['submandibular','right','organ','right-submandibular-gland','head-neck-organs-gaps','FJ2768']],
 ['FMA59803',['submandibular','left','organ','left-submandibular-gland','head-neck-organs-gaps','FJ2766']],
 ['FMA59804',['sublingual','right','organ','right-sublingual-gland','head-neck-organs-gaps','FJ2767']],
 ['FMA59805',['sublingual','left','organ','left-sublingual-gland','head-neck-organs-gaps','FJ2765']],
 ['FMA72309',['stylohyoid','right','ligament','right-stylohyoid-ligament','head-neck-connective-gaps','FJ2764']],
 ['FMA72311',['stylohyoid','left','ligament','left-stylohyoid-ligament','head-neck-connective-gaps','FJ2763']],
]);
const answers={submandibular:['Sublingual caruncle','https://anatomy.ttuhscep.edu/nervous_system/infratemp.html'],
 sublingual:['Medial','https://anatomy.ttuhscep.edu/nervous_system/infratemp.html'],
 stylohyoid:['Temporal styloid — lesser hyoid horn','https://anatomy.ttuhscep.edu/anatomytables/joints_alpha.html']};
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

async function importedApi(){
 const built=await build({stdin:{contents:[
  "export {salivaryStylohyoidQuizLesson} from './atlas-review/lib/salivary-stylohyoid-quiz';",
  "export {salivaryStylohyoidQuizQuestions} from './atlas-review/content/salivary-stylohyoid-quiz';",
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
 for(const path of sourcePaths)assert(Object.keys(built.metafile.inputs).some(input=>
  input.replaceAll('\\','/').endsWith(path)),`Imported closure omits ${path}`);
 const api=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
 const cached=await api.regionalTeachingImports['head-neck']();
 assert.deepEqual(cached.default,json('atlas-review/'+teachingPath),
  'Actual head-neck lazy loader returns the imported regional cache');
 assert.deepEqual(cached.default,JSON.parse(committed(liveCommit,teachingPath).toString()));
 return api;
}

test('six exact salivary and stylohyoid quiz drafts reach both learners and protected Review',
 {timeout:180000},async()=>{
 assert.equal(git(['rev-parse','HEAD']).toString().trim(),liveCommit);
 assert.equal(git(['merge-base',baseline,completedEpoch]).toString().trim(),baseline);
 assert.equal(git(['merge-base',completedEpoch,liveCommit]).toString().trim(),completedEpoch);
 assert.equal(git(['rev-parse',`${completedEpoch}^{tree}`]).toString().trim(),
  '92532dd660e2a8864105463d19fc78883b9135d1');
 assert.equal(sha(committed(completedEpoch,pinsPath)),sha(committed(liveCommit,pinsPath)));
 assert.equal(sha(JSON.stringify(JSON.parse(committed(completedEpoch,pinsPath).toString()))),
  '1a46ee2826bb961d0f856568af823f8dd2fd18c19e920b63f7f40697db7de643');
 for(const path of [questionsPath,helperPath])
  assert.deepEqual(committed(liveCommit,path),committed(completedEpoch,path));
 assert.deepEqual(committed(liveCommit,catalogPath),committed(baseline,catalogPath));
 const changed=git(['diff','--name-only',baseline,completedEpoch]).toString().trim().split(/\r?\n/);
 assert.deepEqual(new Set(changed),new Set(introducedPaths));
 const priorNotices=committed(baseline,'LICENSES/THIRD_PARTY_NOTICES.md').toString();
 const currentNotices=committed(completedEpoch,'LICENSES/THIRD_PARTY_NOTICES.md').toString();
 assert(currentNotices.endsWith(priorNotices.slice(priorNotices.indexOf('## '))));
 const featureCache=JSON.parse(committed(completedEpoch,teachingPath).toString());
 const currentCache=json('atlas-review/'+teachingPath);
 const featureByIdentity=new Map(featureCache.entries.map((row:any)=>[row.identity,row]));
 const salivaryEntries=currentCache.entries.filter((row:any)=>expected.has(JSON.parse(row.identity).fmaId));
 assert.equal(salivaryEntries.length,6);
 for(const row of salivaryEntries)assert.deepEqual(row,featureByIdentity.get(row.identity),'Later regional cache edits must preserve salivary teaching');
 const review=json('atlas-review/manifest.json');assert.equal(review.revision,liveCommit);
 const viewerBase='public/atlas-review-viewer/',viewer=json(viewerBase+'manifest.json');
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
  const digest=sha(committed(liveCommit,path));
  const record=review.files.find((file:{path:string})=>file.path===path);assert(record,path);
  assert.equal(record.sourceSha256,digest,path);
  assert.equal(record.importedSha256,digest,path);
  assert.equal(sha(readFileSync('atlas-review/'+path)),digest,path);
  assert.equal(sha(readFileSync(atlas+'/'+path)),digest,path);
  for(const {name,base} of learners){
   const input=json(base+'source-inputs.json').find((file:{path:string})=>file.path===path);
   if(name==='head-neck'||name==='shoulder')
    assert.equal(input?.sha256,digest,`${name}: ${path}`);
   else assert.equal(input,undefined,`${name}: independent closure`);
  }
  for(const base of ['public/atlas-review/',viewerBase,...learners.map(item=>item.base)])
   assert.equal(existsSync(base+path),false,`${base+path}: raw source exposed`);
 }
 // The source licence is head-neck input only; shoulder makes no such claim.
 const licence='LICENSES/THIRD_PARTY_NOTICES.md';
 const headLicence=json('public/atlas-runtime/head-neck/source-inputs.json')
  .find((file:{path:string})=>file.path===licence);
 assert.equal(headLicence?.sha256,sha(committed(liveCommit,licence)));
 for(const {name,base,manifest} of learners.filter(item=>
  item.name==='lower-limb'||item.name==='female-pelvis')){
  for(const input of json(base+'source-inputs.json'))
   assert.equal(input.sha256,sha(committed(liveCommit,input.path)),`${name}: ${input.path}`);
  for(const file of manifest.files.filter((item:{path:string})=>item.path.startsWith('models/'))){
   assert.equal(file.sha256,sha(readFileSync(base+file.path)),`${name}: delivered model`);
   assert.equal(file.sha256,sha(committed(baseline,'public/'+file.path)),`${name}: original model`);
  }
 }
 const pinFile=json('atlas-review/'+pinsPath),pins=pinFile.entries;
 assert.equal(pins.length,6);
 assert.deepEqual(new Set(pins.map((entry:any)=>entry.identity.fmaId)),new Set(expected.keys()));
 for(const descriptor of pinFile.bundles){
  const path='public'+descriptor.url.split('?')[0];
  assert.deepEqual(readFileSync(atlas+'/'+path),committed(baseline,path),
   `${descriptor.id}: selected source geometry retained`);
 }
 const api=await importedApi(),catalog=api.bodyDisplayCatalog(json('atlas-review/'+catalogPath));
 assert.equal(catalog.structures.length,1104);
 const emitted=learners.filter(item=>item.name==='head-neck'||item.name==='shoulder')
  .map(item=>emittedTeaching(item.base,item.manifest.files,true));
 const selected=new Set<string>();
 for(const [fma,[group,side,category,slug,bundle,file]] of expected){
  const matches=pins.filter((entry:any)=>entry.identity.fmaId===fma);
  assert.equal(matches.length,1,`${fma}: exact unique pin`);
  assert.equal(matches[0].group,group);
  const identity=matches[0].identity;selected.add(identity.id);
  assert.equal(identity.id,`vm:anatomy:body:head-neck:${side}:${category}:${slug}`);
  assert.equal(identity.laterality,side);assert.equal(identity.region,'head-neck');
  assert.equal(identity.system,category==='organ'?'organs':'connective');
  assert.equal(identity.category,category);assert.equal(identity.bundle,bundle);
  assert.equal(identity.sourceTree,'isa');assert.equal(identity.nodeName,fma);
  assert.deepEqual(identity.sources.map((source:{file:string})=>source.file),[file]);
  assert.equal(identity.validation.status,'unvalidated');
  assert.equal(identity.validation.anatomicalReview,false);
  assert.deepEqual(catalog.structures.find((s:{id:string})=>s.id===identity.id),identity);
  const lesson=api.salivaryStylohyoidQuizLesson(identity,'quiz');assert(lesson);
  assert.deepEqual(api.bodyLesson(identity,'quiz'),lesson);
  const {readiness,...content}=lesson;
  assert.equal(readiness,'draft');assert.deepEqual(api.bodyContent(identity,'quiz'),content);
  const question=api.salivaryStylohyoidQuizQuestions[group];assert(question);
  assert.equal(lesson.body,question.body);
  assert.deepEqual(lesson.bullets,question.choices);
  assert.equal(lesson.correctAnswer,question.correctAnswer);
  assert.equal(lesson.explanation,question.explanation);
  assert.deepEqual(lesson.citations,question.references);
  assert.equal(lesson.correctAnswer,answers[group as keyof typeof answers][0]);
  assert.deepEqual(lesson.citations,[answers[group as keyof typeof answers][1]]);
  assert.equal(lesson.bullets.length,4);
  assert.equal(lesson.bullets.filter((choice:string)=>choice===lesson.correctAnswer).length,1);
  assert.match(lesson.note,/revision-bound radiologist review pending/);
  assert.match(lesson.note,/no diagnosis, acquired-image match or spatial registration/);
  assert.match(lesson.note,/Atlas, imaging-case and paid-lecture access remain independent/);
  assert.doesNotMatch(JSON.stringify(lesson),/approved for clinical use|registered to a patient/i);
  for(const code of emitted)for(const value of [lesson.body,...lesson.bullets,
   lesson.correctAnswer,lesson.explanation,...lesson.citations,lesson.note])
   assert(visible(code,value),`${identity.id}: emitted teaching`);
  const clean=wire(lesson);lesson.bullets.push('foreign');lesson.citations.push('https://foreign.example');
  assert.deepEqual(api.salivaryStylohyoidQuizLesson(identity,'quiz'),clean,'Fresh detached lesson');
  for(const path of pathsWhere(identity,value=>value===null||typeof value!=='object')){
   const bad=wire(identity),parent=at(bad,path.slice(0,-1)),key=path.at(-1)!;
   const original=parent[key];parent[key]=typeof original==='string'?original+'-foreign'
    :typeof original==='number'?original+0.01:original===null?'foreign':!original;
   assert.equal(api.salivaryStylohyoidQuizLesson(bad,'quiz'),undefined,`${identity.id}:${path.join('.')}`);
  }
  for(const path of pathsWhere(identity,Array.isArray)){
   const bad=wire(identity);at(bad,path).push('foreign');
   assert.equal(api.salivaryStylohyoidQuizLesson(bad,'quiz'),undefined,`${identity.id}:${path.join('.')}`);
  }
  for(const path of pathsWhere(identity,value=>value&&typeof value==='object'&&!Array.isArray(value))){
   const bad=wire(identity);at(bad,path).unexpected=true;
   assert.equal(api.salivaryStylohyoidQuizLesson(bad,'quiz'),undefined,`${identity.id}:${path.join('.')}`);
   for(const key of Object.keys(at(identity,path))){
    const omitted=wire(identity);delete at(omitted,path)[key];
    assert.equal(api.salivaryStylohyoidQuizLesson(omitted,'quiz'),undefined,
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
   assert.equal(api.salivaryStylohyoidQuizLesson(bad,'quiz'),undefined,
    `${identity.id}:${path.join('.')} reordered`);
  }
  assert.equal(api.salivaryStylohyoidQuizLesson({id:identity.id},'quiz'),undefined);
 }
 assert.equal(selected.size,6);
 for(const structure of catalog.structures)if(!selected.has(structure.id))
  assert.equal(api.salivaryStylohyoidQuizLesson(structure,'quiz'),undefined);
});

test('immutable 9,936 lessons and 1,104 packets match imported source and refuse forged decisions',
 {timeout:300000},async()=>{
 const current=await importedApi(),live=await boundLiveAtlasHistory(liveCommit);
 const {exactSourceHistoryApi}=await import(pathToFileURL(atlas+'/scripts/exact-source-history-api.mjs').href);
 const old=await exactSourceHistoryApi(baseline,'review-security');
 const feature=await exactSourceHistoryApi(completedEpoch,'review-security');
 const catalog=current.bodyDisplayCatalog(json('atlas-review/'+catalogPath));
 assert.deepEqual(catalog,live.bodyDisplayCatalog(json('atlas-review/'+catalogPath)));
 assert.deepEqual(catalog,old.bodyDisplayCatalog(JSON.parse(committed(baseline,catalogPath).toString())));
 assert.deepEqual(current.structures,live.structures);assert.deepEqual(live.structures,old.structures);
 assert.deepEqual(current.dissectionProfiles,live.dissectionProfiles);
 assert.deepEqual(live.dissectionProfiles,old.dissectionProfiles);
 assert.deepEqual(current.regionalTours,live.regionalTours);
 assert.deepEqual(feature.regionalTours,old.regionalTours);
 assert.deepEqual(current.contentTabs,live.contentTabs);assert.deepEqual(live.contentTabs,old.contentTabs);
 assert.equal(current.contentTabs.length,9);
 const ids=new Set<string>(json('atlas-review/'+pinsPath).entries.map((entry:any)=>entry.identity.id));
 assert.equal(ids.size,6);
 let placements=0,changed=0,packets=0,changedPackets=0,storageCalls=0;
 let malformedPackets=0,staleRefusals=0,forgedSaves=0,forgedApprovals=0;
 const storage={prepare(){storageCalls++;throw Error('Rejected request reached synthetic storage');}};
 const request=(value:any)=>new Request('https://review.test/api/body-decisions',{
  method:'POST',headers:{origin:'https://review.test','content-type':'application/json',
   'oai-authenticated-user-id':'SYNTHETIC_SALIVARY_STYLOHYOID_REVIEWER'},body:JSON.stringify(value),
 });
 for(const structure of catalog.structures){
  for(const tab of current.contentTabs){
   const before=old.bodyLesson(structure,tab),historical=feature.bodyLesson(structure,tab);
   const after=live.bodyLesson(structure,tab),imported=current.bodyLesson(structure,tab);
   assert.deepEqual(imported,after,`${structure.id}:${tab}: imported versus exact current source`);
   placements++;
   if(!ids.has(structure.id)||tab!=='quiz'){
    assert.deepEqual(historical,before,`${structure.id}:${tab}: introduction epoch preserves lesson`);
    assert.equal(current.salivaryStylohyoidQuizLesson(structure,tab),undefined);
   }else{
    changed++;assert.equal(before.readiness,'generated-identification');
    assert.equal(historical.readiness,'draft');
    assert.deepEqual(after,current.salivaryStylohyoidQuizLesson(structure,tab));
   }
  }
  const before=wire(await old.bodyReviewMaterial(structure.id));
  const historical=wire(await feature.bodyReviewMaterial(structure.id));
  const after=wire(await live.bodyReviewMaterial(structure.id));
  assert(before&&historical&&after,structure.id);packets++;
  assert.deepEqual(wire(await current.bodyReviewMaterial(structure.id)),after,
   `${structure.id}: complete imported/source Review packet`);
  assert.equal(after.approval,false);assert.equal(after.status,'worksheet-not-submitted');
  if(!ids.has(structure.id)){
   assert.deepEqual(historical,before,`${structure.id}: introduction epoch preserves packet`);
   continue;
  }
  changedPackets++;
  assert.deepEqual(await current.parseBodyReviewResponse(after,structure.id),after);
  assert.equal(await current.parseBodyReviewResponse(before,structure.id),null);
  for(const key of ['source','reasoning','guidedTours','checklist','atlasLink','limits'])
   assert.deepEqual(historical[key],before[key],`${structure.id}: ${key}`);
  assert.deepEqual(historical.topics.filter((row:any)=>row.tab!=='quiz'),
   before.topics.filter((row:any)=>row.tab!=='quiz'));
  assert.deepEqual(historical.topics.find((row:any)=>row.tab==='quiz'),
   {tab:'quiz',...feature.bodyLesson(structure,'quiz')});
  assert.equal(historical.fingerprints.source,before.fingerprints.source);
  assert.notEqual(historical.fingerprints.teaching,before.fingerprints.teaching);
  assert.notEqual(historical.materialHash,before.materialHash);
  assert.deepEqual(await live.parseBodyReviewResponse(after,structure.id),after);
  assert.equal(await live.parseBodyReviewResponse(before,structure.id),null);
  for(const mutate of [
   (bad:any)=>{bad.topics.find((row:any)=>row.tab==='quiz').body+=' forged';},
   (bad:any)=>{bad.topics.find((row:any)=>row.tab==='quiz').citations[0]='https://forged.example';},
   (bad:any)=>{bad.topics.find((row:any)=>row.tab==='quiz').readiness='approved';},
   (bad:any)=>{bad.source.structure.sources[0].sha256='0'.repeat(64);},
  ]){const forged=wire(after);mutate(forged);
   assert.equal(await current.parseBodyReviewResponse(forged,structure.id),null);
   assert.equal(await live.parseBodyReviewResponse(forged,structure.id),null);
   malformedPackets++;
  }
  const previousContext=await old.bodyReviewContext(structure.id);
  const context=await live.bodyReviewContext(structure.id);
  const historicalContext=await feature.bodyReviewContext(structure.id);
  assert.equal(historicalContext.catalogScope,previousContext.catalogScope);
  assert.equal(historicalContext.checklistVersion,previousContext.checklistVersion);
  assert.equal(historicalContext.sourceHash,previousContext.sourceHash);
  assert.equal(context.rendererHash,json('atlas-review/content/body-renderer-revision.json').sha256);
  assert.equal(context.revisions.geometry,sha(JSON.stringify({catalogScope:context.catalogScope,
   structureId:structure.id,checklistVersion:context.checklistVersion,source:context.sourceHash,
   renderer:context.rendererHash,checks:context.checklists.geometry})));
  assert.deepEqual(await current.bodyReviewContext(structure.id),context);
  assert.equal(historicalContext.sourceHash,previousContext.sourceHash);
  assert.notEqual(historicalContext.revisions.teaching,previousContext.revisions.teaching);
  assert.equal(context.revisions.imaging,null);
  assert(context.teachingTabs.includes('quiz'));
  assert.equal(current.bodyReviewStale({catalogScope:context.catalogScope,
   structureId:structure.id,checklistVersion:context.checklistVersion,
   revisionHash:previousContext.revisions.teaching,track:'teaching'},context),true);
  const decision={catalogScope:context.catalogScope,structureId:structure.id,
   track:'teaching',expectedVersion:0,materialHash:context.materialHash,
   revisionHash:context.revisions.teaching,checklistVersion:context.checklistVersion,
   draft:current.blankBodyReview(context,'teaching')};
  for(const patch of [{materialHash:previousContext.materialHash},
   {revisionHash:previousContext.revisions.teaching},
   {materialHash:previousContext.materialHash,revisionHash:previousContext.revisions.teaching}]){
   assert.equal((await current.postBodyDecision(request({...decision,...patch}),storage)).status,409);
   staleRefusals++;
  }
  const forged=wire(decision);forged.draft.checks.foreign=true;
  assert.equal((await current.postBodyDecision(request(forged),storage)).status,422);
  forgedSaves++;
  const approval=wire(decision);approval.draft.status='approved';
  assert.equal((await current.postBodyDecision(request(approval),storage)).status,422);
  forgedApprovals++;
 }
 assert.deepEqual({placements,changed,preserved:placements-changed,packets,changedPackets,
  preservedPackets:packets-changedPackets,storageCalls},
  {placements:9936,changed:6,preserved:9930,packets:1104,changedPackets:6,
   preservedPackets:1098,storageCalls:0});
 assert.deepEqual({malformedPackets,staleRefusals,forgedSaves,forgedApprovals,storageCalls},
  {malformedPackets:24,staleRefusals:18,forgedSaves:6,forgedApprovals:6,storageCalls:0});
});
