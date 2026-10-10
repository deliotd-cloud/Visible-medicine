import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {contentContext, contentValidator} from './content-contract-tools.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
import {build as componentBuild} from './workspace-component-test-build.mjs';
import {build} from './workspace-test-build.mjs';
import pins from '../content/thoracic-bone-quiz-pins.json' with {type:'json'};
import {thoracicBoneQuizGroups, thoracicBoneQuizQuestions} from '../content/thoracic-bone-quiz.ts';

const integrated = process.argv.includes('--integrated');
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const snapshot = (api, display) => ({
  body: display.structures.map(structure => ({id:structure.id, sections:Object.fromEntries(api.contentTabs.map(tab => [tab, api.bodyLesson(structure,tab)]))})),
  shoulder: api.structures,
  recipes: api.dissectionProfiles,
});
const {api, catalog, registry} = await contentContext();
const display = api.bodyDisplayCatalog(catalog);
const parent = await exactSourceHistoryApi(pins.parentCommit);
const built = await build({stdin:{contents:"export {thoracicBoneQuizLesson} from './lib/thoracic-bone-quiz';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const {thoracicBoneQuizLesson} = await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));

assert.equal(pins.parentCommit,'d9cd141f1fefae6842754e134a1ef18d5661c727');
assert.equal(hash(pins),'17aff08d0f326b93bea58fa6fbdc2657502e0e5a99e5addde5afe5946e7819eb');
assert.deepEqual(display,parent.bodyDisplayCatalog(catalog));
assert.deepEqual(display.coordinateSystem,pins.coordinateSystem);
assert.equal(hash(snapshot(parent,display)),pins.previousAllLessonsAndRecipesHash);
assert.deepEqual(api.structures,parent.structures);
assert.deepEqual(api.dissectionProfiles,parent.dissectionProfiles);
assert.deepEqual(pins.entries.map(entry=>entry.identity.fmaId),Object.values(thoracicBoneQuizGroups).flat());
assert.equal(pins.entries.length,27);
assert.equal(new Set(pins.entries.map(entry=>entry.identity.id)).size,27);
assert.equal(new Set(pins.entries.map(entry=>entry.identity.fmaId)).size,27);
assert.deepEqual([...new Set(pins.entries.map(entry=>entry.identity.bundle))],['thorax-skeleton','thorax-skeleton-recovery']);
assert.deepEqual(pins.bundles.map(bundle=>bundle.id),['thorax-skeleton','thorax-skeleton-recovery']);
for(const entry of pins.entries){
  assert.equal(entry.identity.nodeName,entry.identity.fmaId);
  assert.equal(entry.identity.sources.length,1);
  assert.equal(entry.identity.validation.anatomicalReview,false);
}
for(const bundle of pins.bundles){
  assert.deepEqual(display.bundles.find(candidate=>candidate.id===bundle.id),bundle);
  const bytes=await readFile('public'+bundle.url.split('?')[0]);
  assert.equal(bytes.length,bundle.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),bundle.sha256);
}

const targets=new Map(pins.entries.map(entry=>[entry.identity.id,entry]));
const records=integrated?api.bodyContentRecords(display):[];
const validate=integrated?await contentValidator(registry):undefined;
let resolved=0, changed=0, unchanged=0, rejected=0, rendered=0;
for(const structure of display.structures) for(const tab of api.contentTabs){
  const before=parent.bodyLesson(structure,tab), now=api.bodyLesson(structure,tab), target=targets.get(structure.id);
  const direct=thoracicBoneQuizLesson(structure,tab);
  if(!target||tab!=='quiz'){
    assert.equal(direct,undefined); assert.deepEqual(now,before,structure.id+'|'+tab); unchanged++; continue;
  }
  assert.deepEqual(structure,target.identity);
  assert.deepEqual(target.topics,['quiz']);
  assert.deepEqual(before,target.previous.quiz);
  assert(direct); assert.notDeepEqual(direct,before);
  assert.equal(direct.readiness,'draft');
  assert.equal(direct.bullets.length,4);
  assert.equal(new Set(direct.bullets.map(choice=>choice.trim())).size,4);
  assert(direct.bullets.every(choice=>choice.trim().length));
  assert.equal(direct.bullets.filter(choice=>choice===direct.correctAnswer).length,1);
  assert(direct.body.trim()); assert(direct.explanation.trim());
  assert.match(direct.note,/Revision-bound radiologist review pending/);
  assert.match(direct.note,/not separately segmented or validated/);
  assert.match(direct.note,/No imaging study/);
  assert.match(direct.note,/Atlas, imaging-case and lecture access remain independent/);
  assert.deepEqual(direct.citations,[thoracicBoneQuizQuestions[target.group].reference]);
  if(integrated){
    assert.deepEqual(now,direct); assert.notDeepEqual(now,before);
    const {readiness:_readiness,...shown}=direct;
    assert.deepEqual(api.bodyContent(structure,tab),shown);
    const record=records.find(candidate=>candidate.id===structure.id);
    assert(validate(record)); assert.deepEqual(record.content.quiz,direct);
    assert.equal(record.validation.clinicalApproval,'not-included');
    const packet=await api.bodyReviewMaterial(structure.id);
    assert.equal(packet.approval,false);
    const {tab:_tab,...topic}=packet.topics.find(candidate=>candidate.tab==='quiz');
    assert.deepEqual(topic,direct); changed++;
  }
  const copy=structuredClone(direct); direct.bullets.push('foreign'); direct.citations.length=0;
  assert.deepEqual(thoracicBoneQuizLesson(structure,tab),copy); resolved++;
}
assert.equal(resolved,27);
assert.equal(unchanged,9909);
if(integrated) assert.equal(changed,27);

const leaves=(value,path=[])=>value===null||typeof value!=='object'?[path]:Object.entries(value).flatMap(([key,child])=>leaves(child,[...path,key]));
for(const {identity} of pins.entries) for(const path of leaves(identity)){
  const bad=structuredClone(identity); let object=bad;
  for(const key of path.slice(0,-1)) object=object[key];
  const key=path.at(-1), old=object[key];
  object[key]=typeof old==='number'?old+.01:typeof old==='boolean'?!old:String(old)+'-foreign';
  assert.equal(thoracicBoneQuizLesson(bad,'quiz'),undefined); rejected++;
}
for(const {identity} of pins.entries){
  assert.equal(thoracicBoneQuizLesson({...identity,unexpectedSourceField:true},'quiz'),undefined); rejected++;
  const missing=structuredClone(identity); assert(Object.hasOwn(missing,'coverageNote'));
  delete missing.coverageNote; assert.equal(thoracicBoneQuizLesson(missing,'quiz'),undefined); rejected++;
  for(const tab of api.contentTabs) if(tab!=='quiz') assert.equal(thoracicBoneQuizLesson(identity,tab),undefined);
}
assert.equal(thoracicBoneQuizLesson({...pins.entries[0].identity,id:'unknown'},'quiz'),undefined); rejected++;
assert.equal(thoracicBoneQuizLesson({...pins.entries[0].identity,id:pins.entries[1].identity.id},'quiz'),undefined); rejected++;

const questions=Object.values(thoracicBoneQuizQuestions);
assert.equal(questions.length,9);
assert.deepEqual(questions.map(question=>question.choices.indexOf(question.correctAnswer)),[0,1,2,3,0,1,2,3,0]);
assert(questions.every(question=>!question.reference.includes('openstax.org')));
const referenceWords=Object.fromEntries([...new Set(questions.map(question=>question.reference))].map(reference=>[reference,
  questions.filter(question=>question.reference===reference).map(question=>[question.body,...question.choices,question.correctAnswer,question.explanation].join(' ')).join(' ').split(/\s+/).length]));
for(const count of Object.values(referenceWords)) assert(count<200);

const require=createRequire(import.meta.url), React=require('react'), render=require('react-dom/server').renderToStaticMarkup;
assert.equal(typeof require('class-variance-authority').cva,'function');
const component=await componentBuild({stdin:{contents:"export {StructureQuickCheck} from './app/structure-quick-check'; export {QuizNotes,AtlasWorkspace} from './app/atlas-workspace';",resolveDir:process.cwd(),loader:'tsx'},bundle:true,platform:'node',format:'cjs',write:false});
const load=react=>{
  const scope={exports:{}};
  runInNewContext(component.outputFiles[0].text,{module:scope,exports:scope.exports,require:id=>{
    const result=id==='react'?react:id==='next/link'?()=>{throw Error('Unrelated Next Link must not render');}:require(id);
    if(id==='class-variance-authority') assert.equal(typeof result.cva,'function');
    return result;
  },console});
  return scope.exports;
};
const {StructureQuickCheck,QuizNotes,AtlasWorkspace}=load(React);
const escaped=value=>render(React.createElement('span',null,value)).slice(6,-7);
let states=[],refs=[],cursor=0,refCursor=0,active=false;
const shim={...React,useContext:()=>({exam:false}),useId:()=>active?'thoracic-quiz-check':React.useId(),
  useState(initial){if(!active)return React.useState(initial);const index=cursor++;if(!(index in states))states[index]=initial;return [states[index],value=>{states[index]=value;}];},
  useRef(initial){if(!active)return React.useRef(initial);const index=refCursor++;return refs[index]??(refs[index]={current:initial});},
};
const events=load(shim);
const walk=(node,found=[])=>{if(React.isValidElement(node)){found.push(node);React.Children.forEach(node.props.children,child=>walk(child,found));}return found;};
const nodeText=node=>typeof node==='string'?node:!node?'':Array.isArray(node)?node.map(nodeText).join(''):nodeText(node.props?.children);
let interacted=0;
for(const {identity} of pins.entries){
  const lesson=thoracicBoneQuizLesson(identity,'quiz');
  const props={question:lesson.body,choices:lesson.bullets,correctAnswer:lesson.correctAnswer,explanation:lesson.explanation};
  states=[]; refs=[]; cursor=0; refCursor=0; active=true;
  let note=events.QuizNotes({structure:identity}); active=false;
  assert.equal(note.type,'details');
  let lazy=walk(note).find(node=>typeof node.type==='function'&&node.type.name==='LazyBodyTeaching');
  assert(lazy); assert.equal(lazy.props.enabled,false);
  note.props.onToggle({currentTarget:{open:true}});
  cursor=0; refCursor=0; active=true; note=events.QuizNotes({structure:identity}); active=false;
  lazy=walk(note).find(node=>typeof node.type==='function'&&node.type.name==='LazyBodyTeaching');
  assert(lazy.props.enabled);
  const loaded=lazy.props.children({bodyContent:integrated?api.bodyContent:(structure,tab)=>{
    const direct=thoracicBoneQuizLesson(structure,tab);
    if(!direct)return undefined;
    const {readiness:_readiness,...shown}=direct; return shown;
  }});
  const child=walk(loaded).find(node=>typeof node.type==='function'&&node.type.name==='StructureQuickCheck');
  assert(child); assert.equal(child.key,identity.id);
  assert.deepEqual(JSON.parse(JSON.stringify(child.props)),props);
  assert.deepEqual(walk(loaded).filter(node=>node.type==='a').map(node=>node.props.href),lesson.citations);
  const html=render(React.createElement(StructureQuickCheck,props));
  assert.equal((html.match(/type="radio"/g)||[]).length,4);
  assert(html.includes('<fieldset'));
  assert(html.includes(escaped(lesson.body)));
  assert(!html.includes(escaped(lesson.explanation)));
  for(const choice of lesson.bullets) assert(html.includes(escaped(choice)));
  // Exercise the actual component handlers for these exact four-option props.
  const attempt=events.StructureQuickCheck(child.props);
  assert.equal(attempt.key,JSON.stringify(child.props));
  assert.notEqual(events.StructureQuickCheck({...child.props,explanation:props.explanation+' revised'}).key,attempt.key);
  states=[];refs=[];let tree,focused;
  const redraw=()=>{
    cursor=0;refCursor=0;active=true;tree=attempt.type(attempt.props);active=false;
    for(const node of walk(tree))if(node.props.ref)node.props.ref.current={focus(options){
      assert.equal(options.preventScroll,true);focused=node.type==='input'?'first-radio':'feedback';
    }};
  };
  const radios=()=>walk(tree).filter(node=>node.type==='input');
  const button=label=>walk(tree).find(node=>node.type==='button'&&nodeText(node)===label);
  const answer=index=>{radios()[index].props.onChange();redraw();button('Check answer').props.onClick();redraw();};
  redraw();assert.equal(button('Check answer').props.disabled,true);
  const correct=props.choices.indexOf(props.correctAnswer);
  answer(correct);assert(nodeText(tree).includes('Correct. Correct answer: '+props.correctAnswer));
  assert(nodeText(tree).includes(props.explanation));assert.equal(focused,'feedback');
  button('Practise again').props.onClick();redraw();assert.equal(focused,'first-radio');
  assert(radios().every(node=>!node.props.checked));
  answer((correct+1)%4);assert(nodeText(tree).includes('Incorrect. Correct answer: '+props.correctAnswer));
  button('Try again').props.onClick();redraw();assert.equal(focused,'first-radio');
  assert(radios().every(node=>!node.props.checked));
  answer((correct+1)%4);radios()[correct].props.onChange();redraw();
  assert(!nodeText(tree).includes('Correct answer:'));assert(!nodeText(tree).includes(props.explanation));interacted++;
  if(integrated){
    const wrapper=render(React.createElement(AtlasWorkspace,{exam:false},React.createElement(QuizNotes,{structure:identity})));
    assert(wrapper.includes('atlas-quiz-notes'));
    const exam=render(React.createElement(AtlasWorkspace,{exam:true},React.createElement(QuizNotes,{structure:identity})));
    assert(!exam.includes('atlas-quiz-notes'));
  }
  rendered++;
}
assert.equal(interacted,27);
console.log(JSON.stringify({integrated,resolved,changed,unchanged,rejected,rendered,interacted,referenceWords,clinicalApproval:false}));
