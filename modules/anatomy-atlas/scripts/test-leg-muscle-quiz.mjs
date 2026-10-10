import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {mkdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {join} from 'node:path';
import {contentContext} from './content-contract-tools.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
import {build} from './workspace-test-build.mjs';
import {build as componentBuild} from './workspace-component-test-build.mjs';
import pins from '../content/leg-muscle-quiz-pins.json' with {type:'json'};
import {legMuscleQuizQuestions} from '../content/leg-muscle-quiz.ts';

assert.equal(process.argv.length,2,'No test-mode arguments are accepted');
const evidenceDir=process.env.LEG_MUSCLE_QUIZ_EVIDENCE_DIR;
if(evidenceDir){
  const chunks=[];
  for(const stream of [process.stdout,process.stderr]){
    const original=stream.write.bind(stream);
    stream.write=(chunk,...args)=>{
      chunks.push(Buffer.isBuffer(chunk)?chunk.toString('utf8'):String(chunk));
      return original(chunk,...args);
    };
  }
  process.on('exit',()=>{
    mkdirSync(evidenceDir,{recursive:true});
    const log=chunks.join('');
    writeFileSync(join(evidenceDir,'focused-test.log'),log);
    const last=log.trimEnd().split(/\r?\n/).at(-1);
    try{writeFileSync(join(evidenceDir,'focused-result.json'),JSON.stringify(JSON.parse(last),null,2)+'\n');}
    catch{ /* A failed assertion has no success result. Keep its full log. */ }
  });
}
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
assert.equal(pins.parentCommit,'4bb7a85b962e2cbd20ee9f329ddd0ae38e4f0642');
assert.equal(hash(pins),'41486d28b006b7651fb75ad2ecb1244cf90078fbcb12de49876c384fd915b0c9');
const {api,catalog}=await contentContext();
const before=await exactSourceHistoryApi(pins.parentCommit,'display-review');
// Freeze this completed epoch's preservation comparison; the forefoot suite
// checks every current non-target against this completed source parent.
const completed=await exactSourceHistoryApi('7952a8a136a92700c6905908ab97aa0838b21e55','display-review');
const display=api.bodyDisplayCatalog(catalog);
assert.equal(hash(display),pins.catalogHash);
assert.deepEqual(display,before.bodyDisplayCatalog(catalog));
assert.deepEqual(display.coordinateSystem,pins.coordinateSystem);
for(const name of ['structures','dissectionProfiles'])assert.deepEqual(api[name],before[name],`${name} unchanged`);
assert.equal(pins.entries.length,28);
assert.equal(new Set(pins.entries.map(e=>e.identity.id)).size,28);
assert.equal(new Set(pins.entries.map(e=>e.group)).size,13);
assert.deepEqual(Object.keys(legMuscleQuizQuestions).sort(),[...new Set(pins.entries.map(e=>e.group))].sort());
assert.equal(new Set(Object.values(legMuscleQuizQuestions).map(q=>q.choices.indexOf(q.correctAnswer))).size,4,'Answers must use all positions');
for(const [group,q] of Object.entries(legMuscleQuizQuestions)){
  assert.equal(q.choices.length,4,group);
  assert.equal(new Set(q.choices).size,4,group);
  assert.equal(q.choices.filter(choice=>choice===q.correctAnswer).length,1,group);
  assert.deepEqual(q.references,['https://anatomy.ttuhscep.edu/anatomytables/muscles_lowerlimb.html']);
}
for(const bundle of pins.bundles){
  assert.deepEqual(display.bundles.find(candidate=>candidate.id===bundle.id),bundle);
  const bytes=await readFile('public'+bundle.url.split('?')[0]);
  assert.equal(bytes.length,bundle.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),bundle.sha256);
}

const built=await build({stdin:{contents:"export {legMuscleQuizLesson} from './lib/leg-muscle-quiz';export {parseBodyReviewResponse} from './lib/body-review-response';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const {legMuscleQuizLesson,parseBodyReviewResponse}=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
const targets=new Map(pins.entries.map(e=>[e.identity.id,e]));
let changed=0,preserved=0,refused=0;
for(const structure of display.structures)for(const tab of api.contentTabs){
  const old=before.bodyLesson(structure,tab),current=api.bodyLesson(structure,tab),entry=targets.get(structure.id);
  if(entry&&tab==='quiz'){
    assert.deepEqual(structure,entry.identity);
    assert.deepEqual(old,entry.previous);
    assert.equal(old.readiness,'generated-identification');
    assert.equal(old.correctAnswer,undefined);
    const draft=legMuscleQuizLesson(structure,tab);
    assert.equal(draft.readiness,'draft');
    assert.deepEqual(draft.bullets,[...legMuscleQuizQuestions[entry.group].choices]);
    assert.equal(draft.correctAnswer,legMuscleQuizQuestions[entry.group].correctAnswer);
    assert.equal(draft.bullets.filter(choice=>choice===draft.correctAnswer).length,1);
    assert.match(draft.note,/revision-bound radiologist review pending/i);
    assert.deepEqual(draft.citations,[...legMuscleQuizQuestions[entry.group].references]);
    assert.deepEqual(current,draft,'Actual bodyLesson must route to the quiz');
    const {readiness,...shown}=draft;
    assert.deepEqual(api.bodyContent(structure,tab),shown);
    changed++;
  }else{
    assert.deepEqual(completed.bodyLesson(structure,tab),old,`${structure.id}:${tab}`);
    assert.equal(legMuscleQuizLesson(structure,tab),undefined);
    preserved++;
  }
}
assert.equal(changed,28);
assert.equal(preserved,display.structures.length*api.contentTabs.length-28);
for(const {identity} of pins.entries){
  const direct=legMuscleQuizLesson(identity,'quiz');
  const original=structuredClone(direct);
  direct.bullets.push('foreign');direct.citations.push('foreign');
  assert.deepEqual(legMuscleQuizLesson(identity,'quiz'),original,'Fresh lesson arrays');
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
    assert.equal(legMuscleQuizLesson(invalid,'quiz'),undefined);
    refused++;
  }
  for(const tab of api.contentTabs.filter(tab=>tab!=='quiz'))assert.equal(legMuscleQuizLesson(identity,tab),undefined);
  const packet=await api.bodyReviewMaterial(identity.id);
  const old=await before.bodyReviewMaterial(identity.id);
  assert.equal(packet.approval,false);
  assert.deepEqual(packet.source,old.source);
  assert.deepEqual(packet.reasoning,old.reasoning);
  assert.deepEqual(packet.guidedTours,old.guidedTours);
  assert.notEqual(packet.fingerprints.teaching,old.fingerprints.teaching);
  assert.deepEqual(packet.topics.find(topic=>topic.tab==='quiz'),{tab:'quiz',...original});
  assert.deepEqual(await parseBodyReviewResponse(packet,identity.id),packet);
  assert.equal(await parseBodyReviewResponse(old,identity.id),null,'Old packet must be rejected');
  const altered=structuredClone(packet);altered.topics.find(topic=>topic.tab==='quiz').correctAnswer='foreign';
  assert.equal(await parseBodyReviewResponse(altered,identity.id),null);
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
  useId:()=>active?'leg-muscle-check':React.useId(),
  useState(initial){if(!active)return React.useState(initial);const index=cursor++;if(!(index in states))states[index]=initial;return [states[index],value=>{states[index]=value}]},
  useRef(initial){if(!active)return React.useRef(initial);const index=refCursor++;return refs[index]??(refs[index]={current:initial})},
};
const events=load(shim);
const walk=(node,found=[])=>{if(React.isValidElement(node)){found.push(node);React.Children.forEach(node.props.children,child=>walk(child,found))}return found};
const nodeText=node=>typeof node==='string'?node:!node?'':Array.isArray(node)?node.map(nodeText).join(''):nodeText(node.props?.children);
let interacted=0;
for(const {identity} of pins.entries){
  const lesson=legMuscleQuizLesson(identity,'quiz');
  const props={question:lesson.body,choices:lesson.bullets,correctAnswer:lesson.correctAnswer,explanation:lesson.explanation};
  const html=render(React.createElement(actual.StructureQuickCheck,props));
  assert.equal((html.match(/type="radio"/g)||[]).length,4);
  assert.match(html,/<button[^>]*disabled=""[^>]*>Check answer/);
  assert(!html.includes('Correct answer:'));
  assert(!html.includes(render(React.createElement('span',null,props.explanation)).slice(6,-7)));
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
assert.equal(interacted,28);
console.log(JSON.stringify({passed:true,changed,preserved,sourceRefusals:refused,interacted,clinicalApproval:false}));
