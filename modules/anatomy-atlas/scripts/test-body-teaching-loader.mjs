import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {createDeferredLoader} from '../lib/body-teaching-loader.ts';

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
  const states=[], effects=[], refs=[]; let cursor=0, effectCursor=0, refCursor=0;
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
        old?.cleanup?.(); effects[i]={deps,run};
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
    throw Error(name);
  }});
  return {
    context:exports.BodyTeachingVisibility,states,refs,
    render(props) {
      cursor=effectCursor=refCursor=0;
      const node=exports.LazyBodyTeaching(props);
      for(const effect of effects)if(effect.run){const run=effect.run;effect.run=null;effect.cleanup=run();}
      return node;
    },
    unmount(){for(const effect of effects)effect.cleanup?.();},
  };
}

test('hidden boundary starts no request; loading resolves using current selection/tab', async () => {
  const request=deferred();let calls=0;
  const host=boundaryHost(createDeferredLoader(()=>{calls++;return request.promise;}));
  const props=(selection,tab)=>({children:module=>module.bodyContent(selection,tab)});
  host.context.value=false; assert.equal(host.render(props('old','ct')),null);
  await tick();assert.equal(calls,0);
  host.context.value=true;
  assert.equal(host.render(props('old','ct')).props.children.props.role,'status');
  host.render(props('current','mri'));
  request.resolve({bodyContent:(selection,tab)=>`${selection}:${tab}`}); await tick();
  assert.equal(host.render(props('current','mri')).props.children,'current:mri');
  assert.equal(host.render(props('next','pathology')).props.children,'next:pathology');
  assert.equal(calls,1);
});

test('one subscriber can disappear while another uses the shared pending load', async () => {
  const request=deferred();let calls=0;
  const loader=createDeferredLoader(()=>{calls++;return request.promise;});
  const old=boundaryHost(loader),current=boundaryHost(loader);
  old.render({children:()=> 'old notes'});
  current.render({children:()=> 'current notes'});
  await tick();assert.equal(calls,1);old.unmount();
  request.resolve({});await tick();
  assert.equal(old.states[0],undefined);
  assert.equal(current.render({children:()=> 'current notes'}).props.children,'current notes');
});

test('disabled/unmounted subscribers ignore late success and failure', async () => {
  for(const result of ['resolve','reject']) {
    const request=deferred();const host=boundaryHost(createDeferredLoader(()=>request.promise));
    host.render({children:()=> 'old'}); await tick();host.unmount();
    request[result](result==='resolve'?{}:Error('offline'));await tick();
    assert.equal(host.states[0],undefined); assert.equal(host.states[1],false);
  }
  const request=deferred();const host=boundaryHost(createDeferredLoader(()=>request.promise));
  host.render({children:()=> 'old'});host.render({enabled:false,children:()=> 'new'});
  request.resolve({});await tick();assert.equal(host.states[0],undefined);
  assert.equal(host.render({enabled:false,children:()=> 'new'}),null);
});

test('actual boundary exposes recovery and restores focus only if retry retained focus', async () => {
  for(const moved of [false,true]) {
    let calls=0;const host=boundaryHost(createDeferredLoader(async()=>{if(++calls===1)throw Error('offline');return {};}));
    const props={children:()=> 'current notes'};
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
  const props={children:()=> 'notes'};
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
