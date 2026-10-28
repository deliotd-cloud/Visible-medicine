import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import test from 'node:test';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
import {emittedTeaching} from './atlas-emitted-teaching.ts';

// Run only after the coordinator has closed all four exports and the Review import.
const root=process.cwd();
const source='0ac11ca2eb8effe47f2b6927f7987a9a36c7e3a2';
const sourceTree='0418fa402e7a6586c7d3add78aa92ffe849d343e';
const baseline='bc925194ce3b388d4b6d9f73b4b3362ed4f2ad5f';
const modules=['head-neck','shoulder','lower-limb','female-pelvis'];
const newPaths=['content/arterial-evidence-limits-pins.json','content/arterial-evidence-limits.ts','lib/arterial-evidence-limits.ts'];
const read=path=>readFileSync(resolve(root,path));
const json=path=>JSON.parse(read(path));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const same=(a,b,label)=>assert.deepEqual(structuredClone(a),structuredClone(b),label);
const git=(atlas,...args)=>execFileSync('git',['-C',atlas,...args],{windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
const specs=[
  ['FMA23125','left','FJ2331','ultrasound','middleCollateralUltrasound'],
  ['FMA23124','right','FJ2362','ultrasound','middleCollateralUltrasound'],
  ['FMA10680','left','FJ2210','mri','inferiorThyroidMri'],
  ['FMA10697','right','FJ2209','mri','inferiorThyroidMri'],
];
let fixture;
async function setup(){
  if(fixture)return fixture;
  const pin=validateCurrentAtlasDelivery();
  assert.equal(pin.source,CURRENT_ATLAS_REVISION);
  const atlas=currentAtlasDeliveryRoot();
  assert.equal(git(atlas,'rev-parse',`${CURRENT_ATLAS_REVISION}^{tree}`).toString().trim(),pin.sourceTree);
  assert.equal(git(atlas,'rev-parse',`${source}^{commit}`).toString().trim(),source);
  assert.equal(git(atlas,'rev-parse',`${source}^{tree}`).toString().trim(),sourceTree);
  assert.equal(git(atlas,'rev-parse',`${source}^`).toString().trim(),baseline);
  const requireSite=createRequire(resolve(root,'package.json'));
  const {build}=requireSite('esbuild');
  const entry=[
    "export {bodyLesson,bodyContent} from './atlas-review/app/body-content';",
    "export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';",
    "export {contentTabs} from './atlas-review/lib/content-types';",
    "export {decodeRegionalTeachingSnapshot} from './atlas-review/lib/regional-teaching-snapshot';",
    "export {arterialEvidenceLimitLesson} from './atlas-review/lib/arterial-evidence-limits';",
    "export {arterialEvidenceLimits} from './atlas-review/content/arterial-evidence-limits';",
    "export {structures} from './atlas-review/app/anatomy-data';",
    "export {dissectionProfiles} from './atlas-review/app/dissection-data';",
    "export {regionalTours} from './atlas-review/lib/regional-tours';",
    "export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';",
    "export {bodyReviewContext} from './atlas-review/lib/body-review-context';",
    "export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';",
    "export {postBodyDecision} from './atlas-review/lib/body-review-api';",
    "export {blankBodyReview} from './atlas-review/lib/body-review-decisions';",
  ].join('');
  const built=await build({stdin:{contents:entry,resolveDir:root,loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
  const api=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
  const {exactSourceHistoryApi}=await import(pathToFileURL(resolve(atlas,'scripts/exact-source-history-api.mjs')).href);
  const feature=await exactSourceHistoryApi(source,'review-security');
  const old=await exactSourceHistoryApi(baseline,'review-security');
  const currentGit=await exactSourceHistoryApi(CURRENT_ATLAS_REVISION,'review-security');
  const pins=json('atlas-review/content/arterial-evidence-limits-pins.json');
  const catalog=api.bodyDisplayCatalog(json('atlas-review/public/models/bodyparts3d/full-body/catalog.json'));
  const featureCatalog=feature.bodyDisplayCatalog(JSON.parse(git(atlas,'show',`${source}:public/models/bodyparts3d/full-body/catalog.json`)));
  const oldCatalog=old.bodyDisplayCatalog(JSON.parse(git(atlas,'show',`${baseline}:public/models/bodyparts3d/full-body/catalog.json`)));
  fixture={pin,atlas,api,feature,old,currentGit,pins,catalog,featureCatalog,oldCatalog};
  return fixture;
}

test('closed source and four runtime exports import the exact committed evidence limits without clearance',async()=>{
  const {pin,atlas,pins}=await setup();
  const review=json('atlas-review/manifest.json');
  assert.equal(review.revision,CURRENT_ATLAS_REVISION);
  assert.equal(review.files.length,pin.reviewSourceFiles);
  assert.equal(pins.baseline,baseline);
  same(read('atlas-review/content/arterial-evidence-limits-pins.json'),git(atlas,'show',`${source}:content/arterial-evidence-limits-pins.json`),'Original arterial pin bytes retained');
  for(const path of newPaths){
    const row=review.files.find(file=>file.path===path);assert.ok(row,`Review source ${path}`);
    const committed=git(atlas,'show',`${CURRENT_ATLAS_REVISION}:${path}`);
    same(git(atlas,'show',`6036a7a59dcc1fd75eee4a23af34ca2a568d86b6:${path}`),git(atlas,'show',`${source}:${path}`),`Feature source retained ${path}`);
    assert.equal(row.sourceSha256,sha(committed));
    assert.equal(row.importedSha256,sha(read(`atlas-review/${path}`)));
    assert.equal(row.importedSha256,row.sourceSha256,`Exact imported ${path}`);
  }
  const inventory=json('lib/atlas-model-inventory.json');
  assert.equal(inventory.models.length,137);
  assert.equal(inventory.models.flatMap(model=>model.paths).length,144);
  for(const name of modules){
    const base=`public/atlas-runtime/${name}/`;
    const manifest=json(base+'manifest.json'),inputs=json(base+'source-inputs.json');
    assert.equal(manifest.sourceCommit,pin.runtimeSources[name]);
    assert.equal(manifest.patientDataIncluded,false);
    for(const key of ['clinicalApproved','standaloneReviewConnection','imagingConnection'])
      assert.ok(manifest[key]===false||manifest[key]===undefined,`${name}:${key}`);
    const row=inventory.sources.find(item=>item.module===name);
    assert.equal(row.sourceCommit,pin.runtimeSources[name]);
    assert.equal(row.manifestSha256,sha(read(base+'manifest.json')));
    for(const path of newPaths){
      const input=inputs.find(item=>item.path===path);
      if(name==='head-neck')assert.ok(input,`Learner source closure includes ${path}`);
      if(input)assert.equal(input.sha256,sha(readFileSync(resolve(atlas,path))),`${name}:${path}`);
    }
  }
  const viewer=json('public/atlas-review-viewer/manifest.json');
  assert.equal(viewer.sourceCommit,CURRENT_ATLAS_REVISION);
  assert.equal(viewer.personalRecordsIncluded,false);
  assert.equal(viewer.mode,'production');
});

test('four exact source identities change only their pending lessons; all 9932 others preserve the baseline',async()=>{
  const {feature,old,pins,featureCatalog,oldCatalog}=await setup();
  same(featureCatalog,oldCatalog,'No catalogue, model, identity or geometry change');
  same(feature.structures,old.structures,'No anatomical structure change');
  same(feature.dissectionProfiles,old.dissectionProfiles,'No dissection change');
  same(feature.regionalTours,old.regionalTours,'No tour change');
  same(feature.contentTabs,old.contentTabs,'No topic change');
  assert.equal(featureCatalog.structures.length,1104);
  assert.equal(feature.contentTabs.length,9);
  assert.equal(pins.entries.length,4);
  same(pins.entries.map(row=>[row.identity.fmaId,row.identity.laterality,row.identity.sources[0].file,row.tab,row.family]),specs);
  const selected=new Map(pins.entries.map(row=>[row.identity.id,row]));
  assert.equal(selected.size,4);
  const byId=new Map(featureCatalog.structures.map(row=>[row.id,row]));
  for(const row of pins.entries){
    same(byId.get(row.identity.id),row.identity,`${row.identity.id} current identity`);
    same(oldCatalog.structures.find(item=>item.id===row.identity.id),row.identity,`${row.identity.id} immutable identity`);
    assert.equal(row.identity.validation.status,'unvalidated');
    assert.equal(row.identity.validation.anatomicalReview,false);
    same(old.bodyLesson(row.identity,row.tab),row.previous,`${row.identity.id} baseline lesson`);
  }
  let changed=0,preserved=0;
  for(const structure of featureCatalog.structures)for(const tab of feature.contentTabs){
    const current=feature.bodyLesson(structure,tab),previous=old.bodyLesson(structure,tab);
    if(selected.get(structure.id)?.tab===tab){
      assert.notDeepEqual(current,previous);
      assert.equal(current.readiness,'pending');
      assert.match(current.title,/evidence pending/);
      assert.match(current.note,/sign-off remain pending/);
      changed++;
    }else{same(current,previous,`${structure.id}/${tab}`);preserved++;}
  }
  same([changed,preserved],[4,9932]);
});

test('all 9936 current imported lessons agree with the exact current Git application graph',async()=>{
  const {api,currentGit,catalog,atlas}=await setup();
  const committedCatalog=currentGit.bodyDisplayCatalog(JSON.parse(git(atlas,'show',`${CURRENT_ATLAS_REVISION}:public/models/bodyparts3d/full-body/catalog.json`)));
  same(catalog,committedCatalog,'Current display catalogue');
  same(api.structures,currentGit.structures,'Current anatomical structures');
  same(api.dissectionProfiles,currentGit.dissectionProfiles,'Current dissection profiles');
  same(api.regionalTours,currentGit.regionalTours,'Current regional tours');
  same(api.contentTabs,currentGit.contentTabs,'Current content tabs');
  assert.equal(catalog.structures.length,1104);
  assert.equal(api.contentTabs.length,9);
  let compared=0;
  for(const structure of catalog.structures)for(const tab of api.contentTabs){
    same(api.bodyLesson(structure,tab),currentGit.bodyLesson(structure,tab),`${structure.id}/${tab} current Git lesson`);
    compared++;
  }
  assert.equal(compared,9936);
});

test('actual imported resolver, regional reader and Review worksheet agree; forged identities and packets fail',async()=>{
  const {api,old,pins}=await setup();
  const regional=new Map(['shoulder-arm','head-neck'].map(name=>[name,api.decodeRegionalTeachingSnapshot(json(`atlas-review/content/regional-teaching/${name}.json`),name)]));
  let refused=0,malformedPackets=0,storageCalls=0;
  const storage={prepare(){storageCalls++;throw Error('Invalid review reached storage');}};
  for(const row of pins.entries){
    const {identity,tab,family}=row;
    const lesson=api.arterialEvidenceLimitLesson(identity,tab);
    same(api.bodyLesson(identity,tab),lesson);
    const reader=regional.get(identity.region);assert.ok(reader,'Exact primary region reader');
    assert.ok(reader.accepts(identity));
    same(reader.bodyLesson(identity,tab),lesson,`${identity.id} generated reader`);
    assert.equal(lesson.readiness,'pending');
    assert.equal(lesson.body,api.arterialEvidenceLimits[family].body);
    same(lesson.bullets,[...api.arterialEvidenceLimits[family].bullets]);
    same(lesson.citations,[...api.arterialEvidenceLimits[family].citations]);
    assert.match(lesson.note,/Atlas, case and lecture access remain independent/);
    const {readiness,...section}=lesson;same(api.bodyContent(identity,tab),section);
    const first=api.arterialEvidenceLimitLesson(identity,tab);first.bullets.push('foreign');first.citations.push('https://foreign.invalid');
    same(api.arterialEvidenceLimitLesson(identity,tab),lesson,'Fresh arrays');
    for(const other of api.contentTabs.filter(value=>value!==tab))assert.equal(api.arterialEvidenceLimitLesson(identity,other),undefined);
    function leaves(value,path=[]){return value&&typeof value==='object'?Object.entries(value).flatMap(([key,part])=>leaves(part,[...path,key])):[{path,value}];}
    for(const {path,value} of leaves(identity)){
      const altered=structuredClone(identity);let target=altered;
      for(const key of path.slice(0,-1))target=target[key];
      target[path.at(-1)]=typeof value==='string'?value+' foreign':typeof value==='number'?value+1:typeof value==='boolean'?!value:'foreign';
      assert.equal(api.arterialEvidenceLimitLesson(altered,tab),undefined,`${identity.id} altered ${path.join('.')}`);
      refused++;
    }
    assert.equal(api.arterialEvidenceLimitLesson({...identity,foreign:true},tab),undefined);refused++;
    const worksheet=await api.bodyReviewMaterial(identity.id);
    assert.equal(worksheet.approval,false);
    same(worksheet.topics.find(topic=>topic.tab===tab),{tab,...lesson});
    assert.ok(await api.parseBodyReviewResponse(worksheet,identity.id));
    for(const mutate of [
      packet=>{packet.topics.find(topic=>topic.tab===tab).body+=' foreign';},
      packet=>{packet.topics.find(topic=>topic.tab===tab).readiness='draft';},
      packet=>{packet.source.structure.sources[0].sha256='0'.repeat(64);},
      packet=>{packet.topics.find(topic=>topic.tab===tab).citations=['https://foreign.invalid'];},
    ]){
      const forged=structuredClone(worksheet);mutate(forged);
      assert.equal(await api.parseBodyReviewResponse(forged,identity.id),null);malformedPackets++;
    }
    const oldWorksheet=await old.bodyReviewMaterial(identity.id);
    assert.equal(await api.parseBodyReviewResponse(oldWorksheet,identity.id),null);
    const context=await api.bodyReviewContext(identity.id),before=await old.bodyReviewContext(identity.id);
    assert.equal(context.sourceHash,before.sourceHash);
    assert.notEqual(context.revisions.teaching,before.revisions.teaching);
    const packet={catalogScope:context.catalogScope,structureId:identity.id,track:'teaching',expectedVersion:0,
      materialHash:before.materialHash,revisionHash:before.revisions.teaching,checklistVersion:context.checklistVersion,
      draft:api.blankBodyReview(context,'teaching')};
    const request=new Request('https://atlas.test/api/body-decisions',{method:'POST',headers:{origin:'https://atlas.test',
      'content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_ARTERIAL_LIMITS'},body:JSON.stringify(packet)});
    assert.equal((await api.postBodyDecision(request,storage)).status,409);
  }
  assert.equal(refused,142);assert.equal(malformedPackets,16);
  assert.equal(storageCalls,0);
});

test('source-pinned lesson text is reachable in emitted learner and production Review assets',async()=>{
  const {api}=await setup();
  const learnerBase='public/atlas-runtime/head-neck/';
  const learner=emittedTeaching(learnerBase,json(learnerBase+'manifest.json').files,true);
  const reviewBase='public/atlas-review-viewer/';
  const review=emittedTeaching(reviewBase,json(reviewBase+'manifest.json').files,true);
  const contains=(emitted,line)=>emitted.includes(line)||emitted.includes(JSON.stringify(line).slice(1,-1));
  for(const family of ['middleCollateralUltrasound','inferiorThyroidMri']){
    const topic=api.arterialEvidenceLimits[family];
    for(const emitted of [learner,review]){
      assert.ok(contains(emitted,topic.body),`${family} body in reachable output`);
      assert.ok(contains(emitted,topic.note),`${family} note in reachable output`);
      for(const citation of topic.citations)assert.ok(contains(emitted,citation),`${family} reference in reachable output`);
    }
  }
});

import {assertCurrentArterialPrefix} from './arterial-delivery-roles.mjs';
import {assertFrozenOriginal} from './a01-delivery-binding.mjs';
import {runArterialA01Historical} from './arterial-a01-history-transport.mjs';

test('current a01 arterial delivery stays exact and refuses foreign family/source roles',t=>{
  // The first five cases above inspect the current source. This complete old
  // a01 role executes in its own authenticated website/native epoch.
  assertCurrentArterialPrefix();
  assertFrozenOriginal(resolve(root,'tests/nine-history-original-atlas-arterial-current-delivery.mjs'),'cd5b7082922746ae5af6e781c4538db225c30a0776eb41646a39c5a8e61a5df6');
  t.diagnostic(JSON.stringify(runArterialA01Historical()));
});
