import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {dirname,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {runInNewContext} from 'node:vm';
import {build} from './workspace-component-test-build.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),stage=fileURLToPath(new URL('../../',import.meta.url));
const read=p=>fs.readFileSync(p),json=p=>JSON.parse(read(p)),sha=b=>createHash('sha256').update(b).digest('hex');
const prep=json(stage+'/PREPARATION.json');assert.equal(sha(read(prep.parentReceipt)),prep.parentReceiptSha256);
const sealed=json(prep.parentReceipt),rows=new Map(sealed.sourceRows.map(r=>[r.path,r]));
assert.equal(sealed.atlasHead,'7659453d7d99da78742b06ee6e6665a467e5d972');
const entry="export * from './lib/reasoning-questions';export * from './lib/atlas-practice';export * from './lib/body-review-material';export * from './lib/body-review-response';export * from './lib/body-review-context';export * from './lib/body-review-decisions';export * from './lib/body-review-api';export {bodyDisplayCatalog} from './lib/body-display-catalog';export {bodyLesson} from './app/body-content';export {contentTabs} from './lib/content-types';";
const require=createRequire(new URL('../package.json',import.meta.url));
async function load(previous=false){
 const compiled=await build({stdin:{contents:entry,resolveDir:root,loader:'ts'},bundle:true,write:false,platform:'node',format:'cjs',packages:'external',plugins:previous?[{name:'exact-authenticated765-parent',setup(api){api.onLoad({filter:/\.(?:ts|tsx|json)$/},args=>{
  const rel=relative(root,args.path).replaceAll('\\','/'),row=rows.get(rel);assert(row,rel);const bytes=read(sealed.atlas+'/'+rel);assert.equal(sha(bytes),row.sha256,rel);
  return{contents:bytes.toString(),loader:rel.endsWith('.json')?'json':rel.endsWith('.tsx')?'tsx':'ts',resolveDir:dirname(args.path)};
 });}}]:[]});
 const module={exports:{}};runInNewContext(compiled.outputFiles[0].text,{module,exports:module.exports,require,crypto,TextEncoder,TextDecoder,Request,Response,URL,URLSearchParams,structuredClone});return module.exports;
}
const previous=await load(true),api=await load(),same=(a,b,message)=>assert.deepEqual(structuredClone(a),structuredClone(b),message);
const catalog=api.bodyDisplayCatalog(json(root+'/public/models/bodyparts3d/full-body/catalog.json')),loaded=catalog.bundles.map(b=>b.id),pins=json(root+'/content/cervical-vascular-reasoning-pins.json');

test('every preceding definition, target session and source-backed lesson stays exact',()=>{
 assert.equal(previous.reasoningConcepts.length,232);assert.equal(api.reasoningConcepts.length,236);same(api.reasoningConcepts.slice(0,232),previous.reasoningConcepts);
 assert.equal(catalog.structures.filter(api.reasoningConceptFor).length,432);let sessions=0,lessons=0;
 for(const s of catalog.structures){
  const before=previous.reasoningConceptFor(s);if(before){same(api.reasoningConceptFor(s),before,s.id);const options={id:1,mode:'reason',sampling:'all',count:1,retryIds:[s.id]};same(api.createPracticeSession(catalog.structures,loaded,options,()=>.314159),previous.createPracticeSession(catalog.structures,loaded,options,()=>.314159),s.id);sessions++;}
  for(const topic of api.contentTabs){same(api.bodyLesson(s,topic),previous.bodyLesson(s,topic),s.id+':'+topic);lessons++;}
 }
 assert.equal(sessions,424);assert.equal(lessons,9936);console.log(JSON.stringify({precedingDefinitions:232,precedingTargetSessions:sessions,unchangedLessons:lessons,newConcepts:4,newTargets:8}));
});

test('new Review questions remain drafts and reject stale or forged evidence before storage',async()=>{
 let refusals=0,stalePosts=0;
 for(const {key,identity}of pins.entries){
  const before=await previous.bodyReviewMaterial(identity.id),now=await api.bodyReviewMaterial(identity.id);assert(before&&now);assert.equal(before.reasoning,null);assert.equal(now.reasoning.key,key);
  for(const p of ['source','topics','guidedTours','checklist'])same(now[p],before[p],identity.id+':'+p);
  assert.equal(now.approval,false);assert.equal(now.status,'worksheet-not-submitted');assert.notEqual(now.fingerprints.teaching,before.fingerprints.teaching);
  assert(await api.parseBodyReviewResponse(now,identity.id));assert.equal(await api.parseBodyReviewResponse(before,identity.id),null);
  for(const edit of [p=>{p.reasoning.answerId=p.reasoning.choices.find(c=>c.id!==identity.id).id;},p=>{p.reasoning.explanation+=' altered';},p=>{p.reasoning.readiness='approved';},p=>{p.reasoning.choices[0].sources[0].sha256='0'.repeat(64);},p=>{p.reasoning.references[0].url='javascript:alert(1)';}]){const bad=structuredClone(now);edit(bad);assert.equal(await api.parseBodyReviewResponse(bad,identity.id),null);refusals++;}
  const oldContext=await previous.bodyReviewContext(identity.id);let storageCalls=0;
  const body={catalogScope:oldContext.catalogScope,structureId:identity.id,track:'teaching',expectedVersion:0,materialHash:oldContext.materialHash,revisionHash:oldContext.revisions.teaching,checklistVersion:oldContext.checklistVersion,draft:api.blankBodyReview(oldContext,'teaching')};
  const response=await api.postBodyDecision(new Request('https://atlas.example/api/body-review/decisions',{method:'POST',headers:{'content-type':'application/json','oai-authenticated-user-id':'synthetic-reviewer',origin:'https://atlas.example'},body:JSON.stringify(body)}),{prepare(){storageCalls++;throw Error('Stale evidence touched storage');}});
  assert.equal(response.status,409);assert.equal(storageCalls,0);stalePosts++;
 }
 assert.equal(refusals,40);assert.equal(stalePosts,8);console.log(JSON.stringify({packetMutationsRejected:refusals,stalePostsRejectedBeforeStorage:stalePosts,clinicalApproval:false,patientSpaceRegistration:false}));
});
