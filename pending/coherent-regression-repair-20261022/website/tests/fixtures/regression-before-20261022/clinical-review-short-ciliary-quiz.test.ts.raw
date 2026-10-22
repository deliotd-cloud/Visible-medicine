import {boundLiveAtlasHistory} from './atlas-bound-live-history.mjs';
import {emittedTeaching} from './atlas-emitted-teaching.ts';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync,readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import test from 'node:test';
import {build} from 'esbuild';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';

const atlas='F:/VisibleMedicine/atlas';
const baseline='0a267a65c3855b87d3d01d2ed28279de5415bc93';
const historicalCommit='280c701c9cc21c540b7b496f58e2d1c4214e7865'; // Exact original quiz epoch.
const liveCommit='190a63238eadcf906abe89dcbb6a67c88afe70b9'; // Current committed, integrated source revision.
const id='vm:anatomy:body:head-neck:unspecified:nerve:short-ciliary-nerve';
const catalogPath='public/models/bodyparts3d/full-body/catalog.json';
const sourceCatalog='public/models/bodyparts3d/short-ciliary/catalog.json';
const inputPaths=['content/short-ciliary-quiz.ts','lib/short-ciliary-quiz.ts','app/body-content.ts'];
const keys=['mixed-fibres','sensory-synapse','accommodation','source-components'];
const answers=['Parasympathetic, sympathetic and sensory fibres',
  'They traverse the ganglion without a synapse there',
  'Ciliary muscle contraction reduces zonular tension for accommodation',
  'Mesh separation alone does not establish an individual nerve count'];
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));
const sha=(bytes:Uint8Array|string)=>createHash('sha256').update(bytes).digest('hex');
const norm=(bytes:Uint8Array)=>Buffer.from(bytes).toString('utf8').replaceAll('\r\n','\n');
const git=(args:string[])=>execFileSync('git',args,{cwd:atlas,windowsHide:true,maxBuffer:64e6,
  env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
const committed=(revision:string,path:string)=>git(['show',`${revision}:${path}`]);
const visible=(code:string,value:string)=>code.includes(value)||code.includes(JSON.stringify(value).slice(1,-1));

async function closure(){
  const built=await build({stdin:{contents:[
    "export {shortCiliaryQuizLesson} from './atlas-review/lib/short-ciliary-quiz';",
    "export {shortCiliaryQuizQuestions} from './atlas-review/content/short-ciliary-quiz';",
    "export {bodyLesson,bodyContent} from './atlas-review/app/body-content';",
    "export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';",
    "export {structures} from './atlas-review/app/anatomy-data';",
    "export {dissectionProfiles} from './atlas-review/app/dissection-data';",
    "export {regionalTours} from './atlas-review/lib/regional-tours';",
    "export {contentTabs} from './atlas-review/lib/content-types';",
    "export * from './atlas-review/lib/body-review-material';",
    "export * from './atlas-review/lib/body-review-context';",
    "export * from './atlas-review/lib/body-review-response';",
    "export * from './atlas-review/lib/body-review-api';",
    "export * from './atlas-review/lib/body-review-decisions';",
  ].join('\n'),resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,
    platform:'node',format:'esm',metafile:true});
  for(const path of inputPaths)
    assert(Object.keys(built.metafile.inputs).some(input=>input.replaceAll('\\','/').endsWith(path)),
      `Actual imported closure omits ${path}`);
  return import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
}

test('one exact short-ciliary source group delivers four draft quiz checks',async()=>{
  assert.match(liveCommit,/^[a-f0-9]{40}$/,'Coordinator must pin __ATLAS_COMMIT__ after source commit');
  assert.equal(git(['rev-parse','HEAD']).toString().trim(),liveCommit);
  assert.equal(git(['merge-base',baseline,liveCommit]).toString().trim(),baseline);
  assert.equal(git(['merge-base',historicalCommit,liveCommit]).toString().trim(),historicalCommit);
  assert.equal(git(['rev-parse',historicalCommit+'^']).toString().trim(),baseline,'Exact authored quiz epoch is immediate baseline child');
  const review=json('atlas-review/manifest.json');assert.equal(review.revision,liveCommit);
  const viewerBase='public/atlas-review-viewer/',viewer=json(viewerBase+'manifest.json');
  assert.equal(viewer.sourceCommit,liveCommit);
  assert.equal(viewer.websiteIntegrationSha256,review.websiteIntegrationSha256);
  assert.equal(viewer.personalRecordsIncluded,false);
  const learners=['head-neck','shoulder','female-pelvis','lower-limb'].map(name=>({name,
    base:`public/atlas-runtime/${name}/`,manifest:json(`public/atlas-runtime/${name}/manifest.json`)}));
  for(const {name,manifest} of learners){
    assert.equal(manifest.sourceCommit,liveCommit,name);
    assert.equal(manifest.patientDataIncluded,false,name);
    assert.equal(manifest.clinicalApproved,false,name);
  }
  for(const path of inputPaths){
    const source=committed(liveCommit,path),imported=readFileSync('atlas-review/'+path);
    const historical=committed(historicalCommit,path);
    const record=review.files.find((file:{path:string})=>file.path===path);assert(record,path);
    assert.equal(record.sourceSha256,sha(source),path);
    assert.equal(record.importedSha256,sha(imported),path);
    assert.equal(norm(imported),norm(source),`${path}: imported source`);
    assert.equal(norm(readFileSync(`${atlas}/${path}`)),norm(source),`${path}: live source`);
    if(path!=='app/body-content.ts')assert.deepEqual(source,historical,`${path}: exact historical quiz source retained`);
    else assert.notDeepEqual(source,historical,'Current dispatcher includes later separately authored drafts');
    for(const {name,base} of learners){
      const input=json(base+'source-inputs.json').find((file:{path:string})=>file.path===path);
      if(name==='head-neck'||name==='shoulder')assert.equal(input?.sha256,sha(source),`${name}: ${path}`);
      else assert.equal(input,undefined,`${name}: regional input`);
    }
  }
  assert.equal(norm(readFileSync('atlas-review/'+sourceCatalog)),norm(committed(baseline,sourceCatalog)));
  for(const path of [sourceCatalog,...inputPaths])
    for(const base of ['public/atlas-review/',viewerBase,...learners.map(item=>item.base)])
      assert.equal(existsSync(base+path),false,`${base+path}: raw source is not public`);
  const api=await closure(),catalog=api.bodyDisplayCatalog(json('atlas-review/'+catalogPath));
  assert.equal(catalog.structures.length,1104);
  const identity=json('atlas-review/'+sourceCatalog).structures[0];
  assert.deepEqual(catalog.structures.find((item:{id:string})=>item.id===id),identity);
  assert.equal(identity.id,id);assert.equal(identity.fmaId,'FMA7041');
  assert.equal(identity.laterality,'unspecified');assert.equal(identity.region,'head-neck');
  assert.deepEqual(identity.sources.map((source:{file:string})=>source.file),['FJ1319','FJ1370']);
  assert.deepEqual(identity.presentationParts.map((part:{displaySide:string})=>part.displaySide),['left','right']);
  assert.equal(identity.validation.anatomicalReview,false);
  const questions=api.shortCiliaryQuizQuestions;
  assert.deepEqual(questions.map((q:{key:string})=>q.key),keys);
  assert.deepEqual(questions.map((q:{correctAnswer:string})=>q.correctAnswer),answers);
  const lesson=api.shortCiliaryQuizLesson(wire(identity),'quiz');assert(lesson);
  assert.deepEqual(api.bodyLesson(identity,'quiz'),lesson);
  const {readiness,...content}=lesson;assert.equal(readiness,'draft');
  assert.deepEqual(api.bodyContent(identity,'quiz'),content);
  assert.equal(lesson.additionalChecks.length,3);
  const checks=[lesson,...lesson.additionalChecks];
  for(let index=0;index<4;index++){
    const question=questions[index],check=checks[index];
    assert.equal(check.body,question.body);assert.deepEqual(check.bullets,question.choices);
    assert.equal(check.correctAnswer,answers[index]);assert.equal(check.explanation,question.explanation);
    assert.deepEqual(check.citations,question.references);
    assert.equal(check.bullets.filter((choice:string)=>choice===check.correctAnswer).length,1);
    assert.equal(new Set(check.bullets).size,4);
    assert(check.citations.every((url:string)=>url.startsWith('https://')));
    assert.match(check.note,/radiologist review pending/i);
  }
  assert.match(lesson.note,/patient.space registration/i);
  assert.match(lesson.note,/Atlas, imaging.case and paid.lecture access remain independent/i);
  assert.match(checks[3].explanation,/mesh, not validated individual nerves/i);
  const clean=wire(lesson);
  lesson.bullets.push('foreign');lesson.citations.push('https://foreign.example');
  lesson.additionalChecks[0].bullets.push('foreign');lesson.additionalChecks[0].citations.push('https://foreign.example');
  assert.deepEqual(api.shortCiliaryQuizLesson(identity,'quiz'),clean,'Fresh primary and additional arrays');
  for(const tab of api.contentTabs.filter((tab:string)=>tab!=='quiz'))
    assert.equal(api.shortCiliaryQuizLesson(identity,tab),undefined,tab);
  for(const item of catalog.structures)if(item.id!==id)
    assert.equal(api.shortCiliaryQuizLesson(item,'quiz'),undefined,item.id);
  for(const mutate of [(bad:any)=>{bad.name+=' foreign';},(bad:any)=>{bad.fmaId+=' foreign';},
    (bad:any)=>{bad.sources[0].sha256='0'.repeat(64);},
    (bad:any)=>{bad.presentationParts[0].displaySide='right';},
    (bad:any)=>{bad.validation.anatomicalReview=true;},
    (bad:any)=>{bad.sources.push(wire(bad.sources[0]));}]){
    const bad=wire(identity);mutate(bad);
    assert.equal(api.shortCiliaryQuizLesson(bad,'quiz'),undefined,'Altered source identity');
  }
  assert.equal(api.shortCiliaryQuizLesson({id},'quiz'),undefined,'ID alone is insufficient');
  const emitted=learners.filter(item=>item.name==='head-neck'||item.name==='shoulder')
    .map(item=>emittedTeaching(item.base,item.manifest.files,true));
  const scope=learners[0].manifest.regionalScopes.find((row:{region:string})=>row.region==='head-neck');
  assert(scope?.regionalIds.includes(id));
  for(const code of emitted)for(const check of [clean,...clean.additionalChecks])
    for(const value of [check.body,...check.bullets,check.correctAnswer,check.explanation,...check.citations,check.note])
      assert(visible(code,value),`Emitted teaching missing ${value}`);
});

test('short-ciliary quiz preserves other epochs and refuses stale or forged Review submissions',async()=>{
  assert.match(liveCommit,/^[a-f0-9]{40}$/,'Coordinator must pin __ATLAS_COMMIT__');
  const imported=await closure(),live=await boundLiveAtlasHistory(liveCommit);
  const {exactSourceHistoryApi}=await import(pathToFileURL(atlas+'/scripts/exact-source-history-api.mjs').href);
  const old=await exactSourceHistoryApi(baseline,'review-security');
  const historical=await exactSourceHistoryApi(historicalCommit,'review-security');
  const catalog=imported.bodyDisplayCatalog(json('atlas-review/'+catalogPath));
  assert.deepEqual(catalog,live.bodyDisplayCatalog(json('atlas-review/'+catalogPath)));
  assert.deepEqual(imported.structures,live.structures);
  assert.deepEqual(imported.dissectionProfiles,live.dissectionProfiles);
  assert.deepEqual(imported.regionalTours,live.regionalTours);
  assert.deepEqual(imported.contentTabs,live.contentTabs);
  const structure=catalog.structures.find((item:{id:string})=>item.id===id);assert(structure);
  assert.equal(old.bodyLesson(structure,'quiz').readiness,'pending');
  assert.equal(historical.bodyLesson(structure,'quiz').readiness,'draft');
  assert.equal(imported.bodyLesson(structure,'quiz').readiness,'draft');
  assert.deepEqual(imported.bodyLesson(structure,'quiz'),historical.bodyLesson(structure,'quiz'),'Current quiz retains exact original authored answer');
  let changed=0,preserved=0;
  for(const item of catalog.structures)for(const tab of imported.contentTabs){
    const current=historical.bodyLesson(item,tab);
    if(item.id===id&&tab==='quiz'){changed++;continue;}
    assert.deepEqual(current,old.bodyLesson(item,tab),`${item.id}:${tab}: preserved`);preserved++;
  }
  assert.deepEqual([changed,preserved],[1,9935]);
  for(const item of catalog.structures)for(const tab of imported.contentTabs)
    assert.deepEqual(imported.bodyLesson(item,tab),live.bodyLesson(item,tab),`${item.id}:${tab}: current live`);
  const packet=wire(await imported.bodyReviewMaterial(id));
  const historicalPacket=wire(await historical.bodyReviewMaterial(id));
  const previous=wire(await old.bodyReviewMaterial(id));
  assert.deepEqual(packet,wire(await live.bodyReviewMaterial(id)));
  assert.equal(packet.approval,false);assert.deepEqual(packet.source.structure,structure);
  assert.equal(historicalPacket.approval,false);assert.deepEqual(historicalPacket.source.structure,structure);
  assert.deepEqual(historicalPacket.topics.filter((row:any)=>row.tab!=='quiz'),
    previous.topics.filter((row:any)=>row.tab!=='quiz'));
  for(const key of ['source','reasoning','guidedTours','checklist','atlasLink','limits'])
    assert.deepEqual(historicalPacket[key],previous[key],key);
  assert.deepEqual(historicalPacket.topics.find((row:any)=>row.tab==='quiz'),
    {tab:'quiz',...imported.bodyLesson(structure,'quiz')});
  assert.equal(historicalPacket.fingerprints.source,previous.fingerprints.source);
  assert.notEqual(historicalPacket.fingerprints.teaching,previous.fingerprints.teaching);
  assert.notEqual(historicalPacket.materialHash,previous.materialHash);
  assert.deepEqual(packet.topics.find((row:any)=>row.tab==='quiz'),
    {tab:'quiz',...imported.bodyLesson(structure,'quiz')});
  assert.deepEqual(await imported.parseBodyReviewResponse(packet,id),packet);
  assert.equal(await imported.parseBodyReviewResponse(previous,id),null);
  for(const mutate of [
    (bad:any)=>{bad.topics.find((row:any)=>row.tab==='quiz').correctAnswer='forged';},
    (bad:any)=>{bad.topics.find((row:any)=>row.tab==='quiz').additionalChecks[0].correctAnswer='forged';},
    (bad:any)=>{bad.topics.find((row:any)=>row.tab==='quiz').additionalChecks[1].bullets[0]='forged';},
    (bad:any)=>{bad.topics.find((row:any)=>row.tab==='quiz').additionalChecks[2].citations[0]='https://forged.example';},
    (bad:any)=>{bad.topics.find((row:any)=>row.tab==='quiz').readiness='approved';},
    (bad:any)=>{bad.topics.splice(bad.topics.findIndex((row:any)=>row.tab==='quiz'),1);},
    (bad:any)=>{bad.source.structure.sources[0].sha256='0'.repeat(64);},
  ]){const forged=wire(packet);mutate(forged);
    assert.equal(await imported.parseBodyReviewResponse(forged,id),null);}
  const context=await imported.bodyReviewContext(id),prior=await old.bodyReviewContext(id);
  assert.deepEqual(context,await live.bodyReviewContext(id));
  assert.equal(context.sourceHash,prior.sourceHash);
  assert.notEqual(context.revisions.teaching,prior.revisions.teaching);
  assert.equal(context.revisions.imaging,null);
  assert(context.teachingTabs.includes('quiz'));
  assert.equal(imported.bodyReviewStale({catalogScope:context.catalogScope,structureId:id,
    checklistVersion:context.checklistVersion,revisionHash:prior.revisions.teaching,track:'teaching'},context),true);
  const decision={catalogScope:context.catalogScope,structureId:id,track:'teaching',expectedVersion:0,
    materialHash:context.materialHash,revisionHash:context.revisions.teaching,
    checklistVersion:context.checklistVersion,draft:imported.blankBodyReview(context,'teaching')};
  let storageCalls=0;
  const storage={prepare(){storageCalls++;throw Error('Rejected request reached storage');}};
  const save=(input:any)=>imported.postBodyDecision(new Request('https://review.test/api/body-decisions',{
    method:'POST',headers:{origin:'https://review.test','content-type':'application/json',
      'oai-authenticated-user-id':'synthetic-short-ciliary-reviewer'},body:JSON.stringify(input),
  }),storage);
  for(const patch of [{materialHash:prior.materialHash},{revisionHash:prior.revisions.teaching},
    {materialHash:prior.materialHash,revisionHash:prior.revisions.teaching}])
    assert.equal((await save({...decision,...patch})).status,409);
  const forged=wire(decision);forged.draft.checks.foreign=true;
  assert.equal((await save(forged)).status,422);
  const approval=wire(decision);approval.draft.status='approved';
  assert.equal((await save(approval)).status,422);
  assert.equal(storageCalls,0);
});

test('the actual imported quick-check component marks each authored key and all distractors correctly',async()=>{
  const api=await closure(),identity=json('atlas-review/'+sourceCatalog).structures[0];
  const lesson=api.shortCiliaryQuizLesson(identity,'quiz'),checks=[lesson,...lesson.additionalChecks];
  const require=createRequire(import.meta.url),React=require('react');
  let values:any[]=[],cursor=0;
  const shim={...React,useId:()=> 'short-ciliary-fixture',useRef:()=>({current:null}),
    useState(initial:any){const index=cursor++;if(!(index in values))values[index]=initial;
      return[values[index],(next:any)=>{values[index]=next;}];}};
  const built=await build({entryPoints:['atlas-review/app/structure-quick-check.tsx'],bundle:true,
    write:false,platform:'node',format:'cjs',external:['react','react/*'],loader:{'.css':'empty'}});
  const module={exports:{} as any};
  runInNewContext(built.outputFiles[0].text,{module,exports:module.exports,require:(name:string)=>name==='react'?shim:require(name)});
  const nodes=(tree:any):any[]=>!tree||typeof tree!=='object'?[]:Array.isArray(tree)?tree.flatMap(nodes):[tree,...nodes(tree.props?.children)];
  const text=(tree:any):string=>tree==null?'':typeof tree==='string'||typeof tree==='number'?String(tree):Array.isArray(tree)?tree.map(text).join(''):text(tree.props?.children);
  let answered=0;
  for(const check of checks)for(let index=0;index<check.bullets.length;index++){
    values=[];
    const attempt=module.exports.StructureQuickCheck({question:check.body,choices:check.bullets,
      correctAnswer:check.correctAnswer,explanation:check.explanation});
    const render=()=>{cursor=0;return attempt.type(attempt.props);};
    let tree=render(),inputs=nodes(tree).filter(n=>n.type==='input');
    assert.equal(inputs.length,4);inputs[index].props.onChange();tree=render();
    const button=nodes(tree).find(n=>n.type==='button'&&text(n)==='Check answer');
    assert(button&&!button.props.disabled);button.props.onClick();tree=render();
    const feedback=text(nodes(tree).find(n=>n.props?.['aria-live']==='polite'));
    assert(feedback.startsWith(check.bullets[index]===check.correctAnswer?'Correct.':'Incorrect.'),check.body);
    assert(feedback.includes(check.explanation));answered++;
  }
  assert.equal(answered,16,'Four correct keys and twelve distractors through production callbacks');
});
