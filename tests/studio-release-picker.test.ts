import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import React from 'react';
import ts from 'typescript';
const require=createRequire(import.meta.url);
const {stableMutationContext}=require('./studio-mutation-context-fixture.mjs');
const code=ts.transpileModule(readFileSync(new URL('../components/StudioForms.tsx',import.meta.url),'utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
type Node={type:unknown;props:Record<string,any>};
function harness(){
 const slots:any[]=[];let cursor=0;
 const hooks={...React,useEffect(){},useRef(initial:unknown){const i=cursor++;if(!(i in slots))slots[i]={current:initial};return slots[i];},useState(initial:unknown){const i=cursor++;if(!(i in slots))slots[i]=typeof initial==='function'?initial():initial;return [slots[i],(next:any)=>{slots[i]=typeof next==='function'?next(slots[i]):next;}];}};
 const mod={exports:{} as {ReleaseDraftForm:(props:any)=>Node}};
 new Function('require','module','exports',code)((name:string)=>name==='../lib/studio-mutation-context.ts'?stableMutationContext:name==='react'?hooks:name==='next/navigation'?{useRouter:()=>({refresh(){}})}:name==='@/lib/studio-templates'?{STUDIO_COURSE_TEMPLATES:[]}:require(name),mod,mod.exports);
 const render=()=>{cursor=0;return mod.exports.ReleaseDraftForm({course:{id:'synthetic',title:'Course'},workbooks:['a','b','c'].map(id=>({id,title:id,mode:'lecture',caseCount:0})),release:{id:'release',status:'draft',workbookIds:['b','a'],outcomes:[],version:3},recoveryScope:{actorId:'edu:synthetic-author',organizationId:'org:synthetic'}});};
 function nodes(value:any,predicate:(node:Node)=>boolean):Node[]{if(Array.isArray(value))return value.flatMap(v=>nodes(v,predicate));if(!value?.props)return [];return [...(predicate(value)?[value]:[]),...nodes(value.props.children,predicate)];}
 const checkboxes=(tree:Node)=>nodes(tree,n=>n.type==='input'&&n.props.name==='workbookIds');
 const values=(tree:Node)=>checkboxes(tree).filter(n=>n.props.checked).map(n=>n.props.value);
 const move=(tree:Node,id:string,direction:string)=>{const button=nodes(tree,n=>n.type==='button'&&n.props['aria-label']===`Move ${id} ${direction}`)[0];assert(button);return button;};
 return {render,values,move,checkboxes};
}
test('release picker preserves saved order and offers exact bounded movement',()=>{
 const h=harness();let tree=h.render();assert.deepEqual(h.values(tree),['b','a']);assert.equal(h.move(tree,'b','up').props.disabled,true);
 h.move(tree,'a','up').props.onClick();tree=h.render();assert.deepEqual(h.values(tree),['a','b']);assert.equal(h.move(tree,'b','down').props.disabled,true);
 assert.equal(tree.props.draftRevision,JSON.stringify([['a','b'],0]));
 const form=new FormData();for(const id of ['a','b','c'])form.append('workbookIds',id);tree.props.onValuesChange(form);tree=h.render();
 assert.deepEqual(h.values(tree),['a','b','c']);h.move(tree,'c','up').props.onClick();assert.deepEqual(h.values(h.render()),['a','c','b']);
});
test('recovered array order wins over old DOM order and foreign values are excluded',()=>{
 const h=harness();const form=new FormData();for(const id of ['a','b','c'])form.append('workbookIds',id);
 h.render().props.onValuesChange(form,{workbookIds:['c','b','foreign','c']});let tree=h.render();assert.deepEqual(h.values(tree),['c','b']);
 assert.deepEqual(h.checkboxes(tree).map(n=>n.props.value),['c','b','a']);
 tree.props.onValuesChange(form,{workbookIds:'a'});assert.deepEqual(h.values(h.render()),['a']);
 h.render().props.onValuesChange(form,{workbookIds:'false'});assert.deepEqual(h.values(h.render()),[]);
});
test('submitted release uses visible checkbox order without publication or access actions',async()=>{
 const oldFetch=globalThis.fetch;const payloads:any[]=[];
 globalThis.fetch=(async(_url,options)=>{payloads.push(JSON.parse(String(options?.body)));return {ok:true,json:async()=>({ok:true,action:'save-release',releaseId:'release'})} as Response;});
 try{
  const h=harness();h.move(h.render(),'a','up').props.onClick();const tree=h.render(),form=new FormData();
  for(const id of h.values(tree))form.append('workbookIds',id);
  form.set('outcomes','Identify anatomical structures\nCompare imaging appearances');
  form.set('expectedCourseId','synthetic');form.set('expectedReleaseId','release');form.set('expectedVersion','3');
  await tree.props.onSubmit(form,()=>true);
  assert.equal(payloads.length,1);assert.equal(payloads[0].action,'save-release');assert.equal(payloads[0].expectedVersion,3);assert.deepEqual(payloads[0].workbookIds,['a','b']);
 }finally{globalThis.fetch=oldFetch;}
});
