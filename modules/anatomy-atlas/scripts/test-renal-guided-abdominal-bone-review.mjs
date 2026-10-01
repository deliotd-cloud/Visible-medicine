import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {dirname} from 'node:path';
import {build} from './workspace-test-build.mjs';

const baseline='adad1abe1ad6fdb3c942d1d8b6a98393591bec80';
const oldFile=path=>execFileSync('git',['show',`${baseline}:${path}`],{encoding:'utf8',maxBuffer:32e6});
const contents="export * from './lib/specimen-review-material'; export * from './lib/specimen-review'; export * from './lib/specimen-review-api'; export * from './lib/hra-renal'; export * from './lib/hra-renal-guided-dissection'; export * from './lib/abdominal-wall';";
async function load(previous=false){
  const result=await build({stdin:{contents,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm',
    plugins:previous?[{name:'exact-before-renal-bones',setup(api){
      for(const path of ['lib/specimen-review-material.ts','lib/abdominal-wall-teaching.ts'])
        api.onLoad({filter:new RegExp(path.replaceAll('/','[\\\\/]')+'$')},args=>({contents:oldFile(path),loader:'ts',resolveDir:dirname(args.path)}));
      api.onLoad({filter:/[\\/]content[\\/]body-renderer-revision\.json$/},()=>({contents:oldFile('content/body-renderer-revision.json'),loader:'json'}));
    }}]:[]});
  return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
}
const current=await load(),previous=await load(true);
const guide=current.hraRenalGuidedDissection(current.hraRenalDefinition);
const renalIds=new Set(guide.steps.flatMap(step=>step.ids));
const boneIds=new Set(current.abdominalWallDefinition.surfaces.filter(s=>s.tissue==='skeleton').map(s=>s.id));
assert.equal(guide.steps.length,8);assert.equal(renalIds.size,82);assert.equal(boneIds.size,21);
const storage=new Proxy({},{get(){throw Error('Stale packet reached storage');}});
let contexts=0,renal=0,bones=0,unchanged=0,rejected=0;
for(const row of current.specimenReviewRows)for(const surface of row.surfaces){
  const before=await previous.specimenReviewMaterial(row.key,surface.id),after=await current.specimenReviewMaterial(row.key,surface.id);
  contexts++;
  assert.deepEqual(after.source,before.source);assert.equal(after.context.sourceHash,before.context.sourceHash);
  const isRenal=row.key===guide.specimenKey&&renalIds.has(surface.id);
  const isBone=row.key===current.abdominalWallDefinition.key&&boneIds.has(surface.id);
  if(!isRenal&&!isBone){
    unchanged++;assert.deepEqual(after.teaching,before.teaching);
    assert.equal(after.context.teachingHash,before.context.teachingHash);
    assert.equal(after.context.revisions.teaching,before.context.revisions.teaching);
    assert.deepEqual(after.context.checklists.teaching,before.context.checklists.teaching);
    continue;
  }
  if(isRenal){
    renal++;assert.deepEqual(after.teaching.guidedDissection,guide);
    const withoutGuide=structuredClone(after.teaching);delete withoutGuide.guidedDissection;
    assert.deepEqual(withoutGuide,before.teaching,'All existing renal teaching retained');
    assert.equal(after.context.checklists.teaching.at(-1).id,'guided-dissection');
    assert.equal(after.context.sourceFrame,guide.sourceFrame);
  }else{
    bones++;assert.equal(before.teaching.lesson,null);assert(after.teaching.lesson);
    assert.deepEqual(after.teaching.guidedDissection,before.teaching.guidedDissection);
    assert(after.teaching.topics.every(t=>typeof t.body==='string'&&t.body.length>60));
    for(const topic of after.teaching.topics)for(const url of topic.references)
      assert(after.teaching.referenceTitles[url],'Skeletal reference caption missing');
    assert.deepEqual(before.context.teachingTabs,['guided-dissection']);
    assert.deepEqual(after.context.teachingTabs,['anatomy','function','clinical','pathology','ct','mri','xray','ultrasound','self-check','guided-dissection']);
  }
  assert.notEqual(after.context.teachingHash,before.context.teachingHash);
  assert.notEqual(after.context.revisions.teaching,before.context.revisions.teaching);
  assert.equal(after.context.revisions.imaging,null);assert(after.context.blockers.imaging.length);
  const draft=current.blankSpecimenReview(after.context,'teaching');
  assert.equal(draft.status,'draft');assert.equal(draft.attested,false);
  assert(Object.values(draft.checks).every(v=>v===false));
  const unchecked={...draft,reviewer:'Synthetic reviewer',qualification:'Synthetic qualification',scope:'Synthetic source only',attested:true,evidence:['https://example.test/review']};
  assert(current.specimenApprovalProblems(unchecked,after.context,'teaching').includes('Complete every checklist item.'));
  for(const patch of [{revisionHash:before.context.revisions.teaching},{materialHash:before.context.materialHash},{sourceFrame:'foreign-frame'}]){
    const payload={catalogScope:after.context.catalogScope,specimenKey:row.key,structureId:surface.id,sourceFrame:after.context.sourceFrame,
      materialHash:after.context.materialHash,revisionHash:after.context.revisions.teaching,checklistVersion:after.context.checklistVersion,
      track:'teaching',expectedVersion:0,draft,...patch};
    const response=await current.postSpecimenReview(new Request('https://atlas.test/api/review/specimens',{method:'POST',headers:{origin:'https://atlas.test','content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_RENAL_BONES'},body:JSON.stringify(payload)}),storage);
    assert.equal(response.status,409);rejected++;
  }
  const copy=structuredClone(after);copy.teaching.lesson&&(copy.teaching.lesson.anatomy='changed');
  copy.teaching.guidedDissection.steps[0].caption='changed';
  assert.deepEqual(await current.specimenReviewMaterial(row.key,surface.id),after);
}
assert.equal(contexts,356);assert.equal(renal,82);assert.equal(bones,21);assert.equal(unchanged,253);assert.equal(rejected,309);
const sha=b=>createHash('sha256').update(b).digest('hex');
for(const [scope,files]of [['hra-renal',['catalog.json','kidneys.glb','NOTICE.md']],['bodyparts3d-v3/abdominal-wall',['catalog.json','abdominal-wall.glb','NOTICE.md']]])for(const file of files){
  const path=`public/models/${scope}/${file}`,old=execFileSync('git',['show',baseline+':'+path],{maxBuffer:32e6});
  assert.equal(sha(await readFile(path)),sha(old),'Admitted asset changed: '+path);
}
console.log(JSON.stringify({contexts,unchangedSourceContexts:contexts,renalGuidedContexts:renal,newSkeletalLessons:bones,unchangedTeachingContexts:unchanged,rejectedStalePackets:rejected,modelsUnchanged:true,clinicalApproved:false}));
