import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import {HEAD_MANIFEST_SHA256,type HeadEntry,type LoadedStudy} from '../lib/head-atlas-import.ts';
import {headStudySetEntries,toggleHeadStudySet,type HeadStudySet} from '../lib/head-study-set.ts';

const require=createRequire(import.meta.url);
const componentSource=readFileSync(new URL('../components/HeadAtlasStudySet.tsx',import.meta.url),'utf8');
const viewerSource=readFileSync(new URL('../components/HeadAtlasViewer.tsx',import.meta.url),'utf8');
function transpile(source:string){
  const result=ts.transpileModule(source,{reportDiagnostics:true,compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}});
  assert.equal(result.diagnostics?.filter(item=>item.category===ts.DiagnosticCategory.Error).length,0);
  return result.outputText;
}
type Element={type:string|symbol;props:Record<string,unknown>;key?:string};
const fragment=Symbol('Fragment');
const jsx=(type:Element['type'],props:Record<string,unknown>,key?:string):Element=>({type,props,key});
function nodes(value:unknown):Element[]{
  if(Array.isArray(value))return value.flatMap(nodes);
  if(!value||typeof value!=='object'||!('type' in value))return [];
  const element=value as Element;
  return [element,...nodes(element.props.children)];
}
function one(tree:Element,type:string,predicate:(node:Element)=>boolean=()=>true):Element{
  const matches=nodes(tree).filter(node=>node.type===type&&predicate(node));
  assert.equal(matches.length,1,`expected one ${type}, found ${matches.length}`);
  return matches[0];
}
function content(value:unknown):string{
  if(Array.isArray(value))return value.map(content).join('');
  if(value&&typeof value==='object'&&'props' in value)return content((value as Element).props.children);
  return value==null?'':String(value);
}
function entry(id:string):HeadEntry{
  return {id,label:`${id} regional mask`,family:'test',representation:'partial_mask',color:[1,0,0],opacity:{fill:.2,outline:1},
    mask:{file:`${id}.bin`,sha256:id.padEnd(64,'a'),dtype:'uint8',shape_kji:[1,1,1],offset_kji:[0,0,0],native_shape_kji:[2,2,2],ijk_to_ras:[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]}};
}
function study(entries:HeadEntry[]):LoadedStudy{return {definition:{entries}} as LoadedStudy;}

function componentHarness(initial:HeadEntry[],filteredAdd?:{count:number;total:number;onAdd:()=>void}){
  const module={exports:{} as Record<string,unknown>};const slots:unknown[]=[];let cursor=0;
  const calls:{kind:string;value?:unknown}[]=[];
  new Function('require','module','exports',transpile(componentSource))((name:string)=>{
    if(name==='react')return {useEffect:()=>{},useState:(initial:unknown)=>{const slot=cursor++;if(!(slot in slots))slots[slot]=typeof initial==='function'?initial():initial;return [slots[slot],(value:unknown)=>{slots[slot]=typeof value==='function'?value(slots[slot]):value;}];}};
    if(name==='react/jsx-runtime')return {jsx,jsxs:jsx,Fragment:fragment};
    if(name==='../lib/head-atlas-display')return require('../lib/head-atlas-display.ts');
    if(name==='../lib/head-study-set')return require('../lib/head-study-set.ts');
    if(name==='../lib/head-disclosure-keyboard')return require('../lib/head-disclosure-keyboard.ts');
    throw Error(`unexpected import ${name}`);
  },module,module.exports);
  const Component=module.exports.HeadAtlasStudySet as (props:Record<string,unknown>)=>Element;
  let entries=initial;
  function render(){cursor=0;return Component({entries,filteredAdd,onSelect:(value:HeadEntry)=>calls.push({kind:'select',value}),
    onRemove:(value:HeadEntry)=>{calls.push({kind:'remove',value});entries=entries.filter(item=>item!==value);},
    onClear:()=>{calls.push({kind:'clear'});entries=[];},
    onPractice:(value:string)=>calls.push({kind:'practice',value})});}
  return {render,calls,setEntries:(value:HeadEntry[])=>{entries=value;}};
}
function click(node:Element,event:Record<string,unknown>={}){(node.props.onClick as (value:unknown)=>void)(event);}

test('empty disclosure is compact and offers no way to start practice',()=>{
  const h=componentHarness([]),tree=h.render();
  assert.equal(content(one(tree,'summary')),'My study set · 0');
  assert.match(content(tree),/No structures added yet/);
  assert.equal(nodes(tree).filter(node=>node.type==='ol'||node.type==='select').length,0);
  assert.equal(nodes(tree).filter(node=>node.type==='button').length,0);
  assert.deepEqual(h.calls,[]);
});

test('filtered batch action stays inside the existing disclosure and explains capacity without starting practice',()=>{
  let adds=0;
  const h=componentHarness([entry('a')],{count:2,total:7,onAdd:()=>{adds++;}}),tree=h.render();
  assert.equal(one(tree,'details').props.open,undefined);
  const add=one(tree,'button',node=>content(node)==='Add filtered masks to study set (2)');
  click(add);assert.equal(adds,1);assert.deepEqual(h.calls,[]);
  assert.match(content(tree),/2 of 7 new masks fit/);assert.match(content(tree),/Earlier entries stay/);
  const none=componentHarness([],{count:0,total:0,onAdd:()=>{adds++;}}).render();
  assert.equal(one(none,'button').props.disabled,true);assert.match(content(none),/No new eligible masks/);
});

test('filled disclosure selects exact entry and supports all three question modes',()=>{
  const a=entry('a'),b=entry('b'),h=componentHarness([a,b]);
  let tree=h.render();
  assert.equal(content(one(tree,'summary')),'My study set · 2');
  assert.deepEqual(nodes(one(tree,'ol')).filter(node=>node.type==='li').map(node=>node.key),['a','b']);
  click(one(tree,'button',node=>node.props['aria-label']==='Study a'));
  assert.deepEqual(h.calls,[{kind:'select',value:a}]);
  const selector=one(tree,'select');
  assert.deepEqual(nodes(selector).filter(node=>node.type==='option').map(node=>node.props.value),['locate','label','recall']);
  for(const mode of ['locate','label','recall'] as const){
    (selector.props.onChange as (event:unknown)=>void)({target:{value:mode}});
    tree=h.render();assert.equal(one(tree,'select').props.value,mode);
    click(one(tree,'button',node=>content(node).startsWith('Practise study set')));
  }
  assert.deepEqual(h.calls.slice(1),['locate','label','recall'].map(value=>({kind:'practice',value})));
  (selector.props.onChange as (event:unknown)=>void)({target:{value:'invalid'}});
  assert.equal(one(h.render(),'select').props.value,'recall');
});

test('remove and clear focus summary before changing the shortlist',()=>{
  const a=entry('a'),b=entry('b'),h=componentHarness([a,b]);let focused=0;
  const event={currentTarget:{closest:()=>({querySelector:()=>({focus:()=>{focused++;}})})}};
  click(one(h.render(),'button',node=>node.props['aria-label']==='Remove a from study set'),event);
  assert.equal(focused,1);assert.deepEqual(h.calls,[{kind:'remove',value:a}]);
  assert.equal(content(one(h.render(),'summary')),'My study set · 1');
  click(one(h.render(),'button',node=>content(node)==='Clear study set'),event);
  assert.equal(focused,2);assert.deepEqual(h.calls.at(-1),{kind:'clear'});
  assert.equal(content(one(h.render(),'summary')),'My study set · 0');
});

test('Escape closes an open disclosure and focuses its summary',()=>{
  const h=componentHarness([entry('a')]),details=one(h.render(),'details');let focused=0,prevented=0,stopped=0;
  const currentTarget={open:true,isConnected:true,querySelector:()=>({isConnected:true,focus:()=>{focused++;}})};
  const handler=details.props.onKeyDown as (event:unknown)=>void;
  handler({key:'Escape',defaultPrevented:false,currentTarget,target:{closest:()=>currentTarget},preventDefault:()=>{prevented++;},stopPropagation:()=>{stopped++;}});
  assert.equal(currentTarget.open,false);assert.deepEqual([focused,prevented,stopped],[1,1,1]);
  handler({key:'Escape',defaultPrevented:false,currentTarget,target:{closest:()=>currentTarget},preventDefault:()=>{prevented++;},stopPropagation:()=>{stopped++;}});
  handler({key:'Enter',currentTarget:{...currentTarget,open:true},preventDefault:()=>{prevented++;},stopPropagation:()=>{stopped++;}});
  assert.deepEqual([focused,prevented,stopped],[1,1,1]);
});

const viewerTree=ts.createSourceFile('HeadAtlasViewer.tsx',viewerSource,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const handlers=new Map<string,ts.FunctionDeclaration>();
function visit(node:ts.Node):void{
  if(ts.isFunctionDeclaration(node)&&node.name&&['canUseStudySet','toggleStudyEntry','practiseStudySet'].includes(node.name.text))handlers.set(node.name.text,node);
  ts.forEachChild(node,visit);
}
visit(viewerTree);
for(const name of ['toggleStudyEntry','practiseStudySet'])assert(handlers.has(name),`${name} must remain an executable viewer handler`);
const extracted=transpile([...handlers.values()].map(node=>node.getText(viewerTree)).join('\n'));
function viewerHarness(options:{active?:boolean;opening?:boolean;retired?:boolean;generationChanged?:boolean;setChanged?:boolean;empty?:boolean;refuse?:boolean}={}){
  const a=entry('a'),b=entry('b'),current=study([a,b]);let set:HeadStudySet=options.empty?null:toggleHeadStudySet(null,current,HEAD_MANIFEST_SHA256,a);
  if(set&&!options.empty)set=toggleHeadStudySet(set,current,HEAD_MANIFEST_SHA256,b);
  const calls:{kind:string;value?:unknown}[]=[];
  const practice={startTargets:(targets:HeadEntry[],mode:string)=>{calls.push({kind:'start',value:{targets,mode}});return !options.refuse;}};
  const reviewContext={study:current,generation:1};
  const scope={study:current,studySet:set,studySetRef:{current:options.setChanged?null:set},practice,practiceRef:{current:{active:!!options.active}},packageOpening:!!options.opening,
    reviewContext,reviewContextRef:{current:options.retired?{...reviewContext}:reviewContext},importGeneration:{current:options.generationChanged?2:1},HEAD_MANIFEST_SHA256,
    headStudySetEntries,toggleHeadStudySet,shuffled:(items:HeadEntry[])=>[...items],
    setStudySet:(updater:(value:HeadStudySet)=>HeadStudySet)=>{set=updater(set);calls.push({kind:'set'});},
    setPracticeOrigin:(value:unknown)=>calls.push({kind:'origin',value}),writeNavigation:(...value:unknown[])=>calls.push({kind:'navigation',value}),
    setRightPanel:(value:string)=>calls.push({kind:'panel',value})};
  const fn=new Function(...Object.keys(scope),`${extracted}\nreturn {toggleStudyEntry,practiseStudySet};`);
  const actions=fn(...Object.values(scope)) as {toggleStudyEntry:(value:HeadEntry)=>void;practiseStudySet:(mode:string)=>void};
  return {actions,calls,a,b,current,getSet:()=>set};
}

test('viewer toggle and practice handlers refuse active, opening and retired contexts',()=>{
  for(const option of [{active:true},{opening:true},{retired:true},{generationChanged:true},{setChanged:true}]){
    const h=viewerHarness(option),before=h.getSet();
    h.actions.toggleStudyEntry(h.a);h.actions.practiseStudySet('locate');
    assert.deepEqual(h.calls,[]);assert.equal(h.getSet(),before);
  }
});

test('empty set, invalid mode and declined start preserve navigation and panel',()=>{
  for(const option of [{empty:true},{refuse:true}]){
    const h=viewerHarness(option);h.actions.practiseStudySet('label');
    assert.deepEqual(h.calls.filter(call=>call.kind!=='start'),[]);
  }
  const h=viewerHarness();h.actions.practiseStudySet('invalid');assert.deepEqual(h.calls,[]);
});

test('valid start passes exact shortlist and chosen mode, then resets origin, navigation and panel',()=>{
  for(const mode of ['locate','label','recall']){
    const h=viewerHarness();h.actions.practiseStudySet(mode);
    assert.deepEqual(h.calls.map(call=>call.kind),['start','origin','navigation','panel']);
    assert.deepEqual(h.calls[0].value,{targets:[h.a,h.b],mode});
    assert.deepEqual(h.calls.slice(1),[{kind:'origin',value:null},{kind:'navigation',value:[null,null]},{kind:'panel',value:'practice'}]);
  }
});

test('viewer resets local shortlist on study/package/modality change and hides it during quiz',()=>{
  assert.match(viewerSource,/useEffect\(\(\)=>\{setStudySet\(null\);\},\[study,pkg,modality\]\)/);
  assert.match(viewerSource,/const studySetEntries=headStudySetEntries\(studySet,study,HEAD_MANIFEST_SHA256\)/);
  assert.match(viewerSource,/const sidebar=quizActive\?<div className="head-atlas-sidebar head-index-paused"/);
  assert.match(viewerSource,/\{study&&<HeadAtlasStudySet entries=\{studySetEntries\}/);
  assert.match(viewerSource,/const selectedPracticeEntry=!quizActive&&/);
  assert.doesNotMatch(componentSource,/\b(?:localStorage|sessionStorage|fetch|XMLHttpRequest)\b/);
  assert.doesNotMatch(readFileSync(new URL('../lib/head-study-set.ts',import.meta.url),'utf8'),/\b(?:localStorage|sessionStorage|fetch|XMLHttpRequest)\b/);
});
