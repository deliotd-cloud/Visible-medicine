import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),React=require('react'),ts=require('typescript');
function compile(path,mocks={}){
 const code=ts.transpileModule(readFileSync(new URL('../'+path,import.meta.url),'utf8'),{
  compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
 }).outputText,module={exports:{}};
 new Function('require','module','exports',code)(name=>Object.hasOwn(mocks,name)?mocks[name]:require(name),module,module.exports);
 return module.exports;
}
function walk(node,predicate){
 if(Array.isArray(node)){for(const child of node){const found=walk(child,predicate);if(found)return found;}return null;}
 return node?.props?(predicate(node)?node:walk(node.props.children,predicate)):null;
}
function words(node){if(Array.isArray(node))return node.map(words).join('');return node?.props?words(node.props.children):typeof node==='string'||typeof node==='number'?String(node):'';}
const deferred=()=>{let resolve;const promise=new Promise(done=>{resolve=done;});return{resolve,promise};};
const flush=()=>new Promise(resolve=>setImmediate(resolve));
const reply=body=>({ok:true,action:body.action,workbookId:body.id,workbookVersion:body.expectedVersion,mode:body.expectedMode,status:'draft',outcome:'verified',source:{workbookId:'source:one',version:4,hash:'a'.repeat(64)}});
const contract=compile('lib/workbook-correction-lineage-contract.ts',{'./workbook-correction-contract.ts':compile('lib/workbook-correction-contract.ts')});
function fixture(mode='teaching'){
 const calls=[];let tree,props={id:'draft:one',version:1,mode,status:'draft',authorityKey:'actor:org'},response=null;
 const frame=()=>({slots:[],effects:new Map(),pending:[]});
 const root=frame();let child=null,childKey=null,activeFrame=root,cursor=0,unmounted=false;
 const oldFetch=globalThis.fetch;
 globalThis.fetch=async(url,options)=>{const body=JSON.parse(options.body);calls.push({url,options,body});if(response instanceof Error)throw response;
  return response??{ok:true,status:200,json:async()=>reply(body)};};
 const hooks={...React,useState(initial){const at=cursor++,owner=activeFrame,slots=owner.slots;if(!(at in slots))slots[at]=typeof initial==='function'?initial():initial;return[slots[at],value=>{slots[at]=typeof value==='function'?value(slots[at]):value;}];},
  useRef(initial){const at=cursor++;return activeFrame.slots[at]??={current:initial};},
  useLayoutEffect(create,deps){const at=cursor++,owner=activeFrame,old=owner.effects.get(at);
   if(!old||deps.length!==old.deps.length||deps.some((value,index)=>value!==old.deps[index]))owner.pending.push(()=>{old?.cleanup?.();owner.effects.set(at,{deps,cleanup:create()});});},
  useSyncExternalStore(subscribe,getSnapshot){hooks.useLayoutEffect(()=>subscribe(()=>{}),[subscribe]);return getSnapshot();},
 };
 const component=compile('components/WorkbookCorrectionLineage.tsx',{'react':hooks,'../lib/workbook-correction-lineage-contract.ts':contract,'./workbook-correction-lineage.css':{}});
 const context=component.createWorkbookCorrectionLineageContext();props={...props,context};
 const cleanup=owner=>{if(owner)for(const effect of owner.effects.values())effect.cleanup?.();};
 function render(next=props,commit=true){
  activeFrame=root;cursor=0;root.pending=[];const element=component.WorkbookCorrectionLineage(next);
  const candidate=element.key===childKey?child:frame();activeFrame=candidate;cursor=0;candidate.pending=[];
  const rendered=element.type(element.props);
  if(commit){if(candidate!==child)cleanup(child);if(!unmounted){for(const run of root.pending)run();for(const run of candidate.pending)run();}
   props=next;child=candidate;childKey=element.key;tree=rendered;}
  return rendered;
 }
 async function open(node=tree){node.props.onToggle({currentTarget:{open:true}});await flush();render();}
 async function click(node=tree){walk(node,n=>n.type==='button').props.onClick();await flush();render();}
 function unmount(){unmounted=true;cleanup(child);cleanup(root);}
 render();return{render,abandon:next=>render(next,false),open,click,unmount,calls,context,setResponse:r=>{response=r;},dispose(){unmount();globalThis.fetch=oldFetch;},
  get tree(){return tree;},get props(){return props;},link:()=>walk(tree,n=>n.type==='a')};
}
test('closed disclosure is quiet and all modes show exact source and ordinary next steps after a single explicit check',async()=>{
 for(const mode of ['teaching','assessment','lecture']){const h=fixture(mode);try{
  assert.equal(h.calls.length,0);assert.equal(h.link(),null);h.tree.props.onToggle({currentTarget:{open:false}});await flush();assert.equal(h.calls.length,0);
  await h.open();assert.equal(h.calls.length,1);const call=h.calls[0];
  assert.equal(call.url,'/api/studio/workbooks/draft%3Aone/correction-lineage');assert.equal(call.options.method,'POST');assert.equal(call.options.cache,'no-store');assert.equal(call.options.credentials,'same-origin');
  assert.deepEqual(call.body,{action:'workbook-correction-lineage',id:'draft:one',expectedVersion:1,expectedMode:mode,expectedStatus:'draft'});
  assert.equal(h.link().props.href,'/studio/workbooks/source%3Aone');assert.match(words(h.tree),/published source version 4/);assert.match(words(h.tree),/a{64}/);
  for(const phrase of [/independent review/,/publication checks/,/approval does not transfer/,/updated course release/,/does not replace or retire/,/attempts remain unchanged/])assert.match(words(h.tree),phrase);
  await h.open();assert.equal(h.calls.length,1);
 }finally{h.dispose();}}
});
test('malformed, unavailable and failed replies expose neither a link nor untrusted server text',async()=>{
 for(const kind of ['unavailable','wrong-id','wrong-version','extra','wrong-hash','foreign-source','network','json','403']){
  const h=fixture();try{
   let value=reply({action:'workbook-correction-lineage',id:'draft:one',expectedVersion:1,expectedMode:'teaching'});
   if(kind==='unavailable')value={...value,outcome:'unavailable',source:null};
   if(kind==='wrong-id')value.workbookId='other';if(kind==='wrong-version')value.workbookVersion=2;
   if(kind==='extra')value.reason='PRIVATE';if(kind==='wrong-hash')value.source.hash='bad';if(kind==='foreign-source')value.source.workbookId='https://foreign.invalid';
   h.setResponse(kind==='network'?new Error('PRIVATE'):{ok:kind!=='403',status:kind==='403'?403:200,json:async()=>{if(kind==='json')throw Error('PRIVATE');return kind==='403'?{error:'PRIVATE'}:value;}});
   await h.open();assert.equal(h.link(),null,kind);assert.doesNotMatch(words(h.tree),/PRIVATE/);assert.match(words(h.tree),/could not be verified/);assert.equal(h.calls.length,1);
  }finally{h.dispose();}
 }
});
test('single-flight and manual recheck clear a previously verified link on revoked access',async()=>{
 const h=fixture();try{
  const wait=deferred();h.setResponse(wait.promise);const old=h.tree;await h.open(old);await h.open(old);await h.click(old);assert.equal(h.calls.length,1);
  wait.resolve({ok:true,json:async()=>reply(h.calls[0].body)});await flush();h.render();assert(h.link());
  const revoked=deferred();h.setResponse(revoked.promise);await h.click();assert.equal(h.link(),null);assert.equal(h.calls.length,2);
  revoked.resolve({ok:false,status:403,json:async()=>({error:'Access revoked'})});await flush();h.render();assert.equal(h.link(),null);assert.match(words(h.tree),/could not be verified/);
 }finally{h.dispose();}
});
test('context changes, return to the same context, and old handlers revoke late replies',async()=>{
 for(const patch of [{id:'draft:two'},{version:2},{mode:'assessment'},{status:'published'},{authorityKey:'other-actor:org'},{authorityKey:'actor:other-org'}]){
  const h=fixture();try{
   const wait=deferred();h.setResponse(wait.promise);const old=h.tree,original=h.props;await h.open(old);
   h.render({...original,...patch});assert.equal(h.link(),null);assert.equal(h.calls[0].options.signal.aborted,true);
   h.render(original);await h.open(old);assert.equal(h.calls.length,1,'old handler must stay revoked after returning');
   wait.resolve({ok:true,json:async()=>reply(h.calls[0].body)});await flush();h.render();assert.equal(h.link(),null);
  }finally{h.dispose();}
 }
});
test('unmount aborts in-flight work and ignores late results',async()=>{
 const h=fixture();try{
  const wait=deferred();h.setResponse(wait.promise);const old=h.tree;await h.open();h.unmount();assert.equal(h.calls[0].options.signal.aborted,true);
  wait.resolve({ok:true,json:async()=>reply(h.calls[0].body)});await flush();h.render();assert.equal(h.link(),null);await h.open(old);assert.equal(h.calls.length,1);
 }finally{h.dispose();}
});
test('mutation start revokes links and late replies before a React render; completion requires an explicit fresh check',async()=>{
 const h=fixture();try{
  await h.open();const oldLink=h.link(),oldTree=h.tree;
  const operation=h.context.begin();let prevented=false;
  oldLink.props.onClick({preventDefault(){prevented=true;}});assert(prevented,'old committed link is revoked synchronously');
  await h.click(oldTree);assert.equal(h.calls.length,1,'old check handler cannot run during mutation');
  h.render();assert.equal(h.link(),null);await h.open();assert.equal(h.calls.length,1);
  h.context.finish(operation);h.render();assert.equal(h.link(),null);await flush();assert.equal(h.calls.length,1,'no automatic recheck');
  await h.open();assert.equal(h.calls.length,2);assert(h.link());
 }finally{h.dispose();}
});
test('overlapping editor operations stay locked until every operation settles; finishing twice is harmless',async()=>{
 const h=fixture();try{
  const first=h.context.begin(),second=h.context.begin();h.render();await h.open();assert.equal(h.calls.length,0);
  h.context.finish(first);h.render();await h.open();assert.equal(h.calls.length,0);const before=h.context.getSnapshot();
  h.context.finish(first);assert.equal(h.context.getSnapshot(),before);h.context.finish(second);h.render();assert.equal(h.calls.length,0);
  await h.open();assert.equal(h.calls.length,1);
 }finally{h.dispose();}
});
test('late JSON or network completion after mutation start cannot restore provenance',async()=>{
 for(const kind of ['json','network']){const h=fixture();try{
  const wait=deferred();h.setResponse(kind==='json'?{ok:true,json:()=>wait.promise}:wait.promise);
  await h.open();const operation=h.context.begin();h.context.finish(operation);
  wait.resolve(kind==='json'?reply(h.calls[0].body):{ok:true,json:async()=>reply(h.calls[0].body)});
  await flush();h.render();assert.equal(h.link(),null);assert.equal(h.calls.length,1);
 }finally{h.dispose();}}
});
test('abandoned renders do not revoke committed work or activate uncommitted handlers',async()=>{
 const h=fixture();try{
  const wait=deferred();h.setResponse(wait.promise);await h.open();const current=h.tree;
  const abandoned=h.abandon({...h.props,id:'draft:abandoned'});
  assert.equal(h.calls[0].options.signal.aborted,false,'render alone must not abort committed request');
  await h.open(abandoned);assert.equal(h.calls.length,1,'uncommitted handlers cannot issue checks');
  wait.resolve({ok:true,json:async()=>reply(h.calls[0].body)});await flush();h.render();assert(h.link());
  await h.open(current);assert.equal(h.calls.length,1);
 }finally{h.dispose();}
});
test('invalid or non-draft contexts have no control and issue no requests',()=>{
 for(const patch of [{id:'../bad'},{version:0},{version:NaN},{mode:'other'},{status:'approved'},{status:'published'},{authorityKey:''}]){
  const h=fixture();try{assert.equal(h.render({...h.props,...patch}),null);assert.equal(h.calls.length,0);}finally{h.dispose();}
 }
});

test('summary retains its control; builder passes authority to live editors without stale sibling controls',async()=>{
 const workbook={id:'draft:one',version:1,mode:'teaching',status:'draft',title:'Synthetic',courseId:'course:one',courseTitle:'Course',moduleTitle:'Module'};
 const snapshot={organization:{id:'org:one'},workbooks:[workbook]},user={userId:'actor:one'};
 const marker=()=>null;
 const mocks={'next/navigation':{notFound(){throw Error('not found');},redirect(){throw Error('redirect');}},'next/link':{default:'a'},
  '@/components/StudioShell':{StudioShell:'section'},'@/components/StudioForms':{DuplicateWorkbookButton:'button'},
  '@/components/WorkbookRetirement':{WorkbookRetirement:'retirement'},'@/components/WorkbookCorrection':{WorkbookCorrection:'correction'},
  '@/components/WorkbookCorrectionLineage':{WorkbookCorrectionLineage:marker},'@/lib/education-platform':{getStudioSnapshot:async()=>snapshot},
  '../../../chatgpt-auth':{requireChatGPTUser:async()=>user},'../../../../chatgpt-auth':{requireChatGPTUser:async()=>user},
  '@/components/EducationRuntime':{EducationRuntime:'runtime'},'@/components/LectureEditor':{LectureEditor:'lecture'},
  '@/lib/lecture-repository':{getLectureStudio:async()=>({})},'@/components/SiteFrame':{WorkspaceContextBar:'nav'},'../../../../learn/runtime.css':{}};
 for(const path of ['app/studio/workbooks/[workbookId]/page.tsx','app/studio/workbooks/[workbookId]/builder/page.tsx']){
  const page=compile(path,mocks).default;
  for(const mode of path.includes('builder')?['teaching','assessment','lecture']:['teaching','assessment']){
   workbook.mode=mode;const tree=await page({params:Promise.resolve({workbookId:workbook.id})});
   if(!path.includes('builder'))assert.deepEqual(walk(tree,n=>n.type===marker).props,{id:workbook.id,version:1,mode,status:'draft',authorityKey:'actor:one:org:one'});
   else{
    assert.equal(walk(tree,n=>n.type===marker),null);
    const editor=walk(tree,n=>n.type===(mode==='lecture'?'lecture':'runtime'));
    assert.equal(editor.props[mode==='lecture'?'authorityKey':'studioAuthorityKey'],JSON.stringify(['actor:one','org:one']));
   }
  }
 }
});
