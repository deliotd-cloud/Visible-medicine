import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import type {HeadEntry,LoadedStudy} from '../lib/head-atlas-import.ts';

const require=createRequire(import.meta.url);
const source=readFileSync(process.env.HEAD_GUIDED_BASELINE_SOURCE??new URL('../components/HeadAtlasGuidedLearning.tsx',import.meta.url),'utf8');
const code=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
type Node={type:unknown;props:Record<string,any>};
type Effect={create:()=>void|(()=>void);cleanup?:()=>void};
function nodes(value:any):Node[]{return Array.isArray(value)?value.flatMap(nodes):value?.props?[value,...nodes(value.props.children)]:[];}
function text(value:any):string{return Array.isArray(value)?value.map(text).join(''):value?.props?text(value.props.children):value==null?'':String(value);}
const affine=[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]];
const entries=['midbrain','pons','medulla_oblongata'].map((name,i)=>({id:`cth.bst.${name}`,label:`${name==='midbrain'?'Midbrain':name==='pons'?'Pons':'Medulla oblongata'} — regional mask`,family:'bst',laterality:'midline_or_unpaired',representation:'partial-mask',color:[1,0,0],opacity:{fill:.2,outline:1},mask:{file:`${i}.bin`,sha256:String(i+1).repeat(64),dtype:'uint8',shape_kji:[1,1,1],offset_kji:[0,0,0],native_shape_kji:[2,2,2],ijk_to_ras:affine}})) as HeadEntry[];
const study={definition:{entries}} as LoadedStudy;

/** Real component callbacks with synthetic anatomy, persistent hook slots and
 * explicit commit/cleanup. This checks event lifetimes, not browser pixels or
 * concurrent React internals. No scan, patient data or new dependency. */
function harness(){
  let cursor=0,tree:Node,layout:Effect[]=[],passive:Effect[]=[],pendingLayout:Effect[]=[],pendingPassive:Effect[]=[];
  const slots:any[]=[],calls:any[]=[],Bookmark=()=>null;
  const hooks={
    useRef(initial:any){const i=cursor++;return slots[i]??(slots[i]={current:initial});},
    useState(initial:any){const i=cursor++;if(!(i in slots))slots[i]=initial;return [slots[i],(value:any)=>{slots[i]=typeof value==='function'?value(slots[i]):value;}];},
    useLayoutEffect(create:Effect['create']){cursor++;pendingLayout.push({create});},
    useEffect(create:Effect['create']){cursor++;pendingPassive.push({create});},
  };
  const mod={exports:{} as {HeadAtlasGuidedLearning:(props:any)=>Node}};
  new Function('require','module','exports',code)((id:string)=>{
    if(id==='react')return hooks;
    if(id==='react/jsx-runtime')return {jsx:(type:unknown,props:Node['props'])=>({type,props}),jsxs:(type:unknown,props:Node['props'])=>({type,props}),Fragment:Symbol('Fragment')};
    if(id==='next/link')return {__esModule:true,default:()=>null};
    if(id==='./HeadAtlasTeaching')return {HeadAtlasTeaching:()=>null};
    if(id==='./HeadAtlasConceptTeaching')return {HeadAtlasConceptTeaching:()=>null};
    if(id==='./HeadLearningBookmark')return {HeadLearningBookmark:Bookmark};
    if(id==='../lib/head-atlas-focus')return {focusHeadLearningContent:()=>{}};
    return require(id.startsWith('../lib/')&&!id.endsWith('.ts')?id+'.ts':id);
  },mod,mod.exports);
  let props:any={study,modality:'CT',position:{sequenceId:'brainstem',conceptId:'brainstem-midbrain'},
    onPositionChange:(p:any)=>calls.push(['position',p]),onSelect:(e:any)=>calls.push(['select',e]),onPractice:(e:any)=>calls.push(['practice',e]),
    onPracticeSequence:(es:any,mode:any)=>calls.push(['tour-practice',es,mode]),onCompare:(e:any)=>calls.push(['compare',e]),comparisonReady:true,
    studySetAdd:{count:3,total:3,onAdd:()=>calls.push(['add'])}};
  function setup(effects:Effect[]){for(const effect of effects){const cleanup=effect.create();effect.cleanup=typeof cleanup==='function'?cleanup:undefined;}}
  function cleanup(effects:Effect[]){for(const effect of effects)effect.cleanup?.();}
  function render(overrides:any={},commit=true){
    const next={...props,...overrides};cursor=0;pendingLayout=[];pendingPassive=[];
    const rendered=mod.exports.HeadAtlasGuidedLearning(next);
    if(commit){cleanup(layout);cleanup(passive);props=next;tree=rendered;layout=pendingLayout;passive=pendingPassive;setup(layout);setup(passive);}
    return rendered;
  }
  function button(label:string,from=tree){const node=nodes(from).find(n=>n.type==='button'&&text(n)===label);assert(node,`button ${label}`);return node.props.onClick as ()=>void;}
  function select(index:number,from=tree){const node=nodes(from).filter(n=>n.type==='select')[index];assert(node);return (value:string)=>node.props.onChange({target:{value}});}
  function bookmark(from=tree){const node=nodes(from).find(n=>n.type===Bookmark);assert(node);return node.props.onOpenCurrent as (position:any)=>boolean;}
  render();return {calls,render,button,select,bookmark,props:()=>props,tree:()=>tree,unmount:()=>{cleanup(layout);cleanup(passive);},replay:()=>{cleanup(layout);cleanup(passive);setup(layout);setup(passive);}};
}

const actions=['Next','Show this step','Compare this step beside 3D','Find this structure · quick check','Practise available steps','Add tour to study set (3)'];
for(const label of actions)test(`current ${label} works and rejects duplicate queued invocation`,()=>{
  const h=harness(),act=h.button(label);act();const count=h.calls.length;assert(count>0);act();assert.equal(h.calls.length,count);
  if(label==='Next'){assert.equal(count,2);assert.deepEqual(h.calls[0],['position',{sequenceId:'brainstem',conceptId:'brainstem-pons'}]);assert.equal(h.calls[1][1],entries[1]);}
});
for(const replacement of ['step','sequence','study','props','unmount'])test(`every retained native action rejects ${replacement}`,()=>{
  const h=harness(),callbacks=actions.map(label=>h.button(label)),sequence=h.select(0),style=h.select(1),bookmark=h.bookmark();
  if(replacement==='unmount')h.unmount();
  else h.render(replacement==='step'?{position:{sequenceId:'brainstem',conceptId:'brainstem-medulla'}}:
    replacement==='sequence'?{position:{sequenceId:'ventricles',conceptId:null}}:
    replacement==='study'?{study:{definition:{entries:entries.map(e=>({...e}))}}}:
    {onSelect:()=>h.calls.push(['replacement'])});
  callbacks.forEach(act=>act());sequence('ventricles');style('recall');bookmark({sequenceId:'brainstem',conceptId:'brainstem-pons'});
  assert.deepEqual(h.calls,[]);
  h.render({study,position:{sequenceId:'brainstem',conceptId:'brainstem-midbrain'}});h.button('Practise available steps')();assert.equal(h.calls[0][2],'locate','retired style control cannot mutate the new render');
});
test('retired Finish, Previous and explicit step callbacks cannot reopen an older tour',()=>{
  const h=harness();h.render({position:{sequenceId:'brainstem',conceptId:'brainstem-medulla'}});
  const old=[h.button('Finish sequence'),h.button('Previous'),h.button('Pons')];h.render({position:{sequenceId:'ventricles',conceptId:null}});old.forEach(act=>act());assert.deepEqual(h.calls,[]);
});
test('accepted sequence, step list, Previous and Finish navigate exactly once',()=>{
  const h=harness(),sequence=h.select(0);sequence('unknown');assert.deepEqual(h.calls,[]);sequence('ventricles');sequence('brainstem');assert.equal(h.calls.length,1);
  h.calls.length=0;h.render();const step=h.button('Pons');step();step();assert.equal(h.calls.length,2);
  h.calls.length=0;h.render({position:{sequenceId:'brainstem',conceptId:'brainstem-medulla'}});const previous=h.button('Previous');previous();previous();assert.equal(h.calls.length,2);
  h.calls.length=0;h.render();const finish=h.button('Finish sequence');finish();finish();assert.deepEqual(h.calls,[['position',{sequenceId:'brainstem',conceptId:null}]]);
});
test('bookmark validation and question style preserve current valid actions',()=>{
  const h=harness(),bookmark=h.bookmark();assert.equal(bookmark({sequenceId:'unknown',conceptId:'brainstem-pons'}),false);
  assert.equal(bookmark({sequenceId:'brainstem',conceptId:'brainstem-pons'}),true);bookmark({sequenceId:'brainstem',conceptId:'brainstem-pons'});assert.equal(h.calls.length,2);
  h.calls.length=0;h.render();const style=h.select(1);style('invalid');style('recall');style('label');h.render();h.button('Practise available steps')();assert.equal(h.calls[0][2],'recall');
});
test('abandoned render neither invalidates committed controls nor activates speculative controls',()=>{
  const h=harness(),current=h.button('Next');const speculative=h.render({position:{sequenceId:'brainstem',conceptId:'brainstem-medulla'}},false);
  h.button('Finish sequence',speculative)();assert.deepEqual(h.calls,[]);current();assert.equal(h.calls.length,2);
});
test('StrictMode cleanup/setup replay permits explicit action without reviving consumed handlers',()=>{
  const h=harness();h.replay();const act=h.button('Next');act();assert.equal(h.calls.length,2);h.replay();act();assert.equal(h.calls.length,2);
});
test('reentrant parent render cannot launch the same accepted practice twice',()=>{
  const h=harness();let act:()=>void,reentered=false;h.render({onPractice:(e:any)=>{h.calls.push(['practice',e]);h.render();if(!reentered){reentered=true;act();}}});act=h.button('Find this structure · quick check');act();assert.equal(h.calls.length,1);
});
test('accepted navigation keeps its matching select when its parent commits synchronously',()=>{
  const h=harness();let act:()=>void,reentered=false;h.render({onPositionChange:(p:any)=>{h.calls.push(['position',p]);h.render({position:p});if(!reentered){reentered=true;act();}}});act=h.button('Next');act();assert.equal(h.calls.length,2);assert.equal(h.calls[1][1],entries[1]);
});
test('empty study and unavailable mask cannot launch practice or invent sequence targets',()=>{
  const h=harness();h.render({study:{definition:{entries:[]}}});h.button('Practise available steps')();assert.deepEqual(h.calls,[]);
  const sequence=h.select(0);sequence('unknown');assert.deepEqual(h.calls,[]);
});

test('unchanged select values cannot consume the visible controls without a state update',()=>{
  const h=harness();h.select(0)('brainstem');h.select(1)('locate');assert.deepEqual(h.calls,[]);
  h.button('Next')();assert.equal(h.calls.length,2);
});
