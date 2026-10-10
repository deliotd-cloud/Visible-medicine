import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile,writeFile} from 'node:fs/promises';
import {relative,dirname} from 'node:path';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {build} from './workspace-component-test-build.mjs';
const baseline='24d023f471d39d7d1e4660fb4f20264528bdd6fe',root=process.cwd();
// This is the immutable170-concept thoracic-core milestone, not current-bank
// coverage. test-lower-venous-reasoning validates the current176-concept bank.
const milestone='193fb837176dd3bb2a991754f2f2f087c55978b3';
const old=p=>execFileSync('git',['show',baseline+':'+p],{encoding:'utf8',maxBuffer:32e6});
const read=p=>readFile(p,'utf8'),same=(a,b,m)=>assert.deepEqual(structuredClone(a),structuredClone(b),m);
async function load(previous=false){
 const result=await build({stdin:{contents:`export * from './lib/reasoning-questions';
 export * from './lib/atlas-practice'; export * from './lib/body-review-material';
 export {bodyDisplayCatalog} from './lib/body-display-catalog';
 export {ReasoningFeedback} from './app/reasoning-feedback';`,resolveDir:root,loader:'ts'},
 bundle:true,write:false,format:'cjs',platform:'node',packages:'external',jsx:'automatic',
 plugins:[{name:'exact-thoracic-core-milestone',setup(api){api.onLoad({filter:/reasoning-questions\.ts$/},args=>{
  if(relative(root,args.path).replaceAll('\\','/')!=='lib/reasoning-questions.ts')return;
  return{contents:execFileSync('git',['show',(previous?baseline:milestone)+':lib/reasoning-questions.ts'],{encoding:'utf8',maxBuffer:32e6}),loader:'ts',resolveDir:dirname(args.path)};
 });}}]});
 const module={exports:{}},require=createRequire(root+'/package.json');
 runInNewContext(result.outputFiles[0].text,{module,exports:module.exports,require,crypto,TextEncoder,structuredClone,URL,URLSearchParams});
 return module.exports;
}
const previous=await load(true),current=await load(),raw=JSON.parse(await read('public/models/bodyparts3d/full-body/catalog.json'));
const catalog=current.bodyDisplayCatalog(raw),pins=JSON.parse(await read('content/thoracic-core-reasoning-pins.json'));
same(current.reasoningConcepts.slice(0,166),previous.reasoningConcepts,'All prior166 question definitions and order preserved');
same(current.reasoningConcepts.slice(166).map(c=>c.key),['thoracic-core-heart','thoracic-core-lung','thoracic-core-right-main-bronchus','thoracic-core-left-main-bronchus']);
assert.equal(current.reasoningConcepts.length,170);assert.equal(pins.entries.length,5);
same(await read('lib/atlas-practice.ts'),old('lib/atlas-practice.ts'),'Shared answer/filter/history engine unchanged');
same(await read('lib/anatomy-practice.ts'),old('lib/anatomy-practice.ts'),'Identification engine unchanged');
same(await read('public/models/bodyparts3d/full-body/catalog.json'),old('public/models/bodyparts3d/full-body/catalog.json'));
same(catalog.coordinateSystem,pins.coordinateSystem);assert.equal(catalog.sourceVersion,pins.sourceVersion);
const targets=new Set(pins.entries.map(e=>e.identity.id)),loaded=catalog.bundles.map(b=>b.id);
const create=(items,target,bundles=loaded,random=()=>0.314159)=>current.createPracticeSession(items,bundles,{id:1,mode:'reason',sampling:'all',count:1,retryIds:[target]},random);
const require=createRequire(root+'/package.json'),{createElement}=require('react'),{renderToStaticMarkup}=require('react-dom/server');
let changed=0,unchanged=0,sourceMutations=0,answerCases=0;
for(const entry of pins.entries){
 const target=catalog.structures.find(s=>s.id===entry.identity.id);same(target,entry.identity);
 assert.equal(current.reasoningConceptFor(target)?.key,entry.key);
 same(catalog.bundles.find(b=>b.id===target.bundle),pins.bundles.find(b=>b.id===target.bundle));
 const concept=current.reasoningConceptFor(target);
 for(const patch of [{id:'foreign'},{name:'Renamed surface'},{fmaId:'FMA0'},{laterality:'unspecified'},
  {sourceTree:target.sourceTree==='isa'?'partof':'isa'},{region:'abdomen'},{regions:['abdomen']},
  {bundle:'foreign.glb'},{nodeName:'foreign'},{bounds:[0,0,0,1,1,1]},
  {sources:target.sources.map((s,i)=>i? s:{...s,sha256:'0'.repeat(64)})},
  {sources:[...target.sources].reverse()}, {sources:[]}, {sources:[...target.sources,...target.sources]}]){
  if(JSON.stringify({...target,...patch})===JSON.stringify(target))continue;
  assert.equal(current.reasoningConceptFor({...target,...patch}),undefined,'Reject changed complete source identity');sourceMutations++;
 }
 for(const scope of [catalog.structures,catalog.structures.filter(s=>s.regions.includes('thorax'))]){
  for(const random of [()=>0,()=>0.314159,()=>0.999999]){
   const session=create(scope,target.id,loaded,random);assert(session);assert.equal(session.questions[0].target,target.id);
   const q=session.questions[0];assert.equal(q.reasoning.key,entry.key);assert.equal(new Set(q.choices).size,q.choices.length);
   assert.equal(q.choices.length,target.laterality==='unpaired'?4:2);
   for(const id of q.choices){const selected=scope.find(s=>s.id===id);assert(selected);assert.equal(selected.laterality,target.laterality);}
   assert.equal(renderToStaticMarkup(createElement(current.ReasoningFeedback,{session})), '','No feedback before response');
   const action={sessionId:session.id,index:0};
   const answered=current.practiceReducer(session,{type:'answer',...action,chosen:target.id});
   assert.equal(current.practiceScore(answered),1,'Correct picked identity must count correct');
   same(current.practiceReducer(answered,{type:'answer',...action,chosen:q.choices.find(id=>id!==target.id)}),answered,'Answer once');
   assert(renderToStaticMarkup(createElement(current.ReasoningFeedback,{session:answered})).includes('Sources &amp; scope'));
   assert(renderToStaticMarkup(createElement(current.ReasoningFeedback,{session:answered})).includes('review pending'));
   const wrong=current.practiceReducer(session,{type:'answer',...action,chosen:q.choices.find(id=>id!==target.id)});assert.equal(current.practiceScore(wrong),0);
   const finished=current.practiceReducer(wrong,{type:'next',...action});same(current.missedPracticeIds(finished.responses),[target.id]);answerCases++;
  }
 }
 assert.equal(create(catalog.structures.filter(s=>s.id!==target.id),target.id),null,'Hidden target excluded');
 assert.equal(create(catalog.structures,target.id,loaded.filter(b=>b!==target.bundle)),null,'Unloaded target excluded');
 assert.equal(create([target],target.id),null,'No authored loaded alternative means no question');
 assert.equal(create(catalog.structures,target.id)?.questions[0].reasoning.explanation,concept.explanation);
}
for(const s of catalog.structures){
 const before=await previous.bodyReviewMaterial(s.id),after=await current.bodyReviewMaterial(s.id);
 same(after.source,before.source,s.id+': source/frame unchanged');same(after.topics,before.topics,s.id+': all9 topic slots unchanged');
 same(after.guidedTours,before.guidedTours);same(after.fingerprints.source,before.fingerprints.source);
 assert.equal(after.approval,false);assert.equal(after.status,'worksheet-not-submitted');
 if(targets.has(s.id)){assert.equal(before.reasoning,null);assert(after.reasoning);assert.notEqual(after.fingerprints.teaching,before.fingerprints.teaching);changed++;}
 else{same(after.reasoning,before.reasoning,s.id+': existing interactive question preserved');same(after.fingerprints.teaching,before.fingerprints.teaching);unchanged++;}
}
assert.equal(changed,5);assert.equal(unchanged,1099);
const report={baseline,milestone,scope:'Immutable thoracic-core question-bank milestone; current bank checked separately',concepts:170,boundRepresentations:313,newConcepts:4,newRootTargets:5,existingQuestionsPreserved:166,
 unchangedRootTeaching:1099,unchangedTopicPlacements:9936,sourceMutations,answerCases,
 geometryAndRightsUnchanged:true,clinicalApproval:false,browserAcceptance:false};
await writeFile('docs/thoracic-core-reasoning-validation.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
