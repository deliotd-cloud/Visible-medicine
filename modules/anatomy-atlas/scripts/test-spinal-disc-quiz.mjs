// Real learner, answer interaction and Review evidence against immutable Git source.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {build} from './workspace-test-build.mjs';
import {build as componentBuild} from './workspace-component-test-build.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
import {beforeSpinalDiscQuiz,hashDiscQuiz as hash} from './spinal-disc-quiz-history.mjs';
import transition from '../content/spinal-disc-quiz.transition.json' with {type:'json'};
const compiled=await build({stdin:{contents:`export {bodyLesson,bodyContent} from './app/body-content';
export {bodyDisplayCatalog} from './lib/body-display-catalog';export {contentTabs} from './lib/content-types';
export * from './lib/spinal-disc-quiz';export * from './content/spinal-disc-quiz';
export {structures} from './app/anatomy-data';export {dissectionProfiles} from './app/dissection-data';
export * from './lib/body-review-material';export * from './lib/body-review-context';
export * from './lib/body-review-response';export {bodyReviewDisplayMatches} from './lib/body-review-display-integrity';`,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const current=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const raw=JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json','utf8')),catalog=current.bodyDisplayCatalog(raw);
const old=await exactSourceHistoryApi(transition.baselineCommit,'review-security',{'content/body-renderer-revision.json':await readFile('content/body-renderer-revision.json','utf8')});
const genuineOld=await exactSourceHistoryApi(transition.baselineCommit,'review-security');
assert.deepEqual(catalog,old.bodyDisplayCatalog(raw));assert.equal(hash(catalog),transition.catalogSha256);
assert.deepEqual(current.structures,old.structures);assert.deepEqual(current.dissectionProfiles,old.dissectionProfiles);
const snapshot={body:catalog.structures.map(s=>({id:s.id,sections:Object.fromEntries(old.contentTabs.map(t=>[t,old.bodyLesson(s,t)]))})),shoulder:old.structures,recipes:old.dissectionProfiles};
assert.equal(hash(snapshot),transition.previousAllLessonsAndRecipesHash);
const targets=new Map(transition.entries.map(e=>[e.identity.id,e]));
let changed=0,preserved=0,unrelatedPackets=0,currentPackets=0,oldPacketsRefused=0,forgedRefusals=0,sourceRefusals=0;
for(const s of catalog.structures)for(const tab of current.contentTabs){
  const a=old.bodyLesson(s,tab),b=current.bodyLesson(s,tab),direct=current.spinalDiscQuizLesson(s,tab);
  if(targets.has(s.id)&&tab==='quiz'){
    const e=targets.get(s.id);assert.deepEqual(s,e.identity);assert.deepEqual(a,e.oldLesson);assert.deepEqual(b,e.newLesson);
    assert.deepEqual(direct,b);assert.notDeepEqual(b,a);assert.equal(b.readiness,'draft');
    assert.equal(b.bullets.length,4);assert.equal(new Set(b.bullets.map(x=>x.trim())).size,4);
    assert.equal(b.bullets.filter(x=>x===b.correctAnswer).length,1);assert(b.explanation.trim());assert(b.bullets.every(x=>x.trim()));
    const {readiness:_readiness,...shown}=b;assert.deepEqual(current.bodyContent(s,tab),shown);changed++;
  }else{assert.equal(direct,undefined);assert.deepEqual(b,a,s.id+' '+tab);preserved++;}
}
assert.equal(changed,22);assert.equal(preserved,9914);assert.equal(Object.keys(current.spinalDiscQuizQuestions).length,5);
assert.deepEqual(Object.values(current.spinalDiscQuizQuestions).map(q=>q.choices.indexOf(q.correctAnswer)),[0,1,2,3,1]);
for(const s of catalog.structures){
  const a=await old.bodyReviewMaterial(s.id),b=await current.bodyReviewMaterial(s.id),ac=await old.bodyReviewContext(s.id),bc=await current.bodyReviewContext(s.id);
  assert.equal(b.approval,false);assert.equal(b.status,'worksheet-not-submitted');
  assert.equal(await current.bodyReviewDisplayMatches(b,s.id),true);assert.deepEqual(await current.parseBodyReviewResponse(b,s.id),b);currentPackets++;
  if(!targets.has(s.id)){assert.deepEqual(b,a,'Unrelated material with explicitly shared current renderer');assert.deepEqual(bc,ac);unrelatedPackets++;continue;}
  const lesson=current.bodyLesson(s,'quiz');assert.deepEqual(current.bodyReviewSnapshot(s.id).topics.find(t=>t.tab==='quiz'),{tab:'quiz',...lesson});
  assert.equal(ac.sourceHash,bc.sourceHash);assert.equal(ac.revisions.geometry,bc.revisions.geometry);assert.notEqual(ac.revisions.teaching,bc.revisions.teaching);
  assert.equal(await current.parseBodyReviewResponse(await genuineOld.bodyReviewMaterial(s.id),s.id),null,'Genuine old packet is not current review evidence');oldPacketsRefused++;
  for(const change of [q=>q.body+=' foreign',q=>q.correctAnswer=q.bullets.find(x=>x!==q.correctAnswer),q=>q.explanation+=' foreign',q=>q.citations[0]='https://foreign.example/']){
    const bad=structuredClone(b);change(bad.topics.find(t=>t.tab==='quiz'));assert.equal(await current.parseBodyReviewResponse(bad,s.id),null);forgedRefusals++;
  }
}
assert.equal(unrelatedPackets,1082);assert.equal(currentPackets,1104);assert.equal(oldPacketsRefused,22);assert.equal(forgedRefusals,88);
const leaves=(value,path=[])=>value===null||typeof value!=='object'?[path]:Object.entries(value).flatMap(([key,child])=>leaves(child,[...path,key]));
for(const {identity}of transition.entries)for(const path of leaves(identity)){
  const bad=structuredClone(identity);let object=bad;for(const key of path.slice(0,-1))object=object[key];const key=path.at(-1),prior=object[key];
  object[key]=typeof prior==='number'?prior+.01:typeof prior==='boolean'?!prior:String(prior)+'-foreign';
  assert.equal(current.spinalDiscQuizLesson(bad,'quiz'),undefined);sourceRefusals++;
}
const axis=transition.entries.find(e=>e.identity.fmaId==='FMA25058');assert(axis.newLesson.correctAnswer.includes('no C1–C2'));assert(axis.newLesson.note.includes('below C2'));
assert(!catalog.structures.some(s=>s.sources.some(p=>p.file==='FJ3211')),'No unresolved T12–L1 mesh admitted');
for(const e of transition.entries){
  assert.equal(e.newLesson.note.includes('no C1–C2'),e===axis);
  if(['thoracicCoverage','surfaceLimits'].includes(e.group))assert(e.newLesson.note.includes('T12–L1 is unresolved'));
  const lesson=current.spinalDiscQuizLesson(e.identity,'quiz');lesson.bullets.push('foreign');lesson.citations.length=0;assert.deepEqual(current.spinalDiscQuizLesson(e.identity,'quiz'),e.newLesson);
}
const restored=beforeSpinalDiscQuiz(current,catalog);assert.equal(beforeSpinalDiscQuiz(old,catalog),old);assert.equal(beforeSpinalDiscQuiz(restored,catalog),restored);
for(const s of catalog.structures)for(const t of current.contentTabs){assert.deepEqual(restored.bodyLesson(s,t),old.bodyLesson(s,t));assert.deepEqual(restored.bodyContent(s,t),old.bodyContent(s,t));}
let predecessorRefusals=0;const reject=(api,source=catalog)=>{assert.throws(()=>beforeSpinalDiscQuiz(api,source));predecessorRefusals++;};
const first=transition.entries[0];
for(const field of ['body','bullets','correctAnswer','explanation','citations','note'])reject({...current,bodyLesson(s,t){const q=current.bodyLesson(s,t);if(s.id!==first.identity.id||t!=='quiz')return q;const bad=structuredClone(q);if(Array.isArray(bad[field]))bad[field].push('foreign');else bad[field]+=' foreign';return bad;}});
reject({...current,bodyLesson(s,t){return s.id===first.identity.id&&t==='quiz'?first.oldLesson:current.bodyLesson(s,t);}});
reject({...current,bodyContent:()=>({body:'foreign'})});reject({...current,spinalDiscQuizLesson:()=>undefined});reject({...current,spinalDiscQuizQuestions:undefined});
const questions=structuredClone(current.spinalDiscQuizQuestions);questions.axis.explanation+=' foreign';reject({...current,spinalDiscQuizQuestions:questions});
const foreignCatalog=structuredClone(catalog);foreignCatalog.structures.find(s=>s.id===first.identity.id).anchor[0]+=.01;reject(current,foreignCatalog);
const absent={};assert.equal(beforeSpinalDiscQuiz(absent),absent);
const early={bodyLesson:()=>undefined,bodyContent:()=>undefined};assert.equal(beforeSpinalDiscQuiz(early,catalog),early);reject({...early,bodyContent:()=>({body:'foreign'})});
const omitted={bodyLesson:current.bodyLesson,bodyContent:current.bodyContent};assert.deepEqual(beforeSpinalDiscQuiz(omitted,catalog).bodyLesson(first.identity,'quiz'),first.oldLesson);
assert.throws(()=>restored.bodyLesson({...first.identity,name:'foreign'},'quiz'));predecessorRefusals++;
const detached=restored.bodyLesson(first.identity,'quiz');detached.body='foreign';assert.deepEqual(restored.bodyLesson(first.identity,'quiz'),first.oldLesson);

// Exercise the same lazy QuizNotes and QuickCheckAttempt used by the learner.
const require=createRequire(import.meta.url),React=require('react'),render=require('react-dom/server').renderToStaticMarkup;
const component=await componentBuild({stdin:{contents:"export {StructureQuickCheck} from './app/structure-quick-check';export {QuizNotes,AtlasWorkspace} from './app/atlas-workspace';",resolveDir:process.cwd(),loader:'tsx'},bundle:true,platform:'node',format:'cjs',write:false});
const load=react=>{const scope={exports:{}};runInNewContext(component.outputFiles[0].text,{module:scope,exports:scope.exports,require:id=>id==='react'?react:id==='next/link'?()=>{throw Error('Unrelated navigation');}:require(id),console,structuredClone});return scope.exports;};
const actual=load(React);let states=[],refs=[],cursor=0,refCursor=0,active=false,focusTarget;
const shim={...React,useContext:()=>({exam:false}),useId:()=>active?'disc-quiz':React.useId(),
  useState(initial){if(!active)return React.useState(initial);const i=cursor++;if(!(i in states))states[i]=initial;return [states[i],value=>{states[i]=value;}];},
  useRef(initial){if(!active)return React.useRef(initial);const i=refCursor++;return refs[i]??(refs[i]={current:initial});}};
const events=load(shim),walk=(node,found=[])=>{if(React.isValidElement(node)){found.push(node);React.Children.forEach(node.props.children,child=>walk(child,found));}return found;};
const text=node=>typeof node==='string'?node:!node?'':Array.isArray(node)?node.map(text).join(''):text(node.props?.children);
let rendered=0,interacted=0;const attemptKeys=new Set();
for(const {identity,newLesson:lesson}of transition.entries){
  const props={question:lesson.body,choices:lesson.bullets,correctAnswer:lesson.correctAnswer,explanation:lesson.explanation},attempt=events.StructureQuickCheck(props);attemptKeys.add(attempt.key);
  assert.equal(attempt.key,JSON.stringify(props));assert.notEqual(attempt.key,events.StructureQuickCheck({...props,explanation:props.explanation+' revised'}).key);
  states=[];refs=[];cursor=0;refCursor=0;active=true;let note=events.QuizNotes({structure:identity});active=false;assert.equal(note.type,'details');
  assert.equal(walk(note).find(n=>typeof n.type==='function'&&n.type.name==='LazyBodyTeaching').props.enabled,false);
  note.props.onToggle({currentTarget:{open:true}});cursor=0;active=true;note=events.QuizNotes({structure:identity});active=false;
  const lazy=walk(note).find(n=>typeof n.type==='function'&&n.type.name==='LazyBodyTeaching');assert(lazy.props.enabled);
  const loaded=lazy.props.children({bodyContent:current.bodyContent}),child=walk(loaded).find(n=>typeof n.type==='function'&&n.type.name==='StructureQuickCheck');
  assert.equal(child.key,identity.id);assert.deepEqual(JSON.parse(JSON.stringify(child.props)),props);assert.deepEqual(walk(loaded).filter(n=>n.type==='a').map(n=>n.props.href),lesson.citations);
  const html=render(React.createElement(actual.StructureQuickCheck,props));assert.equal((html.match(/type="radio"/g)||[]).length,4);assert(html.includes('<fieldset'));assert(!html.includes('Correct answer:'));assert(!html.includes('answer key is missing'));
  const exam=render(React.createElement(actual.AtlasWorkspace,{exam:true},React.createElement(actual.QuizNotes,{structure:identity})));assert(!exam.includes('atlas-quiz-notes'));rendered++;
  states=[];refs=[];let tree;
  const redraw=()=>{cursor=0;refCursor=0;active=true;tree=attempt.type(attempt.props);active=false;for(const n of walk(tree))if(n.props.ref)n.props.ref.current={focus(options){assert.equal(options.preventScroll,true);focusTarget=n.type==='input'?'first-radio':'feedback';}};};
  const radios=()=>walk(tree).filter(n=>n.type==='input'),button=label=>walk(tree).find(n=>n.type==='button'&&text(n)===label);
  const answer=index=>{radios()[index].props.onChange();redraw();button('Check answer').props.onClick();redraw();};
  redraw();assert.equal(button('Check answer').props.disabled,true);const correct=props.choices.indexOf(props.correctAnswer);
  answer(correct);assert(text(tree).includes('Correct. Correct answer: '+props.correctAnswer));assert(text(tree).includes(props.explanation));assert.equal(focusTarget,'feedback');
  button('Practise again').props.onClick();redraw();assert.equal(focusTarget,'first-radio');assert(radios().every(n=>!n.props.checked));
  answer((correct+1)%4);assert(text(tree).includes('Incorrect. Correct answer: '+props.correctAnswer));assert(text(tree).includes(props.explanation));
  button('Try again').props.onClick();redraw();assert.equal(focusTarget,'first-radio');assert(radios().every(n=>!n.props.checked));
  answer((correct+1)%4);radios()[correct].props.onChange();redraw();assert(!text(tree).includes('Correct answer:'));assert(!text(tree).includes(props.explanation));interacted++;
}
assert.equal(attemptKeys.size,5);assert.equal(rendered,22);assert.equal(interacted,22);
console.log(JSON.stringify({changedQuizPlacements:changed,originalTemplates:5,otherTopicsExact:preserved,unrelatedMaterialsAndContextsExactWithSharedRenderer:unrelatedPackets,currentPackets, genuineOldPacketsRefused:oldPacketsRefused,forgedRefusals,sourceRefusals,predecessorRefusals,actualQuizRenders:rendered,actualAnswerInteractions:interacted,clinicalApproval:false}));
