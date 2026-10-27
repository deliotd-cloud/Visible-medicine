import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

// Source-only proposal. The two source overrides let the integrator bind a
// sealed successor; this fixture never writes product or browser storage.
const root=fileURLToPath(new URL('../',import.meta.url));
const require=createRequire(join(root,'package.json'));
const ts=require('typescript');
const React=require('react');
const scope={actorId:'edu:synthetic-author',organizationId:'org:synthetic'};
export const draftKey=id=>`visible-medicine-studio-draft:${JSON.stringify(['v1',scope.actorId,scope.organizationId,`release:${id}`])}`;

function compile(path,imports={}){
  const code=ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const module={exports:{}};
  new Function('module','exports','require',code)(module,module.exports,name=>Object.hasOwn(imports,name)?imports[name]:require(name));
  return module.exports;
}
const lib=(name)=>compile(join(root,'lib',name));
const scopes=lib('studio-draft-scope.ts');
const session=lib('studio-session-drafts.ts');
const notes=lib('studio-release-note-recovery.ts');
const order=lib('studio-release-order.ts');
const protocol=lib('studio-mutation-context.ts');
const predecessor=compile(join(root,'lib/studio-release-predecessor.ts'));
export {predecessor};

export function fixture({primary=null,old=null,shared,context='ok',lock='ok',remove='ok',status='draft',onRead}={}){
  const stored=shared??new Map();
  if(primary!==null)stored.set(draftKey('release:one'),JSON.stringify(primary));
  if(old!==null)stored.set(draftKey('course:one'),typeof old==='string'?old:JSON.stringify(old));
  const reads=[],removes=[],locks=[],payloads=[],refreshes=[],timers=[];
  const oldGlobals=new Map(['fetch','FormData','navigator','localStorage','window','document','HTMLInputElement','HTMLTextAreaElement','HTMLSelectElement'].map(name=>[name,Object.getOwnPropertyDescriptor(globalThis,name)]));
  let contextState=context,lockState=lock,removeState=remove,reply={ok:true,status:200,body:{ok:true,action:'save-release',releaseId:'release:one'}},fetchOverride=null,renderNeeded=false,phase='release',cursor=0,releaseTree,actionTree;
  const slots={release:[],action:[]},effects={release:[],action:[]},records={release:new Map(),action:new Map()};
  const hooks={...React,
    useState(initial){const i=cursor++,bag=slots[phase];if(!(i in bag))bag[i]=typeof initial==='function'?initial():initial;return[bag[i],value=>{const next=typeof value==='function'?value(bag[i]):value;if(!Object.is(next,bag[i])){bag[i]=next;renderNeeded=true;}}];},
    useRef(initial){const i=cursor++,bag=slots[phase];return bag[i]??={current:initial};},
    useEffect(create,deps){const i=cursor++,map=records[phase],old=map.get(i);if(!old||!deps||deps.some((x,j)=>!Object.is(x,old.deps[j])))effects[phase].push(()=>{old?.cleanup?.();map.set(i,{deps,cleanup:create()});});},
    useLayoutEffect(create,deps){hooks.useEffect(create,deps);},
  };
  const verifier={...protocol,verifyStudioMutationContext(value){return {then(ok,fail){try{if(contextState==='changed')throw new protocol.StudioMutationContextError('changed');if(contextState==='unavailable')throw new protocol.StudioMutationContextError('unavailable');if(!protocol.parseStudioMutationContext(value))throw new protocol.StudioMutationContextError();return Promise.resolve(ok());}catch(error){return Promise.resolve(fail?.(error));}}};}};
  const jsx=(type,props,key)=>({type,props:{...props,key}});
  const forms=compile(join(root,'components/StudioForms.tsx'),{
    react:hooks,'react/jsx-runtime':{jsx,jsxs:jsx},'next/navigation':{useRouter:()=>({refresh:()=>refreshes.push(true)})},
    '@/lib/studio-templates':{STUDIO_COURSE_TEMPLATES:[]},'../lib/studio-release-order.ts':order,
    '../lib/studio-navigation-guard.ts':{registerStudioNavigationGuard:()=>()=>{}},
    '../lib/studio-draft-scope.ts':scopes,'../lib/studio-session-drafts.ts':session,
    '../lib/studio-release-note-recovery.ts':notes,'../lib/studio-mutation-context.ts':verifier,
    '../lib/studio-release-predecessor.ts':predecessor,
  });
  const release={id:'release:one',version:2,status,workbookIds:['workbook:one'],outcomes:['Identify structures','Compare views'],title:'Original release',slug:'original-release',summary:'Original saved description.',level:'Intermediate',duration:'Self-paced',publisher:'School',publisherKind:'institution',visibility:'private',accessModel:'invitation',priceMinor:0,currency:'GBP',enrolmentOpen:true};
  const props={course:{id:'course:one',title:'Course',description:release.summary},workbooks:[{id:'workbook:one',title:'Workbook one',mode:'lecture',caseCount:0}],release,recoveryScope:scope,onDraftRecoveryChange:()=>{}};
  const fields=new Map([['expectedCourseId','course:one'],['expectedReleaseId','release:one'],['expectedVersion','2'],['title','Original release'],['slug','original-release'],['summary',release.summary],['level','Intermediate'],['duration','Self-paced'],['outcomes','Identify structures\nCompare views'],['publisherName','School'],['publisherKind','institution'],['visibility','private'],['accessModel','invitation'],['enrolmentOpen','on'],['workbookIds',['workbook:one']],['price','0'],['currency','GBP']]);
  class Input{constructor(name,type='text'){this.name=name;this.type=type;this.disabled=false;}get value(){if(this.type==='checkbox')return this.name==='workbookIds'?'workbook:one':'on';return fields.get(this.name)??'';}set value(v){fields.set(this.name,String(v));}get checked(){return this.type==='checkbox'&&fields.has(this.name);}set checked(v){if(!v)fields.delete(this.name);else if(this.name==='workbookIds')fields.set(this.name,['workbook:one']);else fields.set(this.name,'on');}focus(){}}
  class Textarea extends Input{}class Select extends Input{}
  const form={elements:[...fields.keys()].map(name=>new Input(name,['workbookIds','enrolmentOpen'].includes(name)?'checkbox':'text')),querySelectorAll:()=>[]};
  class FormDataFixture{constructor(){this.values=new Map([...fields].map(([k,v])=>[k,Array.isArray(v)?[...v]:v]));}get(k){const v=this.values.get(k);return Array.isArray(v)?v[0]??null:v??null;}getAll(k){const v=this.values.get(k);return v===undefined?[]:Array.isArray(v)?[...v]:[v];}keys(){return this.values.keys();}[Symbol.iterator](){return this.values[Symbol.iterator]();}}
  const globals={FormData:FormDataFixture,HTMLInputElement:Input,HTMLTextAreaElement:Textarea,HTMLSelectElement:Select,
    navigator:{locks:{request(name,action){locks.push(name);if(lockState==='unavailable')return Promise.reject(Error('locks unavailable'));try{return Promise.resolve(action());}catch(error){return Promise.reject(error);}}}},
    localStorage:{getItem(key){reads.push(key);onRead?.(key,stored,reads);return stored.get(key)??null;},setItem(key,value){stored.set(key,value);},removeItem(key){removes.push(key);if(removeState==='failed')throw Error('remove failed');stored.delete(key);}},
    document:{addEventListener(){},removeEventListener(){},visibilityState:'visible'},
    window:{setTimeout(fn){timers.push(fn);return timers.length;},clearTimeout(){},addEventListener(){},removeEventListener(){},confirm:()=>false,requestAnimationFrame:()=>1,cancelAnimationFrame(){}},
    fetch:async(_url,options)=>{payloads.push(JSON.parse(options.body));return fetchOverride?fetchOverride():{ok:reply.ok,status:reply.status,json:async()=>reply.body};}};
  for(const[name,value]of Object.entries(globals))Object.defineProperty(globalThis,name,{value,configurable:true,writable:true});
  function attach(node){if(Array.isArray(node)){node.forEach(attach);return;}if(!node?.props)return;const{name,ref}=node.props;if(name&&ref&&typeof ref==='object')ref.current=form.elements.find(x=>x.name===name)??new Input(name);attach(node.props.children);}
  function render(){let passes=0;do{assert(++passes<40);renderNeeded=false;phase='release';cursor=0;releaseTree=forms.ReleaseDraftForm(props);attach(releaseTree.props.children);phase='action';cursor=0;actionTree=releaseTree.type(releaseTree.props);actionTree.props.ref.current=form;for(const fn of effects.release.splice(0))fn();for(const fn of effects.action.splice(0))fn();}while(renderNeeded);return actionTree;}
  function find(predicate){function walk(node){if(Array.isArray(node)){for(const child of node){const found=walk(child);if(found)return found;}return null;}if(!node?.props)return null;return predicate(node)?node:walk(node.props.children);}return walk(actionTree)??walk(releaseTree);}
  function unmount(){for(const map of Object.values(records)){for(const value of map.values())value.cleanup?.();map.clear();}}
  function dispose(){unmount();for(const[name,descriptor]of oldGlobals){if(descriptor)Object.defineProperty(globalThis,name,descriptor);else delete globalThis[name];}}
  render();
  return{fields,form,props,stored,reads,removes,locks,payloads,refreshes,render,find,unmount,dispose,
    async settle(){for(let i=0;i<8;i++){await Promise.resolve();render();}},
    change(name,value){fields.set(name,value);render().props.onChange();render();},
    submit(){return render().props.onSubmit({preventDefault(){},currentTarget:form});},
    runTimers(){for(const fn of timers.splice(0))fn();render();},
    setReply(value){reply=value;},setFetch(value){fetchOverride=value;},setContext(value){contextState=value;},setLock(value){lockState=value;},setRemove(value){removeState=value;},
  };
}
