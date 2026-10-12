import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {sourceCanonical} from '../lib/body-source-additions.ts';
import {createDeferredLoader} from '../lib/body-teaching-loader.ts';

const structure = (id = 'selected', region = 'abdomen') => ({
  id, region, regions:[region,'whole-body'], sources:[{file:'FJ-test',sha256:'a'.repeat(64)}],
});
const accepting = (value = {}) => ({...value, accepts:()=>true});
const tick = async () => {for (let i=0;i<8;i++) await Promise.resolve();};
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes,no) => {resolve=yes;reject=no;});
  return {promise,resolve,reject};
}

test('defers import, deduplicates pending and shares successful module', async () => {
  const request=deferred(); let calls=0;
  const loader=createDeferredLoader(() => {calls++;return request.promise;});
  assert.equal(calls,0); assert.equal(loader.peek(),undefined);
  const a=loader.load(), b=loader.load(); assert.equal(a,b);
  await tick(); assert.equal(calls,1);
  const module={bodyContent:()=>'content'}; request.resolve(module);
  assert.equal(await a,module); assert.equal(loader.peek(),module);
  assert.equal(await loader.load(),module); assert.equal(calls,1);
});

test('failed import is recoverable, concurrent retry remains deduplicated', async () => {
  let calls=0; const module={};
  const loader=createDeferredLoader(async () => {if (++calls===1) throw Error('offline');return module;});
  await assert.rejects(loader.load(),/offline/); assert.equal(loader.peek(),undefined);
  const retry=loader.load(); assert.equal(loader.load(),retry);
  assert.equal(await retry,module); assert.equal(calls,2);
});

// Exercise the actual boundary function and effects with a minimal hook host.
// This avoids adding a renderer dependency. DOM focus and real navigation still
// require browser acceptance; these tests cover state, cleanup and current props.
function boundaryHost(loader, reload = () => {throw Error('Unexpected reload');}) {
  const states=[], effects=[], refs=[]; let cursor=0, effectCursor=0, refCursor=0, pendingEffects=[];
  const react={
    createContext:value=>({value}), useContext:context=>context.value,
    useState(initial) {
      const i=cursor++;
      if (!(i in states)) states[i]=typeof initial==='function'?initial():initial;
      return [states[i],value=>{states[i]=typeof value==='function'?value(states[i]):value;}];
    },
    useRef(initial) {const i=refCursor++;return refs[i]??(refs[i]={current:initial});},
    useEffect(run,deps) {
      const i=effectCursor++, old=effects[i];
      if (!old || deps.some((value,j)=>!Object.is(value,old.deps[j]))) {
        pendingEffects.push({i,deps,run});
      }
    },
  };
  const exports={};
  const source=ts.transpileModule(readFileSync('app/lazy-body-teaching.tsx','utf8'),{
    compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022},
  }).outputText;
  vm.runInNewContext(source,{exports,window:{location:{reload}},require:name=>{
    if(name==='react')return react;
    if(name==='react/jsx-runtime')return {jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})};
    if(name==='../lib/body-teaching-loader')return {bodyTeachingLoader:loader};
    if(name==='../lib/body-source-additions')return {sourceCanonical};
    throw Error(name);
  }});
  return {
    context:exports.BodyTeachingVisibility,states,refs,
    render(props, commit = true) {
      cursor=effectCursor=refCursor=0; pendingEffects=[];
      const node=exports.LazyBodyTeaching(props);
      if(commit)for(const {i,deps,run} of pendingEffects){effects[i]?.cleanup?.();effects[i]={deps,cleanup:run()};}
      return node;
    },
    unmount(){for(const effect of effects)effect.cleanup?.();},
  };
}

test('hidden boundary starts no request; loading resolves using current selection/tab', async () => {
  const request=deferred();let calls=0;
  const host=boundaryHost(createDeferredLoader(()=>{calls++;return request.promise;}));
  const props=(selection,tab)=>({structure:structure(selection),children:module=>module.bodyContent(selection,tab)});
  host.context.value=false; assert.equal(host.render(props('old','ct')),null);
  await tick();assert.equal(calls,0);
  host.context.value=true;
  assert.equal(host.render(props('old','ct')).props.children.props.role,'status');
  host.render(props('current','mri'));
  request.resolve(accepting({bodyContent:(selection,tab)=>`${selection}:${tab}`})); await tick();
  assert.equal(host.render(props('current','mri')).props.children,'current:mri');
  assert.equal(host.render(props('next','pathology')).props.children,'next:pathology');
  assert.equal(calls,1);
});

test('one subscriber can disappear while another uses the shared pending load', async () => {
  const request=deferred();let calls=0;
  const loader=createDeferredLoader(()=>{calls++;return request.promise;});
  const old=boundaryHost(loader),current=boundaryHost(loader);
  old.render({structure:structure(),children:()=> 'old notes'});
  current.render({structure:structure(),children:()=> 'current notes'});
  await tick();assert.equal(calls,1);old.unmount();
  request.resolve(accepting());await tick();
  assert.equal(old.states[0],undefined);
  assert.equal(current.render({structure:structure(),children:()=> 'current notes'}).props.children,'current notes');
});

test('disabled/unmounted subscribers ignore late success and failure', async () => {
  for(const result of ['resolve','reject']) {
    const request=deferred();const host=boundaryHost(createDeferredLoader(()=>request.promise));
    host.render({structure:structure(),children:()=> 'old'}); await tick();host.unmount();
    const before=[...host.states];
    request[result](result==='resolve'?accepting():Error('offline'));await tick();
    assert.equal(host.states[0],undefined); assert.deepEqual(host.states,before);
  }
  const request=deferred();const host=boundaryHost(createDeferredLoader(()=>request.promise));
  host.render({structure:structure(),children:()=> 'old'});host.render({structure:structure(),enabled:false,children:()=> 'new'});
  request.resolve(accepting());await tick();assert.equal(host.states[0],undefined);
  assert.equal(host.render({structure:structure(),enabled:false,children:()=> 'new'}),null);
});

test('actual boundary exposes recovery and restores focus only if retry retained focus', async () => {
  for(const moved of [false,true]) {
    let calls=0;const host=boundaryHost(createDeferredLoader(async()=>{if(++calls===1)throw Error('offline');return accepting();}));
    const props={structure:structure(),children:()=> 'current notes'};
    host.render(props);await tick();
    const error=host.render(props).props.children;
    assert.equal(error.props.role,'alert');
    const button=error.props.children.find(node=>node?.type==='button');
    let focus=0;const body={},other={};const document={activeElement:null,body};
    const origin={ownerDocument:document};document.activeElement=origin;
    host.refs[0].current={focus:()=>focus++};
    button.props.onClick({currentTarget:origin});
    host.render(props);document.activeElement=moved?other:body;await tick();
    assert.equal(host.render(props).props.children,'current notes');
    assert.equal(focus,moved?0:1);assert.equal(calls,2);
  }
});

test('repeated failed browser import offers warned manual reload, never automatic', async () => {
  let reloads=0;
  const host=boundaryHost(createDeferredLoader(async()=>{throw Error('cached network failure');}),()=>reloads++);
  const props={structure:structure(),children:()=> 'notes'};
  host.render(props);await tick();
  let error=host.render(props).props.children;
  assert.equal(error.props.children.filter(node=>node?.type==='button').length,1);
  const retry=error.props.children.find(node=>node?.type==='button');
  retry.props.onClick({currentTarget:{ownerDocument:{activeElement:null}}});
  host.render(props);await tick();error=host.render(props).props.children;
  assert.equal(reloads,0);
  assert.match(error.props.children.filter(node=>node?.type==='p').map(node=>node.props.children).join(' '),/resets your current unsaved view/);
  const reload=error.props.children.find(node=>node?.props?.children==='Reload atlas');assert(reload);
  reload.props.onClick();assert.equal(reloads,1);
});

test('changed complete identity rejects cached regional module before children run', async () => {
  const a=structure('same-id','abdomen'),b=structuredClone(a);b.sources[0].sha256='b'.repeat(64);
  const one={accepts:s=>sourceCanonical(s)===sourceCanonical(a)},two={accepts:s=>sourceCanonical(s)===sourceCanonical(b)};
  const request=deferred();let calls=0,children=0;
  const host=boundaryHost({peek:s=>one.accepts(s)?one:undefined,load:s=>{calls++;return one.accepts(s)?Promise.resolve(one):request.promise;}});
  const props=s=>({structure:s,children:()=>{children++;return s.sources[0].sha256;}});
  assert.equal(host.render(props(a)).props.children,a.sources[0].sha256);await tick();
  const before=children;
  assert.equal(host.render(props(b)).props.children.props.role,'status');
  assert.equal(children,before,'No transient child using previous identity');
  request.resolve(two);await tick();
  assert.equal(host.render(props(b)).props.children,b.sources[0].sha256);assert.equal(calls,2);
});

test('cross-region completion and rejection cannot replace the current notes', async () => {
  for(const outcome of ['resolve','reject']){
    const a=structure('old','abdomen'),b=structure('new','head-neck');
    const old=deferred(),current=deferred();
    const host=boundaryHost({peek:()=>undefined,load:s=>s.region===a.region?old.promise:current.promise});
    const props=s=>({structure:s,children:module=>{assert(module.accepts(s));return s.id;}});
    host.render(props(a));host.render(props(b));
    current.resolve({accepts:s=>sourceCanonical(s)===sourceCanonical(b)});await tick();
    assert.equal(host.render(props(b)).props.children,'new');
    old[outcome](outcome==='resolve'?{accepts:s=>sourceCanonical(s)===sourceCanonical(a)}:Error('old offline'));await tick();
    assert.equal(host.render(props(b)).props.children,'new');
  }
});

test('abandoned render starts no request and cannot retire the committed subscriber', async () => {
  const a=structure('committed','abdomen'),b=structure('abandoned','head-neck');
  const request=deferred(),calls=[];
  const host=boundaryHost({peek:()=>undefined,load:s=>{calls.push(s.id);return request.promise;}});
  const props=s=>({structure:s,children:module=>{assert(module.accepts(s));return s.id;}});
  host.render(props(a));
  host.render(props(b),false);
  assert.deepEqual(calls,['committed'],'Only committed effects may start downloads');
  request.resolve({accepts:s=>sourceCanonical(s)===sourceCanonical(a)});await tick();
  assert.equal(host.render(props(a)).props.children,'committed');
  assert.deepEqual(calls,['committed']);
});

test('retry focus belongs to its source identity and cannot follow a later selection', async () => {
  for(const completionOrder of [['old','current'],['current','old']]){
    const a=structure('retry-A','abdomen'),b=structure('selection-B','head-neck');
    const old=deferred(),current=deferred();let aCalls=0,focus=0;
    const host=boundaryHost({peek:()=>undefined,load:s=>{
      if(s.id===a.id)return ++aCalls===1?Promise.reject(Error('A offline')):old.promise;
      return current.promise;
    }});
    const props=s=>({structure:s,children:module=>{assert(module.accepts(s));return s.id;}});
    host.render(props(a));await tick();
    const error=host.render(props(a)).props.children;
    assert.equal(error.props.role,'alert');
    const retry=error.props.children.find(node=>node?.type==='button');
    const body={},document={activeElement:null,body},origin={ownerDocument:document};
    document.activeElement=origin;host.refs[0].current={focus:()=>focus++};
    retry.props.onClick({currentTarget:origin});host.render(props(a));
    assert.equal(aCalls,2,'A retry starts while its button retains focus');
    assert.equal(host.render(props(b)).props.children.props.role,'status');
    document.activeElement=body;
    for(const which of completionOrder){
      const selected=which==='old'?a:b;
      (which==='old'?old:current).resolve({accepts:s=>sourceCanonical(s)===sourceCanonical(selected)});
      await tick();host.render(props(b));
      assert.equal(focus,0,which+': A retry must not restore focus into B');
    }
    assert.equal(host.render(props(b)).props.children,b.id);
    assert.equal(focus,0);
  }
});
