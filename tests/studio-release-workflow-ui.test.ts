import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import React from 'react';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const code = ts.transpileModule(readFileSync(process.env.STUDIO_FORMS_SOURCE ?? new URL('../components/StudioForms.tsx', import.meta.url), 'utf8'), {
  compilerOptions: {jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022},
}).outputText;
const revision = 'a'.repeat(64);
type Element = {type: unknown; props: Record<string, any>};
function deferred() {
  let resolve!: (value: any) => void, reject!: (error: Error) => void;
  const promise = new Promise<any>((yes, no) => {resolve = yes; reject = no;});
  return {promise, resolve, reject};
}
function setup(release: Record<string, unknown>, canPublish = true) {
  const props = {release, canPublish, recoveryScope:{actorId:'edu:synthetic-editor',organizationId:'synthetic-school'}};
  const oldFetch = Object.getOwnPropertyDescriptor(globalThis, 'fetch');
  const oldDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const oldWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const slots: any[] = [], effects: Array<() => void> = [], cleanups: Array<() => void> = [], setups: Array<() => void | (() => void)> = [];
  const layouts: Array<() => void> = [], layoutCleanups: Array<() => void> = [], layoutSetups: Array<() => void | (() => void)> = [];
  const calls: Array<{body: any; response: ReturnType<typeof deferred>}> = [];
  let cursor = 0, refreshes = 0, navigationGuard: (() => boolean) | null = null;
  const listeners = new Map<string, (event: any) => void>();
  Object.defineProperty(globalThis, 'document', {configurable: true, value: {visibilityState:'visible',addEventListener(){},removeEventListener(){}}});
  Object.defineProperty(globalThis, 'window', {configurable: true, value: {
    addEventListener: (name: string, listener: (event: any) => void) => listeners.set(name, listener),
    removeEventListener: (name: string) => listeners.delete(name), confirm: () => true,location:{reload(){}},
  }});
  Object.defineProperty(globalThis, 'fetch', {configurable: true, value: (_url: string, options: RequestInit) => {
    if(options.method==='GET')return Promise.resolve({ok:true,status:200,json:async()=>({ok:true,action:'verify-studio-mutation-context'})});
    const response = deferred(); calls.push({body: JSON.parse(String(options.body)), response}); return response.promise;
  }});
  const hooks = {...React,
    useState(initial: unknown) {const index = cursor++; if (!(index in slots)) slots[index] = initial;
      return [slots[index], (next: any) => {slots[index] = typeof next === 'function' ? next(slots[index]) : next;}];},
    useRef(initial: unknown) {const index = cursor++; if (!(index in slots)) slots[index] = {current: initial}; return slots[index];},
    useEffect(effect: () => void | (() => void), deps?: unknown[]) {const index = cursor++;
      if (!(index in slots) || !deps || deps.some((value, position) => value !== slots[index][position])) {
        slots[index] = deps;
        setups[index] = effect;
        effects.push(() => {cleanups[index]?.(); cleanups[index] = effect() ?? (() => {});});
      }
    },
    useLayoutEffect(effect: () => void | (() => void), deps?: unknown[]) {const index = cursor++;
      if (!(index in slots) || !deps || deps.some((value, position) => value !== slots[index][position])) {
        slots[index] = deps;
        layoutSetups[index] = effect;
        layouts.push(() => {layoutCleanups[index]?.(); layoutCleanups[index] = effect() ?? (() => {});});
      }
    },
  };
  const module = {exports: {} as Record<string, (props: any) => Element>};
  new Function('require', 'module', 'exports', code)((id: string) => id === 'react' ? hooks
    : id === 'next/navigation' ? {useRouter: () => ({refresh: () => refreshes++})}
    : id === '@/lib/studio-templates' ? {STUDIO_COURSE_TEMPLATES: []}
    : id === '../lib/studio-navigation-guard.ts' ? {registerStudioNavigationGuard: (_document: unknown, guard: () => boolean) => {navigationGuard = guard; return () => {navigationGuard = null;};}}
    : require(id), module, module.exports);
  const render = () => {cursor = 0; const tree = module.exports.ReleaseWorkflowActions(props); for (const effect of layouts.splice(0)) effect();for (const effect of effects.splice(0)) effect(); return tree;};
  const find = (root: any, predicate: (element: Element) => boolean): Element | undefined => {
    if (Array.isArray(root)) {for (const child of root) {const found = find(child, predicate); if (found) return found;} return;}
    if (!root?.props) return;
    return predicate(root) ? root : find(root.props.children, predicate);
  };
  const all = (root: any, predicate: (element: Element) => boolean): Element[] => {
    if (Array.isArray(root)) return root.flatMap(item => all(item, predicate));
    if (!root?.props) return [];
    return [...(predicate(root) ? [root] : []), ...all(root.props.children, predicate)];
  };
  const settle = async () => {for (let i = 0; i < 20; i++) await Promise.resolve();};
  const ready = async () => {render();await settle();return render();};
  const unmount = () => {for (const cleanup of layoutCleanups) cleanup?.(); layoutCleanups.length = 0;for (const cleanup of cleanups) cleanup?.(); cleanups.length = 0;};
  const replayEffects = () => {unmount(); for (let index = 0; index < layoutSetups.length; index++) if (layoutSetups[index]) layoutCleanups[index] = layoutSetups[index]() ?? (() => {});for (let index = 0; index < setups.length; index++) if (setups[index]) cleanups[index] = setups[index]() ?? (() => {});};
  const dispose = () => {unmount();
    for (const [name, old] of [['fetch', oldFetch], ['document', oldDocument], ['window', oldWindow]] as const)
      if (old) Object.defineProperty(globalThis, name, old); else delete (globalThis as any)[name];};
  return {props, render, ready, find, all, calls, settle, dispose, unmount, replayEffects, listeners,
    get refreshes() {return refreshes;}, get navigationGuard() {return navigationGuard;}};
}
const bound = (status: string) => ({id: 'release-1', version: 2, status, materialRevision: revision, approvalCurrent: true});

test('missing material binding fails closed with a refresh notice', () => {
  const h = setup({...bound('draft'), materialRevision: null});
  try {const tree = h.render(); assert.match(String(h.find(tree, node => node.props.role === 'alert')?.props.children), /Refresh this page/);
    const button = h.find(tree, node => node.type === 'button')!;
    assert.equal(button.props.disabled, true); button.props.onClick(); assert.equal(h.calls.length, 0);
  } finally {h.dispose();}
});

test('stale approval offers independent re-review and disables publish', () => {
  const h = setup({...bound('approved'), approvalCurrent: false});
  try {const tree = h.render(); assert.equal(h.all(tree, node => node.type === 'form').length, 1);
    const buttons = h.all(tree, node => node.type === 'button');
    assert.equal(buttons.at(-1)!.props.disabled, true);
  } finally {h.dispose();}
});

test('notes are labelled, bounded, guarded and retained on failure or context replacement', async () => {
  const h = setup(bound('in-review'));
  try {
    let tree = await h.ready();
    assert.equal(h.all(tree, node => node.type === 'label').length, 2);
    const textarea = h.find(tree, node => node.type === 'textarea')!;
    assert.equal(textarea.props.maxLength, 2000);
    textarea.props.onChange({target: {value: 'Evidence needs another look'}});
    tree = h.render();
    assert.equal(h.navigationGuard?.(), true);
    const unload: any = {preventDefault() {this.prevented = true;}};
    h.listeners.get('beforeunload')!(unload); assert.equal(unload.prevented, true);
    h.find(tree, node => node.type === 'form')!.props.onSubmit({preventDefault() {}});
    await h.settle();
    h.calls[0].response.resolve({ok: false, json: async () => ({error: 'Review failed'})});
    await h.settle();
    assert.equal(h.find(h.render(), node => node.type === 'textarea')!.props.value, 'Evidence needs another look');
    assert.equal(h.refreshes, 0);
    h.props.release = {...bound('in-review'), version: 3};
    tree = h.render();
    assert.match(String(h.find(tree, node => node.props.role === 'alert')?.props.children), /previous release version/);
    assert.equal(h.find(tree, node => node.type === 'textarea')!.props.value, 'Evidence needs another look');
    assert.equal(h.all(tree, node => node.type === 'button').at(-1)!.props.disabled, true);
  } finally {h.dispose();}
});

test('old completion cannot refresh replacement context; same-state success stays locked', async () => {
  const h = setup(bound('draft'));
  try {
    h.find(await h.ready(), node => node.type === 'button')!.props.onClick(); await h.settle();
    h.props.release = {...bound('draft'), version: 3}; h.render();
    h.calls[0].response.resolve({ok: true, json: async () => ({ok:true,action:h.calls[0].body.action})}); await h.settle();
    assert.equal(h.refreshes, 0);
    h.find(await h.ready(), node => node.type === 'button')!.props.onClick(); await h.settle();
    h.calls[1].response.resolve({ok: true, json: async () => ({ok:true,action:h.calls[1].body.action})}); await h.settle();
    assert.equal(h.refreshes, 1);
    h.find(h.render(), node => node.type === 'button')!.props.onClick();
    assert.equal(h.calls.length, 2);
  } finally {h.dispose();}
});

test('edits made during review request remain unsent after success', async () => {
  const h = setup(bound('in-review'));
  try {
    await h.ready(); h.find(h.render(), node => node.type === 'textarea')!.props.onChange({target: {value: 'First review evidence'}});
    h.find(h.render(), node => node.type === 'form')!.props.onSubmit({preventDefault() {}});
    h.find(h.render(), node => node.type === 'textarea')!.props.onChange({target: {value: 'Further evidence typed while saving'}});
    await h.settle();
    h.calls[0].response.resolve({ok: true, json: async () => ({ok:true,action:h.calls[0].body.action})}); await h.settle();
    assert.equal(h.find(h.render(), node => node.type === 'textarea')!.props.value, 'Further evidence typed while saving');
    assert.equal(h.navigationGuard?.(), true);
    assert.equal(h.refreshes, 1);
  } finally {h.dispose();}
});

test('notes remain copyable when a review is replaced by a non-review context', () => {
  const h = setup(bound('in-review'));
  try {
    h.render(); h.find(h.render(), node => node.type === 'textarea')!.props.onChange({target: {value: 'Unsent reviewer evidence'}});
    h.props.release = {...bound('draft'), version: 3};
    const tree = h.render();
    const recovery = h.find(tree, node => node.type === 'textarea')!;
    assert.equal(recovery.props.readOnly, true);
    assert.equal(recovery.props.value, 'Unsent reviewer evidence');
    assert.equal(h.all(tree, node => node.type === 'button').at(-1)!.props.disabled, true);
    assert.equal(h.navigationGuard?.(), true);
  } finally {h.dispose();}
});

test('actor or organization replacement hides old notes while keeping the leave guard', async()=>{
  const h=setup(bound('in-review'));
  try{
    await h.ready();h.find(h.render(),node=>node.type==='textarea')!.props.onChange({target:{value:'Unsent private review notes'}});
    h.props.recoveryScope={actorId:'edu:another-reviewer',organizationId:'another-school'};
    const tree=h.render();
    assert.equal(h.find(tree,node=>node.type==='textarea'),undefined);
    assert.equal(h.navigationGuard?.(),true);
    const unload:any={preventDefault(){this.prevented=true;}};h.listeners.get('beforeunload')!(unload);
    assert.equal(unload.prevented,true);
    assert(h.find(tree,node=>node.type==='button'&&node.props.children==='Reload Studio'));
  }finally{h.dispose();}
});

test('A to B to A retires old handlers and deferred completions', async () => {
  const h = setup(bound('draft'));
  try {
    const oldClick = h.find(await h.ready(), node => node.type === 'button')!.props.onClick;
    oldClick(); await h.settle();
    h.props.release = {...bound('draft'), version: 3}; h.render();
    h.props.release = bound('draft'); h.render();
    oldClick(); assert.equal(h.calls.length, 1);
    h.calls[0].response.resolve({ok: true, json: async () => ({ok:true,action:h.calls[0].body.action})}); await h.settle();
    assert.equal(h.refreshes, 0);
    h.find(await h.ready(), node => node.type === 'button')!.props.onClick(); await h.settle();
    assert.equal(h.calls.length, 2);
    h.calls[1].response.resolve({ok: true, json: async () => ({ok:true,action:h.calls[1].body.action})}); await h.settle();
    assert.equal(h.refreshes, 1);
  } finally {h.dispose();}
});

test('unmount and effect replay retire old completion and handler', async () => {
  const h = setup(bound('draft'));
  try {
    const oldClick = h.find(await h.ready(), node => node.type === 'button')!.props.onClick;
    oldClick(); await h.settle(); h.replayEffects();
    h.calls[0].response.resolve({ok: true, json: async () => ({ok:true,action:h.calls[0].body.action})}); await h.settle();
    assert.equal(h.refreshes, 0);
    oldClick(); assert.equal(h.calls.length, 1);
    h.find(await h.ready(), node => node.type === 'button')!.props.onClick(); await h.settle();
    assert.equal(h.calls.length, 2);
    h.unmount();
    h.calls[1].response.resolve({ok: true, json: async () => ({ok:true,action:h.calls[1].body.action})}); await h.settle();
    assert.equal(h.refreshes, 0);
  } finally {h.dispose();}
});

test('obsolete restart and input callbacks cannot clear newer unsent notes', () => {
  const h = setup(bound('in-review'));
  try {
    h.render(); h.find(h.render(), node => node.type === 'textarea')!.props.onChange({target: {value: 'Original reviewer notes'}});
    h.props.release = {...bound('in-review'), version: 3};
    const oldTree = h.render();
    const oldRestart = h.find(oldTree, node => node.type === 'button')!.props.onClick;
    const oldChange = h.find(oldTree, node => node.type === 'textarea')!.props.onChange;
    const oldDecision = h.find(oldTree, node => node.type === 'select')!.props.onChange;
    h.props.release = {...bound('in-review'), version: 4};
    h.render();
    h.find(h.render(), node => node.type === 'textarea')!.props.onChange({target: {value: 'Newer reviewer notes'}});
    oldRestart(); oldChange({target: {value: 'Obsolete edit'}}); oldDecision({target: {value: 'changes-requested'}});
    assert.equal(h.find(h.render(), node => node.type === 'textarea')!.props.value, 'Newer reviewer notes');
    assert.equal(h.find(h.render(), node => node.type === 'select')!.props.value, 'approved');
    assert.equal(h.navigationGuard?.(), true);
  } finally {h.dispose();}
});

test('material revision must be lowercase hexadecimal', () => {
  const h = setup({...bound('draft'), materialRevision: 'A'.repeat(64)});
  try {const tree = h.render(); assert.equal(h.find(tree, node => node.type === 'button')!.props.disabled, true);
    assert.equal(h.calls.length, 0);
  } finally {h.dispose();}
});

test('success and error feedback from a completed visit are not shown in a replacement visit', async () => {
  for (const ok of [true, false]) {
    const h = setup(bound('draft'));
    try {
      h.find(await h.ready(), node => node.type === 'button')!.props.onClick(); await h.settle();
      h.calls[0].response.resolve({ok, json: async () => ok ? {ok:true,action:h.calls[0].body.action} : {error: 'Previous release failed'}});
      await h.settle();
      assert.ok(h.find(h.render(), node => node.props.role === (ok ? 'status' : 'alert')));
      h.props.release = {...bound('draft'), version: 3};
      const next = h.render();
      assert.equal(h.find(next, node => node.props.role === 'alert' || node.props.role === 'status' && !String(node.props.children).startsWith('Checking this page')), undefined);
    } finally {h.dispose();}
  }
});
