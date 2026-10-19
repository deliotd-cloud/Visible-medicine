import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
import {checkedAtlasSourceRepo} from './atlas-source-repo.mjs';
import {emittedTeaching} from './atlas-emitted-teaching.ts';
import {CURRENT_ATLAS_REVISION} from './current-atlas-delivery.mjs';
const originalRevision='408759d57644b05402e98a937e7cf6338b5509cf';
const revision=CURRENT_ATLAS_REVISION,atlas=checkedAtlasSourceRepo(revision);
const json=(p:string)=>JSON.parse(readFileSync(p,'utf8')),sha=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex');
const paths=['content/thoracic-bone-quiz-pins.json','content/thoracic-bone-quiz.ts','lib/thoracic-bone-quiz.ts','content/thoracic-core-reasoning-pins.json','lib/thoracic-core-reasoning.ts','lib/reasoning-questions.ts'];
test('current thoracic quizzes and reasoning retain exact identities, grading, drafts and delivered source',async()=>{
 const review=json('atlas-review/manifest.json');assert.equal(review.revision,revision);
 for(const path of paths){const f=review.files.find((x:any)=>x.path===path);assert(f);assert.equal(sha(readFileSync('atlas-review/'+path)),f.importedSha256);
  const committed=execFileSync('git',['show',revision+':'+path],{cwd:atlas,windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
  assert.equal(sha(committed),f.sourceSha256);
  assert.deepEqual(committed,execFileSync('git',['show',originalRevision+':'+path],{cwd:atlas,windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}),`${path}: original thoracic source retained`);
 }
 const result=await build({stdin:{contents:`
 export * from './atlas-review/lib/body-review-material';export * from './atlas-review/lib/body-review-response';
 export * from './atlas-review/lib/atlas-practice';export * from './atlas-review/lib/thoracic-bone-quiz';
 export * from './atlas-review/lib/thoracic-core-reasoning';export {bodyLesson} from './atlas-review/app/body-content';
 import raw from './atlas-review/public/models/bodyparts3d/full-body/catalog.json';
 import {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';export const catalog=bodyDisplayCatalog(raw as any);`,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
 const api=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
 const quiz=json('atlas-review/content/thoracic-bone-quiz-pins.json'),core=json('atlas-review/content/thoracic-core-reasoning-pins.json');
 assert.equal(quiz.entries.length,27);assert.equal(core.entries.length,5);assert.equal(api.catalog.structures.length,1104);const loaded=api.catalog.bundles.map((b:any)=>b.id);
 for(const {identity} of quiz.entries){
  assert.deepEqual(api.catalog.structures.find((s:any)=>s.id===identity.id),identity);
  const lesson=api.thoracicBoneQuizLesson(identity,'quiz');assert(lesson);assert.equal(lesson.readiness,'draft');assert.deepEqual(api.bodyLesson(identity,'quiz'),lesson);
  const altered=structuredClone(identity);altered.laterality='foreign';assert.equal(api.thoracicBoneQuizLesson(altered,'quiz'),undefined);
  const packet=await api.bodyReviewMaterial(identity.id);assert.equal(packet.approval,false);assert(await api.parseBodyReviewResponse(packet,identity.id));
 }
 const keys=new Set(api.thoracicCoreReasoningConcepts.map((c:any)=>c.key));assert.equal(keys.size,4);
 for(const {identity} of core.entries){
  assert.deepEqual(api.catalog.structures.find((s:any)=>s.id===identity.id),identity);
  const packet=await api.bodyReviewMaterial(identity.id);assert(packet.reasoning);assert.equal(packet.approval,false);assert(await api.parseBodyReviewResponse(packet,identity.id));
  const run=api.createPracticeSession(api.catalog.structures,loaded,{id:9,mode:'reason',sampling:'all',count:1,retryIds:[identity.id]},()=>.314159);assert(run);assert.equal(run.questions[0].target,identity.id);
  const action={sessionId:run.id,index:0},correct=api.practiceReducer(run,{type:'answer',...action,chosen:identity.id});assert.equal(api.practiceScore(correct),1);
  assert.deepEqual(api.practiceReducer(correct,{type:'answer',...action,chosen:'foreign'}),correct);
  const malformed=structuredClone(packet);malformed.reasoning.answerId='foreign';assert.equal(await api.parseBodyReviewResponse(malformed,identity.id),null);
 }
 for(const folder of ['head-neck','review']){
  const base=folder==='review'?'public/atlas-review-viewer/':'public/atlas-runtime/head-neck/',m=json(base+'manifest.json');assert.equal(m.sourceCommit,revision);
  if(folder==='review'){assert.equal(m.websiteIntegrationSha256,review.websiteIntegrationSha256);assert.equal(m.personalRecordsIncluded,false);}else assert.equal(m.patientDataIncluded,false);
  for(const f of m.files)assert.equal(sha(readFileSync(base+f.path)),f.sha256);
  // Reasoning lives in a separate reachable module, not just body-content.
  const code=emittedTeaching(base,m.files,true);for(const c of api.thoracicCoreReasoningConcepts)for(const value of [c.prompt,c.explanation])assert(code.includes(value)||code.includes(JSON.stringify(value).slice(1,-1)),folder+': '+c.key);
 }
});
