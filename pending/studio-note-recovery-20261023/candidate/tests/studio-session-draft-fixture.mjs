import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(new URL('../package.json',import.meta.url)),ts=require('typescript');
export function compile(relative,imports={}){
 const source=relative==='components/StudioForms.tsx'&&process.env.STUDIO_SESSION_FORMS_SOURCE?process.env.STUDIO_SESSION_FORMS_SOURCE:new URL('../'+relative,import.meta.url);
 const code=ts.transpileModule(readFileSync(source,'utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const module={exports:{}},moduleRequire=createRequire(new URL('../'+relative,import.meta.url));new Function('module','exports','require',code)(module,module.exports,name=>Object.hasOwn(imports,name)?imports[name]:moduleRequire(name));return module.exports;
}
export const protocol=compile('lib/studio-mutation-context.ts');
export const sessionDrafts=compile('lib/studio-session-drafts.ts');
// Existing focused harnesses model an unchanged, already compared synthetic
// context synchronously. Real asynchronous transport is exercised below/by API.
export const stableMutationContext={...protocol,verifyStudioMutationContext(value){return{then(ok,fail){try{if(!protocol.parseStudioMutationContext(value))throw new protocol.StudioMutationContextError();return Promise.resolve(ok());}catch(error){return Promise.resolve(fail?.(error));}}};}};
export const A={actorId:'edu:actor-a',organizationId:'org-a'},B={actorId:'edu:actor-b',organizationId:'org-a'};
const scopes=compile('lib/studio-draft-scope.ts');
export const storageKey=scope=>'visible-medicine-studio-draft:'+scopes.studioDraftScopedKey(scope,'new-course');
class Input{constructor(name,value=''){this.name=name;this.value=value;this.type='text';this.checked=false;this.disabled=false;}}
class Textarea extends Input{}class Select extends Input{}
class FormDataFixture{
 constructor(form){this.entries=form.elements.filter(x=>!x.disabled).map(x=>[x.name,x.value]);}
 get(name){return this.entries.find(x=>x[0]===name)?.[1]??null;}getAll(name){return this.entries.filter(x=>x[0]===name).map(x=>x[1]);}keys(){return this.entries.map(x=>x[0]).values();}
}
export function formFixture({scope=A,current=A,initial={},deferPost=false,onValuesChange,ownerDocument,storageBlocked=false,writesBlocked=false,locksUnavailable=false}={}){
 const originals=new Map(),values=new Map(Object.entries(initial)),reads=[],writes=[],removes=[],requests=[],routes=[],timers=new Map(),windowEvents=new Map(),documentEvents=new Map(),queued=[];
 const controls=[new Input('title')],form={elements:controls,querySelectorAll:()=>[]};
 let session=current,postResolve,postResult,probeResolve,deferProbe=false,refreshes=0,reloads=0,unmounted=false,dirty=true,cursor=0,pending=[],pendingLayout=[],tree;
 const slots=[],effects=new Map(),layoutEffects=new Map();
 const storage={getItem(key){reads.push(key);if(storageBlocked)throw Error('Synthetic storage blocked');return values.get(key)??null;},setItem(key,value){writes.push(key);if(storageBlocked||writesBlocked)throw Error('Synthetic write blocked');values.set(key,value);},removeItem(key){removes.push(key);if(storageBlocked)throw Error('Synthetic removal blocked');values.delete(key);}};
 const locks={held:false,request(_key,fn){if(this.held)return new Promise((resolve,reject)=>queued.push({fn,resolve,reject}));try{return Promise.resolve(fn());}catch(e){return Promise.reject(e);}}};
 const add=(map,name,fn)=>{const list=map.get(name)??new Set();list.add(fn);map.set(name,list);};const remove=(map,name,fn)=>map.get(name)?.delete(fn);
 let confirmResult=true,onConfirm;
 const browserDocument=Object.assign(ownerDocument??{},{visibilityState:'visible',location:{href:'https://synthetic.invalid/studio'},addEventListener:(n,f)=>add(documentEvents,n,f),removeEventListener:(n,f)=>remove(documentEvents,n,f)});
 const globals={localStorage:storage,navigator:{locks:locksUnavailable?undefined:locks},HTMLInputElement:Input,HTMLTextAreaElement:Textarea,HTMLSelectElement:Select,FormData:FormDataFixture,
  document:browserDocument,
  window:{location:{reload(){reloads++;}},confirm(){onConfirm?.();return confirmResult;},setTimeout(fn){const id=timers.size+1;timers.set(id,fn);return id;},clearTimeout:id=>timers.delete(id),addEventListener:(n,f)=>add(windowEvents,n,f),removeEventListener:(n,f)=>remove(windowEvents,n,f)},
  fetch:async(url,options={})=>{
   requests.push({url:String(url),options});
   if(options.method==='GET'){
    const expected=JSON.parse(options.headers['X-Studio-Mutation-Context']);
    if(deferProbe){deferProbe=false;return new Promise(resolve=>{probeResolve=resolve;});}
    if(session==='network-error')throw Error('PRIVATE_TRANSPORT_DIAGNOSTIC');
    const match=session&&expected.actorId===session.actorId&&expected.organizationId===session.organizationId;
    return Response.json(match?{ok:true,action:'verify-studio-mutation-context'}:{error:'Reload Studio.',code:'STUDIO_CONTEXT_CHANGED'},{status:match?200:session?409:401});
   }
   if(deferPost)return new Promise(resolve=>{postResolve=resolve;});
   return Response.json(postResult??{ok:true,action:'create-course',courseId:'course:accepted'});
  }};
 for(const [name,value]of Object.entries(globals)){originals.set(name,Object.getOwnPropertyDescriptor(globalThis,name));Object.defineProperty(globalThis,name,{value,configurable:true,writable:true});}
 const equal=(a,b)=>a&&a.length===b.length&&a.every((v,i)=>Object.is(v,b[i]));
 const hooks={useRef(value){const i=cursor++;if(!(i in slots))slots[i]={current:value};return slots[i];},useState(value){const i=cursor++;if(!(i in slots))slots[i]=typeof value==='function'?value():value;return[slots[i],value=>{const next=typeof value==='function'?value(slots[i]):value;if(!Object.is(next,slots[i])){slots[i]=next;dirty=true;}}];},
  useEffect(create,deps){const i=cursor++,old=effects.get(i);if(!equal(old?.deps,deps))pending.push(()=>{old?.cleanup?.();effects.set(i,{deps,cleanup:create()});});},
  useLayoutEffect(create,deps){const i=cursor++,old=layoutEffects.get(i);if(!equal(old?.deps,deps))pendingLayout.push(()=>{old?.cleanup?.();layoutEffects.set(i,{deps,cleanup:create()});});}};
 const jsx=(type,props,key)=>({type,props:{...props,key}});
 const forms=compile('components/StudioForms.tsx',{react:hooks,'react/jsx-runtime':{jsx,jsxs:jsx},'next/navigation':{useRouter:()=>({push:x=>routes.push(x),refresh:()=>refreshes++})},'@/lib/studio-templates':{STUDIO_COURSE_TEMPLATES:[]},'../lib/studio-draft-scope.ts':scopes,'../lib/studio-mutation-context.ts':protocol,'../lib/studio-release-order.ts':{},'../lib/studio-navigation-guard.ts':{registerStudioNavigationGuard:()=>()=>{}},'../lib/studio-session-drafts.ts':sessionDrafts});
 const outer=forms.CreateCourseForm({recoveryScope:scope}),action=outer.type,props={...outer.props,...(onValuesChange?{onValuesChange}:{})};
 const find=(node,predicate)=>Array.isArray(node)?node.map(n=>find(n,predicate)).find(Boolean):node?.props?(predicate(node)?node:find(node.props.children,predicate)):undefined;
 const text=node=>Array.isArray(node)?node.map(text).join(''):node?.props?text(node.props.children):typeof node==='string'?node:'';
 function flush(){let cycles=0;do{assert(++cycles<40);dirty=false;cursor=0;pending=[];pendingLayout=[];tree=action(props);tree.props.ref.current=form;const fieldset=find(tree,n=>n.type==='fieldset');controls.forEach(x=>x.disabled=!!fieldset?.props.disabled);for(const fn of pendingLayout)fn();for(const fn of pending)fn();}while(dirty);}
 flush();
 return{document:browserDocument,values,reads,writes,removes,requests,routes,controls,locks,queued,timers,find:predicate=>find(tree,predicate),text:()=>text(tree),get refreshes(){return refreshes;},get reloads(){return reloads;},get current(){return session;},set current(value){session=value;},set confirmResult(value){confirmResult=value;},set onConfirm(value){onConfirm=value;},set storageBlocked(value){storageBlocked=value;},set writesBlocked(value){writesBlocked=value;},
  async settle(){for(let i=0;i<14;i++){await Promise.resolve();if(!unmounted)flush();}},
  change(value){controls[0].value=value;tree.props.onChange();flush();},submit(){return tree.props.onSubmit({preventDefault(){},currentTarget:form});},
  finishPost(body={ok:true,action:'create-course',courseId:'course:accepted'},status=200){assert(postResolve,'POST has started');postResolve(Response.json(body,{status}));},
  set postResult(value){postResult=value;},emit(name){for(const fn of windowEvents.get(name)??[])fn();flush();},visibility(){for(const fn of documentEvents.get('visibilitychange')??[])fn();flush();},runTimers(){for(const [id,fn]of timers){timers.delete(id);fn();}flush();},releaseLock(){const item=queued.shift();assert(item);try{item.resolve(item.fn());}catch(e){item.reject(e);}if(!unmounted)flush();},
  pauseProbe(){deferProbe=true;},finishProbe(){assert(probeResolve);probeResolve(Response.json({ok:true,action:'verify-studio-mutation-context'}));},
  dispose(){unmounted=true;for(const e of layoutEffects.values())e.cleanup?.();for(const e of effects.values())e.cleanup?.();for(const[name,descriptor]of originals){if(descriptor)Object.defineProperty(globalThis,name,descriptor);else delete globalThis[name];}}
 };
}
