import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {dirname,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {runInNewContext} from 'node:vm';
import {build} from './workspace-component-test-build.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),stage=fileURLToPath(new URL('../../',import.meta.url));
const prep=JSON.parse(fs.readFileSync(stage+'/PREPARED.json'));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const read=rel=>fs.readFileSync(root+'/'+rel,'utf8'),parentRows=new Map(prep.files.map(r=>[r.path,r]));
assert.equal(prep.head,'cf9b5091db90219981929f6a9cbfdf1056bac9d6');
const require=createRequire(new URL('../package.json',import.meta.url)),React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');
const addition="export * from './lib/upper-vascular-reasoning';";
const entry=`export * from './lib/reasoning-questions';${addition}export * from './lib/atlas-practice';export * from './lib/body-review-material';export * from './lib/body-review-response';export * from './lib/body-review-context';export * from './lib/body-review-decisions';export * from './lib/body-review-api';export {bodyDisplayCatalog} from './lib/body-display-catalog';export {bodyLesson} from './app/body-content';export {contentTabs} from './lib/content-types';export {ReasoningFeedback} from './app/reasoning-feedback';`;
async function load(previous=false){
 const compiled=await build({stdin:{contents:previous?entry.replace(addition,''):entry,resolveDir:root,loader:'ts'},bundle:true,write:false,format:'cjs',platform:'node',packages:'external',jsx:'automatic',plugins:previous?[{name:'authenticated-exact-cf9b-parent',setup(api){api.onLoad({filter:/\.(?:ts|tsx|json)$/},args=>{
  const rel=relative(root,args.path).replaceAll('\\','/'),row=parentRows.get(rel);assert(row,rel);
  const bytes=fs.readFileSync(prep.parent+'/'+rel);assert.equal(sha(bytes),row.sha256,rel);
  return{contents:bytes.toString(),loader:rel.endsWith('.json')?'json':rel.endsWith('.tsx')?'tsx':'ts',resolveDir:dirname(args.path)};
 });}}]:[]});
 const module={exports:{}};
 runInNewContext(compiled.outputFiles[0].text,{module,exports:module.exports,require,crypto,TextEncoder,TextDecoder,Request,Response,structuredClone,URL,URLSearchParams});
 return module.exports;
}
const previous=await load(true),api=await load();
const same=(a,b,label)=>assert.deepEqual(structuredClone(a),structuredClone(b),label);
const catalog=api.bodyDisplayCatalog(JSON.parse(read('public/models/bodyparts3d/full-body/catalog.json'))),loaded=catalog.bundles.map(b=>b.id);
const pins=JSON.parse(read('content/upper-vascular-reasoning-pins.json'));
const keys=['axillary-artery','brachial-artery','deep-brachial-artery','radial-artery','ulnar-artery','common-interosseous-artery','anterior-interosseous-artery','axillary-vein','cephalic-vein','basilic-vein'].map(k=>'upper-vascular-'+k);
const create=(target,scope=catalog.structures,bundles=loaded,extra={},random=()=>.314159)=>api.createPracticeSession(scope,bundles,{id:1,mode:'reason',sampling:'all',count:1,retryIds:[target.id],...extra},random);
const markup=session=>renderToStaticMarkup(React.createElement(api.ReasoningFeedback,{session}));
const leaves=(value,path=[])=>value===null||typeof value!=='object'?[path]:Object.entries(value).flatMap(([key,child])=>leaves(child,[...path,key]));
let identityNegatives=0,practicePaths=0,refusedRegionalPaths=0,packetNegatives=0,stalePosts=0;

test('preserve every prior concept, target session and lesson; add exactly20 source-bound targets',()=>{
 assert.equal(previous.reasoningConcepts.length,222);assert.equal(api.reasoningConcepts.length,232);
 same(api.reasoningConcepts.slice(0,222),previous.reasoningConcepts);
 same(api.reasoningConcepts.slice(222),api.upperVascularReasoningConcepts);
 same(api.upperVascularReasoningConcepts.map(c=>c.key),keys);
 assert.equal(pins.entries.length,20);assert.equal(pins.parentSource,prep.head);
 assert.equal(catalog.structures.filter(api.reasoningConceptFor).length,424);
 let old=0;
 for(const s of catalog.structures){
  const before=previous.reasoningConceptFor(s);
  if(before){same(api.reasoningConceptFor(s),before,s.id);
   const options={id:1,mode:'reason',sampling:'all',count:1,retryIds:[s.id]};
   same(api.createPracticeSession(catalog.structures,loaded,options,()=>.314159),previous.createPracticeSession(catalog.structures,loaded,options,()=>.314159),s.id);old++;
  }
  for(const topic of api.contentTabs)same(api.bodyLesson(s,topic),previous.bodyLesson(s,topic),'Existing lesson '+s.id+':'+topic);
 }
 assert.equal(old,404);
});

test('complete paired source identities reject every leaf mutation, wrong key and extra field',()=>{
 const index=read('LICENSES/bodyparts3d-v4-index/isa_element_parts.txt').trim().split(/\r?\n/).map(line=>line.split('\t'));
 for(const {key,identity}of pins.entries){
  const target=catalog.structures.find(s=>s.id===identity.id);same(target,identity);
  assert.equal(previous.reasoningConceptFor(target),undefined);
  const concept=api.reasoningConceptFor(target);assert.equal(concept?.key,key);
  assert(api.upperVascularReasoningSourceMatches(target,key));
  assert.equal(concept.sourceTissue,'vessel');assert.equal(concept.readiness,'draft');assert.equal(concept.revision,1);
  same(concept.sourceRegions,target.regions);assert.equal(concept.sourceTree,'isa');
  same(index.filter(row=>row[0]===target.fmaId).map(row=>row[2]),target.sources.map(s=>s.file));
  for(const path of leaves(target)){
   const bad=structuredClone(target);let node=bad;for(const part of path.slice(0,-1))node=node[part];
   const leaf=path.at(-1),value=node[leaf];node[leaf]=typeof value==='number'?value+.01:typeof value==='boolean'?!value:String(value)+'-foreign';
   assert.equal(api.upperVascularReasoningSourceMatches(bad,key),false,path.join('.'));
   assert.equal(api.reasoningConceptFor(bad),undefined,path.join('.'));identityNegatives++;
  }
  for(const sources of [[],[...target.sources,...target.sources]])assert.equal(api.reasoningConceptFor({...target,sources}),undefined);
  assert.equal(api.upperVascularReasoningSourceMatches({...target,unexpected:true},key),false);
  for(const other of keys.filter(k=>k!==key))assert.equal(api.upperVascularReasoningSourceMatches(target,other),false);
 }
});

test('same-side visible regional choices support answer/skip/retry and refuse isolated or unloaded choices',()=>{
 for(const {key,identity}of pins.entries){
  const concept=api.reasoningConceptFor(identity);
  for(const region of ['whole-body',...identity.regions]){
   const scope=catalog.structures.filter(s=>region==='whole-body'||s.regions.includes(region));
   const expectedAlternatives=scope.filter(s=>s.laterality===identity.laterality&&concept.distractors.includes(api.reasoningConceptFor(s)?.key));
   for(const random of [()=>0,()=>.314159,()=>.999999]){
    const session=create(identity,scope,loaded,{},random);
    if(!expectedAlternatives.length){assert.equal(session,null,key+':'+region);refusedRegionalPaths++;continue;}
    assert(session,key+':'+region);const q=session.questions[0];
    assert.equal(q.target,identity.id);assert.equal(q.reasoning.key,key);
    assert(q.choices.length>=2&&q.choices.length<=4);assert.equal(new Set(q.choices).size,q.choices.length);
    for(const id of q.choices){const choice=scope.find(s=>s.id===id);assert(choice);assert.equal(choice.laterality,identity.laterality);assert(loaded.includes(choice.bundle));if(id!==identity.id)assert(concept.distractors.includes(api.reasoningConceptFor(choice)?.key));}
    assert.equal(markup(session),'');const action={sessionId:session.id,index:0};
    const correct=api.practiceReducer(session,{type:'answer',...action,chosen:identity.id});assert.equal(api.practiceScore(correct),1);assert(markup(correct).includes('Sources &amp; scope'));
    same(api.practiceReducer(correct,{type:'answer',...action,chosen:null}),correct);
    for(const chosen of [q.choices.find(id=>id!==identity.id),null]){
     const answered=api.practiceReducer(session,{type:'answer',...action,chosen});assert.equal(api.practiceScore(answered),0);assert(markup(answered).includes('Sources &amp; scope'));
     const done=api.practiceReducer(answered,{type:'next',...action});same(api.missedPracticeIds(done.responses),[identity.id]);assert.equal(create(identity,scope,loaded,{retryIds:api.missedPracticeIds(done.responses)})?.questions[0].target,identity.id);
    }
    practicePaths++;
   }
  }
  assert.equal(create(identity,[identity]),null);
  assert.equal(create(identity,catalog.structures.filter(s=>s.id!==identity.id)),null);
  assert.equal(create(identity,catalog.structures,loaded.filter(b=>b!==identity.bundle)),null);
  assert.equal(create(identity,catalog.structures,loaded,{sampling:'focus',focusIds:[identity.id]}),null);
 }
 assert.equal(refusedRegionalPaths,6,'Only the two axillary-vein thorax-only scopes lack a visible authored alternative');
});

test('Review binds new questions and rejects stale or altered material before persistence',async()=>{
 for(const {identity}of pins.entries){
  const before=await previous.bodyReviewMaterial(identity.id),material=await api.bodyReviewMaterial(identity.id);
  assert.equal(before.reasoning,null);assert(material.reasoning);
  same(material.source,before.source);same(material.topics,before.topics);same(material.guidedTours,before.guidedTours);same(material.checklist,before.checklist);
  assert.equal(material.approval,false);assert.equal(material.status,'worksheet-not-submitted');
  assert.notEqual(material.fingerprints.teaching,before.fingerprints.teaching);
  assert(await api.parseBodyReviewResponse(material,identity.id));assert.equal(await api.parseBodyReviewResponse(before,identity.id),null);
  for(const edit of [p=>{p.reasoning.answerId=p.reasoning.choices.find(c=>c.id!==identity.id).id;},p=>{p.reasoning.explanation+=' altered';},p=>{p.reasoning.readiness='approved';},p=>{p.reasoning.choices[0].sources[0].sha256='0'.repeat(64);},p=>{p.reasoning.references[0].url='javascript:alert(1)';}]){
   const bad=structuredClone(material);edit(bad);assert.equal(await api.parseBodyReviewResponse(bad,identity.id),null);packetNegatives++;
  }
  const oldContext=await previous.bodyReviewContext(identity.id);let calls=0;
  const body={catalogScope:oldContext.catalogScope,structureId:identity.id,track:'teaching',expectedVersion:0,materialHash:oldContext.materialHash,revisionHash:oldContext.revisions.teaching,checklistVersion:oldContext.checklistVersion,draft:api.blankBodyReview(oldContext,'teaching')};
  const response=await api.postBodyDecision(new Request('https://atlas.example/api/body-review/decisions',{method:'POST',headers:{'content-type':'application/json','oai-authenticated-user-id':'synthetic-reviewer',origin:'https://atlas.example'},body:JSON.stringify(body)}),{prepare(){calls++;throw Error('Stale request touched storage');}});
  assert.equal(response.status,409);assert.equal(calls,0);stalePosts++;
 }
 console.log(JSON.stringify({oldConcepts:222,concepts:232,oldTargets:404,targets:424,newConcepts:10,newTargets:20,lessonsPreserved:1104*9,identityNegatives,practicePaths,refusedRegionalPaths,packetNegatives,stalePosts,clinicalApproval:false,patientSpaceRegistration:false}));
});
