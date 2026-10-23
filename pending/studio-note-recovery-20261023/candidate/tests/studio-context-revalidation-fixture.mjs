// Private revalidation fixture derived from the frozen 151-case helper. The shared helper is unchanged.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(new URL('../package.json',import.meta.url)),ts=require('typescript');
export function compile(relative,imports={}){
 const code=ts.transpileModule(readFileSync(new URL('../'+relative,import.meta.url),'utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const module={exports:{}},moduleRequire=createRequire(new URL('../'+relative,import.meta.url));new Function('module','exports','require',code)(module,module.exports,name=>Object.hasOwn(imports,name)?imports[name]:moduleRequire(name));return module.exports;
}
export const protocol=compile('lib/studio-mutation-context.ts');
// Existing focused harnesses model an unchanged, already compared synthetic
// context synchronously. Real asynchronous transport is exercised below/by API.
export const stableMutationContext={...protocol,verifyStudioMutationContext(value){return{then(ok,fail){try{if(!protocol.parseStudioMutationContext(value))throw new protocol.StudioMutationContextError();return Promise.resolve(ok());}catch(error){return Promise.resolve(fail?.(error));}}};}};
export const A={actorId:'edu:actor-a',organizationId:'org-a'},B={actorId:'edu:actor-b',organizationId:'org-a'};
const scopes=compile('lib/studio-draft-scope.ts');
export const storageKey=scope=>'visible-medicine-studio-draft:'+scopes.studioDraftScopedKey(scope,'new-course');
class LinkTarget{constructor(anchor){this.anchor=anchor;}closest(){return this.anchor;}}
class Input{constructor(name,value=''){this.name=name;this.value=value;this.type='text';this.checked=false;this.disabled=false;}}
class Textarea extends Input{}class Select extends Input{}
class FormDataFixture{
 constructor(form){this.entries=form.elements.filter(x=>!x.disabled).map(x=>[x.name,x.value]);}
 get(name){return this.entries.find(x=>x[0]===name)?.[1]??null;}getAll(name){return this.entries.filter(x=>x[0]===name).map(x=>x[1]);}keys(){return this.entries.map(x=>x[0]).values();}
}
export function revalidationFixture({scope=A,current=A,initial={},deferPost=false,onValuesChange,setFails=false,formKind='course'}={}){
 const accepted=formKind==='invitation'?{ok:true,action:'create-invitation',invitationCode:'ELV-ABCDEF123456'}:formKind==='cohort'?{ok:true,action:'create-cohort',cohortId:'cohort:accepted'}:formKind==='assignment'?{ok:true,action:'assign-cohort-workbook'}:{ok:true,action:'create-course',courseId:'course:accepted'};
 const originals=new Map(),values=new Map(Object.entries(initial)),reads=[],writes=[],removes=[],requests=[],routes=[],timers=new Map(),windowEvents=new Map(),documentEvents=new Map(),queued=[];
 const controls=[new Input('title')],form={elements:controls,querySelectorAll:()=>[]};
 let session=current,postResolve,postResult,postError,postStatus=200,postMalformedJson=false,probeResolve,deferProbe=false,storageFails=setFails,confirmResult=false,confirms=0,writesAfterUnmount=0,refreshes=0,reloads=0,unmounted=false,dirty=true,cursor=0,pending=[],pendingLayout=[],tree;
 const slots=[],effects=new Map(),layoutEffects=new Map();
 const storage={getItem(key){reads.push(key);return values.get(key)??null;},setItem(key,value){if(storageFails)throw Error('Synthetic quota failure');writes.push(key);values.set(key,value);},removeItem(key){removes.push(key);values.delete(key);}};
 const locks={held:false,request(_key,fn){if(this.held)return new Promise((resolve,reject)=>queued.push({fn,resolve,reject}));try{return Promise.resolve(fn());}catch(e){return Promise.reject(e);}}};
 const add=(map,name,fn)=>{const list=map.get(name)??new Set();list.add(fn);map.set(name,list);};const remove=(map,name,fn)=>map.get(name)?.delete(fn);
 const globals={Element:LinkTarget,localStorage:storage,navigator:{locks},HTMLInputElement:Input,HTMLTextAreaElement:Textarea,HTMLSelectElement:Select,FormData:FormDataFixture,
  document:{visibilityState:'visible',location:{href:'https://synthetic.invalid/studio'},addEventListener:(n,f)=>add(documentEvents,n,f),removeEventListener:(n,f)=>remove(documentEvents,n,f)},
  window:{location:{reload(){reloads++;}},confirm(){confirms++;return confirmResult;},setTimeout(fn){const id=timers.size+1;timers.set(id,fn);return id;},clearTimeout:id=>timers.delete(id),addEventListener:(n,f)=>add(windowEvents,n,f),removeEventListener:(n,f)=>remove(windowEvents,n,f)},
  fetch:async(url,options={})=>{
   requests.push({url:String(url),options});
   if(options.method==='GET'){
    const expected=JSON.parse(options.headers['X-Studio-Mutation-Context']);
    if(deferProbe){deferProbe=false;return new Promise(resolve=>{probeResolve=resolve;});}
    if(session==='network-error')throw Error('PRIVATE_TRANSPORT_DIAGNOSTIC');
    if(session==='unavailable-503')return Response.json({error:'PRIVATE_UNAVAILABLE',code:'STUDIO_CONTEXT_UNAVAILABLE'},{status:503});
    if(session==='malformed-receipt')return Response.json({ok:true,action:'wrong-receipt',error:'PRIVATE_MALFORMED'});
    if(session==='opaque-409')return Response.json({error:'PRIVATE_OPAQUE'},{status:409});
    const match=session&&expected.actorId===session.actorId&&expected.organizationId===session.organizationId;
    return Response.json(match?{ok:true,action:'verify-studio-mutation-context'}:{error:'Reload Studio.',code:'STUDIO_CONTEXT_CHANGED'},{status:match?200:session?409:401});
   }
   if(postError)throw postError;
   if(deferPost)return new Promise(resolve=>{postResolve=resolve;});
   if(postMalformedJson)return {ok:postStatus>=200&&postStatus<300,status:postStatus,json:async()=>{throw Error('PRIVATE_MALFORMED_JSON');}};
   return Response.json(postResult??accepted,{status:postStatus});
  }};
 for(const [name,value]of Object.entries(globals)){originals.set(name,Object.getOwnPropertyDescriptor(globalThis,name));Object.defineProperty(globalThis,name,{value,configurable:true,writable:true});}
 const equal=(a,b)=>a&&a.length===b.length&&a.every((v,i)=>Object.is(v,b[i]));
 const hooks={useRef(value){const i=cursor++;if(!(i in slots))slots[i]={current:value};return slots[i];},useState(value){const i=cursor++;if(!(i in slots))slots[i]=typeof value==='function'?value():value;return[slots[i],value=>{const next=typeof value==='function'?value(slots[i]):value;if(!Object.is(next,slots[i])){if(unmounted)writesAfterUnmount++;slots[i]=next;dirty=true;}}];},
  useEffect(create,deps){const i=cursor++,old=effects.get(i);if(!equal(old?.deps,deps))pending.push(()=>{old?.cleanup?.();effects.set(i,{deps,cleanup:create()});});},
  useLayoutEffect(create,deps){const i=cursor++,old=layoutEffects.get(i);if(!equal(old?.deps,deps))pendingLayout.push(()=>{old?.cleanup?.();layoutEffects.set(i,{deps,cleanup:create()});});}};
 const jsx=(type,props,key)=>({type,props:{...props,key}});
 const forms=compile('components/StudioForms.tsx',{react:hooks,'react/jsx-runtime':{jsx,jsxs:jsx},'next/navigation':{useRouter:()=>({push:x=>routes.push(x),refresh:()=>refreshes++})},'@/lib/studio-templates':{STUDIO_COURSE_TEMPLATES:[]},'../lib/studio-draft-scope.ts':scopes,'../lib/studio-mutation-context.ts':protocol,'../lib/studio-release-order.ts':{},'../lib/studio-navigation-guard.ts':compile('lib/studio-navigation-guard.ts')});
 const outer=formKind==='invitation'?forms.InvitationForm({releaseId:'release:synthetic',recoveryScope:scope}):formKind==='cohort'?forms.CreateCohortForm({courses:[],recoveryScope:scope}):formKind==='assignment'?forms.AssignCohortWorkbookForm({cohortId:'cohort:synthetic',workbooks:[],recoveryScope:scope}):forms.CreateCourseForm({recoveryScope:scope});
 const actual=formKind==='invitation'?outer.type(outer.props):outer;
 const outerHookCount=cursor;let action=actual.type,props={...actual.props,...(onValuesChange?{onValuesChange}:{})};
 const find=(node,predicate)=>Array.isArray(node)?node.map(n=>find(n,predicate)).find(Boolean):node?.props?(predicate(node)?node:find(node.props.children,predicate)):undefined;
 const text=node=>Array.isArray(node)?node.map(text).join(''):node?.props?text(node.props.children):typeof node==='string'?node:'';
 function flush(){let cycles=0;do{assert(++cycles<40);dirty=false;cursor=0;pending=[];pendingLayout=[];if(formKind==='invitation'){const wrapper=forms.InvitationForm({releaseId:'release:synthetic',recoveryScope:scope});const refreshed=wrapper.type(wrapper.props);action=refreshed.type;props={...refreshed.props,...(onValuesChange?{onValuesChange}:{})};}cursor=outerHookCount;tree=action(props);tree.props.ref.current=form;const fieldset=find(tree,n=>n.type==='fieldset');controls.forEach(x=>x.disabled=!!fieldset?.props.disabled);for(const fn of pendingLayout)fn();for(const fn of pending)fn();}while(dirty);}
 flush();
 return{values,reads,writes,removes,requests,routes,controls,locks,queued,timers,find:predicate=>find(tree,predicate),text:()=>text(tree),get refreshes(){return refreshes;},get writesAfterUnmount(){return writesAfterUnmount;},get confirms(){return confirms;},set confirmResult(value){confirmResult=value;},set storageFails(value){storageFails=value;},get reloads(){return reloads;},get current(){return session;},set current(value){session=value;},
  async settle(){for(let i=0;i<14;i++){await Promise.resolve();if(!unmounted)flush();}},
  change(value){controls[0].value=value;tree.props.onChange();flush();},submit(){return tree.props.onSubmit({preventDefault(){},currentTarget:form});},
  finishPost(body=accepted,status=200){assert(postResolve,'POST has started');postResolve(Response.json(body,{status}));},
  set postResult(value){postResult=value;},set postError(value){postError=value;},set postStatus(value){postStatus=value;},set postMalformedJson(value){postMalformedJson=value;},emit(name){for(const fn of windowEvents.get(name)??[])fn();flush();},visibility(){for(const fn of documentEvents.get('visibilitychange')??[])fn();flush();},runTimers(){for(const [id,fn]of timers){timers.delete(id);fn();}flush();},releaseLock(){const item=queued.shift();assert(item);try{item.resolve(item.fn());}catch(e){item.reject(e);}if(!unmounted)flush();},
  button(label){return find(tree,n=>n.type==='button'&&text(n)===label);},
  async clickButton(label){const button=find(tree,n=>n.type==='button'&&text(n)===label);assert(button,'Missing button '+label);const result=button.props.onClick?.();flush();await result;},
  unloadWarns(){const event={prevented:false,returnValue:undefined,preventDefault(){this.prevented=true;}};for(const fn of windowEvents.get('beforeunload')??[])fn(event);return event.prevented;},
  clickLeaving(){const event={target:new LinkTarget({href:'https://synthetic.invalid/studio/courses',target:'',hasAttribute:()=>false}),button:0,ctrlKey:false,metaKey:false,shiftKey:false,altKey:false,defaultPrevented:false,preventDefault(){this.defaultPrevented=true;}};for(const fn of documentEvents.get('click')??[])fn(event);return event.defaultPrevented;},
  pauseProbe(){deferProbe=true;},finishProbe(){assert(probeResolve);probeResolve(Response.json({ok:true,action:'verify-studio-mutation-context'}));},
  dispose(){if(unmounted)return;unmounted=true;for(const e of layoutEffects.values())e.cleanup?.();for(const e of effects.values())e.cleanup?.();for(const[name,descriptor]of originals){if(descriptor)Object.defineProperty(globalThis,name,descriptor);else delete globalThis[name];}}
 };
}
