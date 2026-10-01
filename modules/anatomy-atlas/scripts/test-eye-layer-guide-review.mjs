import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {dirname} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {build} from './workspace-test-build.mjs';
const baseline='551f7dc0902be9c26c57a74cac4f101925767809';
const old=path=>execFileSync('git',['show',baseline+':'+path],{maxBuffer:32e6});
const contents=`export * from './lib/nested-review-material';export * from './lib/nested-review';
 export * from './lib/nested-review-api';export * from './lib/nested-review-client';
 export {eyeLayerGuide} from './lib/eye-layer-guide';`;
async function load(previous=false){
 const result=await build({stdin:{contents,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm',
  plugins:previous?[{name:'exact-previous-eye-guide-review',setup(api){
   api.onLoad({filter:/[\\/]lib[\\/]nested-review-material\.ts$/},args=>({contents:old('lib/nested-review-material.ts').toString('utf8'),loader:'ts',resolveDir:dirname(args.path)}));
   api.onLoad({filter:/body-renderer-revision\.json$/},()=>({contents:old('content/body-renderer-revision.json').toString('utf8'),loader:'json'}));
  }}]:[]});
 return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
}
const now=await load(),before=await load(true),storage=new Proxy({},{get(){throw Error('Stale request reached storage');}});
const sqlite=new DatabaseSync(':memory:');sqlite.exec(await readFile('drizzle/0003_nested_review_events.sql','utf8'));
const db={prepare(sql){return{bind(...values){return{
 async all(){return{results:sqlite.prepare(sql).all(...values)};},
 async run(){return{meta:{changes:Number(sqlite.prepare(sql).run(...values).changes)}};},
};}};}};
let contexts=0,changed=0,unchanged=0,staleTeaching=0,staleGeometry=0,savedAndReadBack=0;
for(const group of now.nestedReviewRows)for(const row of group.surfaces){
 const current=await now.nestedReviewMaterial(group.key,row.id),previous=await before.nestedReviewMaterial(group.key,row.id),c=current.context,p=previous.context;
 contexts++;assert.deepEqual(current.source,previous.source);assert.equal(c.sourceHash,p.sourceHash);
 assert.equal(c.sourceFrame,p.sourceFrame);assert.equal(c.revisions.imaging,null);assert.deepEqual(c.blockers,p.blockers);
 const reject=async(track,delta)=>{
  const payload={catalogScope:c.catalogScope,nestedKey:c.nestedKey,structureId:c.structureId,sourceFrame:c.sourceFrame,
   materialHash:c.materialHash,revisionHash:c.revisions[track],checklistVersion:c.checklistVersion,track,expectedVersion:0,draft:now.blankNestedReview(c,track),...delta};
  const response=await now.postNestedReview(new Request('https://review.test/api/nested-review',{method:'POST',headers:{origin:'https://review.test',
   'content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_EYE_GUIDE_TEST'},body:JSON.stringify(payload)}),storage);
  assert.equal(response.status,409);
 };
 const guide=current.teaching.guidedLearning;
 if(!guide){unchanged++;assert.notEqual(group.study,'eye');assert.deepEqual(current.teaching,previous.teaching);
  assert.equal(c.teachingHash,p.teachingHash);assert.equal(c.revisions.teaching,p.revisions.teaching);assert.deepEqual(c.teachingTabs,p.teachingTabs);
 }else{
  changed++;assert.equal(group.study,'eye');assert.equal(guide.parentId,group.parentId);assert.equal(guide.status,'draft');
  assert.deepEqual(guide,now.eyeLayerGuide(current.source.parent));assert(guide.steps.some(step=>step.ids.includes(row.id)));
  for(const field of ['topics','lesson','concept'])assert.deepEqual(current.teaching[field],previous.teaching[field],'Original teaching retained');
  for(const [url,title]of Object.entries(previous.teaching.referenceTitles))assert.equal(current.teaching.referenceTitles[url],title,'Existing credit retained');
  const allURLs=new Set([...previous.teaching.topics.flatMap(t=>t.references),...(previous.teaching.lesson?.extended.selfCheck.references??[]),...guide.steps.flatMap(step=>step.references)]);
  assert.deepEqual(Object.keys(current.teaching.referenceTitles).sort(),[...allURLs].sort());
  assert.notEqual(c.teachingHash,p.teachingHash);assert.notEqual(c.revisions.teaching,p.revisions.teaching);
  assert.deepEqual(c.teachingTabs,[...p.teachingTabs,'guided-learning']);
  assert.deepEqual(c.checklists.teaching.slice(0,-1),p.checklists.teaching);assert.equal(c.checklists.teaching.at(-1).id,'guided-learning');
  const draft=now.blankNestedReview(c,'teaching');assert.equal(draft.checks['guided-learning'],false);assert.equal(draft.attested,false);
  const almost={...draft,reviewer:'SOFTWARE TEST ONLY',qualification:'Synthetic test',scope:'Not clinical sign-off',status:'approved',attested:true,
   evidence:[{title:'Synthetic only',url:'https://example.test/evidence',note:'Not clinical evidence'}],
   checks:Object.fromEntries(c.checklists.teaching.map(item=>[item.id,item.id!=='guided-learning']))};
  assert(now.nestedApprovalProblems(almost,c,'teaching').includes('Complete every checklist item.'));
  for(const delta of [{revisionHash:p.revisions.teaching},{materialHash:p.materialHash},{sourceFrame:'foreign'}]){await reject('teaching',delta);staleTeaching++;}
  const detached=structuredClone(current);detached.teaching.guidedLearning.steps[0].caption='Altered';
  assert.deepEqual(await now.nestedReviewMaterial(group.key,row.id),current,'Returned guide packets detached');
  for(const track of ['geometry','teaching']){
   const payload={catalogScope:c.catalogScope,nestedKey:c.nestedKey,structureId:c.structureId,sourceFrame:c.sourceFrame,
    materialHash:c.materialHash,revisionHash:c.revisions[track],checklistVersion:c.checklistVersion,track,expectedVersion:0,
    draft:{...now.blankNestedReview(c,track),reviewer:'SOFTWARE TEST ONLY',qualification:'Synthetic',scope:'No clinical sign-off'}};
   const response=await now.postNestedReview(new Request('https://review.test/api/nested-review',{method:'POST',headers:{origin:'https://review.test',
    'content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_EYE_GUIDE_TEST'},body:JSON.stringify(payload)}),db);
   assert.equal(response.status,201);const saved=now.parseSavedNestedReview((await response.json()).review);
   assert.equal(saved.status,'draft');assert.equal(saved.attested,false);assert(saved.material.teachingTabs.includes('guided-learning'));
   const get=new Request('https://review.test/api/nested-review?'+new URLSearchParams({nestedKey:c.nestedKey,structureId:c.structureId,track}),
    {headers:{'oai-authenticated-user-id':'SYNTHETIC_EYE_GUIDE_TEST'}});
   const historyResponse=await now.getNestedReviews(get,db);assert.equal(historyResponse.status,200);
   const history=now.parseNestedHistory(await historyResponse.json(),c,track);assert.deepEqual(history.history,[saved]);savedAndReadBack++;
   for(const tabs of [['lecture'],[...saved.material.teachingTabs,'guided-learning'],Array(11).fill('anatomy')])
    assert.throws(()=>now.parseSavedNestedReview({...saved,material:{...saved.material,teachingTabs:tabs}}));
   const oldEvent={...saved,revisionHash:p.revisions[track],checklist:p.checklists[track],checks:before.blankNestedReview(p,track).checks,
    material:{materialHash:p.materialHash,sourceHash:p.sourceHash,teachingHash:p.teachingHash,rendererHash:p.rendererHash,teachingTabs:p.teachingTabs}};
   const parsed=now.parseSavedNestedReview(oldEvent);assert.equal(now.nestedDecisionLabel(parsed,c),'Re-review required');
   const restored=now.nestedDraftFromSaved(parsed,c,track);assert.equal(restored.attested,false);assert.equal(restored.status,'draft');
  }
 }
 assert.notEqual(c.revisions.geometry,p.revisions.geometry,'Normal renderer regeneration requires geometry re-review');
 await reject('geometry',{revisionHash:p.revisions.geometry});staleGeometry++;
}
assert.deepEqual({contexts,changed,unchanged,staleTeaching,staleGeometry,savedAndReadBack},{contexts:108,changed:15,unchanged:93,staleTeaching:45,staleGeometry:108,savedAndReadBack:30});
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
for(const path of ['public/models/bodyparts3d/eye-layers/catalog.json','public/models/bodyparts3d/eye-layers/eye-layers.glb',
 'content/nested-teaching-bindings.v1.json','content/nested-review-bindings.json','content/nested-teaching.ts','LICENSES/THIRD_PARTY_NOTICES.md','package-lock.json'])
 assert.equal(sha(await readFile(path)),sha(old(path)),path+' exact');
const report={baseline,contexts,changedGuidedTeachingContexts:changed,unchangedTeachingContexts:unchanged,unchangedSourceContexts:contexts,
 staleTeachingRejectedBeforeStorage:staleTeaching,staleGeometryRejectedBeforeStorage:staleGeometry,syntheticDraftSaveReadbacks:savedAndReadBack,
 modelsAndNoticesUnchanged:true,clinicalApproval:false,browserAcceptance:false};
sqlite.close();
await writeFile('docs/eye-layer-guide-review-validation.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
