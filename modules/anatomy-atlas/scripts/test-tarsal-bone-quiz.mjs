import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {dirname,relative} from 'node:path';
import {build} from './workspace-component-test-build.mjs';
import {beforeTarsalBoneQuiz} from './tarsal-bone-quiz-history.mjs';
import pins from '../content/tarsal-bone-quiz-pins.json' with {type:'json'};
const root=process.cwd(),baseline='871c57b7729476bb08cbf04d58732b90fc4b52c5';
// Freeze the pre-hand-CT epoch for this batch's unchanged 14-placement golden.
// A separate live check below still exercises today's quiz renderer and packets.
const milestone='946700cc8c5162076cd5e5d9f79a00ba72c6fda1';
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const same=(a,b,message)=>assert.deepEqual(structuredClone(a),structuredClone(b),message);
const old=path=>execFileSync('git',['show',baseline+':'+path],{encoding:'utf8',maxBuffer:32e6});
const require=createRequire(root+'/package.json'),React=require('react'),render=require('react-dom/server').renderToStaticMarkup;
let exam=false,openingQuiz=false;
const shim={...React,useContext:context=>typeof context._currentValue==='boolean'?true:{exam},useState(initial){return openingQuiz?[true,()=>{}]:React.useState(initial);}};
async function load(previous=false,live=false){
 const built=await build({stdin:{contents:`export * from './app/body-content'; export * from './lib/content-types';
 export * from './lib/tarsal-bone-quiz'; export * from './content/tarsal-bone-quiz';
 export {bodyDisplayCatalog} from './lib/body-display-catalog'; export * from './lib/body-review-material';
 export * from './lib/body-review-context'; export * from './lib/body-review-response'; export * from './lib/body-review-api';
 export * from './lib/body-review-decisions'; export {QuizNotes} from './app/atlas-workspace'; export {bodyTeachingLoader} from './lib/body-teaching-loader';`,resolveDir:root,loader:'tsx'},bundle:true,write:false,platform:'node',format:'cjs',packages:'external',
 plugins:live?[]:[{name:'exact-tarsal-quiz-epoch',setup(api){api.onLoad({filter:/\.(?:ts|json)$/},args=>{
  const path=relative(root,args.path).replaceAll('\\','/');
  if(!['app/body-content.ts','content/body-review-display-pins.json','content/body-renderer-revision.json'].includes(path))return;
  const revision=previous&&path==='app/body-content.ts'?baseline:milestone;
  return{contents:execFileSync('git',['show',revision+':'+path],{encoding:'utf8',maxBuffer:32e6}),loader:path.endsWith('.json')?'json':'ts',resolveDir:dirname(args.path)};
 });}}]});
 const module={exports:{}};
 runInNewContext(built.outputFiles[0].text,{module,exports:module.exports,require:id=>id==='react'?shim:id==='next/link'?()=>{throw Error('Unexpected Link render');}:require(id),crypto,TextEncoder,TextDecoder,structuredClone,URL,URLSearchParams,Request,Response,Headers});return module.exports;
}
const previous=await load(true),current=await load();
// Prime the real lazy loader, then represent an opened notes control. Nested
// loader/check components retain real React hooks; this is not a browser claim.
await current.bodyTeachingLoader.load();
function quizHtml(s,api=current){openingQuiz=true;let tree;try{tree=api.QuizNotes({structure:s});}finally{openingQuiz=false;}return render(tree);}
const catalog=current.bodyDisplayCatalog(JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json')));
assert.equal(pins.parentCommit,baseline);assert.equal(pins.previousCatalogHash,hash(catalog));same(pins.coordinateSystem,catalog.coordinateSystem);assert.equal(pins.sourceVersion,catalog.sourceVersion);assert.equal(pins.license,catalog.license);
assert.equal(pins.entries.length,14);const targets=new Map(pins.entries.map(e=>[e.identity.id,e]));assert.equal(targets.size,14);
for(const [group,fmas]of Object.entries(current.tarsalBoneQuizGroups)){same(pins.entries.filter(e=>e.group===group).map(e=>e.identity.fmaId).sort(),[...fmas].sort());}
const snapshot=api=>catalog.structures.map(s=>({id:s.id,topics:api.contentTabs.map(tab=>({tab,...api.bodyLesson(s,tab)}))}));
assert.equal(hash(snapshot(previous)),pins.previousAllTopicsHash,'Immutable 9936-topic baseline');
const replay=beforeTarsalBoneQuiz(current);assert.equal(beforeTarsalBoneQuiz(replay),replay);assert.equal(hash(snapshot(replay)),pins.previousAllTopicsHash,'Exact editorial rollback');
for(const b of pins.bundles){const bytes=await readFile('public'+b.url.split('?')[0]);assert.equal(bytes.length,b.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),b.sha256);same(catalog.bundles.find(x=>x.id===b.id),b);}
for(const path of ['public/models/bodyparts3d/full-body/catalog.json','LICENSES/THIRD_PARTY_NOTICES.md','package-lock.json'])assert.equal((await readFile(path,'utf8')).replaceAll('\r\n','\n'),old(path).replaceAll('\r\n','\n'),path+' unchanged');
let changed=0,preserved=0,rendered=0,refusals=0,reviewChanges=0,stale=0,historyRefusals=0;
const escape=value=>render(React.createElement('span',null,value)).slice(6,-7);
const budgets={};
for(const q of Object.values(current.tarsalBoneQuizQuestions)){assert.equal(new Set(q.choices).size,4);assert.equal(q.choices.filter(c=>c===q.correctAnswer).length,1);const n=(q.body+' '+q.choices.join(' ')+' '+q.explanation).match(/\S+/g).length;budgets[q.reference]=(budgets[q.reference]??0)+n;if(q.additionalReference)budgets[q.additionalReference]=(budgets[q.additionalReference]??0)+n;}
for(const n of Object.values(budgets))assert(n<=200,'New-batch reference word budget');
for(const s of catalog.structures){
 const entry=targets.get(s.id);
 for(const tab of current.contentTabs){const before=previous.bodyLesson(s,tab),after=current.bodyLesson(s,tab),explicit=current.tarsalBoneQuizLesson(s,tab);
  if(!entry||tab!=='quiz'){assert.equal(explicit,undefined);same(after,before,s.id+'|'+tab);preserved++;continue;}
  same(s,entry.identity);same(before,entry.previous.quiz);assert.equal(before.readiness,'generated-identification');assert.equal(after.readiness,'draft');same(after,explicit);changed++;
  const q=current.tarsalBoneQuizQuestions[entry.group];assert.equal(after.correctAnswer,q.correctAnswer);assert.equal(after.explanation,q.explanation);assert(after.note.includes('radiologist review'));assert(after.note.includes('access remain independent'));
  const html=quizHtml(s);assert.equal((html.match(/type="radio"/g)||[]).length,4);assert.match(html,/>Check answer<\/button>/);assert(!html.includes('Correct answer:'));assert(!html.includes(escape(after.explanation)));assert(html.includes(escape(after.body)));assert(html.includes(escape(after.note)));for(const url of after.citations)assert(html.includes(escape(url)));rendered++;
  exam=true;assert.equal(quizHtml(s),'');exam=false;
  const detached=structuredClone(after);after.bullets.push('foreign');after.citations.push('foreign');same(current.bodyLesson(s,tab),detached,'Defensive copy');
 }
 const priorReview=await previous.bodyReviewMaterial(s.id),nextReview=await current.bodyReviewMaterial(s.id);
 same(nextReview.source,priorReview.source);same(nextReview.reasoning,priorReview.reasoning);same(nextReview.guidedTours,priorReview.guidedTours);assert.equal(nextReview.approval,false);assert.equal(nextReview.fingerprints.source,priorReview.fingerprints.source);
 if(!entry){assert.equal(nextReview.fingerprints.teaching,priorReview.fingerprints.teaching);continue;}
 reviewChanges++;assert.notEqual(nextReview.fingerprints.teaching,priorReview.fingerprints.teaching);assert(await current.parseBodyReviewResponse(nextReview,s.id));
 const foreign=structuredClone(nextReview);foreign.topics.find(t=>t.tab==='quiz').correctAnswer='Foreign';assert.equal(await current.parseBodyReviewResponse(foreign,s.id),null);
 const context=await current.bodyReviewContext(s.id),priorContext=await previous.bodyReviewContext(s.id);assert.equal(context.revisions.imaging,null);assert.notEqual(context.revisions.teaching,priorContext.revisions.teaching);
 const storage=new Proxy({},{get(){throw Error('Stale request reached private storage');}});
 for(const delta of [{materialHash:priorReview.materialHash},{revisionHash:priorContext.revisions.teaching}]){const response=await current.postBodyDecision(new Request('https://review.test/api/body-decisions',{method:'POST',headers:{origin:'https://review.test','content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_TARSAL_REVIEW'},body:JSON.stringify({catalogScope:context.catalogScope,structureId:s.id,track:'teaching',expectedVersion:0,materialHash:context.materialHash,revisionHash:context.revisions.teaching,checklistVersion:context.checklistVersion,draft:current.blankBodyReview(context,'teaching'),...delta})}),storage);assert.equal(response.status,409);stale++;}
 assert.throws(()=>replay.bodyLesson({...s,name:'Foreign'},'quiz'));historyRefusals++;
 for(const changedLesson of [{...current.bodyLesson(s,'quiz'),correctAnswer:'Foreign'},entry.previous.quiz]){assert.throws(()=>beforeTarsalBoneQuiz({...current,bodyLesson(st,tab){return st.id===s.id&&tab==='quiz'?changedLesson:current.bodyLesson(st,tab);}}));historyRefusals++;}
}
for(const e of pins.entries)for(const patch of [{id:'foreign'},{name:'Foreign'},{fmaId:'FMA0'},{laterality:'foreign'},{regions:[]},{region:'foreign'},{system:'foreign'},{category:'foreign'},{sourceTree:'foreign'},{sourceName:'foreign'},{bundle:'foreign.glb'},{nodeName:'foreign'},{bounds:{min:[0,0,0],max:[1,1,1]}},{anchor:[0,0,0]},{sources:[]},{sources:[...e.identity.sources,...e.identity.sources]},{sources:e.identity.sources.map(f=>({...f,sha256:'0'.repeat(64)}))},{validation:{status:'foreign'}}]){assert.equal(current.tarsalBoneQuizLesson({...e.identity,...patch},'quiz'),undefined);refusals++;}
assert.equal(changed,14);assert.equal(preserved,9922);assert.equal(rendered,14);assert.equal(reviewChanges,14);assert.equal(stale,28);assert.equal(refusals,252);assert.equal(historyRefusals,42);
const live=await load(false,true);await live.bodyTeachingLoader.load();let liveQuizChecks=0;
for(const {identity}of pins.entries){
 same(live.bodyLesson(identity,'quiz'),current.bodyLesson(identity,'quiz'),'Current quiz remains exact');
 const packet=await live.bodyReviewMaterial(identity.id);assert(await live.parseBodyReviewResponse(packet,identity.id));
 assert.equal(packet.approval,false);assert.equal((quizHtml(identity,live).match(/type="radio"/g)||[]).length,4);
 exam=true;assert.equal(quizHtml(identity,live),'');exam=false;liveQuizChecks++;
}
assert.equal(liveQuizChecks,14);
const report={baseline,newDraftPlacements:changed,preservedTopicPlacements:preserved,changedTeachingWorksheets:reviewChanges,unchangedTeachingWorksheets:catalog.structures.length-reviewChanges,actualQuizSSRRenderings:rendered,examSuppression:14,stalePostRefusalsBeforeStorage:stale,sourceMutationRefusals:refusals,historyRefusals,referenceWordCounts:budgets,modelsAndLicensesUnchanged:true,clinicalApproval:false,browserAcceptance:false};
await writeFile('docs/tarsal-bone-quiz-validation.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
console.log(JSON.stringify({historicalMilestone:milestone,liveQuizChecks,liveClinicalApproval:false,browserAcceptance:false}));
