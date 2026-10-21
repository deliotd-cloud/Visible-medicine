import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import * as existingChecks from '../lib/head-anatomy-checks.ts';
import * as mriChecks from '../lib/head-mri-anatomy-checks.ts';
import * as links from '../lib/head-atlas-links.ts';
import * as comparison from '../lib/head-ct-facial-comparison-review.ts';
import * as teaching from '../lib/head-ct-facial-teaching.ts';
import * as clinical from '../lib/head-ct-facial-clinical.ts';

const require=createRequire(import.meta.url);
const paths={
  '../lib/head-anatomy-checks.ts':existingChecks,
  '../lib/head-mri-anatomy-checks.ts':mriChecks,
  '../lib/head-atlas-links.ts':links,
  '../lib/head-ct-facial-comparison-review.ts':comparison,
  '../lib/head-ct-facial-teaching.ts':teaching,
  '../lib/head-ct-facial-clinical.ts':clinical,
};
function load(name,hooks){
  const code=ts.transpileModule(readFileSync(new URL(`../components/${name}.tsx`,import.meta.url),'utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const mod={exports:{}};
  new Function('require','module','exports',code)((id)=>{
    if(id==='react'&&hooks)return hooks;
    if(id==='./HeadCtFacialDecisionPanel')return load('HeadCtFacialDecisionPanel');
    if(id==='./HeadCtFacialDecisionForm')return load('HeadCtFacialDecisionForm');
    if(id.endsWith('.css'))return {};
    if(Object.hasOwn(paths,id))return paths[id];
    if(id.startsWith('../lib/'))return require(id.endsWith('.ts')?id:id+'.ts');
    return require(id);
  },mod,mod.exports);
  return mod.exports;
}
function nodes(tree,predicate){
  if(Array.isArray(tree))return tree.flatMap(child=>nodes(child,predicate));
  if(!tree||typeof tree!=='object'||!('props'in tree))return [];
  return [...(predicate(tree)?[tree]:[]),...nodes(tree.props.children,predicate)];
}
function harness(initialId,surface='CT'){
  let conceptId=initialId,revision=links.HEAD_LINK_REVISION,slots=[],cursor=0,key=null,tree=null;
  const hooks={useId(){return `check-${cursor++}`;},useState(initial){const i=cursor++;if(!(i in slots))slots[i]=initial;return [slots[i],value=>{slots[i]=value;}];},useRef(initial){const i=cursor++;if(!(i in slots))slots[i]={current:initial};return slots[i];}};
  const {HeadAnatomyCheck}=load('HeadAnatomyCheck',hooks);
  function render(){const outer=HeadAnatomyCheck({conceptId,revision,surface});if(!outer){slots=[];key=null;return tree=null;}if(outer.key!==key){slots=[];key=outer.key;}cursor=0;return tree=outer.type(outer.props);}
  function one(predicate){const found=nodes(render(),predicate);assert.equal(found.length,1);return found[0];}
  return {render,get html(){const current=render();return current?renderToStaticMarkup(current):'';},get key(){render();return key;},radio(id){return one(n=>n.type==='input'&&n.props.value===id);},form(){return one(n=>n.type==='form');},button(){return one(n=>n.type==='button');},change(next){conceptId=next.conceptId??conceptId;revision=next.revision??revision;surface=next.surface??surface;render();},submit(){this.form().props.onSubmit({preventDefault(){}});}};
}

test('all three CT and 3D questions retain first correct or wrong answer and exact feedback',()=>{
  for(const question of teaching.headCtFacialTeachingContent.questions){
    for(const surface of ['CT','3D'])for(const correctFirst of [true,false]){
      const h=harness(question.conceptId,surface),correct=question.correctOptionId,wrong=question.options.find(option=>option.id!==correct).id;
      assert.equal(h.button().props.disabled,true);
      h.radio(correctFirst?correct:wrong).props.onChange();
      const captured=h.form();captured.props.onSubmit({preventDefault(){}});captured.props.onSubmit({preventDefault(){}});
      h.radio(correctFirst?wrong:correct).props.onChange();
      assert.equal(h.radio(correctFirst?correct:wrong).props.checked,true);
      assert.equal(h.button().props.disabled,true);
      assert(h.html.includes(question.explanation));
      assert.match(h.html,correctFirst?/Correct\./:/Not quite\./);
      assert.match(h.html,/Practice only; no exam score or saved completion/);
      assert(h.html.includes(teaching.HEAD_CT_FACIAL_TEACHING_REVISION));
    }
  }
});

test('unknown, stale and MRI facial questions refuse; key resets on concept, revision and surface',()=>{
  for(const id of teaching.headCtFacialTeachingContent.questions.map(q=>q.conceptId)){
    assert.equal(harness(id,'MRI').html,'');
    assert.equal(harness('unknown').html,'');
    const h=harness(id),first=h.key,correct=teaching.headCtFacialQuestionForConcept(id,links.HEAD_LINK_REVISION).question.correctOptionId;
    h.radio(correct).props.onChange();h.submit();assert.match(h.html,/Correct\./);
    h.change({surface:'3D'});assert.notEqual(h.key,first);assert.equal(h.button().props.disabled,true);
    const other=teaching.headCtFacialTeachingContent.questions.find(q=>q.conceptId!==id).conceptId;
    const beforeConcept=h.key;h.change({conceptId:other});assert.notEqual(h.key,beforeConcept);assert.equal(h.button().props.disabled,true);
    h.change({revision:'stale'});assert.equal(h.html,'');
    h.change({revision:links.HEAD_LINK_REVISION});assert.equal(h.button().props.disabled,true);
  }
});

test('server rendering keeps independently pinned evidence and six unopened review panels without eager forms',async()=>{
  const {HeadAnatomyCheck}=load('HeadAnatomyCheck');
  assert.match(renderToStaticMarkup(React.createElement(HeadAnatomyCheck,{conceptId:'bone-mandible',revision:links.HEAD_LINK_REVISION,surface:'CT'})),/Check understanding/);
  const {HeadCtFacialTeachingReview}=load('HeadCtFacialTeachingReview');
  const props={manifestRevision:links.HEAD_LINK_REVISION,teachingRevision:teaching.HEAD_CT_FACIAL_TEACHING_REVISION,clinicalRevision:clinical.HEAD_CT_FACIAL_CLINICAL_REVISION};
  const html=renderToStaticMarkup(await HeadCtFacialTeachingReview(props));
  assert.equal((html.match(/Exact native CT ID and label/g)??[]).length,3);
  for(const id of ['cth.fac.zygomatic_bone.left','cth.fac.zygomatic_bone.right','cth.fac.mandible'])assert(html.includes(id));
  assert(html.includes(teaching.HEAD_CT_FACIAL_TEACHING_REVISION));assert(html.includes(clinical.HEAD_CT_FACIAL_CLINICAL_REVISION));
  assert.match(html,/not spatially registered|unregistered subjects/);
  assert.doesNotMatch(html,/<form|<input|fetch\(|approval granted/i);
  assert.equal((html.match(/<button/g)??[]).length,6);
  assert.equal((html.match(/<button[^>]*>Review [^<]+ clinical orientation/g)??[]).length,3);
  assert.equal((html.match(/<button[^>]*>Review [^<]+ teaching/g)??[]).length,3);
  for(const altered of [{manifestRevision:'stale'},{teachingRevision:'stale'},{clinicalRevision:'stale'},{teachingRevision:null},{clinicalRevision:null}]){
    const refused=renderToStaticMarkup(await HeadCtFacialTeachingReview({...props,...altered}));
    assert.match(refused,/unavailable/);assert.doesNotMatch(refused,/Exact native CT ID and label|<button|<form/);
  }
});
