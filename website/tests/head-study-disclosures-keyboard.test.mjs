import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';

const require=createRequire(import.meta.url);
const jsx=(type,props)=>({type,props});
function load(name){
 const source=readFileSync(new URL(`../components/${name}.tsx`,import.meta.url),'utf8');
 const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
 const state=[];let cursor=0;
 const hooks={useState(initial){const slot=cursor++;if(!(slot in state))state[slot]=initial;return [state[slot],next=>{state[slot]=typeof next==='function'?next(state[slot]):next;}]},useRef(initial){const slot=cursor++;return state[slot]??={current:initial};},useEffect(){},useLayoutEffect(){}};
 const mod={exports:{}};
 new Function('require','module','exports',compiled)((id)=>id==='react'?hooks:id==='react/jsx-runtime'?{jsx,jsxs:jsx,Fragment:Symbol('Fragment')}:id.startsWith('../lib/')?require(id+'.ts'):require(id),mod,mod.exports);
 return {render:(props)=>{cursor=0;return mod.exports[name](props)}};
}
function nodes(value){return Array.isArray(value)?value.flatMap(nodes):value?.props?[value,...nodes(value.props.children)]:[];}
function text(value){return Array.isArray(value)?value.map(text).join(''):value?.props?text(value.props.children):value==null?'':String(value);}
function details(tree,label){const found=nodes(tree).find(node=>node.type==='details'&&[node.props.children].flat().some(child=>child?.type==='summary'&&text(child)===label));assert(found,`missing ${label}`);return found;}
function dom(parent=null,connected=true){
 const focus=[];const summary={isConnected:connected,focus:(options)=>focus.push(options)};
 const element={open:true,isConnected:connected,querySelector:(selector)=>selector===':scope > summary'?summary:null,parent};
 return {element,focus};
}
function event(element,target=element,options={}){
 let stopped=0,prevented=0;
 const e={key:'Escape',defaultPrevented:!!options.consumed,nativeEvent:{isComposing:!!options.composing,keyCode:options.keyCode},currentTarget:element,target:{closest:()=>target},preventDefault(){prevented++;e.defaultPrevented=true},stopPropagation(){stopped++}};
 return {e,get result(){return {stopped,prevented}}};
}
function dispatch(inner,outer,innerDom,outerDom,options){const input=event(innerDom.element,innerDom.element,options);inner.props.onKeyDown(input.e);if(!input.result.stopped){input.e.currentTarget=outerDom.element;outer.props.onKeyDown(input.e);}return input.result;}

test('nine-entry searchable set closes only its focused inner comparison, order, or saved-plan disclosure',()=>{
 const entries=Array.from({length:9},(_,i)=>({id:`entry-${i}`,label:`Structure ${i+1}`}));
 const set=load('HeadAtlasStudySet'),saved=load('HeadAtlasSavedStudyPlan');
 const savedNode=saved.render({plan:null,entries,study:{definition:{entries}},modality:'CT',canUse:()=>true,onRestore:()=>assert.fail('restore')});
 const props={entries,comparisons:[{entry:entries[0],links:[],scopeNote:'Different subject; no registered coordinates.'}],savedPlan:savedNode,onMove:()=>{},onSelect:()=>{},onRemove:()=>{},onClear:()=>{},onPractice:()=>{}};
 let tree=set.render(props);
 assert.equal(nodes(tree).filter(n=>n.type==='input'&&n.props.type==='search').length,1);
 const search=nodes(tree).find(n=>n.type==='input'&&n.props.type==='search');search.props.onChange({currentTarget:{value:'Structure 1'}});
 tree=set.render(props);assert.equal(nodes(tree).filter(n=>n.type==='button'&&text(n)==='Structure 1').length,1);
 const outer=nodes(tree).find(n=>n.type==='details'&&n.props.className==='head-study-set');
 for(const [label,nested] of [['Comparison limits',nodes(tree).find(n=>n.type==='details'&&n.props.className==='head-study-comparison-limits')],['Arrange study order',details(tree,'Arrange study order')],['Save or restore a plan',details(tree,'Save or restore a plan')]]){
  assert(nested,label);const parentDom=dom(),innerDom=dom(parentDom.element);
  for(const options of [{consumed:true},{composing:true},{keyCode:229}]){
   assert.deepEqual(dispatch(nested,outer,innerDom,parentDom,options),{stopped:0,prevented:0},label);
   assert.equal(innerDom.element.open,true);assert.equal(parentDom.element.open,true);
  }
  assert.deepEqual(dispatch(nested,outer,innerDom,parentDom),{stopped:1,prevented:1},label);
  assert.equal(innerDom.element.open,false);assert.equal(parentDom.element.open,true);
  assert.deepEqual(innerDom.focus,[{preventScroll:true}]);assert.deepEqual(parentDom.focus,[]);
 }
});

test('outer disclosure ignores bubbled, consumed, composing and disconnected Escape; direct Escape restores summary focus',()=>{
 const entry={id:'one',label:'One'};const set=load('HeadAtlasStudySet');
 const outer=nodes(set.render({entries:[entry],onSelect:()=>{},onRemove:()=>{},onClear:()=>{},onPractice:()=>{}})).find(n=>n.type==='details');
 for(const options of [{consumed:true},{composing:true},{keyCode:229},{disconnected:true},{bubbled:true}]){
  const parent=dom(null,!options.disconnected),child=dom(parent.element),input=event(parent.element,options.bubbled?child.element:parent.element,options);
  outer.props.onKeyDown(input.e);assert.deepEqual(input.result,{stopped:0,prevented:0});assert.equal(parent.element.open,true);assert.deepEqual(parent.focus,[]);
 }
 const live=dom(),input=event(live.element);outer.props.onKeyDown(input.e);
 assert.deepEqual(input.result,{stopped:1,prevented:1});assert.equal(live.element.open,false);assert.deepEqual(live.focus,[{preventScroll:true}]);
});
