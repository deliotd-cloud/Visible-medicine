import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync,readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import test from 'node:test';
import {build} from 'esbuild';
import {emittedTeaching} from './atlas-emitted-teaching.ts';

// Immutable Atlas source before this five-topic import; its dispatcher has no new X-ray binding.
const atlasBaseline='c6fd5a1789ce8c6f06c48693aa9d5479a00d610a';
const completedEpoch='7f220ed46578d33731a21e77c3133895c21f1e7a';
const atlas='F:/VisibleMedicine/atlas';
const pinPaths=['content/cardiac-venous-tour-pins.json',
  'content/central-vessel-imaging-pins.json','content/internal-thoracic-imaging-pins.json'];
const teachingPaths=['content/thoracic-venous-xray.ts','lib/thoracic-venous-xray.ts'];
const paths=[...pinPaths,...teachingPaths];
const groups={
  'anterior-cardiac-vein':['FMA76767','unspecified'],
  'great-cardiac-vein':['FMA4707','unspecified'],
  'middle-cardiac-vein':['FMA4713','unspecified'],
  'hemiazygos-vein':['FMA4944','midline'],
  'right-internal-thoracic-vein':['FMA4758','right'],
} as const;
const targetEntries=()=>pinPaths.flatMap(path=>json('atlas-review/'+path).entries)
  .map((entry:any)=>({identity:entry.identity??entry,
    group:(entry.identity??entry).id.split(':').at(-1)}))
  .filter((entry:{group:string})=>Object.hasOwn(groups,entry.group));
const sha=(bytes:Uint8Array|string)=>createHash('sha256').update(bytes).digest('hex');
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));
const norm=(bytes:Uint8Array)=>Buffer.from(bytes).toString('utf8').replaceAll('\r\n','\n');
const visible=(code:string,value:string)=>code.includes(value)||code.includes(JSON.stringify(value).slice(1,-1));
const committed=(cwd:string,revision:string,path:string)=>execFileSync('git',['show',`${revision}:${path}`],
  {cwd,windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});

async function closure(previous:boolean|'completed'=false){
  if(previous){
    const history=await import(pathToFileURL(atlas+'/scripts/exact-source-history-api.mjs').href);
    return history.exactSourceHistoryApi(previous===true?atlasBaseline:completedEpoch,'review-security');
  }
  const built=await build({stdin:{contents:[
    "export {bodyLesson} from './atlas-review/app/body-content';",
    "export {thoracicVenousXrayLesson} from './atlas-review/lib/thoracic-venous-xray';",
    "export {thoracicVenousXrayTopics} from './atlas-review/content/thoracic-venous-xray';",
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

test('five exact source-bound thoracic venous X-ray drafts reach learner and Review',async()=>{
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
  // Thorax/Whole body use the shared head-neck delivery namespace. The other
  // three independent workbenches share the commit, not its teaching closure.
  const bodyLearner=learners.find(item=>item.name==='head-neck');
  assert(bodyLearner);
  const inputs=json(bodyLearner.base+'source-inputs.json');
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
      `${bodyLearner.name} ${path}: learner source input`);
  }
  for(const path of teachingPaths)for(const base of ['public/atlas-review/',
    ...learners.map(item=>item.base),viewerBase])assert.equal(existsSync(base+path),false,`${base+path}: raw source public`);
  const api=await closure();
  assert.deepEqual(Object.keys(api.thoracicVenousXrayTopics).sort(),Object.keys(groups).sort());
  const entries=targetEntries();
  assert.equal(entries.length,5);
  assert.deepEqual(entries.map((entry:{group:string;identity:{fmaId:string;laterality:string}})=>
    [entry.group,entry.identity.fmaId,entry.identity.laterality]).sort(),
    Object.entries(groups).map(([group,[fma,laterality]])=>[group,fma,laterality]).sort());
  assert.equal(new Set(entries.map((entry:{identity:{id:string}})=>entry.identity.id)).size,5);
  const catalog=api.bodyDisplayCatalog(json('atlas-review/public/models/bodyparts3d/full-body/catalog.json'));
  const scope=bodyLearner.manifest.regionalScopes.find((item:{region:string})=>item.region==='thorax');
  assert(scope);
  const emitted=[emittedTeaching(bodyLearner.base,bodyLearner.manifest.files,true),
    emittedTeaching(viewerBase,viewer.files,true)];
  for(const {group,identity} of entries){
    const id=identity.id,topic=api.thoracicVenousXrayTopics[group];
    assert.deepEqual(catalog.structures.find((item:{id:string})=>item.id===id),identity);
    assert(scope.regionalIds.includes(id),`${id}: learner thorax scope`);
    assert.equal(identity.region,'thorax');
    assert.equal(identity.system,'vessels');
    assert.equal(identity.category,'vessel');
    assert.equal(identity.laterality,groups[group as keyof typeof groups][1]);
    assert.equal(identity.id,`vm:anatomy:body:thorax:${identity.laterality}:vessel:${group}`);
    assert.equal(identity.nodeName,identity.fmaId);
    assert.equal(identity.validation.anatomicalReview,false);
    const lesson=api.thoracicVenousXrayLesson(identity,'xray');
    assert.deepEqual(api.bodyLesson(identity,'xray'),lesson);
    assert.equal(lesson.readiness,'draft');
    assert.equal(lesson.title,`${identity.name} · ${topic.title} · draft`);
    assert.equal(lesson.body,topic.body);
    const packet=await api.bodyReviewMaterial(identity.id);
    assert.deepEqual(packet.topics.find((row:{tab:string})=>row.tab==='xray'),{tab:'xray',...lesson});
    assert.deepEqual(await api.parseBodyReviewResponse(packet,identity.id),packet);
    assert.deepEqual(lesson.bullets.slice(0,topic.bullets.length),[...topic.bullets]);

    assert.deepEqual(lesson.citations,[...new Set([...topic.citations,
      'https://www.radiologyinfo.org/en/info/venography'])]);
    assert(lesson.citations.length>0,`${id}: supporting references required`);
    for(const citation of lesson.citations)assert.match(citation,/^https:\/\//);
    const prose=[lesson.body,...lesson.bullets,lesson.note].join(' ');
    assert.match(prose,/plain[^.]*radiograph|plain[^.]*radiography|routine[^.]*chest radiograph/i);
    assert.match(prose,/contrast|venous phase|venography/i);
    assert.match(prose,/registration/i);
    assert.match(lesson.note,/revision-bound radiologist review pending/);
    assert.match(lesson.note,/clinical approval/i);
    assert.match(lesson.note,/independent/i);
    for(const code of emitted)for(const value of [topic.body,...topic.bullets,...lesson.citations,
      ...lesson.bullets,lesson.note])assert(visible(code,value),`${id}: emitted teaching missing ${value}`);
    for(const tab of api.contentTabs.filter((tab:string)=>tab!=='xray'))
      assert.equal(api.thoracicVenousXrayLesson(identity,tab),undefined,`${id}: ${tab}`);
    for(const change of [{id:id+'-forged'},{name:'Forged'},{fmaId:'FMA0'},
      {laterality:identity.laterality==='right'?'left':'right'},{sources:[{file:'FJ0',sha256:'0'.repeat(64)}]},
      {bounds:{...identity.bounds,min:[0,0,0]}},{coverageNote:'forged'}])
      assert.equal(api.thoracicVenousXrayLesson({...identity,...change},'xray'),undefined,
        `${id}: changed source identity ${Object.keys(change)[0]}`);
  }
  const allProse=entries.map(({identity})=>{
    const lesson=api.bodyLesson(identity,'xray');
    return [lesson.body,...lesson.bullets,lesson.note].join(' ');
  }).join(' ');
  assert.match(allProse,/venous phase|venous-phase|contrast[^.]*phase/i);
  assert.match(allProse,/disease|patholog|abnormal|selected[^.]*patient|case report/i);
  assert.match(allProse,/normal[^.]*visib|visib[^.]*normal/i);
  const anterior=entries.find(({group})=>group==='anterior-cardiac-vein');
  assert(anterior);
  const anteriorLesson=api.bodyLesson(anterior.identity,'xray');
  const anteriorProse=[anteriorLesson.body,...anteriorLesson.bullets,anteriorLesson.note].join(' ');
  assert.match(anteriorProse,/group/i);
  assert.match(anteriorProse,/count|number|individual/i);

});

test('completed venous transition preserves 9,936 placements and 1,104 Review packets except five X-ray drafts',async()=>{
  // Later Ultrasound teaching on the same veins is not an X-ray regression.
  // Current source, emitted lessons and full live packet parsing are checked above.
  const current={...await closure('completed'),
    thoracicVenousXrayLesson:(await closure()).thoracicVenousXrayLesson};
  const previous=await closure(true);
  const catalog=current.bodyDisplayCatalog(json('atlas-review/public/models/bodyparts3d/full-body/catalog.json'));
  const priorCatalog=previous.bodyDisplayCatalog(JSON.parse(committed(atlas,atlasBaseline,
    'public/models/bodyparts3d/full-body/catalog.json').toString()));
  assert.deepEqual(catalog,priorCatalog,'display source, bundles and catalog remain exact');
  assert.equal(catalog.structures.length,1104);
  assert.equal(current.contentTabs.length,9);
  const entries=targetEntries();
  const targets=new Map(entries.map((entry:{identity:{id:string}})=>[entry.identity.id,entry]));
  for(const path of pinPaths)assert.deepEqual(json('atlas-review/'+path),
    JSON.parse(committed(atlas,atlasBaseline,path).toString()),`${path}: pins unchanged`);
  const pendingMusculophrenic=catalog.structures.filter((item:{id:string})=>
    item.id.endsWith('musculophrenic-vein'));
  assert.equal(pendingMusculophrenic.length,2);
  for(const structure of pendingMusculophrenic)
    assert.equal(current.bodyLesson(structure,'xray').readiness,'pending',structure.id);
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
      assert.deepEqual(after,current.thoracicVenousXrayLesson(structure,tab));
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
          'oai-authenticated-user-id':'synthetic-thoracic-venous-reviewer'},
        body:JSON.stringify({catalogScope:context.catalogScope,structureId:structure.id,
          track:'teaching',expectedVersion:0,materialHash:context.materialHash,
          revisionHash:context.revisions.teaching,checklistVersion:context.checklistVersion,
          draft:current.blankBodyReview(context,'teaching'),...patch}),
      }),storage);
      assert.equal(response.status,409,`${structure.id}: stale decision rejected before storage`);
    }
    const forgedApproval={...current.blankBodyReview(context,'teaching'),status:'approved'};
    const refused=await current.postBodyDecision(new Request('https://review.test/api/body-decisions',{
      method:'POST',headers:{origin:'https://review.test','content-type':'application/json',
        'oai-authenticated-user-id':'synthetic-thoracic-venous-reviewer'},
      body:JSON.stringify({catalogScope:context.catalogScope,structureId:structure.id,
        track:'teaching',expectedVersion:0,materialHash:context.materialHash,
        revisionHash:context.revisions.teaching,checklistVersion:context.checklistVersion,
        draft:forgedApproval}),
    }),storage);
    assert.equal(refused.status,422,`${structure.id}: unreviewed approval refused before storage`);
  }
  assert.deepEqual({placements,changed,packets},{placements:9936,changed:5,packets:1104});
});


