import {boundLiveAtlasHistory} from './atlas-bound-live-history.mjs';
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
const deliveryPin=validateCurrentAtlasDelivery();
const baseline='fc894122f24b80ad30846b9ffdefc342567bedc2';
const completedEpoch='64171dd32c6e2c1c016c53af8e04619cd417544d';
const liveCommit=CURRENT_ATLAS_REVISION; // Exact committed, integrated Atlas revision.
const id='vm:anatomy:body:spine:midline:space:central-canal-of-spinal-cord';
const pinPath='content/central-canal-imaging-pins.json';
const catalogPath='public/models/bodyparts3d/full-body/catalog.json';
const inputPaths=['content/central-canal-xray.ts','lib/central-canal-xray.ts','app/body-content.ts'];
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));
const sha=(bytes:Uint8Array|string)=>createHash('sha256').update(bytes).digest('hex');
const norm=(bytes:Uint8Array)=>Buffer.from(bytes).toString('utf8').replaceAll('\r\n','\n');
const git=(args:string[])=>execFileSync('git',args,{cwd:atlas,windowsHide:true,maxBuffer:64e6,
  env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
const committed=(revision:string,path:string)=>git(['show',`${revision}:${path}`]);
const visible=(code:string,value:string)=>code.includes(value)||code.includes(JSON.stringify(value).slice(1,-1));
const pathsWhere=(value:any,predicate:(value:any)=>boolean,path:(string|number)[]=[]):(string|number)[][]=>[
  ...(predicate(value)?[path]:[]),
  ...(value&&typeof value==='object'
    ?Object.entries(value).flatMap(([key,child])=>pathsWhere(child,predicate,[...path,key])):[]),
];
const at=(value:any,path:(string|number)[])=>path.reduce((part,key)=>part[key],value);

async function closure(){
  const built=await build({stdin:{contents:[
    "export {centralCanalXrayLesson} from './atlas-review/lib/central-canal-xray';",
    "export {centralCanalXrayTopics} from './atlas-review/content/central-canal-xray';",
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

test('one exact central-canal X-ray draft reaches four bound runtimes and protected Review',async()=>{
  assert.match(liveCommit,/^[a-f0-9]{40}$/,'Coordinator must pin __ATLAS_COMMIT__ after Atlas commit');
  assert.equal(git(['rev-parse','HEAD']).toString().trim(),liveCommit);
  assert.equal(git(['merge-base',baseline,liveCommit]).toString().trim(),baseline);
  const review=json('atlas-review/manifest.json');
  assert.equal(review.revision,liveCommit);
  assert.equal(liveCommit,deliveryPin.source,'Review remains bound to current Atlas source');
  const viewerBase='public/atlas-review-viewer/',viewer=json(viewerBase+'manifest.json');
  assert.equal(viewer.sourceCommit,liveCommit);
  assert.equal(viewer.websiteIntegrationSha256,review.websiteIntegrationSha256);
  assert.equal(viewer.personalRecordsIncluded,false);
  const learners=['head-neck','female-pelvis','lower-limb','shoulder'].map(name=>({
    name,base:`public/atlas-runtime/${name}/`,manifest:json(`public/atlas-runtime/${name}/manifest.json`)}));
  for(const {name,manifest} of learners){
    assert.equal(manifest.sourceCommit,deliveryPin.runtimeSources[name],name);
    assert.equal(manifest.patientDataIncluded,false,name);
    assert.equal(manifest.clinicalApproved,false,name);
  }
  for(const path of inputPaths){
    const source=committed(liveCommit,path),imported=readFileSync('atlas-review/'+path);
    const record=review.files.find((file:{path:string})=>file.path===path);assert(record,path);
    assert.equal(record.sourceSha256,sha(source),path);
    assert.equal(record.importedSha256,sha(imported),path);
    assert.equal(norm(imported),norm(source),`${path}: imported bytes`);
    assert.equal(norm(readFileSync(`${atlas}/${path}`)),norm(source),`${path}: live Atlas bytes`);
    for(const {name,base} of learners){
      const input=json(base+'source-inputs.json').find((file:{path:string})=>file.path===path);
      if(name==='head-neck'||name==='shoulder'){
        const familySource=committed(deliveryPin.runtimeSources[name],path);
        assert.equal(input?.sha256,sha(familySource),`${name}: ${path}`);
      }
      else assert.equal(input,undefined,`${name}: ${path} should not be a regional input`);
    }
  }
  const pins=json('atlas-review/'+pinPath);
  assert.deepEqual(pins,JSON.parse(committed(baseline,pinPath).toString()),'Historical source pins unchanged');
  assert.equal(norm(readFileSync('atlas-review/'+catalogPath)),norm(committed(baseline,catalogPath)),
    'Full-body geometry catalogue unchanged');
  assert.equal(pins.entries.length,1);
  assert.deepEqual(pins.entries[0].topics,['ct','mri','ultrasound']);
  assert.equal(pins.bundles.length,1);
  const identity=pins.entries[0].identity;
  assert.equal(identity.id,id);assert.equal(identity.fmaId,'FMA78497');
  assert.equal(identity.nodeName,'FMA78497');assert.equal(identity.system,'nerves');
  assert.equal(identity.category,'space');assert.equal(identity.region,'spine');
  assert.equal(identity.laterality,'midline');assert.equal(identity.bundle,'spine-nerves');
  assert.equal(identity.sourceTree,'isa');
  assert.deepEqual(identity.sources.map((source:{file:string})=>source.file),['FJ1737']);
  assert.equal(identity.validation.status,'unvalidated');
  assert.equal(identity.validation.anatomicalReview,false);
  const spineBundle='public'+pins.bundles[0].url.split('?')[0];
  const deliveredBundle=learners.find(item=>item.name==='head-neck')!.base+pins.bundles[0].url.replace(/^\//,'');
  assert.equal(sha(readFileSync(deliveredBundle)),pins.bundles[0].sha256);
  assert.deepEqual(readFileSync(deliveredBundle),committed(baseline,spineBundle),
    'Central-canal geometry unchanged');
  for(const path of [pinPath,...inputPaths])
    for(const base of ['public/atlas-review/',viewerBase,...learners.map(item=>item.base)])
      assert.equal(existsSync(base+path),false,`${base+path}: raw source must not be public`);

  const api=await closure(),catalog=api.bodyDisplayCatalog(json('atlas-review/'+catalogPath));
  assert.equal(catalog.structures.length,1104);
  assert.deepEqual(catalog.structures.find((item:{id:string})=>item.id===id),identity);
  assert.deepEqual(Object.keys(api.centralCanalXrayTopics),['xray']);
  const topic=api.centralCanalXrayTopics.xray;
  assert(topic.body.trim());assert(topic.bullets.length>=2);assert(topic.citations.length>=2);
  const selected=api.centralCanalXrayLesson(wire(identity),'xray');assert(selected);
  assert.deepEqual(api.bodyLesson(identity,'xray'),selected);
  assert.equal(selected.readiness,'draft');
  assert.equal(selected.body,topic.body);
  assert.deepEqual(selected.bullets,topic.bullets);
  assert.deepEqual(selected.citations,topic.citations);
  assert(selected.citations.every((url:string)=>url.startsWith('https://')));
  assert.equal(new Set(selected.citations).size,selected.citations.length);
  const prose=[selected.title,selected.body,...selected.bullets,selected.note].join(' ');
  for(const pattern of [/central canal/i,/vertebral canal/i,/within the spinal cord/i,
    /subarachnoid space around the cord/i,/not a cast of the central canal/i,
    /routine spine radiographs do not separately depict/i,/neither a patient radiograph nor evidence of canal patency/i,
    /measured CSF movement/i,/exact.revision radiologist review pending/i,
    /clinical approval/i,/patient.space registration/i,/Atlas, imaging.case and paid.lecture access remain independent/i])
    assert.match(prose,pattern);
  assert.doesNotMatch(prose,/approved for clinical use|diagnostic threshold|confirmed patency|measured flow/i);
  for(const url of ['https://www.radiologyinfo.org/en/info/myelography',
    'https://www.radiologyinfo.org/en/info/spinemr'])assert(selected.citations.includes(url));
  const {readiness,...content}=selected;
  assert.deepEqual(api.bodyContent(identity,'xray'),content);
  const clean=wire(selected);selected.bullets.push('foreign');selected.citations.push('https://foreign.example');
  assert.deepEqual(api.centralCanalXrayLesson(identity,'xray'),clean,'Fresh lesson arrays');
  for(const tab of api.contentTabs.filter((tab:string)=>tab!=='xray'))
    assert.equal(api.centralCanalXrayLesson(identity,tab),undefined,tab);
  for(const structure of catalog.structures)if(structure.id!==id)
    assert.equal(api.centralCanalXrayLesson(structure,'xray'),undefined,structure.id);
  assert.equal(api.centralCanalXrayLesson({id},'xray'),undefined,'ID alone is insufficient');
  let refusals=0;
  const refuse=(bad:any,label:string)=>{
    assert.equal(api.centralCanalXrayLesson(bad,'xray'),undefined,label);refusals++;
  };
  for(const path of pathsWhere(identity,value=>value===null||typeof value!=='object')){
    const bad=wire(identity),parent=at(bad,path.slice(0,-1)),key=path.at(-1)!;
    const original=parent[key];
    parent[key]=typeof original==='string'?original+'-foreign'
      :typeof original==='number'?original+0.01:original===null?'foreign':!original;
    refuse(bad,path.join('.'));
  }
  for(const path of pathsWhere(identity,Array.isArray)){
    const bad=wire(identity);at(bad,path).push('foreign');refuse(bad,path.join('.')+': appended');
    if(at(identity,path).length>1){
      const reordered=wire(identity);at(reordered,path).reverse();
      if(JSON.stringify(at(reordered,path))!==JSON.stringify(at(identity,path)))
        refuse(reordered,path.join('.')+': reordered');
    }
  }
  for(const path of pathsWhere(identity,value=>value&&typeof value==='object'&&!Array.isArray(value))){
    const bad=wire(identity);at(bad,path).unexpected=true;
    refuse(bad,(path.join('.')||'<root>')+': extra field');
    for(const key of Object.keys(at(identity,path))){
      const omitted=wire(identity);delete at(omitted,path)[key];
      refuse(omitted,[...path,key].join('.')+': omitted');
    }
  }
  assert(refusals>50,'Every source identity field is guarded');
  const emitted=learners.filter(item=>item.name==='head-neck'||item.name==='shoulder')
    .map(item=>emittedTeaching(item.base,item.manifest.files,true));
  const scope=learners[0].manifest.regionalScopes.find((row:{region:string})=>row.region==='spine');
  assert(scope?.regionalIds.includes(id));
  for(const code of emitted)for(const value of [topic.title,clean.body,...clean.bullets,...clean.citations,clean.note])
    assert(visible(code,value),`Emitted teaching missing ${value}`);
});

test('historical central-canal X-ray teaching transition survives; current stale and forged submissions stop before storage',async()=>{
  assert.match(liveCommit,/^[a-f0-9]{40}$/,'Coordinator must pin __ATLAS_COMMIT__ after Atlas commit');
  const imported=await closure(),live=await boundLiveAtlasHistory(liveCommit);
  const {exactSourceHistoryApi}=await import(pathToFileURL(atlas+'/scripts/exact-source-history-api.mjs').href);
  const old=await exactSourceHistoryApi(baseline,'review-security');
  const feature=await exactSourceHistoryApi(completedEpoch,'review-security');
  const catalog=imported.bodyDisplayCatalog(json('atlas-review/'+catalogPath));
  assert.deepEqual(catalog,live.bodyDisplayCatalog(json('atlas-review/'+catalogPath)));
  assert.deepEqual(imported.structures,live.structures);
  assert.deepEqual(imported.dissectionProfiles,live.dissectionProfiles);
  assert.deepEqual(imported.regionalTours,live.regionalTours);
  assert.deepEqual(imported.contentTabs,live.contentTabs);
  assert.equal(imported.contentTabs.length,9);
  const structure=catalog.structures.find((item:{id:string})=>item.id===id);assert(structure);
  for(const tab of imported.contentTabs){
    const current=imported.bodyLesson(structure,tab);
    assert.deepEqual(current,live.bodyLesson(structure,tab),`${tab}: live source`);
    const historical=feature.bodyLesson(structure,tab);
    if(tab==='xray'){
      assert.equal(old.bodyLesson(structure,tab).readiness,'pending');
      assert.equal(historical.readiness,'draft');
      assert.deepEqual(current,historical,`${tab}: authored topic retained`);
      assert.equal(current.readiness,'draft');
    }else assert.deepEqual(historical,old.bodyLesson(structure,tab),`${tab}: historical preservation`);
  }
  for(const tab of ['ct','mri','ultrasound'])
    assert.equal(imported.bodyLesson(structure,tab).readiness,'draft',tab);
  let changed=0,preserved=0;
  for(const item of catalog.structures)for(const tab of imported.contentTabs){
    assert.deepEqual(imported.bodyLesson(item,tab),live.bodyLesson(item,tab),`${item.id}:${tab}: current source`);
    if(item.id===id&&tab==='xray'){changed++;continue;}
    assert.deepEqual(feature.bodyLesson(item,tab),old.bodyLesson(item,tab),`${item.id}:${tab}: historical source`);preserved++;
  }
  assert.deepEqual([changed,preserved],[1,9935]);
  const packet=wire(await imported.bodyReviewMaterial(id));
  const previous=wire(await old.bodyReviewMaterial(id));
  const historical=wire(await feature.bodyReviewMaterial(id));
  assert.deepEqual(packet,wire(await live.bodyReviewMaterial(id)));
  assert.equal(packet.approval,false);
  assert.deepEqual(packet.source.structure,structure);
  assert.deepEqual(historical.topics.filter((row:any)=>row.tab!=='xray'),
    previous.topics.filter((row:any)=>row.tab!=='xray'));
  for(const key of ['source','reasoning','guidedTours','checklist','atlasLink','limits'])
    assert.deepEqual(historical[key],previous[key],key);
  assert.deepEqual(packet.topics.find((row:any)=>row.tab==='xray'),
    {tab:'xray',...imported.bodyLesson(structure,'xray')});
  assert.deepEqual(packet.topics.find((row:any)=>row.tab==='xray'),historical.topics.find((row:any)=>row.tab==='xray'));
  assert.equal(historical.fingerprints.source,previous.fingerprints.source);
  assert.notEqual(historical.fingerprints.teaching,previous.fingerprints.teaching);
  assert.notEqual(historical.materialHash,previous.materialHash);
  assert.equal(packet.fingerprints.source,previous.fingerprints.source);
  assert.notEqual(packet.fingerprints.teaching,previous.fingerprints.teaching);
  assert.notEqual(packet.materialHash,previous.materialHash);
  assert.deepEqual(await feature.parseBodyReviewResponse(historical,id),historical);
  assert.equal(await feature.parseBodyReviewResponse(previous,id),null);
  assert.deepEqual(await imported.parseBodyReviewResponse(packet,id),packet);
  assert.equal(await imported.parseBodyReviewResponse(previous,id),null);
  for(const mutate of [
    (bad:any)=>{bad.topics.find((row:any)=>row.tab==='xray').body+=' forged';},
    (bad:any)=>{bad.topics.find((row:any)=>row.tab==='xray').bullets[0]+=' forged';},
    (bad:any)=>{bad.topics.find((row:any)=>row.tab==='xray').citations[0]='https://forged.example';},
    (bad:any)=>{bad.topics.find((row:any)=>row.tab==='xray').readiness='approved';},
    (bad:any)=>{bad.topics.splice(bad.topics.findIndex((row:any)=>row.tab==='xray'),1);},
    (bad:any)=>{bad.source.structure.sources[0].sha256='0'.repeat(64);},
  ]){const forged=wire(packet);mutate(forged);
    assert.equal(await imported.parseBodyReviewResponse(forged,id),null);}
  const context=await imported.bodyReviewContext(id),prior=await old.bodyReviewContext(id);
  assert.deepEqual(context,await live.bodyReviewContext(id));
  assert.equal(context.sourceHash,prior.sourceHash);
  assert.notEqual(context.revisions.teaching,prior.revisions.teaching);
  assert.equal(context.revisions.imaging,null);
  assert(context.teachingTabs.includes('xray'));
  assert.equal(imported.bodyReviewStale({catalogScope:context.catalogScope,structureId:id,
    checklistVersion:context.checklistVersion,revisionHash:prior.revisions.teaching,track:'teaching'},context),true);
  const decision={catalogScope:context.catalogScope,structureId:id,track:'teaching',expectedVersion:0,
    materialHash:context.materialHash,revisionHash:context.revisions.teaching,
    checklistVersion:context.checklistVersion,draft:imported.blankBodyReview(context,'teaching')};
  let storageCalls=0;
  const storage={prepare(){storageCalls++;throw Error('Rejected request reached storage');}};
  const save=(input:any)=>imported.postBodyDecision(new Request('https://review.test/api/body-decisions',{
    method:'POST',headers:{origin:'https://review.test','content-type':'application/json',
      'oai-authenticated-user-id':'synthetic-central-canal-xray-reviewer'},body:JSON.stringify(input),
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
