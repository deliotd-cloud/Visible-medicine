import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import {prostateRevision} from './pin-prostate-zones.mjs';

const root=fileURLToPath(new URL('..',import.meta.url));
const require=createRequire(import.meta.url);
function compile(name,mocks={}){
 const source=fs.readFileSync(path.join(root,name),'utf8');
 const code=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const module={exports:{}};
 new Function('require','module','exports',code)(name=>name in mocks?mocks[name]:require(name),module,module.exports);
 return module.exports;
}
const data=compile('lib/prostate-mri-teaching.ts');
function harness(initial='peripheral'){
 const slots=[];let cursor=0,zone=initial;
 const useState=value=>{const n=cursor++;if(!slots[n])slots[n]={value};return[slots[n].value,next=>{slots[n].value=next;}];};
 const component=compile('app/prostate-mri-teaching.tsx',{react:{useState},'../lib/prostate-mri-teaching':data});
 return {setZone:value=>{zone=value;},render(){cursor=0;return component.ProstateMriTeaching({zone});},close:component.closeProstateTeachingDisclosure};
}
function nodes(tree,predicate){
 const all=[];function walk(item){if(Array.isArray(item)){item.forEach(walk);return;}if(!React.isValidElement(item))return;if(predicate(item))all.push(item);walk(item.props.children);}walk(tree);return all;
}
const radios=tree=>nodes(tree,node=>node.type==='input');
const check=tree=>nodes(tree,node=>node.type==='button')[0];
const status=tree=>nodes(tree,node=>node.props.role==='status')[0].props.children;
const answers={peripheral:'posterior',transition:'urethra',central:'ducts',stroma:'fibromuscular'};

test('four MRI lessons grade stable identifiers, including first/middle/last correct options',()=>{
 assert.deepEqual(Object.keys(data.prostateMriLessons),Object.keys(answers));
 for(const[zone,correct]of Object.entries(answers)){
  const lesson=data.prostateMriLessons[zone];assert.equal(lesson.answerId,correct);
  assert.equal(new Set(lesson.choices.map(row=>row.id)).size,3);
  for(const choice of lesson.choices)assert.equal(data.checkProstateMriAnswer(zone,choice.id),choice.id===correct?'correct':'incorrect');
  for(const invalid of [null,'',correct+'-unknown','0',undefined])assert.equal(data.checkProstateMriAnswer(zone,invalid),'unanswered');
 }
 assert.equal(data.checkProstateMriAnswer('unknown','ducts'),'unanswered');
});

for(const[zone,correct]of Object.entries(answers))test(zone+': actual controls accept the correct answer after an incorrect attempt',()=>{
 const ui=harness(zone);let tree=ui.render();assert.equal(check(tree).props.disabled,true);
 assert.equal(nodes(tree,node=>node.type==='details').length,2);
 assert(nodes(tree,node=>node.type==='details').every(node=>!node.props.open));
 const wrong=radios(tree).find(node=>node.props.value!==correct);wrong.props.onChange();tree=ui.render();
 assert.equal(check(tree).props.disabled,false);assert(!status(tree).startsWith('Correct.'));
 check(tree).props.onClick();tree=ui.render();assert.match(status(tree),/^Not quite\./);
 radios(tree).find(node=>node.props.value===correct).props.onChange();tree=ui.render();assert.match(status(tree),/^Choose one/);
 check(tree).props.onClick();tree=ui.render();assert.match(status(tree),/^Correct\./);
 assert.equal(radios(tree).filter(node=>node.props.checked).length,1);
 const html=renderToStaticMarkup(tree);assert.match(html,/role="status"/);assert.match(html,/aria-atomic="true"/);
 assert.match(html,/draft teaching awaiting clinical review/);
});

test('changing zones rejects old answers even where the option identifier also exists in the new zone',()=>{
 const ui=harness('central');let tree=ui.render();radios(tree).find(node=>node.props.value==='ducts').props.onChange();tree=ui.render();check(tree).props.onClick();assert.match(status(ui.render()),/^Correct\./);
 ui.setZone('transition');tree=ui.render();assert.equal(check(tree).props.disabled,true);assert(radios(tree).every(node=>!node.props.checked));assert.match(status(tree),/^Choose one/);
});

test('radio groups and status references are distinct between zone panels',()=>{
 const names=new Set(),ids=new Set();for(const zone of Object.keys(answers)){
  const tree=harness(zone).render(),name=radios(tree)[0].props.name;assert(!names.has(name));names.add(name);
  assert(radios(tree).every(row=>row.props.name===name));
  const field=nodes(tree,node=>node.type==='fieldset')[0],feedback=nodes(tree,node=>node.props.role==='status')[0];
  assert.equal(field.props['aria-describedby'],feedback.props.id);assert(!ids.has(feedback.props.id));ids.add(feedback.props.id);
 }
});

test('Escape closes only an open teaching disclosure and restores summary focus',()=>{
 const ui=harness();const calls=[];const currentTarget={open:true,querySelector(selector){assert.equal(selector,'summary');return{focus(){calls.push('focus');}};}};
 ui.close({key:'Escape',defaultPrevented:false,currentTarget,preventDefault(){calls.push('prevent');},stopPropagation(){calls.push('stop');}});
 assert.equal(currentTarget.open,false);assert.deepEqual(calls,['prevent','stop','focus']);
 for(const[key,defaultPrevented,open]of [['Enter',false,true],['Escape',true,true],['Escape',false,false]]){
  const event={key,defaultPrevented,currentTarget:{...currentTarget,open},preventDefault(){assert.fail('must not intercept');},stopPropagation(){assert.fail('must not intercept');}};ui.close(event);assert.equal(event.currentTarget.open,open);
 }
});

test('Escape preserves the checked answer instead of submitting or resetting practice',()=>{
 const ui=harness();let tree=ui.render();radios(tree).find(node=>node.props.value==='posterior').props.onChange();tree=ui.render();check(tree).props.onClick();tree=ui.render();
 const detail=nodes(tree,node=>node.type==='details')[1];detail.props.onKeyDown({key:'Escape',defaultPrevented:false,currentTarget:{open:true,querySelector:()=>({focus(){}})},preventDefault(){},stopPropagation(){}});
 assert.match(status(ui.render()),/^Correct\./);
});

test('all lessons expose attributed reference links without bundled imaging or automatic requests',()=>{
 for(const zone of Object.keys(answers)){
  const tree=harness(zone).render(),anchors=nodes(tree,node=>node.type==='a');
  assert(anchors.length);for(const link of anchors){assert.match(link.props.href,/^https:\/\//);assert.equal(link.props.rel,'noopener noreferrer');}
  assert.equal(nodes(tree,node=>['img','iframe','video'].includes(node.type)).length,0);
 }
 assert.equal(data.prostateMriLessons.transition.cautionReference,'acr');
});

test('selected-zone integration and revision include teaching, while preserving semantic linking',()=>{
 const source=fs.readFileSync(path.join(root,'app/prostate-zones.tsx'),'utf8');
 assert.match(source,/<ProstateMriTeaching key=\{selected\} zone=\{selected\} \/>/);
 assert.match(source,/<ImagingLink link=\{imagingLink\} coordinateContext="none" \/>/);
 const revision=JSON.parse(fs.readFileSync(path.join(root,'content/prostate-zones-revision.json'),'utf8'));
 assert.deepEqual(revision,prostateRevision(root));
 for(const file of ['app/prostate-mri-teaching.tsx','lib/prostate-mri-teaching.ts'])assert(revision.inputs.some(row=>row.file===file));
 assert.equal(revision.clinicalReview,'pending');assert.equal(revision.patientSpaceRegistration,null);
});
