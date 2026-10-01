import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname } from 'node:path';
import { build } from './workspace-test-build.mjs';

const baseline = 'a023f47064b2987c5593d9a7884c7e1937afe001';
const oldFile = path => execFileSync('git', ['show', `${baseline}:${path}`], {encoding:'utf8',maxBuffer:20e6});
const contents = "export * from './lib/specimen-review-material'; export * from './lib/specimen-review'; export * from './lib/specimen-review-api'; export * from './lib/specimen-review-client'; export * from './lib/abdominal-wall'; export * from './lib/back-layers'; export * from './lib/abdominal-guided-dissection'; export * from './lib/back-guided-dissection';";
async function load(previous = false) {
  const result = await build({stdin:{contents,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm',
    plugins: previous ? [{name:'exact-before-wall-back-guide',setup(api){
      api.onLoad({filter:/[\\/]lib[\\/]specimen-review-material\.ts$/},args=>({contents:oldFile('lib/specimen-review-material.ts'),loader:'ts',resolveDir:dirname(args.path)}));
      api.onLoad({filter:/[\\/]content[\\/]body-renderer-revision\.json$/},()=>({contents:oldFile('content/body-renderer-revision.json'),loader:'json'}));
    }}] : [],
  });
  return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
}
const current=await load(), previous=await load(true);
const guides=[current.abdominalGuidedDissection(current.abdominalWallDefinition),current.backGuidedDissection(current.backLayersDefinition)];
assert(guides.every(Boolean));
const byKey=new Map(guides.map(guide=>[guide.specimenKey,guide]));
const unreachableStorage=new Proxy({},{get(){throw Error('Stale request reached storage');}});
let contexts=0,changed=0,unchanged=0,rejected=0;
for(const group of current.specimenReviewRows)for(const row of group.surfaces){
  const before=await previous.specimenReviewMaterial(group.key,row.id),after=await current.specimenReviewMaterial(group.key,row.id);
  contexts++;
  assert.deepEqual(after.source,before.source,'Source, held anatomy and original study recipes remain exact');
  assert.equal(after.context.sourceHash,before.context.sourceHash);
  const guide=byKey.get(group.key),participates=guide?.steps.some(step=>step.ids.includes(row.id));
  if(!participates){
    unchanged++;
    assert.deepEqual(after.teaching,before.teaching,'Existing pelvic guide and all other teaching retained');
    assert.equal(after.context.teachingHash,before.context.teachingHash);
    assert.equal(after.context.revisions.teaching,before.context.revisions.teaching);
    assert.deepEqual(after.context.checklists.teaching,before.context.checklists.teaching);
    continue;
  }
  changed++;
  assert.deepEqual(after.teaching.guidedDissection,guide);
  const withoutGuide=structuredClone(after.teaching);delete withoutGuide.guidedDissection;
  assert.deepEqual(withoutGuide,before.teaching,'Original lessons, references and motor supply retained');
  assert.notEqual(after.context.teachingHash,before.context.teachingHash);
  assert.notEqual(after.context.revisions.teaching,before.context.revisions.teaching);
  assert.equal(after.context.sourceFrame,guide.sourceFrame);
  assert.deepEqual(after.context.teachingTabs,[...before.context.teachingTabs,'guided-dissection']);
  assert.equal(after.context.checklists.teaching.at(-1).id,'guided-dissection');
  assert.equal(after.context.revisions.imaging,null);
  const draft=current.blankSpecimenReview(after.context,'teaching');
  assert.equal(draft.status,'draft');assert.equal(draft.attested,false);assert.equal(draft.checks['guided-dissection'],false);
  const completeExceptGuide={...draft,reviewer:'Synthetic test',qualification:'Synthetic test',scope:'Synthetic scope only',evidence:['https://example.test/evidence'],attested:true,
    checks:Object.fromEntries(after.context.checklists.teaching.map(check=>[check.id,check.id!=='guided-dissection']))};
  assert(current.specimenApprovalProblems(completeExceptGuide,after.context,'teaching').includes('Complete every checklist item.'));
  for(const patch of [{revisionHash:before.context.revisions.teaching},{materialHash:before.context.materialHash},{sourceFrame:'foreign'}]){
    const payload={catalogScope:after.context.catalogScope,specimenKey:group.key,structureId:row.id,sourceFrame:after.context.sourceFrame,
      materialHash:after.context.materialHash,revisionHash:after.context.revisions.teaching,checklistVersion:after.context.checklistVersion,track:'teaching',expectedVersion:0,draft,...patch};
    const response=await current.postSpecimenReview(new Request('https://atlas.test/api/review/specimens',{method:'POST',headers:{origin:'https://atlas.test','content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_WALL_BACK_TEST'},body:JSON.stringify(payload)}),unreachableStorage);
    assert.equal(response.status,409);rejected++;
  }
  const copy=structuredClone(after);copy.teaching.guidedDissection.steps[0].caption='altered';
  assert.deepEqual(await current.specimenReviewMaterial(group.key,row.id),after);
}
assert.equal(contexts,356);assert.equal(changed,77);assert.equal(unchanged,279);assert.equal(rejected,231);
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
for(const scope of ['abdominal-wall','back-layers'])for(const file of ['catalog.json',scope+'.glb','NOTICE.md']){
  const path='public/models/bodyparts3d-v3/'+scope+'/'+file;
  const prior=execFileSync('git',['show',baseline+':'+path],{maxBuffer:30e6});
  assert.equal(sha(await readFile(path)),sha(prior),'Existing licensed asset exact: '+path);
}
console.log(JSON.stringify({contexts,unchangedSourceContexts:contexts,changedGuidedTeachingContexts:changed,unchangedTeachingContexts:unchanged,rejectedStalePackets:rejected,modelsUnchanged:true,clinicalApproved:false}));
