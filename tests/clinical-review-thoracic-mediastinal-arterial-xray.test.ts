import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync,readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import test from 'node:test';
import {build} from 'esbuild';
import {emittedTeaching} from './atlas-emitted-teaching.ts';

// Immutable Atlas source before this five-topic import; its dispatcher has no new X-ray binding.
const atlasBaseline='792d6623eeb2bd7ae7ee2bea37c8bd1c9afa6351';
const atlas='F:/VisibleMedicine/atlas';
const paths=['content/thoracic-branch-imaging-pins.json',
  'content/thoracic-mediastinal-arterial-xray.ts',
  'lib/thoracic-mediastinal-arterial-xray.ts'];
const groups={
  'brachiocephalic-artery':'FMA3932',
  'bronchial-artery':'FMA68109',
  'variant-bronchial-artery':'FMA10704',
  'esophageal-artery':'FMA4149',
  'esophageal-branches':'FMA71537',
} as const;
const sha=(bytes:Uint8Array|string)=>createHash('sha256').update(bytes).digest('hex');
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));
const norm=(bytes:Uint8Array)=>Buffer.from(bytes).toString('utf8').replaceAll('\r\n','\n');
const visible=(code:string,value:string)=>code.includes(value)||code.includes(JSON.stringify(value).slice(1,-1));
const committed=(cwd:string,revision:string,path:string)=>execFileSync('git',['show',`${revision}:${path}`],
  {cwd,windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});

async function closure(previous=false){
  if(previous){
    const history=await import(pathToFileURL(atlas+'/scripts/exact-source-history-api.mjs').href);
    return history.exactSourceHistoryApi(atlasBaseline,'review-security');
  }
  const built=await build({stdin:{contents:[
    "export {bodyLesson} from './atlas-review/app/body-content';",
    "export {thoracicMediastinalArterialXrayLesson} from './atlas-review/lib/thoracic-mediastinal-arterial-xray';",
    "export {thoracicMediastinalArterialXrayTopics} from './atlas-review/content/thoracic-mediastinal-arterial-xray';",
    "export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';",
    "export {contentTabs} from './atlas-review/lib/content-types';",
    "export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';",
    "export {bodyReviewContext} from './atlas-review/lib/body-review-context';",
    "export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';",
    "export {postBodyDecision} from './atlas-review/lib/body-review-api';",
    "export {blankBodyReview,bodyReviewStale} from './atlas-review/lib/body-review-decisions';",
  ].join('\n'),resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,
    platform:'node',format:'esm'});
  return import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
}

test('five exact source-bound thoracic mediastinal X-ray drafts reach learner and Review',async()=>{
  const review=json('atlas-review/manifest.json');
  const importedRevision=review.revision;
  assert.match(importedRevision,/^[a-f0-9]{40}$/);
  assert.notEqual(importedRevision,atlasBaseline,'the five new topics require a new source commit');
  assert.equal(execFileSync('git',['rev-parse','HEAD'],{cwd:atlas,windowsHide:true}).toString().trim(),importedRevision);
  const bases=['head-neck','female-pelvis','lower-limb','shoulder'];
  const learners=bases.map(name=>({name,base:`public/atlas-runtime/${name}/`,
    manifest:json(`public/atlas-runtime/${name}/manifest.json`)}));
  for(const {name,manifest} of learners){
    assert.equal(manifest.sourceCommit,importedRevision,name);
    assert.equal(manifest.patientDataIncluded,false,name);
    assert.equal(manifest.clinicalApproved,false,name);
  }
  const viewerBase='public/atlas-review-viewer/';
  const viewer=json(viewerBase+'manifest.json');
  assert.equal(viewer.sourceCommit,importedRevision);
  assert.equal(viewer.websiteIntegrationSha256,review.websiteIntegrationSha256);
  assert.equal(viewer.personalRecordsIncluded,false);
  const inputs=json(learners[0].base+'source-inputs.json');
  for(const path of paths){
    const source=committed(atlas,importedRevision,path);
    const record=review.files.find((file:{path:string})=>file.path===path);
    assert(record,`Review missing ${path}`);
    assert.equal(record.sourceSha256,sha(source),path);
    const imported=readFileSync('atlas-review/'+path);
    assert.equal(record.importedSha256,sha(imported),path);
    assert.equal(norm(imported),norm(source),`${path}: imported source`);
    assert.equal(norm(readFileSync(`${atlas}/${path}`)),norm(source),`${path}: Atlas checkout`);
    assert.equal(inputs.find((file:{path:string})=>file.path===path)?.sha256,sha(source),
      `${path}: learner source input`);
  }
  for(const path of paths.slice(1))for(const base of ['public/atlas-review/',
    learners[0].base,viewerBase])assert.equal(existsSync(base+path),false,`${base+path}: raw source public`);
  const api=await closure();
  assert.deepEqual(Object.keys(api.thoracicMediastinalArterialXrayTopics).sort(),Object.keys(groups).sort());
  const pins=json('atlas-review/'+paths[0]);
  const entries=pins.entries.filter((entry:{group:string})=>Object.hasOwn(groups,entry.group));
  assert.equal(entries.length,5);
  assert.deepEqual(entries.map((entry:{group:string;identity:{fmaId:string}})=>
    [entry.group,entry.identity.fmaId]).sort(),Object.entries(groups).sort());
  assert.equal(new Set(entries.map((entry:{identity:{id:string}})=>entry.identity.id)).size,5);
  const catalog=api.bodyDisplayCatalog(json('atlas-review/public/models/bodyparts3d/full-body/catalog.json'));
  const scope=learners[0].manifest.regionalScopes.find((item:{region:string})=>item.region==='thorax');
  assert(scope);
  const emitted=[emittedTeaching(learners[0].base,learners[0].manifest.files,true),
    emittedTeaching(viewerBase,viewer.files,true)];
  for(const {group,identity,anatomy} of entries){
    const id=identity.id,topic=api.thoracicMediastinalArterialXrayTopics[group];
    assert.deepEqual(catalog.structures.find((item:{id:string})=>item.id===id),identity);
    assert(scope.regionalIds.includes(id),`${id}: learner thorax scope`);
    assert.equal(identity.region,'thorax');
    assert.equal(identity.system,'vessels');
    assert.equal(identity.category,'vessel');
    assert.equal(identity.laterality,'midline');
    assert.equal(identity.nodeName,identity.fmaId);
    assert.equal(identity.validation.anatomicalReview,false);
    const lesson=api.thoracicMediastinalArterialXrayLesson(identity,'xray');
    assert.deepEqual(api.bodyLesson(identity,'xray'),lesson);
    assert.equal(lesson.readiness,'draft');
    assert.equal(lesson.title,`${identity.name} · ${topic.title} · draft`);
    assert.equal(lesson.body,topic.body);
    assert.deepEqual(lesson.bullets.slice(0,topic.bullets.length),[...topic.bullets]);
    const limitation=anatomy.bullets?.find((line:string)=>!line.startsWith('Source identity:'));
    if(limitation)assert(lesson.bullets.includes(limitation));
    assert.deepEqual(lesson.citations,[...new Set(topic.citations)]);
    assert(lesson.citations.includes('https://www.radiologyinfo.org/en/info/angiocath'));
    assert(lesson.bullets.some((line:string)=>/Plain chest radiography does not trace/.test(line)));
    assert(lesson.bullets.some((line:string)=>/Midline is the retained source classification/.test(line)));
    assert(lesson.bullets.some((line:string)=>/do not establish continuous branches, blood flow/.test(line)));
    assert.match(lesson.note,/revision-bound radiologist review pending/);
    assert.match(lesson.note,/No acquired angiogram, publisher image, patient scan, procedural route, clinical approval or patient-space registration/);
    assert.match(lesson.note,/Atlas, Education case and paid-lecture access remain independent/);
    for(const code of emitted)for(const value of [topic.body,...topic.bullets,...topic.citations,
      ...lesson.bullets,lesson.note])assert(visible(code,value),`${id}: emitted teaching missing ${value}`);
    for(const tab of api.contentTabs.filter((tab:string)=>tab!=='xray'))
      assert.equal(api.thoracicMediastinalArterialXrayLesson(identity,tab),undefined,`${id}: ${tab}`);
    for(const change of [{id:id+'-forged'},{name:'Forged'},{fmaId:'FMA0'},
      {laterality:'right'},{sources:[{file:'FJ0',sha256:'0'.repeat(64)}]},
      {bounds:{...identity.bounds,min:[0,0,0]}},{coverageNote:'forged'}])
      assert.equal(api.thoracicMediastinalArterialXrayLesson({...identity,...change},'xray'),undefined,
        `${id}: changed source identity ${Object.keys(change)[0]}`);
  }
  const variant=entries.find((entry:{group:string})=>entry.group==='variant-bronchial-artery');
  assert(variant);
  assert.match(variant.anatomy.body,/FMA14177/);
  assert.match(api.bodyLesson(variant.identity,'xray').body,/FMA14177/);
  assert(!entries.some((entry:{identity:{fmaId:string}})=>entry.identity.fmaId==='FMA14177'));
  const branches=entries.find((entry:{group:string})=>entry.group==='esophageal-branches');
  assert(branches);
  assert.match(branches.anatomy.note,/Grouped branches retain one source identity/);
  assert.match(api.bodyLesson(branches.identity,'xray').body,/grouped source identity/);
});

test('completed arterial import preserves its exact 9,936-placement and 1,104-packet transition',async()=>{
  // Freeze the completed five-artery epoch. The live import/emission test above
  // still checks these lessons; the venous regression checks the next full delta.
  const history=await import(pathToFileURL(atlas+'/scripts/exact-source-history-api.mjs').href);
  const completed=await history.exactSourceHistoryApi('c6fd5a1789ce8c6f06c48693aa9d5479a00d610a','review-security');
  const live=await closure(),previous=await closure(true);
  const current={...completed,thoracicMediastinalArterialXrayLesson:live.thoracicMediastinalArterialXrayLesson};
  const catalog=current.bodyDisplayCatalog(json('atlas-review/public/models/bodyparts3d/full-body/catalog.json'));
  const priorCatalog=previous.bodyDisplayCatalog(JSON.parse(committed(atlas,atlasBaseline,
    'public/models/bodyparts3d/full-body/catalog.json').toString()));
  assert.deepEqual(catalog,priorCatalog,'display source, bundles and catalog remain exact');
  assert.equal(catalog.structures.length,1104);
  assert.equal(current.contentTabs.length,9);
  const entries=json('atlas-review/content/thoracic-branch-imaging-pins.json').entries
    .filter((entry:{group:string})=>Object.hasOwn(groups,entry.group));
  const targets=new Map(entries.map((entry:{identity:{id:string}})=>[entry.identity.id,entry]));
  let placements=0,changed=0,packets=0;
  const storage=new Proxy({},{get(){throw Error('Rejected request reached private storage');}});
  for(const structure of catalog.structures){
    const target=targets.get(structure.id);
    for(const tab of current.contentTabs){
      const before=previous.bodyLesson(structure,tab),after=current.bodyLesson(structure,tab);
      placements++;
      if(!target||tab!=='xray'){assert.deepEqual(after,before,`${structure.id}|${tab}`);continue;}
      changed++;
      assert.equal(before.readiness,'pending',`${structure.id}: old X-ray pending`);
      assert.equal(after.readiness,'draft',`${structure.id}: new X-ray draft`);
      assert.deepEqual(after,current.thoracicMediastinalArterialXrayLesson(structure,tab));
    }
    const before=wire(await previous.bodyReviewMaterial(structure.id));
    const after=wire(await current.bodyReviewMaterial(structure.id));
    assert(before&&after,structure.id);
    packets++;
    assert.equal(after.approval,false);
    assert.equal(after.status,'worksheet-not-submitted');
    if(!target){assert.deepEqual(after,before,`${structure.id}: unrelated packet`);continue;}
    assert.deepEqual(after.source,before.source);
    assert.deepEqual(after.reasoning,before.reasoning);
    assert.deepEqual(after.guidedTours,before.guidedTours);
    assert.deepEqual(after.checklist,before.checklist);
    assert.deepEqual(after.atlasLink,before.atlasLink);
    assert.deepEqual(after.topics.filter((topic:{tab:string})=>topic.tab!=='xray'),
      before.topics.filter((topic:{tab:string})=>topic.tab!=='xray'));
    assert.equal(after.fingerprints.source,before.fingerprints.source);
    assert.notEqual(after.fingerprints.teaching,before.fingerprints.teaching);
    assert.deepEqual(await current.parseBodyReviewResponse(after,structure.id),after);
    const context=await current.bodyReviewContext(structure.id);
    const oldContext=await previous.bodyReviewContext(structure.id);
    assert(context&&oldContext);
    assert.equal(context.sourceHash,oldContext.sourceHash);
    assert.notEqual(context.teachingHash,oldContext.teachingHash);
    assert.notEqual(context.revisions.teaching,oldContext.revisions.teaching);
    assert.equal(context.revisions.imaging,null);
    assert(context.teachingTabs.includes('xray'));
    assert.equal(current.bodyReviewStale({catalogScope:context.catalogScope,structureId:structure.id,
      checklistVersion:context.checklistVersion,revisionHash:oldContext.revisions.teaching,
      track:'teaching'},context),true,`${structure.id}: previous teaching decision stale`);
    for(const mutate of [
      (bad:any)=>{bad.topics.find((topic:any)=>topic.tab==='xray').body+=' forged';},
      (bad:any)=>{bad.topics.find((topic:any)=>topic.tab==='xray').citations[0]='https://forged.example';},
      (bad:any)=>{bad.source.structure.sources[0].sha256='0'.repeat(64);},
    ]){const forged=wire(after);mutate(forged);
      assert.equal(await current.parseBodyReviewResponse(forged,structure.id),null,
        `${structure.id}: forged packet rejected`);}
    for(const patch of [{materialHash:before.materialHash},
      {revisionHash:oldContext.revisions.teaching}]){
      const response=await current.postBodyDecision(new Request('https://review.test/api/body-decisions',{
        method:'POST',headers:{origin:'https://review.test','content-type':'application/json',
          'oai-authenticated-user-id':'synthetic-mediastinal-reviewer'},
        body:JSON.stringify({catalogScope:context.catalogScope,structureId:structure.id,
          track:'teaching',expectedVersion:0,materialHash:context.materialHash,
          revisionHash:context.revisions.teaching,checklistVersion:context.checklistVersion,
          draft:current.blankBodyReview(context,'teaching'),...patch}),
      }),storage);
      assert.equal(response.status,409,`${structure.id}: stale decision rejected before storage`);
    }
  }
  assert.deepEqual({placements,changed,packets},{placements:9936,changed:5,packets:1104});
});
