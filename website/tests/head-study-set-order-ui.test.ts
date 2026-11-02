import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import {HEAD_MANIFEST_SHA256,type HeadEntry,type LoadedStudy,type Modality} from '../lib/head-atlas-import.ts';
import {headStudySetEntries,moveHeadStudySet,type HeadStudySet} from '../lib/head-study-set.ts';
const require=createRequire(import.meta.url);
const source=readFileSync(new URL('../components/HeadAtlasStudySet.tsx',import.meta.url),'utf8');
const viewer=readFileSync(new URL('../components/HeadAtlasViewer.tsx',import.meta.url),'utf8');
const compile=(s:string)=>ts.transpileModule(s,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
type Node={type:unknown;props:Record<string,any>};
const nodes=(v:any):Node[]=>Array.isArray(v)?v.flatMap(nodes):v&&typeof v==='object'&&v.props?[v,...nodes(v.props.children)]:[];
const text=(v:any):string=>Array.isArray(v)?v.map(text).join(''):v?.props?text(v.props.children):v==null?'':String(v);
const one=(v:any,type:string,match:(n:Node)=>boolean=()=>true)=>{const found=nodes(v).filter(n=>n.type===type&&match(n));assert.equal(found.length,1);return found[0];};
function entry(id:string,n:number):HeadEntry{return {id,label:id,family:'test',representation:'mask',color:[1,0,0],opacity:{fill:.2,outline:1},mask:{file:id+'.bin',sha256:String(n).repeat(64),dtype:'uint8',shape_kji:[1,1,1],offset_kji:[0,0,0],native_shape_kji:[2,2,2],ijk_to_ras:[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]}};}
const a=entry('a',1),b=entry('b',2),c=entry('c',3);
const mod={exports:{} as {HeadAtlasStudySet:(p:any)=>Node}};
new Function('require','module','exports',compile(source))((name:string)=>name==='react'?{useEffect:()=>{},useState:(initial:unknown)=>[typeof initial==='function'?initial():initial,()=>{}]}:name==='../lib/head-atlas-display'?require('../lib/head-atlas-display.ts'):name==='../lib/head-study-set'?require('../lib/head-study-set.ts'):name==='../lib/head-disclosure-keyboard'?require('../lib/head-disclosure-keyboard.ts'):require(name),mod,mod.exports);
function ui(entries=[a,b,c]){const calls:any[]=[];return {calls,tree:mod.exports.HeadAtlasStudySet({entries,onSelect:()=>calls.push('select'),onRemove:()=>calls.push('remove'),onClear:()=>calls.push('clear'),onMove:(...args:any[])=>calls.push(['move',...args]),onPractice:(...args:any[])=>calls.push(['practice',...args])})};}
test('ordering remains collapsed, preserves shuffled default and disables exact list boundaries',()=>{
 const {tree,calls}=ui();const arrange=one(tree,'details',n=>text(n.props.children).startsWith('Arrange study order'));
 assert.equal(arrange.props.open,undefined);
 const list=one(arrange,'ol');assert.equal(list.props['aria-label'],'Arrange study set');
 assert.equal(one(list,'button',n=>n.props['aria-label']==='Move a earlier').props.disabled,true);
 assert.equal(one(list,'button',n=>n.props['aria-label']==='Move c later').props.disabled,true);
 assert.equal(one(list,'button',n=>n.props['aria-label']==='Move b earlier').props.disabled,false);
 const order=one(tree,'select',n=>n.props.name==='study-set-question-order');assert.equal(order.props.defaultValue,'shuffle');
 assert.match(text(arrange),/saved plans and existing results stay unchanged/);assert.deepEqual(calls,[]);
 assert.equal(nodes(ui([]).tree).filter(n=>n.type==='select').length,0);
});
test('move focuses the retained entry label before callback without starting or selecting anything',()=>{
 const {tree,calls}=ui(),button=one(tree,'button',n=>n.props['aria-label']==='Move b earlier');
 button.props.onClick({currentTarget:{closest:()=>({querySelector:()=>({focus:()=>calls.push('focus')})})}});
 assert.deepEqual(calls,['focus',['move',b,-1]]);
});
test('explicit practice sends only allowed order and nested Escape leaves parent disclosure open',()=>{
 const {tree,calls}=ui(),button=one(tree,'button',n=>text(n)==='Practise study set (3)');
 for(const value of ['shuffle','study-set','injected'])button.props.onClick({currentTarget:{closest:()=>({querySelector:()=>({value})})}});
 assert.deepEqual([...calls],[['practice','locate','shuffle'],['practice','locate','study-set']]);
 const details=one(tree,'details',n=>text(n.props.children).startsWith('Arrange study order'));
 const currentTarget={open:true,isConnected:true,querySelector:()=>({isConnected:true,focus:()=>calls.push('focus')})};
 details.props.onKeyDown({key:'Escape',defaultPrevented:false,currentTarget,target:{closest:()=>currentTarget},preventDefault:()=>calls.push('prevent'),stopPropagation:()=>calls.push('stop')});
 assert.equal(currentTarget.open,false);assert.deepEqual(calls.slice(-3),['prevent','stop','focus']);
});
const syntax=ts.createSourceFile('viewer.tsx',viewer,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),functions:string[]=[];
function visit(n:ts.Node){if(ts.isFunctionDeclaration(n)&&n.name&&['canUseStudySet','moveStudyEntry','practiseStudySet'].includes(n.name.text))functions.push(n.getText(syntax));ts.forEachChild(n,visit);}visit(syntax);assert.equal(functions.length,3);
function host(options:{active?:boolean;opening?:boolean;retired?:boolean;generation?:boolean;setChanged?:boolean;deferred?:boolean}={}){
 const study={definition:{entries:[a,b,c]}} as LoadedStudy;
 let state:HeadStudySet={study,revision:HEAD_MANIFEST_SHA256,entries:[a,b,c]},pending:((s:HeadStudySet)=>HeadStudySet)|undefined;
 const captured=state,context={generation:1},calls:any[]=[];
 const scope={study,studySet:state,studySetRef:{current:options.setChanged?null:state},reviewContext:context,reviewContextRef:{current:options.retired?{}:context},importGeneration:{current:options.generation?2:1},practiceRef:{current:{active:!!options.active}},packageOpening:!!options.opening,HEAD_MANIFEST_SHA256,headStudySetEntries,moveHeadStudySet,
  setStudySet:(fn:(s:HeadStudySet)=>HeadStudySet)=>{if(options.deferred)pending=fn;else state=fn(state);},
  shuffled:(entries:HeadEntry[])=>[...entries].reverse(),practice:{startTargets:(entries:HeadEntry[],mode:string)=>{calls.push(['start',entries,mode]);return true;}},setPracticeOrigin:()=>calls.push('origin'),writeNavigation:()=>calls.push('navigation'),setRightPanel:()=>calls.push('panel')};
 const actions=new Function(...Object.keys(scope),compile(functions.join('\n'))+';return {moveStudyEntry,practiseStudySet};')(...Object.values(scope));
 return {actions,calls,captured,get:()=>state,apply:(s:HeadStudySet)=>pending?.(s)};
}
test('viewer blocks moves for quiz, import and retired contexts; pending update cannot overwrite another set',()=>{
 for(const opts of [{active:true},{opening:true},{retired:true},{generation:true},{setChanged:true}]){const h=host(opts);h.actions.moveStudyEntry(b,-1);h.actions.practiseStudySet('locate','study-set');assert.equal(h.get(),h.captured);assert.deepEqual(h.calls,[]);}
 const h=host();h.actions.moveStudyEntry(b,-1);assert.deepEqual(h.get()?.entries,[b,a,c]);assert.deepEqual(h.calls,[]);
 const queued=host({deferred:true}),replacement={...queued.captured!,entries:[c,b,a]};queued.actions.moveStudyEntry(b,-1);assert.equal(queued.apply(replacement),replacement);
});
test('viewer retains shuffle by default, honours explicit order and refuses injected order',()=>{
 for(const order of [undefined,'shuffle','study-set']){const h=host();h.actions.practiseStudySet('recall',order);assert.deepEqual(h.calls,[['start',order==='study-set'?[a,b,c]:[c,b,a],'recall'],'origin','navigation','panel']);}
 const h=host();h.actions.practiseStudySet('locate','injected');assert.deepEqual(h.calls,[]);
 assert.match(viewer,/onMove=\{moveStudyEntry\}/);
});
