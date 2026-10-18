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
const deferred=()=>{let resolve;const promise=new Promise(done=>{resolve=done;});return{resolve,promise};};
const flush=()=>new Promise(resolve=>setImmediate(resolve));
const source=props=>({ok:true,action:'workbook-correction-source',workbookId:props.id,workbookVersion:props.version,mode:props.mode,sourceHash:'a'.repeat(64)});
const receipt=body=>({ok:true,action:body.action,requestId:body.requestId,sourceWorkbookId:body.id,
 sourceVersion:body.expectedVersion,sourceHash:body.expectedSourceHash,mode:body.expectedMode,
 draftWorkbookId:'11111111-1111-4111-8111-111111111111',draftVersion:1,draftStatus:'draft',
 auditId:body.requestId,auditHash:'b'.repeat(64),createdAt:'2026-10-16T17:00:00.000Z'});
const lookup=(body,outcome='confirmed')=>({ok:true,action:body.action,requestId:body.requestId,
 sourceWorkbookId:body.id,sourceVersion:body.expectedVersion,sourceHash:body.expectedSourceHash,
 mode:body.expectedMode,outcome,receipt:outcome==='confirmed'?receipt({...body,action:'create-workbook-correction'}):null});
function fixture(mode='teaching'){
 const slots=[],effects=[],calls=[];let cursor=0,tree,props={id:'workbook:one',title:'First workbook',version:2,mode};
 let getReply=null,postReply=null,lookupReply=null;
 const oldFetch=globalThis.fetch;
 globalThis.fetch=async(url,options)=>{const body=options.body?JSON.parse(options.body):undefined;
  calls.push({url,options,body});const checking=url.endsWith('/lookup');
  const value=options.method==='GET'?getReply:checking?lookupReply:postReply;
  if(value instanceof Error)throw value;
  return value??{ok:true,status:200,json:async()=>options.method==='GET'?source(props):checking?lookup(body):receipt(body)};};
 const hooks={...React,useState(initial){const at=cursor++;if(!(at in slots))slots[at]=typeof initial==='function'?initial():initial;
   return[slots[at],value=>{slots[at]=typeof value==='function'?value(slots[at]):value;}];},
  useRef(initial){const at=cursor++;return slots[at]??={current:initial};},
  useEffect(create){if(!effects.length)effects.push(create());}};
 const component=compile('components/WorkbookCorrection.tsx',{'react':hooks,
  '../lib/workbook-correction-contract.ts':compile('lib/workbook-correction-contract.ts'),'./workbook-correction.css':{}});
 function render(next=props){props=next;cursor=0;tree=component.WorkbookCorrection(props);return tree;}
 function find(type){return walk(tree,node=>node.type===type);}
 function findButton(label){return walk(tree,node=>node.type==='button'&&String(node.props.children).includes(label));}
 async function open(node=tree){node.props.onToggle({currentTarget:{open:true}});await flush();render();}
 function update(type,value){find(type).props.onChange({currentTarget:type==='input'?{checked:value}:{value}});render();}
 async function submit(node=tree){await walk(node,item=>item.type==='form').props.onSubmit({preventDefault(){}});render();}
 function dispose(){for(const cleanup of effects)cleanup();globalThis.fetch=oldFetch;}
 render();return{render,find,findButton,open,update,submit,dispose,calls,setGet:value=>{getReply=value;},setPost:value=>{postReply=value;},setLookup:value=>{lookupReply=value;},
  get tree(){return tree;},get props(){return props;}};
}

test('closed disclosure is quiet; exact source is loaded only on explicit opening',async()=>{
 const h=fixture();try{
  assert.equal(h.tree.type,'details');assert.equal(h.tree.props.open,undefined);assert.equal(h.calls.length,0);
  h.tree.props.onToggle({currentTarget:{open:false}});await flush();assert.equal(h.calls.length,0);
  await h.open();assert.equal(h.calls.length,1);assert.equal(h.calls[0].options.method,'GET');
  assert.equal(h.calls[0].options.cache,'no-store');assert.equal(h.calls[0].url,'/api/studio/workbooks/workbook%3Aone/corrections');
  await h.open();assert.equal(h.calls.length,1);assert(h.find('form'));
 }finally{h.dispose();}
});
for(const mode of ['teaching','assessment','lecture'])test(mode+' creates one exact-source draft with a safe explicit link',async()=>{
 const h=fixture(mode);try{
  await h.open();await h.submit();assert.equal(h.calls.length,1);
  h.update('textarea','  Correct the teaching note  ');await h.submit();assert.equal(h.calls.length,1);
  h.update('input',true);await h.submit();assert.equal(h.calls.length,2);
  const body=h.calls[1].body;assert.equal(body.reason,'Correct the teaching note');
  assert.equal(body.expectedMode,mode);assert.equal(body.expectedVersion,2);assert.equal(body.expectedSourceHash,'a'.repeat(64));
  assert.equal(body.expectedStatus,'published');assert.equal(body.confirmed,true);assert.match(body.requestId,/^[a-f0-9-]{36}$/);
  assert.equal(h.find('fieldset').props.disabled,true);assert(walk(h.tree,node=>node.props.role==='status'));
  assert.equal(h.find('a').props.href,'/studio/workbooks/11111111-1111-4111-8111-111111111111/builder');
  await h.submit();assert.equal(h.calls.length,2,'no automatic retry, navigation, approval or retirement');
 }finally{h.dispose();}
});
test('mismatched source and invalid props cannot reach POST',async()=>{
 for(const patch of [{workbookVersion:3},{mode:'lecture'},{workbookId:'other'},{sourceHash:'bad'},{foreign:true}]){
  const h=fixture();try{h.setGet({ok:true,status:200,json:async()=>({...source(h.props),...patch})});await h.open();
   assert.equal(h.find('form'),null);assert(walk(h.tree,node=>node.props.role==='alert'));assert.equal(h.calls.length,1);
  }finally{h.dispose();}
 }
 for(const patch of [{id:'bad/id'},{version:0},{disabled:true},{mode:'unknown'},{title:''},{title:undefined}]){
  const h=fixture();try{h.render({...h.props,...patch});await h.open();assert.equal(h.calls.length,0);}finally{h.dispose();}
 }
});
test('reason changes require renewed confirmation, and double clicks remain single-flight',async()=>{
 const h=fixture();try{
  await h.open();h.update('textarea','First reason');h.update('input',true);h.update('textarea','New reason');
  assert.equal(h.find('input').props.checked,false);await h.submit();assert.equal(h.calls.length,1);
  h.update('input',true);const wait=deferred();h.setPost(wait.promise);const staleTree=h.tree;
  const first=h.submit(staleTree);await h.submit(staleTree);assert.equal(h.calls.length,2);
  h.render();assert.equal(h.find('fieldset').props.disabled,true);
  h.update('textarea','Ignored');assert.equal(h.find('textarea').props.value,'New reason');
  wait.resolve({ok:true,status:200,json:async()=>receipt(h.calls[1].body)});await first;
  assert.equal(h.calls.length,2);assert.equal(h.find('a').props.href,'/studio/workbooks/11111111-1111-4111-8111-111111111111/builder');
 }finally{h.dispose();}
});
test('unknown, forged and lost acknowledgements keep the reason and block retry',async()=>{
 for(const reply of ['network','json','malformed','wrong-source','foreign','server-error']){
  const h=fixture();try{
   await h.open();h.update('textarea','Keep this reason');h.update('input',true);
   if(reply==='network')h.setPost(Error('lost connection'));
   else if(reply==='json')h.setPost({ok:true,status:200,json:async()=>{throw Error('lost response');}});
   else if(reply==='server-error')h.setPost({ok:false,status:500,json:async()=>({error:'not confirmed'})});
   else h.setPost({ok:true,status:200,json:async()=>{const result=receipt(h.calls.at(-1).body);
    return reply==='malformed'?null:reply==='foreign'?{...result,foreign:true}:{...result,sourceHash:'c'.repeat(64)};}});
   await h.submit();assert.equal(h.find('textarea').props.value,'Keep this reason');assert.equal(h.find('fieldset').props.disabled,true);
   assert(walk(h.tree,node=>node.props.role==='alert'));assert.equal(h.find('a').props.href,'/studio/workspace');
   await h.submit();await h.open();assert.equal(h.calls.length,2,'ambiguous commit is never automatically repeated');
  }finally{h.dispose();}
 }
});
for(const mode of ['teaching','assessment','lecture'])test(mode+' manually confirms an uncertain creation using the retained identity',async()=>{
 const h=fixture(mode);try{
  await h.open();h.update('textarea','Retained correction reason');h.update('input',true);
  h.setPost(Error('lost creation response'));await h.submit();
  const creation=h.calls[1].body;
  assert(h.findButton('Check creation status'));assert.equal(h.find('textarea').props.value,'Retained correction reason');
  h.findButton('Check creation status').props.onClick();await flush();h.render();
  assert.equal(h.calls.length,3);assert.equal(h.calls[2].url,'/api/studio/workbooks/workbook%3Aone/corrections/lookup');
  assert.equal(h.calls[2].options.method,'POST');assert.deepEqual(h.calls[2].body,{
   action:'lookup-workbook-correction',id:creation.id,expectedVersion:creation.expectedVersion,
   expectedMode:creation.expectedMode,expectedSourceHash:creation.expectedSourceHash,requestId:creation.requestId});
  assert.equal(h.findButton('Check creation status'),null);
  assert.equal(h.find('a').props.href,'/studio/workbooks/11111111-1111-4111-8111-111111111111/builder');
  assert.match(JSON.stringify(h.tree),/Open correction workbook/);
  assert.match(JSON.stringify(h.tree),/does not verify the workbook/);
  await h.submit();assert.equal(h.calls.filter(call=>call.url.endsWith('/corrections')&&call.options.method==='POST').length,1);
 }finally{h.dispose();}
});
test('unconfirmed, failed and forged lookups retain the creation identity and allow another manual check',async()=>{
 for(const outcome of ['unconfirmed','network','server','malformed','wrong-uuid','wrong-source','foreign','forged-receipt']){
  const h=fixture();try{
   await h.open();h.update('textarea','Keep this reason');h.update('input',true);
   h.setPost(Error('lost response'));await h.submit();const creation=h.calls[1].body;
   if(outcome==='network')h.setLookup(Error('offline'));
   else if(outcome==='server')h.setLookup({ok:false,status:500,json:async()=>({error:'internal'})});
   else h.setLookup({ok:true,status:200,json:async()=>{
    const body=h.calls.at(-1).body,result=lookup(body,outcome==='unconfirmed'?'unconfirmed':'confirmed');
    return outcome==='malformed'?null:outcome==='wrong-uuid'?{...result,requestId:'00000000-0000-4000-8000-000000000000'}:
     outcome==='wrong-source'?{...result,sourceHash:'c'.repeat(64)}:outcome==='foreign'?{...result,foreign:true}:
     outcome==='forged-receipt'?{...result,receipt:{...result.receipt,auditHash:'bad'}}:result;
   }});
   h.findButton('Check creation status').props.onClick();await flush();h.render();
   assert.equal(h.find('textarea').props.value,'Keep this reason');
   assert.equal(h.find('fieldset').props.disabled,true);assert(h.findButton('Check creation status'));
   assert.equal(h.find('a').props.href,'/studio/workspace');assert(walk(h.tree,node=>node.props.role==='alert'));
   await h.submit();assert.equal(h.calls.length,3);
   h.setLookup(null);h.findButton('Check creation status').props.onClick();await flush();h.render();
   assert.equal(h.calls[3].body.requestId,creation.requestId);
   assert.equal(h.calls.filter(call=>call.url.endsWith('/corrections')&&call.options.method==='POST').length,1);
  }finally{h.dispose();}
 }
});
test('lookup is single-flight and late A→B→A or unmounted results cannot confirm',async()=>{
 const h=fixture();try{
  await h.open();h.update('textarea','Same reason');h.update('input',true);h.setPost(Error('lost response'));await h.submit();
  const pending=deferred();h.setLookup(pending.promise);const oldTree=h.tree;
  h.findButton('Check creation status').props.onClick();
  h.findButton('Check creation status').props.onClick();assert.equal(h.calls.length,3);
  h.render();assert.equal(h.findButton('Checking creation status').props.disabled,true);
  h.render({...h.props,id:'workbook:two'});h.render({...h.props,id:'workbook:one'});
  pending.resolve({ok:true,status:200,json:async()=>lookup(h.calls[2].body)});await flush();h.render();
  assert.equal(h.find('a'),null);await walk(oldTree,node=>node.type==='button'&&node.props.children==='Check creation status').props.onClick();
  assert.equal(h.calls.length,3);
  await h.open();h.update('textarea','New reason');h.update('input',true);await h.submit();
  const last=deferred();h.setLookup(last.promise);h.findButton('Check creation status').props.onClick();
  h.dispose();last.resolve({ok:true,status:200,json:async()=>lookup(h.calls.at(-1).body)});await flush();
  assert.equal(h.find('a').props.href,'/studio/workspace');
 }finally{h.dispose();}
});
test('a definite refusal rechecks source explicitly and retains the same request UUID',async()=>{
 const h=fixture();try{
  await h.open();h.update('textarea','Keep this reason');h.update('input',true);
  h.setPost({ok:false,status:409,json:async()=>({error:'The source changed.'})});await h.submit();
  const requestId=h.calls[1].body.requestId;assert.equal(h.find('form'),null);assert.equal(h.calls.length,2);
  await h.open();assert.equal(h.calls.length,3);assert.equal(h.find('textarea').props.value,'Keep this reason');
  assert.equal(h.find('input').props.checked,false);h.update('input',true);h.setPost(null);await h.submit();
  assert.equal(h.calls[3].body.requestId,requestId);assert.equal(h.calls.length,4);
 }finally{h.dispose();}
});
test('source and mutation callbacks plus old handlers are revoked across A→B→A and unmount',async()=>{
 const h=fixture();try{
  const wait=deferred();h.setGet(wait.promise);const oldTree=h.tree;const loading=h.open();
  h.render({...h.props,id:'workbook:two'});h.render({...h.props,id:'workbook:one'});
  wait.resolve({ok:true,status:200,json:async()=>source(h.props)});await loading;
  assert.equal(h.find('form'),null);await h.open(oldTree);assert.equal(h.calls.length,1,'old handlers cannot reload A');
  h.setGet(null);await h.open();h.update('textarea','Old reason');h.update('input',true);
  const mutation=deferred();h.setPost(mutation.promise);const pending=h.submit();
  const staleForm=h.tree;h.render({...h.props,id:'workbook:two'});h.render({...h.props,id:'workbook:one'});
  mutation.resolve({ok:true,status:200,json:async()=>receipt(h.calls.at(-1).body)});await pending;
  assert.equal(h.find('a'),null);await h.submit(staleForm);assert.equal(h.calls.length,3);
  h.setPost(null);await h.open();h.update('textarea','Later reason');h.update('input',true);
  const last=deferred();h.setPost(last.promise);const finish=h.submit();h.dispose();
  last.resolve({ok:true,status:200,json:async()=>receipt(h.calls.at(-1).body)});await finish;
  assert.equal(h.find('a'),null);
 }finally{h.dispose();}
});
test('published controls are integrated without adding learner navigation or review grants',()=>{
 const page=readFileSync(new URL('../app/studio/workbooks/[workbookId]/page.tsx',import.meta.url),'utf8');
 const editor=readFileSync(new URL('../components/LectureEditor.tsx',import.meta.url),'utf8');
 const runtime=readFileSync(new URL('../components/EducationRuntime.tsx',import.meta.url),'utf8');
 assert.match(page,/workbook.status === "published" && <>\s*<WorkbookCorrection/);
 assert.match(editor,/panel === "review" && view.status === "published" && <WorkbookCorrection/);
 assert.match(runtime,/focusedWorkbook.status === "published" && <>\s*<WorkbookCorrection/);
 const component=readFileSync(new URL('../components/WorkbookCorrection.tsx',import.meta.url),'utf8');
 assert.doesNotMatch(component,/router\.(push|replace)|localStorage|sessionStorage|\/retirement|publish\(|approve\(/);
});
