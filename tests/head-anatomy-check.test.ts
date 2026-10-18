import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import {HEAD_LINK_REVISION,headConceptById} from '../lib/head-atlas-links.ts';
import {HEAD_TEACHING_REVISION,headTeachingContent} from '../lib/head-atlas-teaching.ts';
import {HEAD_ANATOMY_CHECK_REVISION,headAnatomyCheckContent,headAnatomyCheckForConcept,headAnatomyCheckPacket,verifiedHeadAnatomyCheckRevision} from '../lib/head-anatomy-checks.ts';
import {headAnatomyCheckModule} from './head-anatomy-check-loader.ts';

const require=createRequire(import.meta.url);
type Node={type:any;key:string|null;props:Record<string,any>};
function nodes(tree:any,predicate:(node:Node)=>boolean):Node[]{
  if(Array.isArray(tree))return tree.flatMap(child=>nodes(child,predicate));
  if(!tree||typeof tree!=='object'||!('props' in tree))return [];
  const node=tree as Node;
  return [...(predicate(node)?[node]:[]),...nodes(node.props.children,predicate)];
}

/** Execute compiled TSX with deterministic state slots. A changed React key
 * remounts the inner Question, mirroring the identity boundary under test. */
function harness(conceptId='brainstem-pons',revision=HEAD_LINK_REVISION,surface:'CT'|'MRI'|'3D'='CT'){
  const source=readFileSync(new URL('../components/HeadAnatomyCheck.tsx',import.meta.url),'utf8');
  const code=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  let slots:any[]=[],cursor=0,innerKey:string|null=null,tree:any;
  const hooks={
    useId(){return `check-${cursor++}`;},
    useState(initial:any){const index=cursor++;if(!(index in slots))slots[index]=initial;return [slots[index],(value:any)=>{slots[index]=typeof value==='function'?value(slots[index]):value;}];},
    useRef(initial:any){const index=cursor++;if(!(index in slots))slots[index]={current:initial};return slots[index];},
  };
  const mod={exports:{} as {HeadAnatomyCheck:(props:any)=>any}};
  new Function('require','module','exports',code)((id:string)=>id==='react'?hooks:id==='../lib/head-anatomy-checks.ts'?require('../lib/head-anatomy-checks.ts'):require(id),mod,mod.exports);
  function render(){
    const outer=mod.exports.HeadAnatomyCheck({conceptId,revision,surface});
    if(!outer){tree=null;innerKey=null;slots=[];return tree;}
    if(outer.key!==innerKey){slots=[];innerKey=outer.key;}
    cursor=0;tree=outer.type(outer.props);return tree;
  }
  function one(predicate:(node:Node)=>boolean){const found=nodes(render(),predicate);assert.equal(found.length,1);return found[0];}
  return {
    render,
    get html(){const current=render();return current?renderToStaticMarkup(current):'';},
    get key(){render();return innerKey;},
    button(){return one(node=>node.type==='button'&&node.props.children==='Check answer');},
    form(){return one(node=>node.type==='form');},
    radio(id:string){return one(node=>node.type==='input'&&node.props.type==='radio'&&node.props.value===id);},
    change(next:{conceptId?:string;revision?:string;surface?:'CT'|'MRI'|'3D'}){conceptId=next.conceptId??conceptId;revision=next.revision??revision;surface=next.surface??surface;return render();},
    setPendingChoiceForInvalidInput(value:string){render();slots[1]=value;},
    submit(){let prevented=0;this.form().props.onSubmit({preventDefault:()=>{prevented++;}});assert.equal(prevented,1);},
  };
}

test('all 25 questions exactly bind cited existing notes, source links, options and independent packet revision',async()=>{
  const packet=headAnatomyCheckPacket();
  assert.equal(packet.content.questions.length,25);
  assert.equal(packet.content.questions.length,headTeachingContent.notes.length);
  assert.equal(packet.content.headRevision,HEAD_LINK_REVISION);
  assert.equal(packet.content.teachingRevision,HEAD_TEACHING_REVISION);
  assert.notEqual(HEAD_ANATOMY_CHECK_REVISION,HEAD_TEACHING_REVISION);
  assert.equal(createHash('sha256').update(JSON.stringify(packet)).digest('hex'),HEAD_ANATOMY_CHECK_REVISION);
  assert.equal(await verifiedHeadAnatomyCheckRevision(HEAD_LINK_REVISION),HEAD_ANATOMY_CHECK_REVISION);
  assert.equal(await verifiedHeadAnatomyCheckRevision('stale'),null);
  assert.equal(packet.content.status,'draft');assert.equal(packet.content.clinicalApproval,false);
  assert.equal(packet.content.publicationApproval,false);assert.equal(packet.content.patientRegistration,false);
  assert.deepEqual(packet.content.questions.map(question=>question.conceptId),headTeachingContent.notes.map(note=>note.conceptId));
  for(const [index,question] of packet.content.questions.entries()){
    const note=headTeachingContent.notes[index],binding=headConceptById(question.conceptId);
    assert.deepEqual(packet.bindings[index],binding);
    assert(binding?.ctHref&&binding.mriHref&&binding.atlasHref);
    assert.equal(question.explanation,note[question.fact].text);
    assert.deepEqual(question.sources,note[question.fact].sources);
    assert.equal(new Set(question.options.map(option=>option.id)).size,question.options.length);
    assert.equal(new Set(question.options.map(option=>option.label)).size,question.options.length);
    assert.equal(question.options.length,3);
    assert(question.options.some(option=>option.id===question.correctOptionId));
    const check=headAnatomyCheckForConcept(question.conceptId,HEAD_LINK_REVISION);assert(check);
    assert.equal(check.question,question);assert.deepEqual(check.binding,binding);
    assert.deepEqual(check.sources.map(source=>source.id).sort(),[...question.sources].sort());
  }
  for(const [id,head,question] of [['missing',HEAD_LINK_REVISION,HEAD_ANATOMY_CHECK_REVISION],['brainstem-pons','stale',HEAD_ANATOMY_CHECK_REVISION],['brainstem-pons',HEAD_LINK_REVISION,'stale']]){
    assert.equal(headAnatomyCheckForConcept(id,head,question),null);
  }
});

test('rendered answer controls reject empty or invalid submissions and lock first correct answer',()=>{
  const check=headAnatomyCheckForConcept('brainstem-pons',HEAD_LINK_REVISION)!;
  const h=harness(),correct=check.question.correctOptionId;
  assert.equal(h.button().props.disabled,true);
  assert.doesNotMatch(h.html,/Correct\.|Not quite\./);
  h.submit();assert.doesNotMatch(h.html,/Correct\.|Not quite\./);
  h.setPendingChoiceForInvalidInput('option-injected');
  assert.equal(h.button().props.disabled,false,'a forged nonempty value reaches the submit guard');
  h.submit();assert.doesNotMatch(h.html,/Correct\.|Not quite\./);
  const valid=h.radio(correct);
  valid.props.onChange();assert.equal(h.button().props.disabled,false);
  assert.equal(h.radio(correct).props.checked,true);
  h.submit();h.submit();
  assert.match(h.html,/Correct\./);assert(h.html.includes(check.question.explanation));
  assert.equal(h.button().props.disabled,true);
  assert.equal(nodes(h.render(),node=>node.type==='fieldset')[0].props.disabled,true);
  h.radio(check.question.options.find(option=>option.id!==correct)!.id).props.onChange();
  assert.match(h.html,/Correct\./);
  assert.equal(h.radio(correct).props.checked,true);
  assert(!h.html.includes('Correct answer:'));
});

test('wrong first choice remains immutable across repeated same-render submits and explains the cited fact',()=>{
  const check=headAnatomyCheckForConcept('brainstem-pons',HEAD_LINK_REVISION)!;
  const h=harness(),wrong=check.question.options.find(option=>option.id!==check.question.correctOptionId)!;
  h.radio(wrong.id).props.onChange();
  const captured=h.form();captured.props.onSubmit({preventDefault(){}});captured.props.onSubmit({preventDefault(){}});
  h.radio(check.question.correctOptionId).props.onChange();
  assert.match(h.html,/Not quite\./);assert(h.html.includes(check.question.explanation));
  assert(h.html.includes(check.question.options.find(option=>option.id===check.question.correctOptionId)!.label));
  assert.equal(h.radio(wrong.id).props.checked,true);
  assert.equal(h.button().props.disabled,true);
});

test('concept, source and surface identities remount clean state; stale source renders nothing',()=>{
  const h=harness();const first=h.key;
  const correct=headAnatomyCheckForConcept('brainstem-pons',HEAD_LINK_REVISION)!.question.correctOptionId;
  h.radio(correct).props.onChange();h.submit();assert.match(h.html,/Correct\./);
  h.change({surface:'MRI'});assert.notEqual(h.key,first);assert.equal(h.button().props.disabled,true);assert.doesNotMatch(h.html,/Correct\.|Not quite\./);
  h.radio(correct).props.onChange();h.submit();h.change({conceptId:'brainstem-medulla'});
  assert.equal(h.button().props.disabled,true);assert.doesNotMatch(h.html,/Correct\.|Not quite\./);
  h.change({revision:'stale'});assert.equal(h.html,'');
  h.change({revision:HEAD_LINK_REVISION,surface:'3D'});assert.equal(h.button().props.disabled,true);
  assert.doesNotMatch(h.html,/Correct\.|Not quite\./);
});

test('real React server rendering loads the component and withholds stale questions',()=>{
  const Component=headAnatomyCheckModule.HeadAnatomyCheck;
  const live=renderToStaticMarkup(React.createElement(Component,{conceptId:'brainstem-pons',revision:HEAD_LINK_REVISION,surface:'CT'}));
  assert.match(live,/Check understanding/);
  assert.match(live,/type="radio"/);
  assert(live.includes(HEAD_ANATOMY_CHECK_REVISION));
  assert.equal(renderToStaticMarkup(React.createElement(Component,{conceptId:'brainstem-pons',revision:'stale',surface:'CT'})),'');
});
