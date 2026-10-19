import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';

const require=createRequire(new URL('../components/LectureEditor.tsx',import.meta.url));
const React=require('react'),ts=require('typescript');
const source=readFileSync(new URL('../components/LectureEditor.tsx',import.meta.url),'utf8');
const code=ts.transpileModule(source,{fileName:'LectureEditor.tsx',compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
const initial={id:'lecture:one',courseId:'course:one',courseTitle:'Course',title:'Original lecture',version:4,status:'draft',slides:[{id:'slide-one',title:'One',body:'Educational content.',referenceUrl:''}],reviews:[],published:null,canEdit:true,canReview:false,canPublish:false};
const context={actorId:'edu:author',organizationId:'org:one'};
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const nodes=node=>Array.isArray(node)?node.flatMap(nodes):React.isValidElement(node)?[node,...nodes(node.props.children)]:[];
const words=node=>Array.isArray(node)?node.map(words).join(''):React.isValidElement(node)?words(node.props.children):typeof node==='string'||typeof node==='number'?String(node):'';
class ContextError extends Error{constructor(reason='changed'){super(reason);this.reason=reason;}}

function harness(){
 const oldWindow=Object.getOwnPropertyDescriptor(globalThis,'window'),oldDocument=Object.getOwnPropertyDescriptor(globalThis,'document');
 Object.defineProperty(globalThis,'window',{configurable:true,value:{confirm:()=>true,addEventListener(){},removeEventListener(){}}});
 Object.defineProperty(globalThis,'document',{configurable:true,value:{addEventListener(){},removeEventListener(){}}});
 const values=[],effects=new Map();let cursor=0,changed=false,tree,mounted=true,pending=[],postUnmountWrites=0;
 const checks=[];
 const parse=value=>value&&typeof value.actorId==='string'&&typeof value.organizationId==='string'?{actorId:value.actorId,organizationId:value.organizationId}:null;
 const mock={parseStudioMutationContext:parse,StudioMutationContextError:ContextError,verifyStudioMutationContext:async(value)=>{checks.push(value);const decision=decisions.shift();if(typeof decision==='function')await decision();else if(decision)throw new ContextError(decision);}};
 const react={...React,useMemo:make=>make(),useRef:value=>{const i=cursor++;if(!(i in values))values[i]={current:value};return values[i];},
  useState:value=>{const i=cursor++;if(!(i in values))values[i]=typeof value==='function'?value():value;return[values[i],next=>{if(!mounted)postUnmountWrites++;values[i]=typeof next==='function'?next(values[i]):next;changed=true;}];},
  useEffect:(create,deps)=>{const i=cursor++,old=effects.get(i);if(!old||deps.length!==old.deps.length||deps.some((item,j)=>item!==old.deps[j]))pending.push(()=>{old?.cleanup?.();const cleanup=create();effects.set(i,{deps,create,cleanup});});},
 };react.useLayoutEffect=react.useEffect;
 const module={exports:{}};
 new Function('require','module','exports',code)((name)=>name==='react'?react:name==='../lib/studio-mutation-context.ts'?mock:name==='./LecturePlayer'?{LecturePlayer:()=>null}:name==='./WorkbookRetirement'?{WorkbookRetirement:()=>null}:name==='./WorkbookCorrection'?{WorkbookCorrection:()=>null}:name==='./WorkbookCorrectionLineage'?{WorkbookCorrectionLineage:()=>null,createWorkbookCorrectionLineageContext:()=>({begin:()=>Symbol(),finish(){},invalidate(){}})}:name.endsWith('.css')?{}:require(name),module,module.exports);
 const props={initial,courseOutline:[],authorityKey:JSON.stringify(['author','org:one']),expectedStudioContext:context};
 const decisions=[];
 function flush(){assert(mounted);let pass=0;do{assert(++pass<16);cursor=0;changed=false;pending=[];tree=module.exports.LectureEditor(props);for(const effect of pending)effect();}while(changed);return tree;}
 const find=predicate=>{const node=nodes(tree).find(predicate);assert(node);return node;};
 const button=label=>find(node=>node.type==='button'&&words(node)===label);
 function edit(){find(node=>node.type==='input'&&node.props.value==='Original lecture').props.onChange({target:{value:'Local unsent lecture'}});flush();}
 function unmount(){if(mounted){for(const effect of effects.values())effect.cleanup?.();mounted=false;}}
 function dispose(){unmount();if(oldWindow)Object.defineProperty(globalThis,'window',oldWindow);else delete globalThis.window;if(oldDocument)Object.defineProperty(globalThis,'document',oldDocument);else delete globalThis.document;}
 flush();return{props,checks,decisions,flush,find,button,edit,unmount,dispose,text:()=>words(tree),get postUnmountWrites(){return postUnmountWrites;},replayEffects(){for(const effect of effects.values())effect.cleanup?.();for(const effect of effects.values())effect.cleanup=effect.create();}};
}

test('exact actor and organization accompany a save and are checked before and after response',async()=>{
 const previous=globalThis.fetch,requests=[];
 globalThis.fetch=async(_url,options)=>{requests.push(JSON.parse(options.body));return Response.json({...initial,title:'Local unsent lecture',version:5});};
 const h=harness();try{h.edit();h.button('Save').props.onClick();await tick();h.flush();
  assert.equal(h.checks.length,2);assert.deepEqual(h.checks, [context,context]);
  assert.equal(requests.length,1);assert.deepEqual(requests[0].expectedStudioContext,context);
  assert.match(h.text(),/Saved version 5/);
 }finally{h.dispose();globalThis.fetch=previous;}
});

test('unavailable precheck and changed postcheck hold unsent text and block duplicate actions',async()=>{
 const previous=globalThis.fetch;let calls=0;
 globalThis.fetch=async()=>{calls++;return Response.json({...initial,title:'Server result',version:5});};
 const h=harness();try{h.edit();h.decisions.push('unavailable');h.button('Save').props.onClick();await tick();h.flush();
  assert.equal(calls,0);assert(h.find(node=>node.type==='input'&&node.props.value==='Local unsent lecture'));assert.equal(h.button('Save').props.disabled,true);
  h.button('Retry context check').props.onClick();await tick();h.flush();assert.equal(h.button('Save').props.disabled,false);
  h.decisions.push(undefined,'changed');h.button('Save').props.onClick();await tick();h.flush();
  assert.equal(calls,1);assert(h.find(node=>node.type==='input'&&node.props.value==='Local unsent lecture'));assert.doesNotMatch(h.text(),/Saved version 5/);
  assert.equal(h.button('Save').props.disabled,true);h.button('Save').props.onClick();assert.equal(calls,1);
 }finally{h.dispose();globalThis.fetch=previous;}
});

test('page-opening actor swap during dispatched save cannot attach old local fields to new actor',async()=>{
 const previous=globalThis.fetch;let complete,calls=0;
 globalThis.fetch=async()=>{calls++;return new Promise(resolve=>{complete=resolve;});};
 const h=harness();try{h.edit();h.button('Save').props.onClick();await tick();assert.equal(calls,1);
  h.props.expectedStudioContext={actorId:'edu:other',organizationId:'org:two'};h.props.authorityKey=JSON.stringify(['other','org:two']);h.flush();
  complete(Response.json({...initial,title:'Wrong actor result',version:5}));await tick();h.flush();
  assert(h.find(node=>node.type==='input'&&node.props.value==='Local unsent lecture'));assert.doesNotMatch(h.text(),/Wrong actor result|Saved version 5/);
  assert.equal(h.button('Save').props.disabled,true);
 }finally{h.dispose();globalThis.fetch=previous;}
});

test('deliberate reload verifies both sides and never replaces local edits after unavailable comparison',async()=>{
 const previous=globalThis.fetch;let calls=0;
 globalThis.fetch=async()=>{calls++;return Response.json({...initial,title:'Saved under another session',version:5});};
 const h=harness();try{h.edit();h.decisions.push(undefined,'unavailable');h.button('Reload saved version').props.onClick();await tick();h.flush();
  assert.equal(calls,1);assert(h.find(node=>node.type==='input'&&node.props.value==='Local unsent lecture'));
  assert.equal(h.button('Reload saved version').props.disabled,true);
  assert.match(h.text(),/context could not be confirmed/i);
 }finally{h.dispose();globalThis.fetch=previous;}
});

test('unmount during dispatched save ignores late response and does not write stale state',async()=>{
 const previous=globalThis.fetch;let complete;
 globalThis.fetch=async()=>new Promise(resolve=>{complete=resolve;});
 const h=harness();try{h.edit();h.button('Save').props.onClick();await tick();h.unmount();
  complete(Response.json({...initial,title:'Late result',version:5}));await tick();
  assert.equal(h.postUnmountWrites,0);
 }finally{h.dispose();globalThis.fetch=previous;}
});

test('successful but mismatched or malformed POST reply is uncertain and cannot authorize retry',async()=>{
 for(const reply of [Response.json({...initial,id:'lecture:other',version:5}),new Response('{broken',{status:200})]){
  const previous=globalThis.fetch;let calls=0;globalThis.fetch=async()=>{calls++;return reply;};
  const h=harness();try{h.edit();h.button('Save').props.onClick();await tick();h.flush();
   assert.equal(calls,1);assert(h.find(node=>node.type==='input'&&node.props.value==='Local unsent lecture'));
   assert.equal(h.button('Save').props.disabled,true);assert.match(h.text(),/may have completed/);
   h.button('Save').props.onClick();assert.equal(calls,1);
  }finally{h.dispose();globalThis.fetch=previous;}
 }
});

test('explicit saved-lecture reconciliation rechecks context without auto-resubmitting local edits',async()=>{
 const previous=globalThis.fetch;let posts=0;
 globalThis.fetch=async()=>{posts++;return Response.json({...initial,id:'lecture:other',version:5});};
 const h=harness();try{h.edit();h.button('Save').props.onClick();await tick();h.flush();
  assert.equal(h.button('Save').props.disabled,true);
  h.button('I checked the saved lecture').props.onClick();await tick();h.flush();
  assert.equal(posts,1);assert(h.find(node=>node.type==='input'&&node.props.value==='Local unsent lecture'));
  assert.equal(h.button('Save').props.disabled,false);
 }finally{h.dispose();globalThis.fetch=previous;}
});

test('structured server context refusal stays changed even if another probe would see old actor restored',async()=>{
 const previous=globalThis.fetch;globalThis.fetch=async()=>Response.json({error:'Changed',code:'STUDIO_CONTEXT_CHANGED'},{status:409});
 const h=harness();try{h.edit();h.button('Save').props.onClick();await tick();h.flush();
  assert.equal(h.checks.length,1,'server refusal does not need a second probe');
  assert.match(h.text(),/context changed/i);assert.equal(h.button('Save').props.disabled,true);
 }finally{h.dispose();globalThis.fetch=previous;}
});

test('a pending recheck is single-flight and cannot clear a newer actor hold',async()=>{
 const previous=globalThis.fetch;globalThis.fetch=async()=>{throw Error('mutation must not be sent');};
 const h=harness();try{h.edit();h.decisions.push('unavailable');h.button('Save').props.onClick();await tick();h.flush();
  let settle;h.decisions.push(()=>new Promise(resolve=>{settle=resolve;}));
  const recheck=h.button('Retry context check').props.onClick;recheck();recheck();await tick();h.flush();
  assert.equal(h.checks.length,2,'only one recheck follows precheck');
  h.props.expectedStudioContext={actorId:'edu:other',organizationId:'org:two'};h.props.authorityKey=JSON.stringify(['other','org:two']);h.flush();
  settle();await tick();h.flush();assert.equal(h.button('Save').props.disabled,true);
  assert.doesNotMatch(h.text(),/Context confirmed after/);
 }finally{h.dispose();globalThis.fetch=previous;}
});

test('unmount and strict effect replay retire a pending context recheck',async()=>{
 for(const retire of ['unmount','replay']){
  const h=harness();try{h.edit();h.decisions.push('unavailable');h.button('Save').props.onClick();await tick();h.flush();
   let settle;h.decisions.push(()=>new Promise(resolve=>{settle=resolve;}));h.button('Retry context check').props.onClick();await tick();
   if(retire==='unmount')h.unmount();else h.replayEffects();
   settle();await tick();
   if(retire==='replay'){h.flush();assert.equal(h.button('Save').props.disabled,true);assert.doesNotMatch(h.text(),/Context confirmed after/);}
   else assert.equal(h.postUnmountWrites,0);
  }finally{h.dispose();}
 }
});

test('uncertain successful replies retain only fixed local diagnostics without exposing foreign or arbitrary content',async()=>{
 const secret='SYNTHETIC_UNTRUSTED_REPLY_DIAGNOSTIC';
 for(const [reply,expected]of [
  [()=>Response.json({...initial,id:'lecture:other',title:secret}), 'The lecture service returned a different lecture or course. Your local changes have been kept.'],
  [()=>Response.json({...initial,slides:secret}), 'The lecture service returned an invalid response.'],
  [()=>({ok:true,status:200,json:async()=>{throw Error(secret);}}), null],
 ]){
  const previous=globalThis.fetch;let calls=0;globalThis.fetch=async()=>{calls++;return reply();};
  const h=harness();try{
   h.edit();h.button('Save').props.onClick();await tick();h.flush();
   assert.equal(calls,1);assert.equal(h.button('Save').props.disabled,true);
   assert(h.find(node=>node.type==='input'&&node.props.value==='Local unsent lecture'));
   assert.match(h.text(),/may have completed/);assert.doesNotMatch(h.text(),new RegExp(secret));
   if(expected)assert(h.find(node=>node.props.role==='alert'&&words(node)===expected));
   h.button('Save').props.onClick();assert.equal(calls,1,'no retry after uncertain reply');
  }finally{h.dispose();globalThis.fetch=previous;}
 }
});
