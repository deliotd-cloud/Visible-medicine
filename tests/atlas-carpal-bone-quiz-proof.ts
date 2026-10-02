import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {dirname,relative} from 'node:path';
import {build} from 'esbuild';
import pins from '../atlas-review/content/carpal-bone-quiz-pins.json' with {type:'json'};
import {carpalBoneQuizQuestions} from '../atlas-review/content/carpal-bone-quiz.ts';

const parent='992b1d2fd99e5304157005d41d394f1500ec21b1';
assert.equal(pins.parentCommit,'acd99b11e279a0525f1488456c0a8adf2abb2cf7');
const old=(path:string)=>execFileSync('git',['show',parent+':atlas-review/'+path],{maxBuffer:16e6});
const entry=`export * from './atlas-review/lib/body-review-material';export * from './atlas-review/lib/body-review-context';
export * from './atlas-review/lib/body-review-response';export * from './atlas-review/lib/body-review-decisions';
export * from './atlas-review/lib/body-review-api';export * from './atlas-review/lib/regional-tours';
export * from './atlas-review/lib/nested-review-material';
export {structures} from './atlas-review/app/anatomy-data';export {dissectionProfiles} from './atlas-review/app/dissection-data';
import raw from './atlas-review/public/models/bodyparts3d/full-body/catalog.json';
import {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';export const catalog=bodyDisplayCatalog(raw as any);`;
async function load(previous=false){
  const replay=new Set(['app/body-content.ts','content/body-review-display-pins.json','content/body-renderer-revision.json']);
  const result=await build({stdin:{contents:entry,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm',
    plugins:previous?[{name:'pre-carpal-bone-quiz',setup(api){api.onLoad({filter:/.*/,namespace:'file'},args=>{
      const path=relative(process.cwd(),args.path).replaceAll('\\','/').replace(/^atlas-review\//,'');
      if(!replay.has(path))return;
      return {contents:old(path).toString(),loader:path.endsWith('.json')?'json':'ts',resolveDir:dirname(args.path)};
    });}}]:[]});
  return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
}
export async function carpalQuizHostProof(){
const api=await load(),before=await load(true);
const targets=new Map<string,any>(pins.entries.map(entry=>[entry.identity.id,entry]));
assert.equal(targets.size,16);
assert.equal(api.catalog.structures.length,1104);
assert.deepEqual(api.catalog,before.catalog);
assert.deepEqual(api.structures,before.structures);
assert.deepEqual(api.dissectionProfiles,before.dissectionProfiles);
assert.deepEqual(api.regionalTours,before.regionalTours);

for(const path of [
  'public/models/bodyparts3d/full-body/catalog.json','lib/body-display-catalog.ts',
  'app/anatomy-data.ts','app/dissection-data.ts','lib/regional-tours.ts',
  'lib/nested-teaching.ts','app/nested-teaching.tsx','content/nested-teaching.ts',
  'content/nested-teaching-bindings.v1.json','lib/nested-education-binding.ts',
  'lib/body-review-api.ts','lib/body-review-material.ts','lib/body-review-context.ts',
  'lib/body-review-response.ts','lib/body-review-decisions.ts',
]) assert.deepEqual(readFileSync('atlas-review/'+path),old(path),path+' preserved at exact parent');

const pinsPath='content/body-review-display-pins.json';
type DisplayPin={structureId:string;sha256:string};
const priorPins:{pins:DisplayPin[]}=JSON.parse(old(pinsPath).toString()),currentPins:{pins:DisplayPin[]}=JSON.parse(readFileSync('atlas-review/'+pinsPath,'utf8'));
assert.deepEqual({...currentPins,pins:[]},{...priorPins,pins:[]});
assert.equal(currentPins.pins.length,1104);
assert.deepEqual(currentPins.pins.map(pin=>pin.structureId),priorPins.pins.map(pin=>pin.structureId));
const priorPinById=new Map(priorPins.pins.map(pin=>[pin.structureId,pin.sha256]));
assert.deepEqual(currentPins.pins.filter(pin=>pin.sha256!==priorPinById.get(pin.structureId)).map(pin=>pin.structureId).sort(),[...targets.keys()].sort());
const priorRenderer=JSON.parse(old('content/body-renderer-revision.json').toString());
const currentRenderer=JSON.parse(readFileSync('atlas-review/content/body-renderer-revision.json','utf8'));
assert.notEqual(currentRenderer.sha256,priorRenderer.sha256);

const storage={prepare(){throw Error('Stale synthetic review reached storage');}};
const staleRequest=async(context:any,revisionHash:string,track:any)=>{
  const payload={catalogScope:context.catalogScope,structureId:context.structureId,track,expectedVersion:0,
    materialHash:context.materialHash,revisionHash,checklistVersion:context.checklistVersion,
    draft:api.blankBodyReview(context,track)};
  return api.postBodyDecision(new Request('https://atlas.test/api/body-decisions',{method:'POST',
    headers:{origin:'https://atlas.test','content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_CARPAL_QUIZ_TEST'},
    body:JSON.stringify(payload)}),storage);
};
const leaves=(value:any,path:string[]=[]):string[][]=>value===null||typeof value!=='object'?[path]:Object.entries(value).flatMap(([key,child])=>leaves(child,[...path,key]));
let selections=0,unchangedTopics=0,changedTopics=0,packets=0,rejectedPackets=0,staleRejected=0;
for(const structure of api.catalog.structures){
  const id=structure.id,target=targets.get(id);
  const now=await api.bodyReviewMaterial(id),prior=await before.bodyReviewMaterial(id);
  assert(now); assert(prior); assert.equal(now.approval,false);
  assert.equal(now.status,'worksheet-not-submitted');
  assert.deepEqual(now.source,prior.source);
  assert.deepEqual(now.reasoning,prior.reasoning);
  assert.deepEqual(now.guidedTours,prior.guidedTours);
  assert.deepEqual(now.checklist,prior.checklist);
  assert.equal(now.topics.length,9);
  for(let index=0;index<now.topics.length;index++){
    if(target&&now.topics[index].tab==='quiz'){
      const quiz=now.topics[index],question=(carpalBoneQuizQuestions as any)[target.group];
      assert.deepEqual(now.source.structure,target.identity);
      assert.deepEqual(target.topics,['quiz']);
      assert.deepEqual(prior.topics[index],{tab:'quiz',...target.previous.quiz});
      assert.equal(quiz.readiness,'draft');
      assert.equal(quiz.body,question.body);
      assert.deepEqual(quiz.bullets,[...question.choices]);
      assert.equal(quiz.correctAnswer,question.correctAnswer);
      assert.equal(quiz.explanation,question.explanation);
      assert.deepEqual(quiz.citations,[question.reference]);
      assert.notDeepEqual(quiz,prior.topics[index]); changedTopics++;
    }else{assert.deepEqual(now.topics[index],prior.topics[index],id+'|'+now.topics[index].tab);unchangedTopics++;}
  }
  const current=await api.bodyReviewContext(id),previous=await before.bodyReviewContext(id);
  assert(current); assert(previous);
  assert.equal(current.sourceHash,previous.sourceHash);
  assert.deepEqual(current.blockers,previous.blockers);
  assert.equal(current.revisions.imaging,null);
  assert.notEqual(current.revisions.geometry,previous.revisions.geometry);
  assert.equal((await staleRequest(current,previous.revisions.geometry,'geometry')).status,409); staleRejected++;
  if(!target){
    assert.deepEqual(now,prior);
    assert.equal(current.revisions.teaching,previous.revisions.teaching);
    selections++; continue;
  }
  assert.notEqual(current.revisions.teaching,previous.revisions.teaching);
  assert(current.teachingTabs.includes('quiz'));
  assert(current.checklists.teaching.some((check:{id:string})=>check.id==='drafts'));
  assert.deepEqual(await api.parseBodyReviewResponse(now,id),now); packets++;
  assert.equal((await staleRequest(current,previous.revisions.teaching,'teaching')).status,409); staleRejected++;

  const quizIndex=now.topics.findIndex((topic:{tab:string})=>topic.tab==='quiz');
  const mutations=[
    (packet:any)=>{packet.topics[quizIndex].body+=' foreign';},
    (packet:any)=>{packet.topics[quizIndex].bullets[0]+=' foreign';},
    (packet:any)=>{packet.topics[quizIndex].correctAnswer=packet.topics[quizIndex].bullets.find((choice:string)=>choice!==packet.topics[quizIndex].correctAnswer);},
    (packet:any)=>{packet.topics[quizIndex].explanation+=' foreign';},
    (packet:any)=>{packet.topics[quizIndex].citations[0]+='?foreign';},
    (packet:any)=>{packet.topics[quizIndex].readiness='approved';},
    (packet:any)=>{packet.approval=true;},
    (packet:any)=>{packet.topics.splice(quizIndex,1);},
  ];
  for(const mutate of mutations){
    const foreign=structuredClone(now);mutate(foreign);
    assert.equal(await api.parseBodyReviewResponse(foreign,id),null);rejectedPackets++;
  }
  for(const path of leaves(target.identity)){
    const foreign=structuredClone(now);let object=foreign.source.structure;
    for(const key of path.slice(0,-1))object=object[key];
    const key=path.at(-1);assert(key!==undefined);const oldValue=object[key];
    object[key]=typeof oldValue==='number'?oldValue+.01:typeof oldValue==='boolean'?!oldValue:String(oldValue)+'-foreign';
    assert.equal(await api.parseBodyReviewResponse(foreign,id),null);rejectedPackets++;
  }
  selections++;
}
assert.equal(selections,1104);
assert.equal(changedTopics,16);
assert.equal(unchangedTopics,9920);
assert.equal(packets,16);
assert.equal(staleRejected,1120);
return {api,before,parent,selections,changedTopics,unchangedTopics,reviewPackets:packets,
  rejectedPackets,staleRejectedBeforeStorage:staleRejected,clinicalApproval:false,patientRegistration:false};
}
