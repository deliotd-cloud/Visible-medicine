import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import * as teaching from '../lib/head-atlas-teaching.ts';
import * as learning from '../lib/head-atlas-learning.ts';
import {HEAD_LINK_REVISION} from '../lib/head-atlas-links.ts';
import {headMriComparisonPacket} from '../lib/head-mri-comparison-review.ts';
import {headInsulaComparisonPacket} from '../lib/head-insula-comparison-review.ts';
import {headReviewImageLinkModule} from './head-review-image-link-loader.ts';

const require=createRequire(import.meta.url);
function component(file:string,extra:Record<string,unknown>={}){
  const source=readFileSync(new URL('../components/'+file+'.tsx',import.meta.url),'utf8');
  const compiled=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const mod={exports:{} as Record<string,(props:any)=>React.ReactElement>};
  const load=(id:string)=>id==='./HeadReviewImageLink'?headReviewImageLinkModule:id==='../lib/head-atlas-teaching'?teaching:id==='../lib/head-atlas-learning'?learning:id.endsWith('.css')?{}:id in extra?extra[id]:require(id);
  new Function('require','module','exports',compiled)(load,mod,mod.exports);
  return {Component:mod.exports[file],source};
}
const {Component:Navigator,source:navigatorSource}=component('HeadTeachingReviewNavigator');
const {Component:Review,source:reviewSource}=component('HeadAtlasTeachingReview',{'./HeadTeachingReviewNavigator':{HeadTeachingReviewNavigator:Navigator}});
type Node={type:unknown;props:Record<string,any>};
function nodes(value:unknown,accept:(node:Node)=>boolean,result:Node[]=[]):Node[]{
  if(Array.isArray(value)){value.forEach(child=>nodes(child,accept,result));return result;}
  if(!value||typeof value!=='object'||!('props'in value))return result;
  const node=value as Node;if(accept(node))result.push(node);nodes(node.props.children,accept,result);return result;
}
const targets=teaching.headTeachingContent.notes.map(note=>({id:`head-teaching-${note.conceptId}`,label:teaching.headTeachingForConcept(note.conceptId,'CT',HEAD_LINK_REVISION)!.concept.label}));
const additionalTargets=[
  ...headMriComparisonPacket().items.map(item=>({id:`head-mri-comparison-${item.conceptId}`,label:`${item.binding!.label} · MRI-only evidence`})),
  ...headInsulaComparisonPacket().items.map(item=>({id:`head-insula-comparison-${item.conceptId}`,label:`${item.binding!.label} · Insula evidence`})),
];
const tree=(props:Record<string,unknown>={})=>Review({revision:HEAD_LINK_REVISION,...props});
const html=(props:Record<string,unknown>={})=>renderToStaticMarkup(React.createElement(Review,{revision:HEAD_LINK_REVISION,...props}));

test('all 25 original teaching summaries have unique collapsed targets and exact picker labels',()=>{
  assert.equal(targets.length,25);
  const output=html();
  const ids=[...output.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]);
  assert.equal(ids.length,new Set(ids).size);
  const details=[...output.matchAll(/<details\b[^>]*\bid="(head-teaching-[^"]+)"[^>]*>/g)];
  assert.deepEqual(details.map(match=>match[1]),targets.map(target=>target.id));
  for(const match of details){assert(!/\bopen(?:=|\s|>)/.test(match[0]),match[1]);}
  const headingStart=output.indexOf('<h2>Teaching summaries · 25</h2>');
  assert(headingStart>=0&&headingStart<details[0].index!);
  for(const [index,match] of details.entries()){
    const slice=output.slice(match.index!,details[index+1]?.index??output.indexOf('<details id="head-review-references"'));
    assert(slice.includes(`<summary><h3>${targets[index].label}</h3></summary>`),targets[index].id);
    const headings=['Anatomy &amp; relationships','Function','CT · reading the image','MRI · reading the image','Try this'];
    let previous=-1;
    for(const heading of headings){const position=slice.indexOf(`<h4>${heading}</h4>`);assert(position>previous,`${targets[index].id}: ${heading}`);previous=position;}
  }
  for(const id of ['head-guided-review','head-review-references']){
    const tag=output.match(new RegExp(`<details\\b[^>]*\\bid="${id}"[^>]*>`))?.[0];
    assert(tag,id);assert(!/\bopen(?:=|\s|>)/.test(tag),id);
  }
  assert.match(output,/<details[^>]*><summary>Exact revisions &amp; teaching checklist/);
  const navigator=nodes(tree(),node=>node.type===Navigator)[0];assert(navigator);
  const select=nodes(Navigator(navigator.props),node=>node.type==='select'&&node.props.name==='head-review-target')[0];assert(select);
  assert.equal(select.props.required,true);assert.equal(select.props.defaultValue,'');assert.equal(select.props.onChange,undefined);
  const options=nodes(select,node=>node.type==='option');
  assert.equal(options[0].props.value,'');assert.equal(options[0].props.disabled,true);
  assert.deepEqual(options.slice(1).map(option=>({id:option.props.value,label:option.props.children})),targets);
  assert(output.includes('Teaching structure'));
  assert(output.includes('Open summary'));
  for(const note of teaching.headTeachingContent.notes){assert(output.includes(note.anatomy.text));assert(output.includes(note.function.text));assert(output.includes(note.task));}
});

test('verified comparison targets append to the original 25 in exact packet order without duplicate ids',()=>{
  assert.equal(additionalTargets.length,6);
  const expected=[...targets,...additionalTargets];
  assert.equal(expected.length,31);
  assert.equal(new Set(expected.map(target=>target.id)).size,31);
  const navigator=nodes(tree({additionalTargets}),node=>node.type===Navigator)[0];assert(navigator);
  const select=nodes(Navigator(navigator.props),node=>node.type==='select'&&node.props.name==='head-review-target')[0];assert(select);
  const options=nodes(select,node=>node.type==='option').slice(1);
  assert.deepEqual(options.map(option=>({id:option.props.value,label:option.props.children})),expected);
  const output=html({additionalTargets});
  assert.equal((output.match(/<option value="head-teaching-/g)??[]).length,25);
  assert.equal((output.match(/<option value="head-mri-comparison-/g)??[]).length,4);
  assert.equal((output.match(/<option value="head-insula-comparison-/g)??[]).length,2);
  assert.equal(new Set([...output.matchAll(/<option value="([^"]+)"/g)].map(match=>match[1])).size,31);
});

test('all 31 picker choices resolve to real collapsed disclosures in their own review sections',()=>{
  const mri=component('HeadMriComparisonReview',{
    '../lib/head-mri-comparison-review':{HEAD_MRI_COMPARISON_REVISION:'test-revision'},
    '../lib/head-mri-only-teaching':{HEAD_MRI_ONLY_TEACHING_REVISION:'test-revision'},
    '../lib/head-mri-learning':{HEAD_MRI_LEARNING_REVISION:'test-revision'},
    '../lib/head-atlas-learning':learning,
    './HeadAtlasTeaching':{HeadAtlasTeaching:()=>null},
  }).Component;
  const insula=component('HeadInsulaComparisonReview',{
    './HeadPairedDecisionPanel':{HeadPairedDecisionPanel:component('HeadPairedDecisionPanel',{'../lib/head-paired-decision-contract':{},'./HeadPairedDecisionForm':{}}).Component},
    '../lib/head-insula-comparison-review':{HEAD_INSULA_COMPARISON_REVISION:'test-revision'},
    '../lib/head-insula-teaching':{HEAD_INSULA_TEACHING_REVISION:'test-revision'},
    '../lib/head-insula-learning':{HEAD_INSULA_LEARNING_REVISION:'test-revision'},
    '../lib/head-atlas-learning':learning,
    './HeadAtlasTeaching':{HeadAtlasTeaching:()=>null},
  }).Component;
  const output=html({additionalTargets,comparisonReview:React.createElement(mri,{packet:headMriComparisonPacket()}),insulaReview:React.createElement(insula,{packet:headInsulaComparisonPacket()})});
  const choices=[...output.matchAll(/<option value="([^"]+)"/g)].map(match=>match[1]);
  const disclosures=[...output.matchAll(/<details\b[^>]*\bid="([^"]+)"/g)].map(match=>match[1]);
  assert.deepEqual(choices,[...targets,...additionalTargets].map(target=>target.id));
  assert.equal(choices.length,31);
  assert.equal(new Set(choices).size,31);
  for(const id of choices)assert.equal(disclosures.filter(found=>found===id).length,1,id);
  for(const target of additionalTargets.slice(0,4))assert(output.indexOf('id="mri-only-comparisons"')<output.indexOf(`id="${target.id}"`));
  for(const target of additionalTargets.slice(4))assert(output.indexOf('id="insula-comparisons"')<output.indexOf(`id="${target.id}"`));
  for(const tag of output.matchAll(/<details\b[^>]*\bid="(head-(?:mri|insula)-comparison-[^"]+)"[^>]*>/g))assert(!/\bopen(?:=|\s|>)/.test(tag[0]),tag[1]);
});

test('review sections have stable anchors and private notes remain one sibling through navigation',()=>{
  const privateNotes=React.createElement('aside',{id:'private-notes-probe'},'Unsaved private text');
  const insulaReview=React.createElement('aside',{id:'insula-probe'},'Independent insula evidence');
  const output=html({reviewNotes:privateNotes,comparisonReview:React.createElement('aside',null,'MRI comparison probe'),insulaReview});
  for(const id of ['head-review-notes-title','head-guided-review','mri-only-comparisons','insula-comparisons','head-review-references'])assert(output.includes(`href="#${id}"`),id);
  assert.equal(output.split('id="insula-probe"').length-1,1);
  assert.equal(output.split('id="private-notes-probe"').length-1,1);
  assert(output.includes('Unsaved private text'));
  const reviewTree=tree({reviewNotes:privateNotes});
  assert.equal(nodes(reviewTree,node=>node===privateNotes).length,1);
  const withoutComparison=html({reviewNotes:privateNotes});
  assert(!withoutComparison.includes('href="#mri-only-comparisons"'));
  assert(!withoutComparison.includes('href="#insula-comparisons"'));
  const stale=renderToStaticMarkup(React.createElement(Review,{revision:'stale',reviewNotes:privateNotes,insulaReview}));
  assert(!stale.includes('Independent insula evidence'));
  assert(!stale.includes('name="head-review-target"'));assert(!stale.includes('Unsaved private text'));
  assert(!stale.includes(teaching.headTeachingContent.notes[0].anatomy.text));
  assert(stale.includes('current head source does not match'));
  assert(output.includes(teaching.HEAD_TEACHING_REVISION));assert(output.includes(learning.HEAD_LEARNING_REVISION));
  assert(!/fetch\(|localStorage|sessionStorage|location\.|history\.|useRouter|useState/.test(navigatorSource));
  assert(!/fetch\(|localStorage|sessionStorage/.test(reviewSource));
});

test('selection is inert; explicit submit opens only an explicitly listed target inside the current main',()=>{
  const picker=Navigator({targets});
  const form=nodes(picker,node=>node.type==='form')[0];assert(form);
  const select=nodes(form,node=>node.type==='select')[0];assert(select);assert.equal(select.props.onChange,undefined);
  assert.equal(nodes(form,node=>node.type==='button')[0]?.props.children,'Open summary');
  const calls:string[]=[];
  const within=new Set<unknown>();
  const main={tagName:'MAIN',contains(node:unknown){return within.has(node);}};
  const ancestor={tagName:'DETAILS',open:false,parentElement:main,querySelector(){return null;}};
  const summary={tagName:'SUMMARY',focus(){calls.push('focus');}};
  const target={tagName:'DETAILS',open:false,parentElement:ancestor,querySelector(selector:string){assert.equal(selector,':scope > summary');return summary;},scrollIntoView(options:unknown){calls.push('scroll:'+JSON.stringify(options));}};
  const sibling={tagName:'DETAILS',open:false,parentElement:ancestor};
  within.add(target);within.add(ancestor);
  let found:unknown=target;
  const ownerDocument={getElementById(id:string){calls.push(`lookup:${id}`);return found;}};
  const selected=targets[0].id;
  function submit(value:string|null){
    let prevented=false;
    form.props.onSubmit({preventDefault(){prevented=true;},currentTarget:{closest(name:string){assert.equal(name,'main');return main;},ownerDocument,elements:{namedItem(name:string){assert.equal(name,'head-review-target');return value===null?null:{value};}}}});
    assert(prevented);
  }
  assert.equal(target.open,false);assert.equal(ancestor.open,false);assert.equal(calls.length,0);
  for(const invalid of [null,'','unknown','javascript:alert(1)','head-teaching-<script>'])submit(invalid);
  assert.equal(target.open,false);assert.equal(ancestor.open,false);assert(!calls.some(call=>call==='focus'||call.startsWith('scroll:')));
  calls.length=0;found=null;submit(selected);assert.equal(target.open,false);assert.equal(calls.join('|'),`lookup:${selected}`);
  calls.length=0;
  const heading={tagName:'H2',hasAttribute(){return false;},setAttribute(name:string,value:string){assert.equal(name,'tabindex');assert.equal(value,'-1');},focus(options:unknown){assert.deepEqual(options,{preventScroll:true});calls.push('focus');}};
  found={...target,tagName:'SECTION',querySelector(selector:string){assert(selector.includes(':scope > h2'));return heading;}};
  within.add(found);submit(selected);assert.equal(target.open,false);assert(ancestor.open);assert(calls.includes('focus'));assert(calls.some(call=>call.startsWith('scroll:')));ancestor.open=false;
  calls.length=0;found={...target};submit(selected);assert.equal(target.open,false);assert(!calls.includes('focus'));
  calls.length=0;found=target;submit(selected);
  assert.equal(target.open,true);assert.equal(ancestor.open,true);
  assert.equal(sibling.open,false);
  assert(calls.includes('focus'));assert(calls.some(call=>call.startsWith('scroll:')));
});
