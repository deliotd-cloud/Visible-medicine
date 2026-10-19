import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import React from 'react';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const source = readFileSync(process.env.STUDIO_FORMS_SOURCE ?? new URL('../components/StudioForms.tsx', import.meta.url), 'utf8');
const code = ts.transpileModule(source, {compilerOptions: {jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022}}).outputText;
type Element = {type: unknown; props: Record<string, any>};
type ActionName = 'DuplicateCourseButton' | 'DuplicateWorkbookButton' | 'ReleaseWorkflowActions';

function deferred<T>() {
  let resolve!: (value: T) => void, reject!: (reason: unknown) => void;
  const promise = new Promise<T>((yes, no) => {resolve = yes; reject = no;});
  return {promise, resolve, reject};
}

function harness(name: ActionName, props: Record<string, unknown>) {
  const oldFetch = Object.getOwnPropertyDescriptor(globalThis, 'fetch');
  const oldFormData = Object.getOwnPropertyDescriptor(globalThis, 'FormData');
  const oldWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const oldDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  let confirmAllowed=false;
  let currentScope:unknown={actorId:'edu:synthetic-editor',organizationId:'synthetic-school'};
  let comparisons=0;
  const listeners=new Map<string,Set<() => void>>();
  const events={addEventListener(name:string,callback:()=>void){if(!listeners.has(name))listeners.set(name,new Set());listeners.get(name)!.add(callback);},removeEventListener(name:string,callback:()=>void){listeners.get(name)?.delete(callback);}};
  Object.defineProperty(globalThis,'window',{configurable:true,value:{...events,confirm:()=>confirmAllowed,location:{reload(){}}}});
  Object.defineProperty(globalThis,'document',{configurable:true,value:{...events,visibilityState:'visible'}});
  const slots: any[] = [], requests: Array<{url: string; options: RequestInit; response: ReturnType<typeof deferred<any>>}> = [];
  const routes: string[] = []; let refreshes = 0, cursor = 0, unmounted = false, writesAfterUnmount = 0;
  const effects: Array<() => void> = [], setups: Array<() => void | (() => void)> = [], cleanups: Array<() => void> = [];
  const layoutEffects: Array<() => void> = [], layoutSetups: Array<() => void | (() => void)> = [], layoutCleanups: Array<() => void> = [];
  Object.defineProperty(globalThis, 'fetch', {configurable: true, value: (url: string, options: RequestInit) => {
    if(options.method==='GET'){
      comparisons++;
      const expected=JSON.parse(String((options.headers as Record<string,string>)['X-Studio-Mutation-Context']));
      if(currentScope===null)return Promise.resolve({ok:false,status:503,json:async()=>({code:'STUDIO_CONTEXT_UNAVAILABLE'})});
      if(JSON.stringify(expected)!==JSON.stringify(currentScope))return Promise.resolve({ok:false,status:409,json:async()=>({code:'STUDIO_CONTEXT_CHANGED'})});
      return Promise.resolve({ok:true,status:200,json:async()=>({ok:true,action:'verify-studio-mutation-context'})});
    }
    const response = deferred<any>(); requests.push({url, options, response}); return response.promise;
  }});
  Object.defineProperty(globalThis, 'FormData', {configurable: true, value: class {
    private values: Record<string, string>;
    constructor(form: {values: Record<string, string>}) {this.values = form.values;}
    get(key: string) {return this.values[key] ?? null;}
  }});
  const hooks = {
    ...React,
    useState(initial: unknown) {const slot = cursor++; if (!(slot in slots)) slots[slot] = initial; return [slots[slot], (value: unknown) => {if(unmounted)writesAfterUnmount++;slots[slot] = typeof value === 'function' ? (value as (old: unknown) => unknown)(slots[slot]) : value;}];},
    useRef(initial: unknown) {const slot = cursor++; if (!(slot in slots)) slots[slot] = {current: initial}; return slots[slot];},
    useEffect(effect: () => void | (() => void), deps?: unknown[]) {const slot = cursor++;
      if (!(slot in slots) || !deps || deps.some((value, index) => value !== slots[slot][index])) {
        slots[slot] = deps; setups[slot] = effect;
        effects.push(() => {cleanups[slot]?.(); cleanups[slot] = effect() ?? (() => {});});
      }
    },
    useLayoutEffect(effect: () => void | (() => void), deps?: unknown[]) {const slot = cursor++;
      if (!(slot in slots) || !deps || deps.some((value, index) => value !== slots[slot][index])) {
        slots[slot] = deps; layoutSetups[slot] = effect;
        layoutEffects.push(() => {layoutCleanups[slot]?.(); layoutCleanups[slot] = effect() ?? (() => {});});
      }
    },
  };
  const router = {push(path: string) {routes.push(path);}, refresh() {refreshes++;}};
  const mod = {exports: {} as Record<ActionName, (props: Record<string, unknown>) => Element>};
  new Function('require', 'module', 'exports', code)((id: string) => id === 'react' ? hooks : id === 'next/navigation' ? {useRouter: () => router} : id === '@/lib/studio-templates' ? {STUDIO_COURSE_TEMPLATES: []} : require(id), mod, mod.exports);
  const render = () => {cursor = 0; const tree = mod.exports[name](props);for(const effect of layoutEffects.splice(0))effect();for(const effect of effects.splice(0))effect();return tree;};
  function find(root: any, predicate: (node: Element) => boolean): Element | undefined {
    if (Array.isArray(root)) {for (const child of root) {const found = find(child, predicate); if (found) return found;} return;}
    if (!root?.props) return;
    return predicate(root) ? root : find(root.props.children, predicate);
  }
  const button = (tree: Element) => find(tree, node => node.type === 'button')!;
  const alert = (tree: Element) => find(tree, node => node.props.role === 'alert');
  const payloads = () => requests.map(request => JSON.parse(String(request.options.body)));
  const finish = (index: number, body: Record<string, unknown>, ok = true, status=ok?200:422) => requests[index].response.resolve({ok,status,json: async () => ok ? {ok:true,action:payloads()[index].action,...body} : body});
  const settle = async () => {for (let i = 0; i < 20; i++) await Promise.resolve();};
  const unmountLayout = () => {unmounted=true;for(const cleanup of layoutCleanups)cleanup?.();layoutCleanups.length=0;};
  const unmount = () => {unmountLayout();for(const cleanup of cleanups)cleanup?.();cleanups.length=0;};
  const replayEffects = () => {unmount();unmounted=false;for(let index=0;index<layoutSetups.length;index++)if(layoutSetups[index])layoutCleanups[index]=layoutSetups[index]()??(()=>{});for(let index=0;index<setups.length;index++)if(setups[index])cleanups[index]=setups[index]()??(()=>{});};
  const dispose = () => {
    unmount();
    if (oldFetch) Object.defineProperty(globalThis, 'fetch', oldFetch); else delete (globalThis as any).fetch;
    if (oldFormData) Object.defineProperty(globalThis, 'FormData', oldFormData); else delete (globalThis as any).FormData;
    if (oldWindow) Object.defineProperty(globalThis, 'window', oldWindow); else delete (globalThis as any).window;
    if (oldDocument) Object.defineProperty(globalThis, 'document', oldDocument); else delete (globalThis as any).document;
  };
  return {render, find, button, alert, requests, routes, allowConfirm(){confirmAllowed=true;}, setContext(value:unknown){currentScope=value;}, emit(name:string){for(const listener of listeners.get(name)??[])listener();}, get comparisons(){return comparisons;}, get refreshes() {return refreshes;}, get writesAfterUnmount(){return writesAfterUnmount;}, payloads, finish, settle, dispose, unmountLayout, unmount, replayEffects};
}

for (const [name, idKey, id, route] of [
  ['DuplicateCourseButton', 'courseId', 'course-1', '/studio/courses/copied%20course'],
  ['DuplicateWorkbookButton', 'workbookId', 'workbook-1', '/studio/workbooks/copied%20workbook'],
] as const) {
  const scope = {actorId:'edu:synthetic-editor',organizationId:'synthetic-school'};
  test(`${name} checks context, sends one guarded request and keeps the accepted copy locked`,async()=>{
    const props:Record<string,unknown>={[idKey]:id,recoveryScope:scope},h=harness(name,props);
    try {
      h.render();await h.settle();
      const click=h.button(h.render()).props.onClick;click();click();await h.settle();
      assert.equal(h.requests.length,1);
      assert.deepEqual(h.payloads(),[{action:name==='DuplicateCourseButton'?'duplicate-course':'duplicate-workbook',[idKey]:id,expectedStudioContext:scope}]);
      assert.equal(h.button(h.render()).props.disabled,true);
      h.finish(0,{[idKey]:route.split('/').at(-1)!.replace('%20',' ')});
      await h.settle();assert.deepEqual(h.routes,[route]);assert.equal(h.refreshes,1);
      assert.equal(h.comparisons,3,'admission, before POST, and after POST comparisons');
      assert.equal(h.button(h.render()).props.disabled,true);
    } finally {h.dispose();}
  });
  test(`${name} retries an ordinary validation refusal, retaining the source visit`,async()=>{
    const h=harness(name,{[idKey]:id,recoveryScope:scope});
    try {
      h.render();await h.settle();h.button(h.render()).props.onClick();await h.settle();
      h.finish(0,{error:'Exact validation refusal'},false,422);await h.settle();
      const tree=h.render();assert.equal(h.alert(tree)?.props.children,'Exact validation refusal');
      assert.equal(h.button(tree).props.disabled,false);
      h.button(tree).props.onClick();await h.settle();assert.equal(h.requests.length,2);
      h.finish(1,{[idKey]:'confirmed-copy'});await h.settle();assert.equal(h.routes.length,1);
    } finally {h.dispose();}
  });
  test(`${name} retains uncertainty until cancellable manual reconciliation`,async()=>{
    const h=harness(name,{[idKey]:id,recoveryScope:scope});
    try {
      h.render();await h.settle();h.button(h.render()).props.onClick();await h.settle();
      h.requests[0].response.reject(Error('PRIVATE_TRANSPORT'));await h.settle();
      let tree=h.render();assert.equal(h.requests.length,1);assert.equal(h.button(tree).props.disabled,true);
      assert.match(String(h.alert(tree)?.props.children),/could not confirm whether this save completed/i);
      const acknowledge=h.find(tree,n=>n.type==='button'&&n.props.children==='I checked the saved item')!;
      acknowledge.props.onClick();assert.equal(h.requests.length,1);
      tree=h.render();assert.equal(h.button(tree).props.disabled,true);
      h.allowConfirm();h.find(tree,n=>n.type==='button'&&n.props.children==='I checked the saved item')!.props.onClick();
      assert.equal(h.requests.length,1);assert.equal(h.button(h.render()).props.disabled,false);
    } finally {h.dispose();}
  });
  for(const outcome of ['malformed-2xx','timeout-408','server-503'] as const)test(`${name} treats ${outcome} as uncertain with zero repeat POSTs`,async()=>{
    const h=harness(name,{[idKey]:id,recoveryScope:scope});
    try {
      h.render();await h.settle();h.button(h.render()).props.onClick();await h.settle();
      if(outcome==='malformed-2xx')h.requests[0].response.resolve({ok:true,status:200,json:async()=>({ok:true,action:name==='DuplicateCourseButton'?'duplicate-course':'duplicate-workbook'})});
      else h.finish(0,{error:'PRIVATE_FAILURE'},false,outcome==='timeout-408'?408:503);
      await h.settle();const tree=h.render();
      assert.equal(h.requests.length,1);assert.equal(h.routes.length,0);assert.equal(h.button(tree).props.disabled,true);
      assert.match(String(h.alert(tree)?.props.children),/could not confirm whether this save completed/i);
      assert.doesNotMatch(String(h.alert(tree)?.props.children),/PRIVATE_FAILURE/);
      h.button(tree).props.onClick();assert.equal(h.requests.length,1);
    } finally {h.dispose();}
  });
  test(`${name} coded admission refusal 503 retries only context without another POST`,async()=>{
    const h=harness(name,{[idKey]:id,recoveryScope:scope});
    try {
      h.render();await h.settle();h.button(h.render()).props.onClick();await h.settle();
      h.finish(0,{code:'STUDIO_CONTEXT_UNAVAILABLE',error:'PRIVATE_LOOKUP'},false,503);await h.settle();
      let tree=h.render();assert.equal(h.button(tree).props.disabled,true);
      assert.match(String(h.alert(tree)?.props.children),/signed-in context/i);
      assert.doesNotMatch(String(h.alert(tree)?.props.children),/PRIVATE_LOOKUP/);
      h.find(tree,n=>n.type==='button'&&n.props.children==='Retry context check')!.props.onClick();await h.settle();
      tree=h.render();assert.equal(h.button(tree).props.disabled,false);
      assert.equal(h.find(tree,n=>n.props.role==='group'&&n.props['aria-label']==='Reconcile uncertain duplication'),undefined);
      assert.equal(h.requests.length,1);
    } finally {h.dispose();}
  });
  for(const outcome of ['success','error','network'] as const)test(`${name} ignores old ${outcome} while a different source is pending`,async()=>{
    const props:Record<string,unknown>={[idKey]:id,recoveryScope:scope},h=harness(name,props);
    try {
      h.render();await h.settle();h.button(h.render()).props.onClick();await h.settle();
      props[idKey]='source-b';h.render();await h.settle();h.button(h.render()).props.onClick();await h.settle();
      assert.equal(h.requests.length,2);
      if(outcome==='network')h.requests[0].response.reject(Error('PRIVATE_OLD_NETWORK'));
      else h.finish(0,outcome==='success'?{[idKey]:'old-copy'}:{error:'PRIVATE_OLD_ERROR'},outcome==='success');
      await h.settle();const tree=h.render();assert.equal(h.routes.length,0);assert.equal(h.refreshes,0);
      assert.equal(h.alert(tree),undefined);assert.equal(h.button(tree).props.disabled,true);
      h.finish(1,{[idKey]:'new-copy'});await h.settle();assert.equal(h.routes.length,1);
    } finally {h.dispose();}
  });
  test(`${name} ignores an old reply after source A to B to A`,async()=>{
    const props:Record<string,unknown>={[idKey]:id,recoveryScope:scope},h=harness(name,props);
    try {
      h.render();await h.settle();h.button(h.render()).props.onClick();await h.settle();
      props[idKey]='other';h.render();await h.settle();props[idKey]=id;h.render();await h.settle();
      h.finish(0,{[idKey]:'old-copy'});await h.settle();
      assert.equal(h.routes.length,0);assert.equal(h.refreshes,0);
      h.button(h.render()).props.onClick();await h.settle();assert.equal(h.requests.length,2);
      h.finish(1,{[idKey]:'fresh-copy'});await h.settle();assert.equal(h.routes.length,1);
    } finally {h.dispose();}
  });
  for(const outcome of ['success','error','network'] as const)test(`${name} ignores a late ${outcome} after unmount`,async()=>{
    const h=harness(name,{[idKey]:id,recoveryScope:scope});
    try {
      h.render();await h.settle();h.button(h.render()).props.onClick();await h.settle();h.unmount();
      const writes=h.writesAfterUnmount;
      if(outcome==='network')h.requests[0].response.reject(Error('PRIVATE_LATE_NETWORK'));
      else h.finish(0,outcome==='success'?{[idKey]:'late-copy'}:{error:'PRIVATE_LATE_ERROR'},outcome==='success');
      await h.settle();
      assert.equal(h.routes.length,0);assert.equal(h.refreshes,0);assert.equal(h.writesAfterUnmount,writes);
    } finally {h.dispose();}
  });
  test(`${name} ignores completion between layout and passive unmount cleanup`,async()=>{
    const h=harness(name,{[idKey]:id,recoveryScope:scope});
    try {
      h.render();await h.settle();h.button(h.render()).props.onClick();await h.settle();
      h.unmountLayout();const writes=h.writesAfterUnmount;
      h.finish(0,{[idKey]:'late-copy'});await h.settle();
      assert.equal(h.routes.length,0);assert.equal(h.refreshes,0);assert.equal(h.writesAfterUnmount,writes);
    } finally {h.dispose();}
  });
  test(`${name} ignores an effect replay's old request`,async()=>{
    const h=harness(name,{[idKey]:id,recoveryScope:scope});
    try {
      h.render();await h.settle();h.button(h.render()).props.onClick();await h.settle();
      h.replayEffects();h.render();await h.settle();h.finish(0,{[idKey]:'retired-copy'});await h.settle();
      assert.equal(h.routes.length,0);assert.equal(h.refreshes,0);
      assert.equal(h.button(h.render()).props.disabled,false);
    } finally {h.dispose();}
  });
  test(`${name} retires a changed actor before write and never reuses the visit`,async()=>{
    const h=harness(name,{[idKey]:id,recoveryScope:scope});
    try {
      h.setContext({...scope,actorId:'edu:other'});h.render();await h.settle();
      assert.equal(h.requests.length,0);assert.equal(h.button(h.render()).props.disabled,true);
      h.setContext(scope);h.emit('focus');await h.settle();
      assert.equal(h.button(h.render()).props.disabled,true);
      assert(h.find(h.render(),n=>n.type==='button'&&n.props.children==='Reload Studio'));
    } finally {h.dispose();}
  });
  test(`${name} refuses missing or malformed trusted scope without a request`,async()=>{
    for(const invalid of [undefined,{actorId:'actor',organizationId:scope.organizationId},{...scope,extra:'forged'}]){
      const h=harness(name,{[idKey]:id,recoveryScope:invalid});
      try {h.render();await h.settle();assert.equal(h.requests.length,0);assert.equal(h.comparisons,0);assert.equal(h.button(h.render()).props.disabled,true);} finally {h.dispose();}
    }
  });
  test(`${name} holds an unavailable comparison until explicit retry`,async()=>{
    const h=harness(name,{[idKey]:id,recoveryScope:scope});
    try {
      h.setContext(null);h.render();await h.settle();
      assert.equal(h.requests.length,0);assert.equal(h.button(h.render()).props.disabled,true);
      h.setContext(scope);h.emit('focus');await h.settle();
      assert.equal(h.button(h.render()).props.disabled,true);
      h.find(h.render(),n=>n.type==='button'&&n.props.children==='Retry context check')!.props.onClick();await h.settle();
      assert.equal(h.button(h.render()).props.disabled,false);assert.equal(h.requests.length,0);
    } finally {h.dispose();}
  });
  test(`${name} refuses a changed context after a possible commit without navigation`,async()=>{
    const h=harness(name,{[idKey]:id,recoveryScope:scope});
    try {
      h.render();await h.settle();h.button(h.render()).props.onClick();await h.settle();
      h.setContext({...scope,organizationId:'other-school'});h.finish(0,{[idKey]:'stale-copy'});await h.settle();
      assert.equal(h.routes.length,0);assert.equal(h.refreshes,0);
      assert.equal(h.button(h.render()).props.disabled,true);
      assert(h.find(h.render(),n=>n.type==='button'&&n.props.children==='Reload Studio'));
    } finally {h.dispose();}
  });
  test(`${name} retains reconciliation through an unavailable post-write comparison`,async()=>{
    const h=harness(name,{[idKey]:id,recoveryScope:scope});
    try {
      h.render();await h.settle();h.button(h.render()).props.onClick();await h.settle();
      h.setContext(null);h.finish(0,{[idKey]:'possibly-created'});await h.settle();
      assert.equal(h.routes.length,0);assert.equal(h.button(h.render()).props.disabled,true);
      h.setContext(scope);h.find(h.render(),n=>n.type==='button'&&n.props.children==='Retry context check')!.props.onClick();await h.settle();
      assert.equal(h.button(h.render()).props.disabled,true);
      h.allowConfirm();h.find(h.render(),n=>n.type==='button'&&n.props.children==='I checked the saved item')!.props.onClick();
      assert.equal(h.requests.length,1);assert.equal(h.button(h.render()).props.disabled,false);
    } finally {h.dispose();}
  });
  test(`${name} retires a changed scope prop and ignores old completion`,async()=>{
    const props:Record<string,unknown>={[idKey]:id,recoveryScope:scope},h=harness(name,props);
    try {
      h.render();await h.settle();h.button(h.render()).props.onClick();await h.settle();
      props.recoveryScope={...scope,organizationId:'other-school'};h.render();await h.settle();
      h.finish(0,{[idKey]:'old-copy'});await h.settle();
      assert.equal(h.routes.length,0);assert.equal(h.button(h.render()).props.disabled,true);
      props.recoveryScope=scope;h.render();await h.settle();assert.equal(h.button(h.render()).props.disabled,true);
    } finally {h.dispose();}
  });
}
const workflowScope={actorId:'edu:synthetic-editor',organizationId:'synthetic-school'};
const workflowSubmit=(h:ReturnType<typeof harness>)=>h.find(h.render(),n=>n.type==='button'&&n.props.children==='Submit for review')!;
for (const [status, canPublish, expected, fields] of [
  ['draft', true, {action: 'submit-release', releaseId: 'release-1', expectedVersion: 2, expectedStatus: 'draft', expectedMaterialRevision: 'a'.repeat(64)}, undefined],
  ['in-review', true, {action: 'review-release', releaseId: 'release-1', expectedVersion: 2, expectedStatus: 'in-review', expectedMaterialRevision: 'a'.repeat(64), decision: 'changes-requested', notes: 'Needs clearer evidence'}, {decision: 'changes-requested', notes: 'Needs clearer evidence'}],
  ['approved', true, {action: 'publish-release', releaseId: 'release-1', expectedVersion: 2, expectedStatus: 'approved', expectedMaterialRevision: 'a'.repeat(64)}, undefined],
] as const) {
  test(`${status} workflow sends one pending POST with exact payload`, async () => {
    const h = harness('ReleaseWorkflowActions', {release: {id: 'release-1', version: 2, status, materialRevision: 'a'.repeat(64), approvalCurrent: true}, canPublish, recoveryScope:workflowScope});
    try {
      h.render(); await h.settle(); const tree = h.render();
      if (fields) {
        h.find(tree, node => node.type === 'select')!.props.onChange({target: {value: fields.decision}});
        h.find(h.render(), node => node.type === 'textarea')!.props.onChange({target: {value: fields.notes}});
        const submit = h.find(h.render(), node => node.type === 'form')!.props.onSubmit;
        const event = {preventDefault() {}, currentTarget: {values: fields}};
        submit(event); submit(event);
      } else {
        const click = h.button(tree).props.onClick;
        click(); click();
      }
      await h.settle(); assert.equal(h.requests.length, 1);
      assert.deepEqual(h.payloads(), [{...expected,expectedStudioContext:workflowScope}]);
      assert.equal(h.button(h.render()).props.disabled, true);
      h.finish(0, {});
      await h.settle();
      assert.equal(h.refreshes, 1);
      assert.equal(h.routes.length, 0);
    } finally {h.dispose();}
  });
}

test('publish permission remains disabled', () => {
  const h = harness('ReleaseWorkflowActions', {release: {id: 'release-1', version: 2, status: 'approved', materialRevision: 'a'.repeat(64), approvalCurrent: true}, canPublish: false, recoveryScope:workflowScope});
  try {assert.equal(h.button(h.render()).props.disabled, true);} finally {h.dispose();}
});

test('workflow network rejection locks repeat until manual reconciliation', async () => {
  const h = harness('ReleaseWorkflowActions', {release: {id: 'release-1', version: 2, status: 'draft', materialRevision: 'a'.repeat(64), approvalCurrent: true}, canPublish: true, recoveryScope:workflowScope});
  try {
    h.render(); await h.settle(); h.button(h.render()).props.onClick(); await h.settle();
    h.requests[0].response.reject(new Error('Network unavailable'));
    await h.settle();
    const tree = h.render();
    assert.match(String(h.alert(tree)?.props.children), /could not confirm whether this save completed/i);
    assert.equal(h.button(tree).props.disabled, true);
    h.button(tree).props.onClick();
    assert.equal(h.requests.length, 1);
    h.allowConfirm();h.find(h.render(),n=>n.type==='button'&&n.props.children==='I checked the release')!.props.onClick();
    h.button(h.render()).props.onClick();await h.settle();assert.equal(h.requests.length,2);
    h.finish(1, {});
    await h.settle();
    assert.equal(h.refreshes, 1);
  } finally {h.dispose();}
});

test('workflow unavailable comparison requires explicit retry before any POST', async()=>{
  const h=harness('ReleaseWorkflowActions',{release:{id:'release-1',version:2,status:'draft',materialRevision:'a'.repeat(64)},canPublish:true,recoveryScope:workflowScope});
  try{
    h.setContext(null);h.render();await h.settle();
    assert.equal(workflowSubmit(h).props.disabled,true);
    assert.equal(h.requests.length,0);
    h.setContext(workflowScope);h.emit('focus');await h.settle();
    assert.equal(workflowSubmit(h).props.disabled,true);
    h.find(h.render(),n=>n.type==='button'&&n.props.children==='Retry context check')!.props.onClick();await h.settle();
    workflowSubmit(h).props.onClick();await h.settle();
    assert.equal(h.requests.length,1);
  }finally{h.dispose();}
});

test('workflow changed actor retires old visit and never sends a POST', async()=>{
  const h=harness('ReleaseWorkflowActions',{release:{id:'release-1',version:2,status:'draft',materialRevision:'a'.repeat(64)},canPublish:true,recoveryScope:workflowScope});
  try{
    h.render();await h.settle();h.setContext({...workflowScope,actorId:'edu:other'});
    h.button(h.render()).props.onClick();await h.settle();
    assert.equal(h.requests.length,0);
    assert(h.find(h.render(),n=>n.type==='button'&&n.props.children==='Reload Studio'));
    h.setContext(workflowScope);h.render();await h.settle();
    assert.equal(h.requests.length,0);
  }finally{h.dispose();}
});

for(const [label,body,ok,status] of [
  ['malformed success',{ok:true,action:'wrong-action'},true,200],
  ['timeout',{error:'PRIVATE_TIMEOUT'},false,408],
  ['server failure',{error:'PRIVATE_SERVER'},false,503],
] as const)test(`workflow ${label} holds another action until manual reconciliation`,async()=>{
  const h=harness('ReleaseWorkflowActions',{release:{id:'release-1',version:2,status:'draft',materialRevision:'a'.repeat(64)},canPublish:true,recoveryScope:workflowScope});
  try{
    h.render();await h.settle();h.button(h.render()).props.onClick();await h.settle();
    h.finish(0,body,ok,status);await h.settle();
    assert.equal(workflowSubmit(h).props.disabled,true);
    h.button(h.render()).props.onClick();assert.equal(h.requests.length,1);
    assert.equal(h.refreshes,0);
    h.allowConfirm();h.find(h.render(),n=>n.type==='button'&&n.props.children==='I checked the release')!.props.onClick();
    assert.equal(workflowSubmit(h).props.disabled,false);
  }finally{h.dispose();}
});

test('workflow coded admission 503 is a no-write refusal with context retry',async()=>{
  const h=harness('ReleaseWorkflowActions',{release:{id:'release-1',version:2,status:'draft',materialRevision:'a'.repeat(64)},canPublish:true,recoveryScope:workflowScope});
  try{
    h.render();await h.settle();h.button(h.render()).props.onClick();await h.settle();
    h.finish(0,{code:'STUDIO_CONTEXT_UNAVAILABLE',error:'PRIVATE'},false,503);await h.settle();
    assert.equal(workflowSubmit(h).props.disabled,true);
    assert.equal(h.find(h.render(),n=>n.props['aria-label']==='Reconcile uncertain release action'),undefined);
    h.find(h.render(),n=>n.type==='button'&&n.props.children==='Retry context check')!.props.onClick();await h.settle();
    assert.equal(workflowSubmit(h).props.disabled,false);
  }finally{h.dispose();}
});

for(const status of [403,409])test(`workflow explicit ${status} refusal preserves ordinary correction path`,async()=>{
  const h=harness('ReleaseWorkflowActions',{release:{id:'release-1',version:2,status:'draft',materialRevision:'a'.repeat(64)},canPublish:true,recoveryScope:workflowScope});
  try{
    h.render();await h.settle();workflowSubmit(h).props.onClick();await h.settle();
    h.finish(0,{error:'Release precondition refused'},false,status);await h.settle();
    assert.equal(h.alert(h.render())?.props.children,'Release precondition refused');
    assert.equal(workflowSubmit(h).props.disabled,false);
    assert.equal(h.find(h.render(),n=>n.props['aria-label']==='Reconcile uncertain release action'),undefined);
  }finally{h.dispose();}
});

test('workflow unavailable post-write comparison requires retry and reconciliation',async()=>{
  const h=harness('ReleaseWorkflowActions',{release:{id:'release-1',version:2,status:'draft',materialRevision:'a'.repeat(64)},canPublish:true,recoveryScope:workflowScope});
  try{
    h.render();await h.settle();h.button(h.render()).props.onClick();await h.settle();
    h.setContext(null);h.finish(0,{});await h.settle();
    assert.equal(h.refreshes,0);assert.equal(workflowSubmit(h).props.disabled,true);
    h.setContext(workflowScope);h.find(h.render(),n=>n.type==='button'&&n.props.children==='Retry context check')!.props.onClick();await h.settle();
    assert.equal(workflowSubmit(h).props.disabled,true);
    assert(h.find(h.render(),n=>n.props['aria-label']==='Reconcile uncertain release action'));
  }finally{h.dispose();}
});

test('workflow scope A to B to A rejects old completion and old handlers',async()=>{
  const props:Record<string,unknown>={release:{id:'release-1',version:2,status:'draft',materialRevision:'a'.repeat(64)},canPublish:true,recoveryScope:workflowScope};
  const h=harness('ReleaseWorkflowActions',props);
  try{
    h.render();await h.settle();const oldClick=h.button(h.render()).props.onClick;
    oldClick();await h.settle();
    props.recoveryScope={...workflowScope,organizationId:'other-school'};h.render();await h.settle();
    props.recoveryScope=workflowScope;h.render();await h.settle();
    h.finish(0,{});await h.settle();oldClick();
    assert.equal(h.refreshes,0);assert.equal(h.requests.length,1);
    assert(h.find(h.render(),n=>n.type==='button'&&n.props.children==='Reload Studio'));
  }finally{h.dispose();}
});
