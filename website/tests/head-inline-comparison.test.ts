import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import regionalManifest from '../public/atlas-runtime/head-neck/manifest.json' with {type:'json'};
import {HEAD_LINK_REVISION,headConceptById,headAtlasConceptOptions} from '../lib/head-atlas-links.ts';
import {HEAD_SELECTION_PROTOCOL,parseHeadSelection} from '../lib/head-live-selection.ts';
import {headInlineDestination,headInlineMatches,headInlineReverseConcept} from '../lib/head-inline-comparison.ts';
import {HEAD_FOCUS_PROTOCOL,headFocusResult} from '../lib/head-guided-focus.ts';
import {headDisclosureKeyDown} from '../lib/head-disclosure-keyboard.ts';

const revision=HEAD_LINK_REVISION,sourceRevision=regionalManifest.sourceCommit,session='inline-session-12345678';
function selected(conceptId:string,sequence=1){
  const concept=headConceptById(conceptId)!;
  const query=new URL(concept.atlasHref,'https://atlas.invalid').searchParams;
  const nested=query.get('study')==='2',id=query.get(nested?'part':'structure')!;
  return parseHeadSelection({type:HEAD_SELECTION_PROTOCOL,version:1,revision:sourceRevision,session,sequence,status:'selected',selection:{kind:nested?'nested':'root',id,source:query.get(nested?'partSource':'source'),laterality:id.split(':')[4],...(nested?{parentId:query.get('structure'),parentSource:query.get('source'),study:query.get('detail')}:{})}},sourceRevision,session,0)!;
}

test('compatible destinations retain source and study scope but carry exact distinct targets',()=>{
  const pons=headInlineDestination('brainstem-pons',revision,'CT')!,midbrain=headInlineDestination('brainstem-midbrain',revision,'CT')!;
  assert.equal(pons.scope,midbrain.scope);
  assert.notEqual(pons.src,midbrain.src);
  assert.notEqual(pons.target.id,midbrain.target.id);
  assert.equal(pons.target.kind,'nested');
  assert.deepEqual(conceptForTarget(pons), 'brainstem-pons');
  for(const other of [headInlineDestination('brainstem-pons',revision,'MRI'),headInlineDestination('ventricle-third',revision,'CT'),headInlineDestination('deep-left-thalamus',revision,'CT')])assert.notEqual(other!.scope,pons.scope);
  const left=headInlineDestination('deep-left-thalamus',revision,'CT')!,leftCaudate=headInlineDestination('deep-left-caudate',revision,'CT')!,right=headInlineDestination('deep-right-thalamus',revision,'CT')!;
  assert.equal(left.scope,leftCaudate.scope);assert.notEqual(left.scope,right.scope);
  assert.equal(left.target.kind,'root');assert.equal(left.target.laterality,'left');
});
function conceptForTarget(destination:NonNullable<ReturnType<typeof headInlineDestination>>){
  return parseHeadSelection({type:HEAD_SELECTION_PROTOCOL,version:1,revision:sourceRevision,session,sequence:1,status:'selected',selection:destination.target},sourceRevision,session,0)?.concept?.conceptId;
}

test('every offered focus target round-trips to its authored concept without imaging metadata',()=>{
 let count=0;
 for(const {conceptId} of headAtlasConceptOptions())for(const modality of ['CT','MRI'] as const){
  const destination=headInlineDestination(conceptId,revision,modality);if(!destination)continue;
  assert.equal(conceptForTarget(destination),conceptId);
  assert.deepEqual(Object.keys(destination.target).sort(),(destination.target.kind==='nested'?['kind','id','source','laterality','parentId','parentSource','study']:['kind','id','source','laterality']).sort());
  assert.match(destination.target.source,/^[a-f0-9]{64}$/);count++;
 }
 assert(count>50,'cover the full current cross-modality registry, not one example');
});

test('inline destination is canonical, pinned and modality-gated',()=>{
  const pons=headInlineDestination('brainstem-pons',revision,'MRI');
  assert(pons);
  assert.equal(pons.sourceRevision,sourceRevision);
  assert.equal(pons.headRevision,revision);
  assert.match(pons.src,/^\/atlas-runtime\/head-neck\/index\.html\?region=head-neck&study=2&/);
  assert.equal(new URL(pons.src,'https://atlas.invalid').searchParams.has('concept'),false);
  assert.deepEqual(new URL(pons.src,'https://atlas.invalid').searchParams.getAll('presentation'),['compare']);
  assert.equal(headInlineDestination('brainstem-pons','0'.repeat(64),'MRI'),null);
  assert.equal(headInlineDestination('unknown',revision,'CT'),null);
  assert.equal(headInlineDestination('brainstem-pons',revision,'PET' as 'CT'),null);
  const ctOnly=headConceptById('left-frontal-bone');
  if(ctOnly&&!ctOnly.mriHref)assert.equal(headInlineDestination(ctOnly.conceptId,revision,'MRI'),null);
});

test('only the exact confirmed selection matches; reverse is explicit and destination-bound',()=>{
  const pons=selected('brainstem-pons'),midbrain=selected('brainstem-midbrain');
  assert.equal(headInlineMatches(pons,'brainstem-pons'),true);
  assert.equal(headInlineMatches(midbrain,'brainstem-pons'),false);
  assert.equal(headInlineReverseConcept(pons,'brainstem-pons','CT',revision),null);
  assert.equal(headInlineReverseConcept(midbrain,'brainstem-pons','CT',revision),'brainstem-midbrain');
  assert.equal(headInlineReverseConcept(midbrain,'brainstem-pons','CT','0'.repeat(64)),null);
  const blocked={...midbrain,status:'blocked' as const,reason:'practice' as const};
  assert.equal(headInlineReverseConcept(blocked,'brainstem-pons','CT',revision),null);
  assert.equal(headInlineReverseConcept({...midbrain,concept:null},'brainstem-pons','CT',revision),null);
  const mriOnly=headConceptById('left-cerebellar-hemisphere');
  if(mriOnly&&!mriOnly.ctHref)assert.equal(headInlineReverseConcept(selected(mriOnly.conceptId),'brainstem-pons','CT',revision),null);
});

test('stale messages never confirm a comparison',()=>{
  const pons=headConceptById('brainstem-pons')!,q=new URL(pons.atlasHref,'https://atlas.invalid').searchParams;
  const id=q.get('part')!;
  const packet={type:HEAD_SELECTION_PROTOCOL,version:1,revision:sourceRevision,session,sequence:1,status:'selected',selection:{kind:'nested',id,source:q.get('partSource'),laterality:id.split(':')[4],parentId:q.get('structure'),parentSource:q.get('source'),study:q.get('detail')}};
  assert.equal(parseHeadSelection({...packet,session:'old-session'},sourceRevision,session,0),null);
  assert.equal(parseHeadSelection({...packet,revision:'0'.repeat(40)},sourceRevision,session,0),null);
  assert.equal(parseHeadSelection(packet,sourceRevision,session,1),null);
  assert.equal(parseHeadSelection({...packet,selection:{...packet.selection,source:'0'.repeat(64)}},sourceRevision,session,0)?.concept,null);
});

test('inline frame accepts only current iframe session and makes reverse selection explicit',()=>{
  const require=createRequire(import.meta.url),origin='https://atlas.example.test';
  const source=readFileSync(new URL('../components/HeadAtlasInlineComparison.tsx',import.meta.url),'utf8');
  const code=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const listeners=new Set<(event:any)=>void>(),timers=new Map<number,()=>void>(),sent:any[]=[];
  let timerId=0,uuid=0,changed:string|null=null,dirty=true,cursor=0,tree:any;
  const mockWindow={location:{origin},setTimeout(callback:()=>void){timers.set(++timerId,callback);return timerId;},clearTimeout(id:number){timers.delete(id);},addEventListener(_name:string,fn:(event:any)=>void){listeners.add(fn);},removeEventListener(_name:string,fn:(event:any)=>void){listeners.delete(fn);}};
  const oldWindow=(globalThis as any).window,oldCrypto=Object.getOwnPropertyDescriptor(globalThis,'crypto');
  Object.defineProperty(globalThis,'window',{configurable:true,value:mockWindow});
  Object.defineProperty(globalThis,'crypto',{configurable:true,value:{randomUUID:()=>`inline-session-${++uuid}-abcd`}});
  const slots:any[]=[],effects=new Map<number,{deps:unknown[];cleanup?:()=>void}>(),pending:Array<()=>void>=[];
  const effect=(create:()=>void|(()=>void),deps?:unknown[])=>{const i=cursor++,old=effects.get(i);if(!old||!deps||old.deps.length!==deps.length||old.deps.some((value,index)=>!Object.is(value,deps[index]))){pending.push(()=>{old?.cleanup?.();const cleanup=create();effects.set(i,{deps:deps??[],cleanup:typeof cleanup==='function'?cleanup:undefined});});}};
  const hooks={useRef(initial:unknown){const i=cursor++;return slots[i]??(slots[i]={current:initial});},useState(initial:unknown){const i=cursor++;if(!(i in slots))slots[i]=initial;return [slots[i],(next:any)=>{const value=typeof next==='function'?next(slots[i]):next;if(!Object.is(value,slots[i])){slots[i]=value;dirty=true;}}];},useEffect:effect,useLayoutEffect:effect};
  const imports:Record<string,unknown>={react:hooks,'react/jsx-runtime':require('react/jsx-runtime'),'../lib/head-live-selection.ts':{HEAD_SELECTION_PROTOCOL,parseHeadSelection},'../lib/head-inline-comparison.ts':{headInlineDestination,headInlineMatches,headInlineReverseConcept},'../lib/head-guided-focus.ts':{HEAD_FOCUS_PROTOCOL,headFocusResult},'../lib/head-disclosure-keyboard.ts':{headDisclosureKeyDown}};
  const mod={exports:{} as {HeadAtlasInlineComparison:(props:any)=>any}};
  new Function('require','module','exports',code)((id:string)=>{assert(Object.hasOwn(imports,id),id);return imports[id];},mod,mod.exports);
  const destination=headInlineDestination('brainstem-pons',revision,'CT')!;
  const props={conceptId:'brainstem-pons',revision,modality:'CT',onSelectConcept:(value:string)=>{changed=value;},onClose:()=>{}};
  const frameWindow={postMessage(packet:unknown,target:string){assert.equal(target,origin);sent.push(packet);}};
  function walk(node:any,predicate:(value:any)=>boolean):any{if(Array.isArray(node))return node.map(value=>walk(value,predicate)).find(Boolean);if(!node||typeof node!=='object'||!('props'in node))return;return predicate(node)?node:walk(node.props.children,predicate);}
  function flush(){let count=0;do{assert(++count<10);dirty=false;cursor=0;pending.length=0;const outer=mod.exports.HeadAtlasInlineComparison(props);tree=outer.type(outer.props);const frame=walk(tree,value=>value.type==='iframe');assert(frame);frame.props.ref.current={contentWindow:frameWindow};for(const effect of pending)effect();}while(dirty);return tree;}
  function status(){return String(walk(tree,value=>value.props.role==='status')?.props.children);}
  function deliver(data:unknown,source:unknown=frameWindow,from=origin){for(const listener of [...listeners])listener({data,source,origin:from});flush();}
  function packet(conceptId:string,sequence:number,sessionId=String(sent.at(-1)?.session)){
    const q=new URL(headConceptById(conceptId)!.atlasHref,'https://atlas.invalid').searchParams,nested=q.get('study')==='2',id=q.get(nested?'part':'structure')!;
    return {type:HEAD_SELECTION_PROTOCOL,version:1,revision:sourceRevision,session:sessionId,sequence,status:'selected',selection:{kind:nested?'nested':'root',id,source:q.get(nested?'partSource':'source'),laterality:id.split(':')[4],...(nested?{parentId:q.get('structure'),parentSource:q.get('source'),study:q.get('detail')}:{})}};
  }
  try{
    flush();assert.equal(walk(tree,value=>value.type==='iframe').props.src,destination.src);
    assert.match(status(),/Loading/);
    assert.equal(timers.size,1,'loading starts a timeout before iframe onLoad');
    const loadTimeout=[...timers.values()][0];loadTimeout();flush();assert.match(status(),/unavailable/);
    const retry=walk(tree,value=>value.type==='button'&&value.props.children==='Retry model comparison');assert(retry);
    retry.props.onClick();flush();assert.match(status(),/Loading/);
    loadTimeout();flush();assert.match(status(),/Loading/,'retired load timeout cannot end retry');
    const loadedFrame=walk(tree,value=>value.type==='iframe');loadedFrame.props.onLoad({currentTarget:loadedFrame.props.ref.current});flush();assert.match(status(),/waiting to confirm/);
    const first=String(sent.at(-1).session);
    deliver(packet('brainstem-pons',1,first),{},origin);assert.match(status(),/waiting to confirm/);
    deliver(packet('brainstem-pons',1,first),frameWindow,'https://foreign.invalid');assert.match(status(),/waiting to confirm/);
    deliver(packet('brainstem-pons',1,'old-session'));assert.match(status(),/waiting to confirm/);
    deliver(packet('brainstem-pons',1));assert.match(status(),/Pons is selected/);
    deliver(packet('brainstem-midbrain',2));assert.match(status(),/differs from Pons/);
    const reverse=walk(tree,value=>value.type==='button'&&JSON.stringify(value.props.children).includes('Midbrain'));
    assert(reverse);reverse.props.onClick();assert.equal(changed,'brainstem-midbrain');
    changed=null;deliver({...packet('brainstem-midbrain',3),selection:{...packet('brainstem-midbrain',3).selection,source:'0'.repeat(64)}});
    assert.match(status(),/without an exact CT\/MRI concept mapping/);
    reverse.props.onClick();assert.equal(changed,null,'unmapped selection must retire prior reverse callback');
    const blocked={type:HEAD_SELECTION_PROTOCOL,version:1,revision:sourceRevision,session:first,sequence:4,status:'blocked',reason:'practice'};
    deliver(blocked);assert.match(status(),/practice is active/);
    assert.equal(walk(tree,value=>value.type==='button'&&JSON.stringify(value.props.children).includes('Midbrain')),undefined);
    reverse.props.onClick();assert.equal(changed,null,'retired reverse callback must not navigate after practice block');
    assert.equal(timers.size,0);
  }finally{for(const item of effects.values())item.cleanup?.();Object.defineProperty(globalThis,'window',{configurable:true,value:oldWindow});if(oldCrypto)Object.defineProperty(globalThis,'crypto',oldCrypto);}
});
