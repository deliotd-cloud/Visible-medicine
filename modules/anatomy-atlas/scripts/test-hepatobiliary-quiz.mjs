import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {contentContext} from './content-contract-tools.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
import {build as componentBuild} from './workspace-component-test-build.mjs';
import pins from '../content/hepatobiliary-quiz-pins.json' with {type:'json'};
import {hepatobiliaryQuizQuestions} from '../content/hepatobiliary-quiz.ts';

const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
assert.equal(pins.parentCommit,'e3d71fe4f3ce60169029fa29d0561d81335bad53');
assert.equal(hash(pins),'b2f3a4287f1101b1c9e60683dc70ea182265f4f37d907e665c50aa5cdefef9e7');
const {catalog}=await contentContext();
// Preserve the completed five-question transition at its exact saved epoch.
// The chest-wall suite independently verifies the current resolver and all other topics.
const api=await exactSourceHistoryApi('ee6647564d871ebc86fa81c44c87718feb178567','hepatobiliary-quiz');
const before=await exactSourceHistoryApi(pins.parentCommit,'display-review');
const display=api.bodyDisplayCatalog(catalog);
assert.equal(hash(display),pins.catalogHash);
assert.deepEqual(display,before.bodyDisplayCatalog(catalog));
assert.deepEqual(display.coordinateSystem,pins.coordinateSystem);
for(const name of ['structures','dissectionProfiles'])
  assert.deepEqual(api[name],before[name],`${name} unchanged`);
assert.equal(pins.entries.length,5);
assert.deepEqual(pins.entries.map(e=>e.group),['liver','gallbladder','portal','cystic','hepatic']);
assert.equal(new Set(pins.entries.map(e=>e.identity.id)).size,5);
for(const bundle of pins.bundles){
  assert.deepEqual(display.bundles.find(candidate=>candidate.id===bundle.id),bundle);
  const bytes=await readFile('public'+bundle.url.split('?')[0]);
  assert.equal(bytes.length,bundle.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),bundle.sha256);
}

const {hepatobiliaryQuizLesson,parseBodyReviewResponse}=api;
const targets=new Map(pins.entries.map(e=>[e.identity.id,e]));
let changed=0,preserved=0,refused=0;
for(const structure of display.structures)for(const tab of api.contentTabs){
  const previous=before.bodyLesson(structure,tab),current=api.bodyLesson(structure,tab),entry=targets.get(structure.id);
  if(entry&&tab==='quiz'){
    assert.deepEqual(structure,entry.identity);
    assert.deepEqual(previous,entry.previous);
    assert.equal(previous.readiness,'generated-identification');
    assert.equal(previous.correctAnswer,undefined);
    assert.notDeepEqual(current,previous);
    assert.deepEqual(current,hepatobiliaryQuizLesson(structure,tab),'Actual bodyLesson must route to the new quiz');
    assert.equal(current.readiness,'draft');
    assert.deepEqual(current.bullets,[...hepatobiliaryQuizQuestions[entry.group].choices]);
    assert.equal(current.correctAnswer,hepatobiliaryQuizQuestions[entry.group].correctAnswer);
    assert.equal(current.bullets.filter(choice=>choice===current.correctAnswer).length,1);
    assert(current.explanation.length>0);
    assert.match(current.note,/radiologist review pending/i);
    assert.deepEqual(current.citations,[...hepatobiliaryQuizQuestions[entry.group].references]);
    const {readiness,...shown}=current;
    assert.deepEqual(api.bodyContent(structure,tab),shown);
    changed++;
  }else{
    assert.deepEqual(current,previous,`${structure.id}:${tab}`);
    assert.equal(hepatobiliaryQuizLesson(structure,tab),undefined);
    preserved++;
  }
}
assert.equal(changed,5);
assert.equal(preserved,display.structures.length*api.contentTabs.length-5);
for(const {identity,group} of pins.entries){
  const direct=hepatobiliaryQuizLesson(identity,'quiz');
  const original=structuredClone(direct);
  direct.bullets.push('foreign');direct.citations.push('foreign');
  assert.deepEqual(hepatobiliaryQuizLesson(identity,'quiz'),original,'Fresh lesson arrays');
  for(const mutation of [
    s=>{s.sources[0].sha256='0'.repeat(64)},
    s=>{s.sources=[]},
    s=>{s.bundle='foreign'},
    s=>{s.fmaId='foreign'},
    s=>{s.laterality='foreign'},
    s=>{s.id='foreign'},
    s=>{s.validation.anatomicalReview=true},
    s=>{s.unexpected=true},
  ]){
    const invalid=structuredClone(identity);mutation(invalid);
    assert.equal(hepatobiliaryQuizLesson(invalid,'quiz'),undefined);
    refused++;
  }
  for(const tab of api.contentTabs.filter(tab=>tab!=='quiz'))assert.equal(hepatobiliaryQuizLesson(identity,tab),undefined);
  const packet=await api.bodyReviewMaterial(identity.id);
  const old=await before.bodyReviewMaterial(identity.id);
  assert.equal(packet.approval,false);
  assert.deepEqual(packet.source,old.source);
  assert.deepEqual(packet.reasoning,old.reasoning);
  assert.deepEqual(packet.guidedTours,old.guidedTours);
  assert.notEqual(packet.fingerprints.teaching,old.fingerprints.teaching);
  assert.deepEqual(packet.topics.find(topic=>topic.tab==='quiz'),{tab:'quiz',...original});
  assert.deepEqual(await parseBodyReviewResponse(packet,identity.id),packet);
  assert.equal(await parseBodyReviewResponse(old,identity.id),null,'Old teaching packet must not be accepted');
  const altered=structuredClone(packet);altered.topics.find(topic=>topic.tab==='quiz').correctAnswer='foreign';
  assert.equal(await parseBodyReviewResponse(altered,identity.id),null,'Changed answer with old fingerprint must be refused');
  assert.equal(old.topics.find(topic=>topic.tab==='quiz').readiness,'generated-identification');
}


const require=createRequire(import.meta.url),React=require('react');
const render=require('react-dom/server').renderToStaticMarkup;
const component=await componentBuild({stdin:{contents:"export {StructureQuickCheck} from './app/structure-quick-check';export {QuizNotes,AtlasWorkspace} from './app/atlas-workspace';",resolveDir:process.cwd(),loader:'tsx'},bundle:true,platform:'node',format:'cjs',write:false});
const load=react=>{
  const scope={exports:{}};
  runInNewContext(component.outputFiles[0].text,{module:scope,exports:scope.exports,structuredClone,require:id=>id==='react'?react:id==='next/link'?()=>{throw Error('Unrelated Next Link must not render');}:require(id),console});
  return scope.exports;
};
const actual=load(React);
let states=[],refs=[],cursor=0,refCursor=0,active=false;
const focus={target:null};
const shim={...React,
  useContext:()=>({exam:false}),
  useId:()=>active?'hepatobiliary-check':React.useId(),
  useState(initial){if(!active)return React.useState(initial);const index=cursor++;if(!(index in states))states[index]=initial;return [states[index],value=>{states[index]=value}]},
  useRef(initial){if(!active)return React.useRef(initial);const index=refCursor++;return refs[index]??(refs[index]={current:initial})},
};
const events=load(shim);
const walk=(node,found=[])=>{if(React.isValidElement(node)){found.push(node);React.Children.forEach(node.props.children,child=>walk(child,found))}return found};
const nodeText=node=>typeof node==='string'?node:!node?'':Array.isArray(node)?node.map(nodeText).join(''):nodeText(node.props?.children);
let interacted=0;
for(const {identity} of pins.entries){
  const lesson=hepatobiliaryQuizLesson(identity,'quiz');
  const props={question:lesson.body,choices:lesson.bullets,correctAnswer:lesson.correctAnswer,explanation:lesson.explanation};
  const html=render(React.createElement(actual.StructureQuickCheck,props));
  assert.equal((html.match(/type="radio"/g)||[]).length,4);
  assert.match(html,/<button[^>]*disabled=""[^>]*>Check answer/);
  assert(!html.includes('Correct answer:'));
  assert(!html.includes(render(React.createElement('span',null,props.explanation)).slice(6,-7)));
  // Exercise the real disclosure's lazy callback, not just an isolated quiz.
  states=[];refs=[];cursor=0;refCursor=0;active=true;
  let note=events.QuizNotes({structure:identity});active=false;
  assert.equal(note.type,'details');
  note.props.onToggle({currentTarget:{open:true}});
  cursor=0;refCursor=0;active=true;note=events.QuizNotes({structure:identity});active=false;
  const lazy=walk(note).find(node=>typeof node.type==='function'&&node.type.name==='LazyBodyTeaching');
  assert(lazy.props.enabled);
  const loaded=lazy.props.children({bodyContent:api.bodyContent});
  const quiz=walk(loaded).find(node=>typeof node.type==='function'&&node.type.name==='StructureQuickCheck');
  assert(quiz);assert.deepEqual(JSON.parse(JSON.stringify(quiz.props)),props);
  assert.deepEqual(walk(loaded).filter(node=>node.type==='a').map(node=>node.props.href),lesson.citations);
  const exam=render(React.createElement(actual.AtlasWorkspace,{exam:true},React.createElement(actual.QuizNotes,{structure:identity})));
  assert(!exam.includes('atlas-quiz-notes'));assert(!exam.includes('type="radio"'));
  const attempt=events.StructureQuickCheck(props);
  states=[];refs=[];
  let tree;
  const redraw=()=>{
    cursor=0;refCursor=0;active=true;tree=attempt.type(attempt.props);active=false;
    for(const node of walk(tree))if(node.props.ref)node.props.ref.current={focus(options){assert.equal(options.preventScroll,true);focus.target=node.type==='input'?'first-radio':'feedback'}};
  };
  const radios=()=>walk(tree).filter(node=>node.type==='input');
  const button=label=>walk(tree).find(node=>node.type==='button'&&nodeText(node)===label);
  const answer=index=>{radios()[index].props.onChange();redraw();button('Check answer').props.onClick();redraw()};
  redraw();assert.equal(button('Check answer').props.disabled,true);
  const correct=props.choices.indexOf(props.correctAnswer);
  answer(correct);assert(nodeText(tree).includes('Correct. Correct answer: '+props.correctAnswer));
  assert(nodeText(tree).includes(props.explanation));assert.equal(focus.target,'feedback');
  button('Practise again').props.onClick();redraw();assert.equal(focus.target,'first-radio');
  assert(radios().every(node=>!node.props.checked));
  answer((correct+1)%4);assert(nodeText(tree).includes('Incorrect. Correct answer: '+props.correctAnswer));
  button('Try again').props.onClick();redraw();assert.equal(focus.target,'first-radio');
  assert(radios().every(node=>!node.props.checked));
  interacted++;
}
assert.equal(interacted,5);
console.log(JSON.stringify({passed:true,changed,preserved,sourceRefusals:refused,interacted,clinicalApproval:false}));
