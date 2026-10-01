import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {dirname} from 'node:path';
import {build} from './workspace-test-build.mjs';

const baseline='7d3010368fc53e3433e8df4f9e9d4ddb67e786e8';
const milestone='fc5457b6dbc12cb6ce702c2fc272d0bcb6cc59fc';
const oldFile=(path,revision=baseline)=>execFileSync('git',['show',`${revision}:${path}`],{encoding:'utf8',maxBuffer:32e6});
const contents="export * from './lib/specimen-review-material'; export * from './lib/specimen-review'; export * from './lib/specimen-review-api'; export * from './lib/back-layers'; export * from './lib/back-guided-dissection';";
async function load(previous=false) {
 const result=await build({stdin:{contents,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm',
  plugins:[{name:'retain-delivered-renal-vocabulary',setup(api){
   api.onLoad({filter:/[\\/]content[\\/]hra-renal-clinical\.ts$/},args=>({contents:oldFile('content/hra-renal-clinical.ts',milestone),loader:'ts',resolveDir:dirname(args.path)}));
  }},...(previous?[{name:'before-back-topic-completion',setup(api){
   for(const path of ['content/back-bone-teaching.ts','content/back-layers-clinical.ts'])
    api.onLoad({filter:new RegExp(path.replaceAll('/','[\\\\/]')+'$')},args=>({contents:oldFile(path),loader:'ts',resolveDir:dirname(args.path)}));
   api.onLoad({filter:/[\\/]content[\\/]body-renderer-revision\.json$/},()=>({contents:oldFile('content/body-renderer-revision.json'),loader:'json'}));
  }}]:[])]});
 return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
}
const current=await load(),previous=await load(true);
const storage=new Proxy({},{get(){throw Error('Stale back-topic request reached storage');}});
let contexts=0,changed=0,unchanged=0,added=0,unblocked=0,rejected=0;
for(const row of current.specimenReviewRows)for(const surface of row.surfaces) {
 const before=await previous.specimenReviewMaterial(row.key,surface.id),after=await current.specimenReviewMaterial(row.key,surface.id);
 assert(before&&after);contexts++;
 assert.deepEqual(after.source,before.source);assert.equal(after.context.sourceHash,before.context.sourceHash);
 assert.equal(after.context.revisions.imaging,null);assert(after.context.blockers.imaging.length);
 if(row.key!==current.backLayersDefinition.key) {
  unchanged++;assert.deepEqual(after.teaching,before.teaching);
  assert.equal(after.context.teachingHash,before.context.teachingHash);
  assert.equal(after.context.revisions.teaching,before.context.revisions.teaching);
  continue;
 }
 changed++;
 assert.notEqual(after.context.teachingHash,before.context.teachingHash);
 assert.notEqual(after.context.revisions.teaching,before.context.revisions.teaching);
 assert.deepEqual(after.teaching.guidedDissection,before.teaching.guidedDissection);
 assert.deepEqual(after.context.checklists.teaching,before.context.checklists.teaching);
 assert.equal(after.context.blockers.teaching.length,0);
 if(before.context.blockers.teaching.length)unblocked++;
 const beforeLesson=structuredClone(before.teaching.lesson),afterLesson=structuredClone(after.teaching.lesson);
 delete beforeLesson.extended.topics;delete afterLesson.extended.topics;
 assert.deepEqual(afterLesson,beforeLesson,'Existing anatomy/function/attachments/self-check/model limitations retained');
 assert.equal(after.teaching.topics.length,8);
 for(const topic of after.teaching.topics) {
  const old=before.teaching.topics.find(t=>t.tab===topic.tab);assert(old);
  assert.equal(typeof topic.body,'string');assert(topic.body.length>0);
  if(old.body!==null)assert.deepEqual(topic,old,'Every previously populated topic retained');
  else {assert(topic.body.length>100,'New topic must be substantive');added++;}
  assert(topic.references.length);
  for(const url of topic.references)assert(after.teaching.referenceTitles[url],url);
 }
 for(const [url,title]of Object.entries(before.teaching.referenceTitles))assert.equal(after.teaching.referenceTitles[url],title);
 const draft=current.blankSpecimenReview(after.context,'teaching');
 assert.equal(draft.status,'draft');assert.equal(draft.attested,false);assert(Object.values(draft.checks).every(value=>value===false));
 const unchecked={...draft,reviewer:'Synthetic test',qualification:'Synthetic test',scope:'Synthetic scope',attested:true,evidence:['https://example.test/review']};
 assert(current.specimenApprovalProblems(unchecked,after.context,'teaching').includes('Complete every checklist item.'));
 for(const patch of [{revisionHash:before.context.revisions.teaching},{materialHash:before.context.materialHash},{sourceFrame:'foreign-frame'}]) {
  const payload={catalogScope:after.context.catalogScope,specimenKey:row.key,structureId:surface.id,sourceFrame:after.context.sourceFrame,
   materialHash:after.context.materialHash,revisionHash:after.context.revisions.teaching,checklistVersion:after.context.checklistVersion,
   track:'teaching',expectedVersion:0,draft,...patch};
  const response=await current.postSpecimenReview(new Request('https://atlas.test/api/review/specimens',{method:'POST',headers:{origin:'https://atlas.test','content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_BACK_TOPICS'},body:JSON.stringify(payload)}),storage);
  assert.equal(response.status,409);rejected++;
 }
 const copy=structuredClone(after);copy.teaching.lesson.extended.topics.clinical.body='changed';copy.teaching.referenceTitles[Object.keys(copy.teaching.referenceTitles)[0]]='changed';
 assert.deepEqual(await current.specimenReviewMaterial(row.key,surface.id),after);
}
assert.equal(contexts,356);assert.equal(changed,48);assert.equal(unchanged,308);assert.equal(added,89);assert.equal(unblocked,10);assert.equal(rejected,144);
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
for(const path of ['public/models/bodyparts3d-v3/back-layers/catalog.json','public/models/bodyparts3d-v3/back-layers/back-layers.glb','public/models/bodyparts3d-v3/back-layers/NOTICE.md'])
 assert.equal(sha(await readFile(path)),sha(execFileSync('git',['show',baseline+':'+path],{maxBuffer:32e6})),path);
console.log(JSON.stringify({contexts,unchangedSourceContexts:356,changedTeachingContexts:48,unchangedTeachingContexts:308,newTopicPlacements:89,newSoftwarePrerequisiteContexts:10,rejectedStalePackets:144,modelsUnchanged:true,clinicalApproval:false}));
