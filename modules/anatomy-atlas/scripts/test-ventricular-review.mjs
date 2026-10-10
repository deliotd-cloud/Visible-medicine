import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {dirname} from 'node:path';
import {readFile,writeFile} from 'node:fs/promises';
import {DatabaseSync} from 'node:sqlite';
import {build} from './workspace-test-build.mjs';
const baseline='9fcf6007719b78c83979a1fbfbca0e4eadbcc42b';
const old=path=>execFileSync('git',['show',baseline+':'+path],{maxBuffer:32e6}).toString('utf8');
async function load(previous){
  const contents=`export * from './lib/nested-review-material';export * from './lib/nested-review';export * from './lib/nested-review-api';export * from './lib/nested-review-client';export * from './lib/nested-guided-learning';export {bodyDisplayCatalog} from './lib/body-display-catalog';export {default as raw} from './public/models/bodyparts3d/full-body/catalog.json';`;
  const files=['lib/nested-review-material.ts','lib/nested-guided-learning.ts','content/nested-guided-learning-bindings.v1.json','content/body-renderer-revision.json'];
  const result=await build({stdin:{contents,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm',
    plugins:previous?[{name:'exact-before-ventricular',setup(api){api.onLoad({filter:/.*/},args=>{
      const path=args.path.replaceAll('\\','/');const match=files.find(f=>path.endsWith('/'+f));
      if(match)return {contents:old(match),loader:match.endsWith('.json')?'json':'ts',resolveDir:dirname(args.path)};
    });}}]:[]});
  return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
}
const now=await load(false),before=await load(true);
const catalog=now.bodyDisplayCatalog(now.raw),options=now.nestedGuidedStudyOptions(catalog);
assert.equal(options.length,3);assert.deepEqual(options.filter(o=>o.kind==='eye'),before.nestedGuidedStudyOptions(catalog));
const vent=options.find(o=>o.kind==='ventricles');assert.equal(vent.guide.steps.length,5);
assert.equal(now.nestedGuidedStudyOptions(catalog,'head-neck').length,3);
assert.deepEqual(now.nestedGuidedStudyOptions(catalog,'thorax'),[]);
for(const mutate of [c=>c.structures.push(structuredClone(vent.parent)),c=>c.structures.find(s=>s.id===vent.parent.id).name='foreign',c=>c.bundles.find(b=>b.id===vent.parent.bundle).sha256='foreign']){
  const altered=structuredClone(catalog);mutate(altered);assert(!now.nestedGuidedStudyOptions(altered).some(o=>o.kind==='ventricles'));
}
const sqlite=new DatabaseSync(':memory:');sqlite.exec(await readFile('drizzle/0003_nested_review_events.sql','utf8'));
const db={prepare(sql){return{bind(...values){return{async all(){return{results:sqlite.prepare(sql).all(...values)};},async run(){return{meta:{changes:Number(sqlite.prepare(sql).run(...values).changes)}};}};}};}};
const storage=new Proxy({},{get(){throw Error('Refused request reached storage');}});
let contexts=0,changed=0,exact=0,refusals=0,saves=0;
const request=payload=>new Request('https://review.test/api/nested-review',{method:'POST',headers:{origin:'https://review.test','content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_CSF_TEST'},body:JSON.stringify(payload)});
for(const group of now.nestedReviewRows)for(const row of group.surfaces){
  const a=await now.nestedReviewMaterial(group.key,row.id),b=await before.nestedReviewMaterial(group.key,row.id),c=a.context,p=b.context;contexts++;
  assert.deepEqual(a.source,b.source);assert.equal(c.sourceHash,p.sourceHash);assert.equal(c.sourceFrame,p.sourceFrame);assert.equal(c.revisions.imaging,null);
  if(group.study!=='ventricles'){
    exact++;assert.deepEqual(a.teaching,b.teaching);assert.equal(c.revisions.teaching,p.revisions.teaching);assert.deepEqual(c.checklists,p.checklists);
  }else{
    changed++;assert.equal(a.teaching.guidedLearning.steps.length,5);assert.equal(a.teaching.csfMotion.markerCount,160);
    for(const field of ['topics','lesson','concept'])assert.deepEqual(a.teaching[field],b.teaching[field]);
    for(const [url,title]of Object.entries(b.teaching.referenceTitles))assert.equal(a.teaching.referenceTitles[url],title);
    assert.notEqual(c.revisions.teaching,p.revisions.teaching);assert(c.teachingTabs.includes('guided-learning'));
    for(const track of ['geometry','teaching']){
      const draft=now.blankNestedReview(c,track);assert.equal(draft.checks['csf-motion'],false);assert.equal(draft.attested,false);
      if(track==='teaching')assert.equal(draft.checks['guided-learning'],false);
      const payload={catalogScope:c.catalogScope,nestedKey:c.nestedKey,structureId:row.id,sourceFrame:c.sourceFrame,
        materialHash:c.materialHash,revisionHash:c.revisions[track],checklistVersion:c.checklistVersion,track,expectedVersion:0,draft};
      for(const delta of [{revisionHash:p.revisions[track]},{materialHash:p.materialHash},{sourceFrame:'foreign'}]){
        assert.equal((await now.postNestedReview(request({...payload,...delta}),storage)).status,409);refusals++;
      }
      const almost={...draft,reviewer:'SOFTWARE TEST ONLY',qualification:'Synthetic',scope:'No clinical sign-off',status:'approved',attested:true,
        evidence:[{title:'Synthetic only',url:'https://example.test/evidence',note:'Not clinical evidence'}],
        checks:Object.fromEntries(c.checklists[track].map(item=>[item.id,item.id!=='csf-motion']))};
      assert(now.nestedApprovalProblems(almost,c,track).includes('Complete every checklist item.'));
      const response=await now.postNestedReview(request(payload),db);assert.equal(response.status,201);
      const saved=now.parseSavedNestedReview((await response.json()).review);assert.equal(saved.status,'draft');assert.equal(saved.attested,false);
      const get=new Request('https://review.test/api/nested-review?'+new URLSearchParams({nestedKey:c.nestedKey,structureId:row.id,track}),{headers:{'oai-authenticated-user-id':'SYNTHETIC_CSF_TEST'}});
      const history=now.parseNestedHistory(await (await now.getNestedReviews(get,db)).json(),c,track);assert.deepEqual(history.history,[saved]);saves++;
    }
  }
  assert.notEqual(c.revisions.geometry,p.revisions.geometry);
}
assert.deepEqual({contexts,changed,exact,refusals,saves},{contexts:108,changed:4,exact:104,refusals:24,saves:8});sqlite.close();
const report={baseline,sourceContextsUnchanged:contexts,changedTeachingContexts:changed,otherTeachingExact:exact,staleRequestsBeforeStorage:refusals,syntheticDraftReadbacks:saves,clinicalApproval:false};
await writeFile('docs/ventricular-review-validation.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
