import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {HEAD_LINK_REVISION,headConceptById} from '../lib/head-atlas-links.ts';
import {HEAD_SELECTION_PROTOCOL,parseHeadSelection} from '../lib/head-live-selection.ts';
import {headDisclosureKeyDown} from '../lib/head-disclosure-keyboard.ts';

const require=createRequire(import.meta.url);
const ts=require('typescript');
const React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');

function component(path,imports){
  const source=readFileSync(new URL(path,import.meta.url),'utf8');
  const result=ts.transpileModule(source,{reportDiagnostics:true,compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}});
  assert.deepEqual(result.diagnostics.filter(item=>item.category===ts.DiagnosticCategory.Error),[]);
  const mod={exports:{}};
  new Function('require','module','exports',result.outputText)(name=>{
    if(name==='react/jsx-runtime')return require(name);
    if(Object.hasOwn(imports,name))return imports[name];
    throw Error('Unbound component import: '+name);
  },mod,mod.exports);
  return mod.exports;
}

const revision=HEAD_LINK_REVISION,sourceRevision='b'.repeat(40),origin='https://atlas.example.test';
const destination={conceptId:'brainstem-pons',label:'Pons',src:'/atlas-runtime/head-neck/index.html?region=head-neck',atlasHref:'/atlas/head-neck-3d?concept=brainstem-pons',sourceRevision,headRevision:revision,scope:'brainstem',target:{kind:'nested',id:'pons'}};
const comparisonImports={
  '../lib/head-live-selection.ts':{HEAD_SELECTION_PROTOCOL,parseHeadSelection},
  '../lib/head-guided-focus.ts':{HEAD_FOCUS_PROTOCOL:'vm-head-focus',headFocusResult:()=>null},
  '../lib/head-disclosure-keyboard.ts':{headDisclosureKeyDown},
  '../lib/head-inline-comparison.ts':{
    headInlineDestination:(conceptId,headRevision,modality)=>conceptId===destination.conceptId&&headRevision===revision&&modality==='CT'?destination:null,
    headInlineMatches:(selection,conceptId)=>selection?.status==='selected'&&selection.concept?.conceptId===conceptId,
    headInlineReverseConcept:()=>null
  }
};

test('comparison waits for model proof, explains unavailable status, and keeps a retry and full Atlas route',()=>{
  const listeners=new Set(),timers=new Map(),slots=[],effects=new Map(),pending=[];
  let cursor=0,dirty=true,timerId=0,uuid=0,tree;
  const mockWindow={location:{origin},setTimeout(fn){timers.set(++timerId,fn);return timerId;},clearTimeout(id){timers.delete(id);},addEventListener(_name,fn){listeners.add(fn);},removeEventListener(_name,fn){listeners.delete(fn);}};
  const priorWindow=Object.getOwnPropertyDescriptor(globalThis,'window'),priorCrypto=Object.getOwnPropertyDescriptor(globalThis,'crypto');
  Object.defineProperty(globalThis,'window',{configurable:true,value:mockWindow});
  Object.defineProperty(globalThis,'crypto',{configurable:true,value:{randomUUID:()=>`session-${++uuid}`}});
  try{
    const hooks={
      useRef(initial){const i=cursor++;return slots[i]??(slots[i]={current:initial});},
      useState(initial){const i=cursor++;if(!(i in slots))slots[i]=initial;return [slots[i],next=>{const value=typeof next==='function'?next(slots[i]):next;if(!Object.is(value,slots[i])){slots[i]=value;dirty=true;}}];},
      useEffect:createEffect,useLayoutEffect:createEffect
    };
    function createEffect(create,deps){const i=cursor++,old=effects.get(i);if(!old||!deps||old.deps.length!==deps.length||deps.some((value,index)=>!Object.is(value,old.deps[index])))pending.push(()=>{old?.cleanup?.();const cleanup=create();effects.set(i,{deps:deps??[],cleanup:typeof cleanup==='function'?cleanup:undefined});});}
    const {HeadAtlasInlineComparison}=component('../components/HeadAtlasInlineComparison.tsx',{...comparisonImports,react:hooks});
    const props={conceptId:'brainstem-pons',revision,modality:'CT',onSelectConcept(){},onClose(){}};
    const sent=[];const frameWindow={postMessage(packet){sent.push(packet);}};
    const walk=(node,predicate)=>Array.isArray(node)?node.map(value=>walk(value,predicate)).find(Boolean):!node||typeof node!=='object'||!('props'in node)?undefined:predicate(node)?node:walk(node.props.children,predicate);
    function flush(){let count=0;do{assert(++count<20);dirty=false;cursor=0;pending.length=0;const outer=HeadAtlasInlineComparison(props);tree=outer.type(outer.props);walk(tree,node=>node.type==='iframe').props.ref.current={contentWindow:frameWindow};for(const effect of pending)effect();}while(dirty);}
    const status=()=>String(walk(tree,node=>node.props.role==='status')?.props.children);
    flush();assert.match(status(),/Loading 3D model/);assert.equal(timers.size,1);
    const limits=walk(tree,node=>node.type==='details'&&node.props.className==='head-inline-limits');
    assert.equal(limits.props.onKeyDown,headDisclosureKeyDown);
    const expired=[...timers.values()][0];expired();flush();
    assert.equal(status(),'The 3D model has not confirmed a matching selection yet. It may still be loading or unavailable; retry or open the full Atlas.');
    assert.doesNotMatch(status(),/is selected in the model/);
    const fallback=walk(tree,node=>node.type==='a'&&node.props.className==='head-inline-fallback');
    assert.equal(fallback.props.href,destination.atlasHref);
    assert.equal(fallback.props.target,'_blank');
    const retry=walk(tree,node=>node.type==='button'&&node.props.children==='Retry model comparison');assert(retry);
    retry.props.onClick();flush();assert.match(status(),/Loading 3D model/);
    expired();flush();assert.match(status(),/Loading 3D model/,'retired timeout cannot mark the retry unavailable');
    walk(tree,node=>node.type==='iframe').props.onLoad({currentTarget:walk(tree,node=>node.type==='iframe').props.ref.current});flush();
    assert.match(status(),/waiting to confirm/);
    const session=sent.at(-1).session;
    const query=new URL(headConceptById('brainstem-pons').atlasHref,'https://atlas.invalid').searchParams;
    const id=query.get('part');
    const selected={type:HEAD_SELECTION_PROTOCOL,version:1,revision:sourceRevision,session,sequence:1,status:'selected',selection:{kind:'nested',id,source:query.get('partSource'),laterality:id.split(':')[4],parentId:query.get('structure'),parentSource:query.get('source'),study:query.get('detail')}};
    function deliver(data,from=origin,source=frameWindow){for(const listener of listeners)listener({origin:from,source,data});flush();}
    deliver(selected,'https://foreign.invalid');assert.match(status(),/waiting to confirm/);
    deliver({...selected,session:'retired'});assert.match(status(),/waiting to confirm/);
    deliver({...selected,selection:{...selected.selection,source:'0'.repeat(64)}});assert.doesNotMatch(status(),/Pons is selected/);
    deliver({...selected,sequence:2});assert.match(status(),/Pons is selected/);
    deliver({type:HEAD_SELECTION_PROTOCOL,version:1,revision:sourceRevision,session,sequence:3,status:'blocked',reason:'practice'});
    assert.match(status(),/practice is active/);
    deliver({type:HEAD_SELECTION_PROTOCOL,version:1,revision:sourceRevision,session,sequence:4,status:'blocked',reason:'unavailable'});
    assert.match(status(),/has not confirmed a matching selection/);
    for(const item of effects.values())item.cleanup?.();
  }finally{
    if(priorWindow)Object.defineProperty(globalThis,'window',priorWindow);else delete globalThis.window;
    if(priorCrypto)Object.defineProperty(globalThis,'crypto',priorCrypto);else delete globalThis.crypto;
  }
});

const practiceImports={
  react:{...React,useEffect(){}},
  '../lib/head-atlas-display':{headLabel:entry=>entry.label},
  '../lib/head-atlas-practice':{practiceEntries:entries=>entries,normalizePracticeLabel:value=>value.trim()},
  '../lib/head-atlas-links':{HEAD_LINK_REVISION:revision},
  '../lib/head-atlas-import':{},
  '../lib/head-atlas-focus':{focusHeadLearningContent(){}},
  './HeadAtlasPracticeReview':{HeadAtlasPracticeFeedback:()=>null,HeadAtlasPracticeReview:()=>null},
  './HeadPracticeSummaryDownload':{HeadPracticeSummaryDownload:()=>null}
};
const {HeadAtlasPractice}=component('../components/HeadAtlasPractice.tsx',practiceImports);
function practice(mode,first,outcome='correct',finished=false){
  return {mode,outcome,outcomes:first?{'synthetic-pons':first}:{},target:{entry:{id:'synthetic-pons',label:'Pons'}},headingRef:{current:null},feedbackRef:{current:null},active:!finished,finished,error:'',index:0,total:1,
    score:{correct:first==='correct'?1:0,attempted:first==='revealed'?0:1,revealed:first==='revealed'?1:0,remaining:0},revisitEntries:[],choices:[],choice:'',pick:null,next(){},retry(){},finish(){},end(){}};
}
const render=p=>renderToStaticMarkup(React.createElement(HeadAtlasPractice,{practice:p,study:null,familyNames:{}}));
const notice='Correct on retry. Your first-attempt score is unchanged.';

test('correct retry explains first-attempt score across all practice modes',()=>{
  for(const mode of ['locate','label','recall'])for(const first of ['incorrect','revealed']){
    const p=practice(mode,first),score=structuredClone(p.score),html=render(p);
    assert.match(html,/>Correct<\/h3>/);assert(html.includes(notice));assert(!html.includes('Try again (unscored)'));
    assert.deepEqual(p.score,score);
  }
});
test('first-correct, unanswered, incorrect, revealed and completed states omit retry notice',()=>{
  for(const p of [practice('label','correct'),practice('label',null),practice('label','incorrect','incorrect'),practice('label','revealed','revealed'),practice('label','incorrect','correct',true)]){
    assert(!render(p).includes(notice));
  }
});
