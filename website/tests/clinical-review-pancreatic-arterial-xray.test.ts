import {boundLiveAtlasHistory} from './atlas-bound-live-history.mjs';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync,readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import test from 'node:test';
import {build} from 'esbuild';
import {emittedTeaching} from './atlas-emitted-teaching.ts';

const atlasBaseline='0587c30bbc43c000ca617d63b9400d6939e51b47';
const historicalLiveCommit='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const liveCommit=CURRENT_ATLAS_REVISION;
const atlas=currentAtlasDeliveryRoot();
const pinsPath='content/abdominal-arterial-pins.json';
const teachingPaths=['content/pancreatic-arterial-xray.ts','lib/pancreatic-arterial-xray.ts'];
const paths=[pinsPath,...teachingPaths];
const targets={
  'anterior-superior-pancreaticoduodenal-artery':{fma:'FMA14782',side:'unspecified',files:['FJ3409'],bundle:'abdomen-vessels-visceral-detail'},
  'posterior-superior-pancreaticoduodenal-artery':{fma:'FMA14784',side:'unspecified',files:['FJ3557'],bundle:'abdomen-vessels-visceral-detail'},
  'dorsal-pancreatic-artery':{fma:'FMA14787',side:'unspecified',files:['FJ3430'],bundle:'abdomen-vessels-visceral-detail'},
  'inferior-pancreatic-artery':{fma:'FMA14790',side:'unspecified',files:['FJ3444'],bundle:'abdomen-vessels-visceral-detail'},
  'great-pancreatic-artery':{fma:'FMA14792',side:'unspecified',files:['FJ3433'],bundle:'abdomen-vessels-visceral-detail'},
  'caudal-pancreatic-artery':{fma:'FMA14793',side:'unspecified',files:['FJ3419'],bundle:'abdomen-vessels-visceral-detail'},
  'inferior-pancreaticoduodenal-artery':{fma:'FMA14805',side:'unspecified',files:['FJ3446'],bundle:'abdomen-vessels-visceral-detail'},
  'anterior-inferior-pancreaticoduodenal-artery':{fma:'FMA70479',side:'unspecified',files:['FJ3401'],bundle:'abdomen-vessels-visceral-detail'},
  'posterior-inferior-pancreaticoduodenal-artery':{fma:'FMA70480',side:'unspecified',files:['FJ3546'],bundle:'abdomen-vessels-visceral-detail'},
} as const;
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const runtimeSources=validateCurrentAtlasDelivery().runtimeSources;
const entries=():{identity:any;group:keyof typeof targets}[]=>json('atlas-review/'+pinsPath).entries
  .filter((identity:any)=>Object.hasOwn(targets,identity.id.split(':').at(-1)))
  .map((identity:any)=>({identity,group:identity.id.split(':').at(-1) as keyof typeof targets}));
const sha=(bytes:Uint8Array|string)=>createHash('sha256').update(bytes).digest('hex');
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));
const norm=(bytes:Uint8Array)=>Buffer.from(bytes).toString('utf8').replaceAll('\r\n','\n');
const visible=(code:string,value:string)=>code.includes(value)||code.includes(JSON.stringify(value).slice(1,-1));
const git=(args:string[])=>execFileSync('git',args,{cwd:atlas,windowsHide:true,maxBuffer:32e6,
  env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
const committed=(revision:string,path:string)=>git(['show',`${revision}:${path}`]);
async function history(revision:string){
  const api=await import(pathToFileURL(atlas+'/scripts/exact-source-history-api.mjs').href);
  return api.exactSourceHistoryApi(revision,'review-security');
}
async function closure(){
  const built=await build({stdin:{contents:[
    "export {bodyLesson} from './atlas-review/app/body-content';",
    "export {pancreaticArterialXrayLesson} from './atlas-review/lib/pancreatic-arterial-xray';",
    "export {pancreaticArterialXrayTopics} from './atlas-review/content/pancreatic-arterial-xray';",
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
    platform:'node',format:'esm'});
  return import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
}

function assertSemantics(prose:string,group:keyof typeof targets){
  assert.match(prose,/plain.{0,80}(?:radiograph|X.ray)/i);
  assert.match(prose,/(?:contrast.{0,100}(?:catheter|angiograph|DSA)|(?:catheter|angiograph|DSA).{0,100}contrast)/i);
  assert.match(prose,/\bDSA\b|digital subtraction/i);
  assert.match(prose,/\bCTA\b|CT angiograph/i);
  assert.match(prose,/\bMRA\b|MR angiograph/i);
  assert.match(prose,/projection/i);
  assert.match(prose,/(?:source|retained).{0,100}(?:laterality|unspecified|side)/i);
  assert.match(prose,/patient.side marker/i);
  assert.match(prose,/screen.{0,100}(?:not|no).{0,60}patient.side marker/i);
  assert.match(prose,/colou?r/i);
  assert.match(prose,/(?:no|not|without).{0,100}acquired/i);
  assert.match(prose,/(?:no|not|without).{0,140}(?:registration|patient.space)/i);
  assert.match(prose,/(?:no|not|cannot|does not).{0,140}(?:flow|perfusion)/i);
  assert.match(prose,/(?:no|not|cannot|does not).{0,140}(?:procedur|route|catheter.placement)/i);
  assert.match(prose,/(?:no|not|cannot|does not).{0,140}clinical approval/i);
  assert.match(prose,/revision.bound radiologist.{0,60}pending/i);
  assert.match(prose,/independent/i);
  assert.match(prose,/Atlas/i);assert.match(prose,/case/i);assert.match(prose,/lecture/i);
  assert.doesNotMatch(prose,/approved for clinical use|recommended catheter route|diagnostic threshold is/i);
  if(/superior-pancreaticoduodenal/.test(group)||/inferior-pancreaticoduodenal/.test(group)){
    assert.match(prose,/anterior|posterior/i);assert.match(prose,/arcade|pancreaticoduodenal/i);
  }
  if(group==='dorsal-pancreatic-artery'){
    assert.match(prose,/(?:not always|variable|inconsistent|may not).{0,100}(?:seen|visible|visualiz|identif|depict)/i);
    assert.match(prose,/inverted.?T/i);
    assert.match(prose,/(?:not|no|non.mandatory|variable).{0,100}inverted.?T|inverted.?T.{0,100}(?:not|no|non.mandatory|variable)/i);
  }
  if(group==='inferior-pancreatic-artery')
    assert.match(prose,/(?:not the|distinct|different|separate).{0,100}inferior pancreaticoduodenal|inferior pancreaticoduodenal.{0,100}(?:distinct|different|separate)/i);
  if(group==='great-pancreatic-artery')assert.match(prose,/pancreatica magna/i);
  if(group==='caudal-pancreatic-artery')assert.match(prose,/tail/i);
  if(group==='inferior-pancreaticoduodenal-artery'){
    assert.match(prose,/(?:trunk|parent)/i);assert.match(prose,/anterior/i);assert.match(prose,/posterior/i);
    assert.match(prose,/jejunal/i);assert.match(prose,/separate inferior branches/i);
  }
  assert.doesNotMatch(prose,/always visible|universally patent|mandatory inverted.?T|routine intravenous CTA.{0,50}Okahara/i);
}

function assertStudyLimits(prose:string,citations:string[],group:keyof typeof targets){
  if(citations.some(url=>/PMC5596604/i.test(url))){
    assert.match(prose,/39.patient selective arteriograph/i,`${group}: selective series scope`);
    assert.match(prose,/(?:not|does not).{0,120}(?:universal|always|every)/i,
      `${group}: series is not universal visibility or patency evidence`);
  }
  if(citations.some(url=>/19777288/.test(url))){
    assert.match(prose,/226 selective angiograph/i,`${group}: selective angiography cohort`);
    assert.match(prose,/CT.during.selective.arteriograph/i,`${group}: CT was during selective arteriography`);
    assert.match(prose,/not routine intravenous CTA/i,`${group}: no routine IV CTA inference`);
  }
  if(citations.some(url=>/PMC8816990/i.test(url))){
    assert.match(prose,/100.patient dual.energy CT/i,`${group}: DECT cohort`);
    assert.match(prose,/(?:CT|cross.sectional).{0,100}(?:not|does not).{0,100}(?:catheter|DSA)/i,
      `${group}: CT findings are not catheter DSA evidence`);
  }
}

test('nine exact pancreatic arterial X-ray drafts reach body learner and protected Review',async()=>{
  const review=json('atlas-review/manifest.json'),revision=review.revision;
  assert.match(revision,/^[a-f0-9]{40}$/);
  assert.notEqual(revision,atlasBaseline);
  assert.equal(revision,liveCommit,'Exact pinned current Review source');
  assert.equal(git(['rev-parse','HEAD']).toString().trim(),revision);
  const learners=['head-neck','female-pelvis','lower-limb','shoulder'].map(name=>({name,
    base:`public/atlas-runtime/${name}/`,manifest:json(`public/atlas-runtime/${name}/manifest.json`)}));
  for(const {name,manifest} of learners){
    assert.equal(manifest.sourceCommit,runtimeSources[name],name);
    assert.equal(manifest.patientDataIncluded,false,name);
    assert.equal(manifest.clinicalApproved,false,name);
  }
  const viewerBase='public/atlas-review-viewer/',viewer=json(viewerBase+'manifest.json');
  assert.equal(viewer.sourceCommit,revision);
  assert.equal(viewer.websiteIntegrationSha256,review.websiteIntegrationSha256);
  assert.equal(viewer.personalRecordsIncluded,false);
  const learner=learners.find(item=>item.name==='head-neck');assert(learner);
  const inputs=json(learner.base+'source-inputs.json');
  for(const path of paths){
    const source=committed(revision,path),imported=readFileSync('atlas-review/'+path);
    const record=review.files.find((file:{path:string})=>file.path===path);
    assert(record,`Review missing ${path}`);
    assert.equal(record.sourceSha256,sha(source),path);
    assert.equal(record.importedSha256,sha(imported),path);
    assert.equal(norm(imported),norm(source),`${path}: imported source`);
    assert.equal(norm(readFileSync(`${atlas}/${path}`)),norm(source),`${path}: Atlas checkout`);
    assert.equal(inputs.find((file:{path:string})=>file.path===path)?.sha256,
      sha(readFileSync(`${atlas}/${path}`)),`${path}: exact learner build input`);
  }
  for(const path of paths)for(const base of ['public/atlas-review/',viewerBase,
    ...learners.map(item=>item.base)])assert.equal(existsSync(base+path),false,`${base+path}: raw source public`);
  const api=await closure(),selected=entries();
  assert.deepEqual(Object.keys(api.pancreaticArterialXrayTopics).sort(),Object.keys(targets).sort());
  assert.equal(selected.length,9);
  assert.equal(new Set(selected.map(({identity}:any)=>identity.id)).size,9);
  const catalog=api.bodyDisplayCatalog(json('atlas-review/public/models/bodyparts3d/full-body/catalog.json'));
  const scope=learner.manifest.regionalScopes.find((item:{region:string})=>item.region==='abdomen');assert(scope);
  const emitted=[emittedTeaching(learner.base,learner.manifest.files,true),emittedTeaching(viewerBase,viewer.files,true)];
  for(const {identity,group} of selected){
    const id=identity.id,expected=targets[group],topic=api.pancreaticArterialXrayTopics[group];
    assert.equal(id,`vm:anatomy:body:abdomen:${expected.side}:vessel:${group}`);
    assert.equal(identity.fmaId,expected.fma);assert.equal(identity.nodeName,expected.fma);
    assert.equal(identity.region,'abdomen');assert.equal(identity.laterality,expected.side);
    assert.equal(identity.system,'vessels');assert.equal(identity.category,'vessel');
    assert.deepEqual(identity.sources.map((source:any)=>source.file),expected.files);
    assert.equal(identity.bundle,expected.bundle);
    assert.equal(identity.validation.anatomicalReview,false);
    assert.deepEqual(catalog.structures.find((item:{id:string})=>item.id===id),identity);
    assert(scope.regionalIds.includes(id),`${id}: abdomen learner scope`);
    const lesson=api.pancreaticArterialXrayLesson(identity,'xray');
    assert.deepEqual(api.bodyLesson(identity,'xray'),lesson);
    assert.equal(lesson.readiness,'draft');
    assert.equal(lesson.title,`${identity.name} · ${topic.title} · draft`);
    assert.equal(lesson.body,topic.body);
    assert.deepEqual(lesson.bullets.slice(0,topic.bullets.length),[...topic.bullets]);
    assert.deepEqual(lesson.citations,[...topic.citations]);
    assert(lesson.citations.includes('https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/artery-tables/arteries-of-the-abdomen/'));
    assert(lesson.citations.includes('https://www.radiologyinfo.org/en/info/angiocath'));
    if(/\b(?:Kulenovic|39.patient selective)/i.test([lesson.body,...lesson.bullets].join(' ')))
      assert(lesson.citations.some((url:string)=>/PMC5596604/i.test(url)));
    if(/\b(?:Okahara|226 selective angiograph)/i.test([lesson.body,...lesson.bullets].join(' ')))
      assert(lesson.citations.some((url:string)=>/19777288/.test(url)));
    if(/\b(?:dual.energy|DECT|100 patients)/i.test([lesson.body,...lesson.bullets].join(' ')))
      assert(lesson.citations.some((url:string)=>/PMC8816990/i.test(url)));
    for(const citation of lesson.citations)assert.match(citation,/^https:\/\//);
    const prose=[lesson.body,...lesson.bullets,lesson.note].join(' ');
    assertSemantics(prose,group);
    assertStudyLimits(prose,[...lesson.citations],group);
    for(const code of emitted){
      for(const value of [identity.name,topic.title,lesson.body,...lesson.bullets,...lesson.citations,lesson.note])
        assert(visible(code,value),`${id}: emitted teaching missing ${value}`);
    }
    for(const tab of api.contentTabs.filter((tab:string)=>tab!=='xray'))
      assert.equal(api.pancreaticArterialXrayLesson(identity,tab),undefined,`${id}:${tab}`);
    const clean=wire(lesson);
    lesson.bullets.push('foreign');lesson.citations.push('https://foreign.example');
    assert.deepEqual(api.pancreaticArterialXrayLesson(identity,'xray'),clean,'Fresh lesson arrays');
    const pathsWhere=(value:any,predicate:(value:any)=>boolean,path:string[]=[]):string[][]=>[
      ...(predicate(value)?[path]:[]),
      ...(value&&typeof value==='object'
        ?Object.entries(value).flatMap(([key,child])=>pathsWhere(child,predicate,[...path,key])):[]),
    ];
    const at=(value:any,path:string[])=>path.reduce((part,key)=>part[key],value);
    const refused=(bad:any,label:string)=>assert.equal(api.pancreaticArterialXrayLesson(bad,'xray'),undefined,id+': '+label);
    for(const path of pathsWhere(identity,value=>value===null||typeof value!=='object')){
      const bad=wire(identity),parent=at(bad,path.slice(0,-1)),key=path.at(-1)!;
      const original=parent[key];
      parent[key]=typeof original==='string'?original+'-foreign'
        :typeof original==='number'?original+0.01:original===null?'foreign':!original;
      refused(bad,path.join('.'));
    }
    for(const path of pathsWhere(identity,Array.isArray)){
      const bad=wire(identity);at(bad,path).push('foreign');refused(bad,path.join('.')+': append');
    }
    for(const path of pathsWhere(identity,value=>value&&typeof value==='object'&&!Array.isArray(value))){
      const bad=wire(identity);at(bad,path).unexpected=true;refused(bad,path.join('.')+': extra field');
      for(const key of Object.keys(at(identity,path))){
        const omitted=wire(identity);delete at(omitted,path)[key];refused(omitted,[...path,key].join('.')+': omitted');
      }
    }
  }
  for(const structure of catalog.structures)if(!Object.hasOwn(targets,structure.id.split(':').at(-1)))
    for(const tab of api.contentTabs)
      assert.equal(api.pancreaticArterialXrayLesson(structure,tab),undefined,`${structure.id}:${tab}: unrelated`);
});

test('admission changes only nine of 9,936 lessons and 1,104 worksheets; forged review stays out of storage',async()=>{
  const imported=await closure(),previous=await history(atlasBaseline);
  const featureCommit=git(['log','--diff-filter=A','-1','--format=%H','--',teachingPaths[0]]).toString().trim();
  assert.match(featureCommit,/^[a-f0-9]{40}$/);
  const current=await history(featureCommit);
  assert.equal(git(['rev-parse','HEAD']).toString().trim(),liveCommit,'Exact live source head');
  git(['merge-base','--is-ancestor',historicalLiveCommit,liveCommit]);
  for(const path of paths)assert.deepEqual(committed(liveCommit,path),committed(historicalLiveCommit,path),`${path}: historical 9f teaching/source bytes preserved at current admission`);
  const live=await boundLiveAtlasHistory(liveCommit);
  const catalogPath='public/models/bodyparts3d/full-body/catalog.json';
  const catalog=current.bodyDisplayCatalog(JSON.parse(committed(featureCommit,catalogPath).toString()));
  assert.deepEqual(catalog,previous.bodyDisplayCatalog(JSON.parse(committed(atlasBaseline,catalogPath).toString())));
  assert.deepEqual(imported.bodyDisplayCatalog(json('atlas-review/'+catalogPath)),catalog);
  assert.deepEqual(json('atlas-review/'+pinsPath),JSON.parse(committed(atlasBaseline,pinsPath).toString()));
  assert.deepEqual(committed(featureCommit,pinsPath),committed(atlasBaseline,pinsPath),'Source pin bytes unchanged at admission');
  assert.equal(norm(readFileSync(atlas+'/'+pinsPath)),norm(committed(atlasBaseline,pinsPath)),'Current source pins unchanged');
  assert.deepEqual(current.regionalTours,previous.regionalTours);
  assert.deepEqual(current.structures,previous.structures);
  assert.deepEqual(current.dissectionProfiles,previous.dissectionProfiles);
  assert.deepEqual(current.contentTabs,previous.contentTabs);
  assert.deepEqual(imported.regionalTours,live.regionalTours);
  assert.deepEqual(imported.structures,live.structures);
  assert.deepEqual(imported.dissectionProfiles,live.dissectionProfiles);
  for(const path of ['app/anatomy-data.ts','app/dissection-data.ts','lib/regional-tours.ts']){
    const original=committed(atlasBaseline,path);
    assert.deepEqual(committed(featureCommit,path),original,`${path}: admission guide/source bytes unchanged`);
    assert.equal(norm(readFileSync(`${atlas}/${path}`)),norm(committed(liveCommit,path)),`${path}: current guide/source matches its committed epoch`);
  }
  for(const bundle of catalog.bundles){
    const path='public'+bundle.url.split('?')[0];
    const baselineBytes=committed(atlasBaseline,path),featureBytes=committed(featureCommit,path);
    assert.equal(sha(featureBytes),bundle.sha256,path);
    assert.deepEqual(featureBytes,baselineBytes,`${path}: admission source geometry unchanged`);
    assert.deepEqual(readFileSync(`${atlas}/${path}`),baselineBytes,`${path}: current source geometry unchanged`);
  }
  assert.equal(catalog.structures.length,1104);assert.equal(current.contentTabs.length,9);
  const selected=new Set(entries().map(({identity}:any)=>identity.id));
  for(const id of selected){
    const structure=catalog.structures.find((item:any)=>item.id===id);assert(structure);
    for(const tab of current.contentTabs)
      assert.deepEqual(imported.bodyLesson(structure,tab),live.bodyLesson(structure,tab),`${id}:${tab}: live imported`);
    const livePacket=wire(await live.bodyReviewMaterial(id));
    assert.deepEqual(wire(await imported.bodyReviewMaterial(id)),livePacket);
    assert.deepEqual(await imported.parseBodyReviewResponse(livePacket,id),livePacket,`${id}: live packet`);
    const liveContext=await imported.bodyReviewContext(id);
    assert.deepEqual(liveContext,await live.bodyReviewContext(id),`${id}: exact live Review context`);
    const forgedLivePacket=wire(livePacket);forgedLivePacket.topics.find((row:any)=>row.tab==='xray').body+=' forged';
    assert.equal(await imported.parseBodyReviewResponse(forgedLivePacket,id),null,`${id}: forged live material refused`);
    const liveDecision={catalogScope:liveContext.catalogScope,structureId:id,track:'teaching',expectedVersion:0,
      materialHash:liveContext.materialHash,revisionHash:liveContext.revisions.teaching,checklistVersion:liveContext.checklistVersion,
      draft:imported.blankBodyReview(liveContext,'teaching')};
    const saveLive=(input:any)=>imported.postBodyDecision(new Request('https://review.test/api/body-decisions',{
      method:'POST',headers:{origin:'https://review.test','content-type':'application/json',
        'oai-authenticated-user-id':'synthetic-live-xray-reviewer'},body:JSON.stringify(input),
    }),{prepare(){throw Error('Rejected live request reached private storage');}});
    assert.equal((await saveLive({...liveDecision,materialHash:'0'.repeat(64)})).status,409,`${id}: stale live material before storage`);
    assert.equal((await saveLive({...liveDecision,revisionHash:'0'.repeat(64)})).status,409,`${id}: stale live revision before storage`);
    const forgedLiveDecision=wire(liveDecision);forgedLiveDecision.draft.checks.foreign=true;
    assert.equal((await saveLive(forgedLiveDecision)).status,422,`${id}: forged live decision before storage`);
    const liveApproval=wire(liveDecision);liveApproval.draft.status='approved';
    assert.equal((await saveLive(liveApproval)).status,422,`${id}: unreviewed live approval before storage`);
  }
  let placements=0,changed=0,packets=0,changedPackets=0,storageCalls=0;
  const storage={prepare(){storageCalls++;throw Error('Rejected request reached private storage');}};
  for(const structure of catalog.structures){
    const target=selected.has(structure.id);
    for(const tab of current.contentTabs){
      const before=previous.bodyLesson(structure,tab),after=current.bodyLesson(structure,tab);placements++;
      if(!target||tab!=='xray'){assert.deepEqual(after,before,`${structure.id}:${tab}`);continue;}
      changed++;assert.equal(before.readiness,'pending');assert.equal(after.readiness,'draft');
      assert.deepEqual(after,imported.pancreaticArterialXrayLesson(structure,tab));
    }
    const before=wire(await previous.bodyReviewMaterial(structure.id));
    const after=wire(await current.bodyReviewMaterial(structure.id));packets++;
    assert.equal(after.approval,false);assert.equal(after.status,'worksheet-not-submitted');
    if(!target){assert.deepEqual(after,before,`${structure.id}: preserved packet`);continue;}
    changedPackets++;
    for(const key of ['source','reasoning','guidedTours','checklist','atlasLink','limits'])assert.deepEqual(after[key],before[key]);
    assert.deepEqual(after.topics.filter((row:any)=>row.tab!=='xray'),before.topics.filter((row:any)=>row.tab!=='xray'));
    assert.deepEqual(after.topics.find((row:any)=>row.tab==='xray'),{tab:'xray',...current.bodyLesson(structure,'xray')});
    assert.equal(after.fingerprints.source,before.fingerprints.source);
    assert.notEqual(after.fingerprints.teaching,before.fingerprints.teaching);
    assert.notEqual(after.materialHash,before.materialHash);
    assert.deepEqual(await current.parseBodyReviewResponse(after,structure.id),after);
    assert.equal(await current.parseBodyReviewResponse(before,structure.id),null);
    const context=await current.bodyReviewContext(structure.id),oldContext=await previous.bodyReviewContext(structure.id);
    assert.equal(context.sourceHash,oldContext.sourceHash);
    assert.notEqual(context.revisions.teaching,oldContext.revisions.teaching);
    assert.equal(context.revisions.imaging,null);assert(context.teachingTabs.includes('xray'));
    assert.equal(current.bodyReviewStale({catalogScope:context.catalogScope,structureId:structure.id,
      checklistVersion:context.checklistVersion,revisionHash:oldContext.revisions.teaching,track:'teaching'},context),true);
    for(const mutate of [
      (bad:any)=>{bad.topics.find((row:any)=>row.tab==='xray').body+=' forged';},
      (bad:any)=>{bad.topics.find((row:any)=>row.tab==='xray').bullets[0]+=' forged';},
      (bad:any)=>{bad.topics.find((row:any)=>row.tab==='xray').citations[0]='https://forged.example';},
      (bad:any)=>{bad.topics.find((row:any)=>row.tab==='xray').readiness='approved';},
      (bad:any)=>{bad.topics.splice(bad.topics.findIndex((row:any)=>row.tab==='xray'),1);},
      (bad:any)=>{bad.source.structure.sources[0].sha256='0'.repeat(64);},
    ]){const forged=wire(after);mutate(forged);assert.equal(await current.parseBodyReviewResponse(forged,structure.id),null);}
    const decision={catalogScope:context.catalogScope,structureId:structure.id,track:'teaching',expectedVersion:0,
      materialHash:context.materialHash,revisionHash:context.revisions.teaching,checklistVersion:context.checklistVersion,
      draft:current.blankBodyReview(context,'teaching')};
    const save=(input:any)=>current.postBodyDecision(new Request('https://review.test/api/body-decisions',{
      method:'POST',headers:{origin:'https://review.test','content-type':'application/json',
        'oai-authenticated-user-id':'synthetic-pancreatic-arterial-reviewer'},body:JSON.stringify(input),
    }),storage);
    for(const patch of [{materialHash:before.materialHash},{revisionHash:oldContext.revisions.teaching},
      {materialHash:before.materialHash,revisionHash:oldContext.revisions.teaching}])
      assert.equal((await save({...decision,...patch})).status,409,`${structure.id}: stale before storage`);
    const forged=wire(decision);forged.draft.checks.foreign=true;
    assert.equal((await save(forged)).status,422,`${structure.id}: malformed before storage`);
    const approval=wire(decision);approval.draft.status='approved';
    assert.equal((await save(approval)).status,422,`${structure.id}: unreviewed approval before storage`);
  }
  assert.deepEqual({placements,changed,packets,changedPackets,storageCalls},
    {placements:9936,changed:9,packets:1104,changedPackets:9,storageCalls:0});
  assert.equal(placements-changed,9927);assert.equal(packets-changedPackets,1095);
});
